import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { tokenId } = await request.json()

  const { data: nft } = await supabase
    .from('user_nfts')
    .select('*')
    .eq('token_id', tokenId)
    .eq('user_id', user.id)
    .single()

  if (!nft || !nft.is_staked) {
    return NextResponse.json({ error: 'NFT not staked' }, { status: 400 })
  }

  // Calculate pending rewards before unstaking
  const timeStaked = (new Date().getTime() - new Date(nft.last_claim).getTime()) / 1000
  const dailyReward = 10 // Would get from badge
  const pendingRewards = Math.floor((dailyReward * timeStaked) / 86400)

  if (pendingRewards > 0) {
    await supabase
      .from('profiles')
      .update({ spy_balance: supabase.rpc('increment', { x: pendingRewards }) })
      .eq('id', user.id)
  }

  await supabase
    .from('user_nfts')
    .update({
      is_staked: false,
      staked_since: null,
      total_rewards_claimed: supabase.rpc('increment', { x: pendingRewards })
    })
    .eq('token_id', tokenId)

  return NextResponse.json({ success: true, rewards_claimed: pendingRewards })
}
