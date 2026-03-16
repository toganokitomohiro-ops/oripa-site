'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PointPlan = {
  id: string
  name: string
  price: number
  points: number
  bonus_percent: number
}

type PaymentMethod = 'card' | 'konbini' | 'bank'

const PAYMENT_METHODS = [
  {
    id: 'card' as PaymentMethod,
    label: 'クレジットカード',
    desc: 'VISA / Mastercard / JCB / AMEX',
    icon: '💳',
    bonus_extra: 3,
  },
  {
    id: 'konbini' as PaymentMethod,
    label: 'コンビニ支払い',
    desc: 'セブン・ローソン・ファミマなど',
    icon: '🏪',
    bonus_extra: 7,
  },
  {
    id: 'bank' as PaymentMethod,
    label: '銀行振込',
    desc: '振込確認後にコイン付与',
    icon: '🏦',
    bonus_extra: 7,
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan_id')

  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<PointPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUser(session.user)
    })
    if (planId) fetchPlan(planId)
    // クーポン情報をsessionStorageから取得
    const savedCoupon = sessionStorage.getItem('applied_coupon')
    if (savedCoupon) setCoupon(JSON.parse(savedCoupon))
  }, [planId])

  const fetchPlan = async (id: string) => {
    const { data } = await supabase.from('point_plans').select('*').eq('id', id).single()
    if (data) setPlan(data)
  }

  const getSelectedMethod = () => PAYMENT_METHODS.find(m => m.id === paymentMethod)!

  const getDiscountedPrice = () => {
    if (!plan) return 0
    if (!coupon?.discount_percent) return plan.price
    return Math.floor(plan.price * (1 - coupon.discount_percent / 100))
  }

  const getTotalPoints = () => {
    if (!plan) return 0
    const method = getSelectedMethod()
    const baseBonus = Math.floor(plan.points * plan.bonus_percent / 100)
    const methodBonus = Math.floor(plan.points * method.bonus_extra / 100)
    const couponBonus = coupon?.bonus_points || 0
    return plan.points + baseBonus + methodBonus + couponBonus
  }

  const getMethodBonusPoints = () => {
    if (!plan) return 0
    const method = getSelectedMethod()
    return Math.floor(plan.points * method.bonus_extra / 100)
  }

  const getBaseBonusPoints = () => {
    if (!plan) return 0
    return Math.floor(plan.points * plan.bonus_percent / 100)
  }

  const handlePurchase = async () => {
    if (!user || !plan) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          user_id: user.id,
          email: user.email,
          payment_method: paymentMethod,
          total_points: getTotalPoints(),
          discounted_price: getDiscountedPrice(),
          coupon_code: coupon?.code || null,
        }),
      })
      const data = await res.json()
      if (data.url) {
        sessionStorage.removeItem('applied_coupon')
        window.location.href = data.url
      } else {
        alert('エラー: ' + (data.error || '不明なエラー'))
      }
    } catch {
      alert('通信エラーが発生しました')
    }
    setLoading(false)
  }

  if (!plan) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#999' }}>読み込み中...</div>
    </div>
  )

  const price = getDiscountedPrice()
  const totalPoints = getTotalPoints()
  const baseBonus = getBaseBonusPoints()
  const methodBonus = getMethodBonusPoints()
  const method = getSelectedMethod()

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', paddingBottom: '40px' }}>

      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>‹ コイン購入</button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>お支払い</h1>

        {/* バナー（支払い方法ボーナス案内） */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d1b00)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', textAlign: 'center', border: '2px solid #f5c518' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#f5c518', marginBottom: '6px' }}>💰 支払い方法でボーナスコインGET！</div>
          <div style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>
            銀行振込 / コンビニ
            <span style={{ color: '#f5c518', fontSize: '16px', marginLeft: '6px' }}>+7%</span>
          </div>
          <div style={{ fontSize: '13px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
            クレジットカード
            <span style={{ color: '#ef4444', fontSize: '16px', marginLeft: '6px' }}>+3%</span>
          </div>
        </div>

        {/* 購入内容 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '16px' }}>購入内容</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '15px', color: '#374151' }}>支払い金額</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#1f2937' }}>
              {price.toLocaleString()}
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginLeft: '2px' }}>円</span>
            </span>
          </div>

          <div style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>基本コイン</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{plan.points.toLocaleString()}コイン</span>
            </div>
            {baseBonus > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>増量コイン（{plan.bonus_percent}%）</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>+{baseBonus.toLocaleString()}コイン</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>支払い方法ボーナス（{method.bonus_extra}%）</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>+{methodBonus.toLocaleString()}コイン</span>
            </div>
            {coupon?.bonus_points > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>クーポンボーナス</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>+{coupon.bonus_points}コイン</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #e5e7eb', marginTop: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#e67e00' }}>獲得コイン</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#e67e00' }}>
                {totalPoints.toLocaleString()}
                <span style={{ fontSize: '13px', marginLeft: '2px' }}>コイン</span>
              </span>
            </div>
          </div>
        </div>

        {/* 支払い方法選択 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '16px' }}>お支払い方法</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PAYMENT_METHODS.map((m) => (
              <div
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px', border: '2px solid', borderColor: paymentMethod === m.id ? '#f5c518' : '#e5e7eb', background: paymentMethod === m.id ? '#fffbeb' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {/* ラジオボタン */}
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === m.id ? '#f5c518' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {paymentMethod === m.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f5c518' }} />}
                </div>
                <span style={{ fontSize: '22px' }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{m.label}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{m.desc}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: m.id === 'card' ? '#ef4444' : '#e67e00', background: m.id === 'card' ? '#fef2f2' : '#fef3c7', padding: '3px 10px', borderRadius: '999px', border: `1px solid ${m.id === 'card' ? '#fca5a5' : '#fde68a'}` }}>
                    +{m.bonus_extra}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 購入ボタン */}
        <button
          onClick={handlePurchase}
          disabled={loading}
          style={{ width: '100%', padding: '18px', background: loading ? '#9ca3af' : '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(245,197,24,0.4)' }}
        >
          {loading ? '処理中...' : '購入する'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
          購入後のキャンセル・返金はできません
        </p>
      </div>
    </div>
  )
}