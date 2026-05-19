// app/api/premium/cancel/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase
    .from('premium_subscriptions')
    .update({ auto_renew: false })
    .eq('user_id', user.id)
    .eq('is_active', true)

  return NextResponse.json({ success: true })
}
