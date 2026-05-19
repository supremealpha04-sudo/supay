// app/api/admin/deposits/route.ts
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

  const { data: deposits } = await supabase
    .from('deposits')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ deposits })
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { depositId, status } = await request.json()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { data: deposit } = await supabase
    .from('deposits')
    .select('*')
    .eq('id', depositId)
    .single()

  if (status === 'completed' && deposit.status === 'pending') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('spy_balance')
      .eq('id', deposit.user_id)
      .single()

    await supabase
      .from('profiles')
      .update({ spy_balance: (profile?.spy_balance || 0) + deposit.spy_expected })
      .eq('id', deposit.user_id)
  }

  await supabase
    .from('deposits')
    .update({ status, confirmed_at: new Date().toISOString() })
    .eq('id', depositId)

  return NextResponse.json({ success: true })
}
