import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { tokenId } = await request.json()

  const { data: nft } = await supabase
    .from('user_nfts')
    .select('*, nft_badges(*)')
    .eq('token_id', tokenId)
    .eq('user_id', user.id)
    .single()

  if (!nft) {
    return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
  }

  if (nft.is_staked) {
    return NextResponse.json({ error: 'Already staked' }, { status: 400 })
  }

  await supabase
    .from('user_nfts')
    .update({
      is_staked: true,
      staked_since: new Date().toISOString(),
      last_claim: new Date().toISOString()
    })
    .eq('token_id', tokenId)

  return NextResponse.json({
    success: true,
    daily_reward: nft.nft_badges?.staking_reward_daily
  })
}
