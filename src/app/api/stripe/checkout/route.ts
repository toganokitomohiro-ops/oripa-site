import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover' as any,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { plan_id, user_id, email, payment_method, total_points, discounted_price, coupon_code } = await req.json()

    const { data: plan } = await supabase.from('point_plans').select('*').eq('id', plan_id).single()
    if (!plan) return NextResponse.json({ error: 'プランが見つかりません' }, { status: 400 })

    const price = discounted_price || plan.price
    const points = total_points || plan.points
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // 支払い方法ごとの設定
    const methodConfig: Record<string, any> = {
      card: {
        payment_method_types: ['card'],
      },
      konbini: {
        payment_method_types: ['konbini'],
      },
      bank: {
        payment_method_types: ['customer_balance'],
        payment_method_options: {
          customer_balance: {
            funding_type: 'bank_transfer',
            bank_transfer: { type: 'jp_bank_transfer' },
          },
        },
      },
    }

    const config = methodConfig[payment_method || 'card']

    // 銀行振込はCustomerが必要
    let customerId: string | undefined
    if (payment_method === 'bank') {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({ email })
        customerId = customer.id
      }
    }

    const sessionParams: any = {
      ...config,
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${plan.name} コイン購入`,
              description: `${points.toLocaleString()}コイン付与`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/buy-points/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buy-points`,
      metadata: {
        user_id,
        plan_id,
        points: points.toString(),
        coupon_code: coupon_code || '',
        payment_method: payment_method || 'card',
      },
      customer_email: payment_method !== 'bank' ? email : undefined,
      customer: customerId,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}