import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } else {
      event = JSON.parse(body)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log('Webhook event type:', event.type)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, points } = session.metadata || {}

    if (user_id && points) {
      const pointsNum = parseInt(points)

      // ポイント付与
      const { data: profile } = await supabase
        .from('profiles')
        .select('points, total_spent')
        .eq('id', user_id)
        .single()

      console.log('Profile found:', profile)
      if (profile) {
        await supabase.from('profiles').update({
          points: (profile.points || 0) + pointsNum,
          total_spent: (profile.total_spent || 0) + (session.amount_total || 0),
        }).eq('id', user_id)

        // ポイントログ記録
        await supabase.from('point_logs').insert({
          user_id,
          amount: pointsNum,
          type: 'purchase',
          description: `ポイント購入（¥${session.amount_total?.toLocaleString()}）`,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}