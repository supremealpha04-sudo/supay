// app/api/user/balance/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('spy_balance')
    .eq('id', user.id)
    .single()

  const { data: breakdown } = await supabase
    .from('user_spy_breakdown')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const withdrawable = (breakdown?.earned_spy || 0) + (breakdown?.referral_spy || 0) + (breakdown?.staking_rewards_spy || 0)

  return NextResponse.json({
    total: profile?.spy_balance || 0,
    withdrawable,
    locked: breakdown?.deposited_spy || 0
  })
}
