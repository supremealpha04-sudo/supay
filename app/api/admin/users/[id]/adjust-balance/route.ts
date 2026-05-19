// app/api/admin/users/[id]/adjust-balance/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { amount, reason } = await request.json()

  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  if (!adminCheck?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('spy_balance')
    .eq('id', params.id)
    .single()

  const newBalance = (targetUser?.spy_balance || 0) + amount

  await supabase
    .from('profiles')
    .update({ spy_balance: newBalance })
    .eq('id', params.id)

  await supabase.from('transactions').insert({
    user_id: params.id,
    type: 'admin_adjustment',
    amount_spy: amount,
    balance_before: targetUser?.spy_balance || 0,
    balance_after: newBalance,
    metadata: { reason, admin_id: user?.id }
  })

  return NextResponse.json({ success: true, new_balance: newBalance })
}
