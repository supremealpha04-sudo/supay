// app/api/nft/marketplace/buy/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { listingId } = await request.json()

  const { data: listing } = await supabase
    .from('nft_listings')
    .select('*, user_nfts(*), profiles!seller_id(username)')
    .eq('id', listingId)
    .single()

  if (!listing || !listing.is_active) {
    return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
  }

  const { data: buyer } = await supabase
    .from('profiles')
    .select('spy_balance')
    .eq('id', user.id)
    .single()

  if ((buyer?.spy_balance || 0) < listing.price_spy) {
    return NextResponse.json({ error: 'Insufficient SPY' }, { status: 400 })
  }

  const fee = Math.floor(listing.price_spy * 0.05)
  const sellerAmount = listing.price_spy - fee

  // Transfer SPY
  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('decrement', { x: listing.price_spy }) })
    .eq('id', user.id)

  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('increment', { x: sellerAmount }) })
    .eq('id', listing.user_id)

  // Transfer NFT
  await supabase
    .from('user_nfts')
    .update({ user_id: user.id })
    .eq('id', listing.user_nft_id)

  // Mark listing as sold
  await supabase
    .from('nft_listings')
    .update({ is_active: false, sold_at: new Date().toISOString() })
    .eq('id', listingId)

  return NextResponse.json({ success: true })
}
