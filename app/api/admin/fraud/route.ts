// app/api/admin/fraud/route.ts
import { createRouteHandlerClient} from '@supabase/auth-helpers-nextjs'
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

  const { data: alerts } = await supabase
    .from('fraud_alerts')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ alerts })
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { alertId, resolved, action } = await request.json()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (action === 'ban_user') {
    const { data: alert } = await supabase
      .from('fraud_alerts')
      .select('user_id')
      .eq('id', alertId)
      .single()

    if (alert) {
      await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', alert.user_id)
    }
  }

  await supabase
    .from('fraud_alerts')
    .update({ resolved, resolved_at: new Date().toISOString(), resolved_by: user?.id })
    .eq('id', alertId)

  return NextResponse.json({ success: true })
}
