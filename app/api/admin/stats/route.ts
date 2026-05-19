// app/api/admin/stats/route.ts
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
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { data: deposits },
    { data: withdrawals },
    { data: tasks }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('deposits').select('amount_usd, status'),
    supabase.from('withdrawals').select('amount_usd, status'),
    supabase.from('tasks').select('total_completions')
  ])

  const totalDeposits = deposits?.reduce((sum, d) => sum + (d.status === 'completed' ? d.amount_usd : 0), 0) || 0
  const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount_usd, 0) || 0
  const totalWithdrawn = withdrawals?.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount_usd, 0) || 0

  return NextResponse.json({
    users: { total: totalUsers, premium: premiumUsers },
    deposits: { total: totalDeposits, pending: 0 },
    withdrawals: { total: totalWithdrawn, pending: pendingWithdrawals },
    tasks: { completed: tasks?.reduce((sum, t) => sum + (t.total_completions || 0), 0) || 0 }
  })
}
