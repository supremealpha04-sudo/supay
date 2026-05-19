// app/api/ads/complete/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { duration } = await request.json()

  if (duration < 10) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('ad_watches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today)

  if ((count || 0) >= 20) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, spy_balance')
    .eq('id', user.id)
    .single()

  const reward = Math.floor(Math.random() * 5) + 1
  const finalReward = profile?.is_premium ? reward * 2 : reward

  await supabase.from('ad_watches').insert({
    user_id: user.id,
    reward_spy: finalReward,
    watch_duration: duration,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  })

  const newBalance = (profile?.spy_balance || 0) + finalReward
  await supabase
    .from('profiles')
    .update({
      spy_balance: newBalance,
      daily_ad_watch_count: (count || 0) + 1,
      last_ad_watch_at: new Date().toISOString()
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true, reward: finalReward })
}
