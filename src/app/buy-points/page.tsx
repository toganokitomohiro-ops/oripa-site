'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PointPlan = {
  id: string
  name: string
  price: number
  points: number
  bonus_percent: number
  is_popular: boolean
  is_active: boolean
}

export default function BuyPointsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [plans, setPlans] = useState<PointPlan[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [pointLogs, setPointLogs] = useState<any[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUser(session.user)
      fetchProfile(session.user.id)
      fetchLogs(session.user.id)
    })
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    const { data } = await supabase.from('point_plans').select('*').eq('is_active', true).order('sort_order')
    if (data) setPlans(data)
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('points').eq('id', userId).single()
    if (data) setPoints(data.points || 0)
  }

  const fetchLogs = async (userId: string) => {
    const { data } = await supabase.from('point_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    if (data) setPointLogs(data)
  }

  const handleCouponApply = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCoupon(null)
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single()
    if (!data) {
      setCouponError('クーポンが見つかりません')
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError('クーポンの有効期限が切れています')
    } else if (data.used_count >= data.max_uses) {
      setCouponError('クーポンの使用回数が上限に達しています')
    } else {
      setCoupon(data)
    }
    setCouponLoading(false)
  }

  const getDiscountedPrice = (price: number) => {
    if (!coupon || !coupon.discount_percent) return price
    return Math.floor(price * (1 - coupon.discount_percent / 100))
  }

  const getTotalPoints = (plan: PointPlan) => {
    const bonusPoints = Math.floor(plan.points * plan.bonus_percent / 100)
    const couponBonus = coupon?.bonus_points || 0
    return plan.points + bonusPoints + couponBonus
  }

  const handlePurchase = (plan: PointPlan) => {
    if (!user) { router.push('/auth/login'); return }
    if (coupon) sessionStorage.setItem('applied_coupon', JSON.stringify(coupon))
    router.push('/buy-points/checkout?plan_id=' + plan.id)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '80px' }}>
      <Header />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '20px' }}>コイン購入</h1>

        {/* クーポン */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>クーポンコード</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', textTransform: 'uppercase' }}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="クーポンコードを入力"
              onKeyDown={(e) => e.key === 'Enter' && handleCouponApply()}
            />
            <button onClick={handleCouponApply} disabled={couponLoading} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {couponLoading ? '確認中' : '適用'}
            </button>
          </div>
          {couponError && <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '6px' }}>{couponError}</div>}
          {coupon && (
            <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>{coupon.code} 適用中！</span>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {coupon.discount_percent > 0 && `${coupon.discount_percent}%割引 `}
                  {coupon.bonus_points > 0 && `+${coupon.bonus_points}コインボーナス`}
                </div>
              </div>
              <button onClick={() => { setCoupon(null); setCouponCode('') }} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>

        {/* プラン一覧 オリパワン風 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {plans.map((plan) => {
            const totalPoints = getTotalPoints(plan)
            const discountedPrice = getDiscountedPrice(plan.price)
            const bonusPoints = Math.floor(plan.points * plan.bonus_percent / 100) + (coupon?.bonus_points || 0)
            const isLoading = loading === plan.id
            return (
              <div key={plan.id} style={{ background: 'white', borderRadius: '12px', border: plan.is_popular ? '2px solid #f97316' : '1px solid #e5e7eb', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: plan.is_popular ? '0 2px 12px rgba(249,115,22,0.15)' : '0 1px 4px rgba(0,0,0,0.04)', position: 'relative' }}>
                {plan.is_popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '16px', background: '#f97316', color: 'white', fontSize: '11px', fontWeight: '900', padding: '3px 12px', borderRadius: '999px', letterSpacing: '0.5px' }}>人気</div>
                )}
                {/* 左：コインアイコン＋枚数 */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* コインアイコン */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} /><div style={{ display: 'none' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#7a5500', lineHeight: 1 }}>P</span>
                    </div>
                  </div>
                  {/* コイン数・増量バッジ */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '26px', fontWeight: '900', color: '#1f2937', lineHeight: 1 }}>{totalPoints.toLocaleString()}</span>
                      <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>コイン</span>
                      {bonusPoints > 0 && (
                        <span style={{ fontSize: '12px', background: 'white', color: '#ef4444', padding: '3px 10px', borderRadius: '999px', fontWeight: '800', border: '1px solid #fca5a5' }}>
                          {plan.bonus_percent > 0 && `${plan.bonus_percent}%増量`}
                          {coupon?.bonus_points > 0 && ` +${coupon.bonus_points}コインボーナス`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右：購入ボタン */}
                <div style={{ flexShrink: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {coupon && coupon.discount_percent > 0 && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', textAlign: 'center', marginBottom: '2px' }}>¥{plan.price.toLocaleString()}</div>
                  )}
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={isLoading}
                    style={{ padding: '14px 0', background: isLoading ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: isLoading ? 'not-allowed' : 'pointer', width: '140px', display: 'block', boxShadow: isLoading ? 'none' : '0 2px 8px rgba(249,115,22,0.4)' }}
                  >
                    {isLoading ? '処理中...' : `¥${discountedPrice.toLocaleString()} 円`}
                  </button>

                </div>
              </div>
            )
          })}
        </div>

        {/* ポイント履歴 */}
        {pointLogs.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>購入履歴</h2>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              {pointLogs.map((log, i) => (
                <div key={log.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{log.description}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDate(log.created_at)}</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: log.amount > 0 ? '#10b981' : '#ef4444' }}>
                    {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}コイン
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}