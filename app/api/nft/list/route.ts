import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: nfts } = await supabase
    .from('nft_badges')
    .select('*')
    .eq('is_active', true)
    .order('purchase_price_spy', { ascending: true })

  return NextResponse.json({ nfts })
}
