// app/api/admin/broadcast/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { title, message, audience, type } = await request.json()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let query = supabase.from('profiles').select('id')

  if (audience === 'premium') {
    query = query.eq('is_premium', true)
  } else if (audience === 'active') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('last_active', weekAgo.toISOString())
  }

  const { data: users } = await query

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No users found' }, { status: 400 })
  }

  const notifications = users.map(u => ({
    user_id: u.id,
    title,
    message,
    type: type || 'info',
    metadata: { broadcast: true, sent_by: user?.id }
  }))

  await supabase.from('notifications').insert(notifications)

  return NextResponse.json({ success: true, sent_to: users.length })
}
