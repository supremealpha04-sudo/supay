import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  const { amount, cardDetails } = await request.json()

  // Integrate with Paystack charge endpoint
  const response = await fetch('https://api.paystack.co/transaction/charge', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount * 100,
      email: user.email,
      card: cardDetails,
      metadata: { user_id: user.id }
    })
  })

  const data = await response.json()

  return NextResponse.json(data)
}
