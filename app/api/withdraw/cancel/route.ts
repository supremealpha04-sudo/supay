import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { withdrawalId } = await request.json()

  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .eq('user_id', user.id)
    .single()

  if (!withdrawal || withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })
  }

  // Refund SPY to user
  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('increment', { x: withdrawal.amount_spy }) })
    .eq('id', user.id)

  await supabase
    .from('withdrawals')
    .update({ status: 'cancelled' })
    .eq('id', withdrawalId)

  return NextResponse.json({ success: true })
}
