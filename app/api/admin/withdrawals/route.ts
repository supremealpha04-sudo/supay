// app/api/admin/withdrawals/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ withdrawals })
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { withdrawalId, status, txHash } = await request.json()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  await supabase
    .from('withdrawals')
    .update({
      status,
      processed_at: new Date().toISOString(),
      processed_by: user?.id,
      tx_hash: txHash
    })
    .eq('id', withdrawalId)

  if (status === 'rejected') {
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('amount_spy, user_id')
      .eq('id', withdrawalId)
      .single()

    await supabase
      .from('profiles')
      .update({ spy_balance: supabase.rpc('increment', { x: withdrawal.amount_spy }) })
      .eq('id', withdrawal.user_id)
  }

  return NextResponse.json({ success: true })
}
