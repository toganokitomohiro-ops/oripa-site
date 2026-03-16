'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PointPlan = {
  id: string
  name: string
  price: number
  points: number
  bonus_percent: number
  is_popular: boolean
  is_active: boolean
  sort_order: number
}

type Coupon = {
  id: string
  code: string
  discount_percent: number
  bonus_points: number
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
}

export default function AdminPointsPage() {
  const [plans, setPlans] = useState<PointPlan[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons'>('plans')
  const [planForm, setPlanForm] = useState({ name: '', price: '', points: '', bonus_percent: '0', is_popular: false, sort_order: '0' })
  const [couponForm, setCouponForm] = useState({ code: '', discount_percent: '0', bonus_points: '0', max_uses: '1', expires_at: '' })
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    const [p, c] = await Promise.all([
      supabase.from('point_plans').select('*').order('sort_order'),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    ])
    if (p.data) setPlans(p.data)
    if (c.data) setCoupons(c.data)
  }

  useEffect(() => { fetchAll() }, [])

  const handlePlanSubmit = async () => {
    if (!planForm.name || !planForm.price || !planForm.points) return
    setLoading(true)
    const data = {
      name: planForm.name,
      price: Number(planForm.price),
      points: Number(planForm.points),
      bonus_percent: Number(planForm.bonus_percent),
      is_popular: planForm.is_popular,
      sort_order: Number(planForm.sort_order),
    }
    if (editingPlanId) {
      await supabase.from('point_plans').update(data).eq('id', editingPlanId)
      setEditingPlanId(null)
    } else {
      await supabase.from('point_plans').insert({ ...data, is_active: true })
    }
    setPlanForm({ name: '', price: '', points: '', bonus_percent: '0', is_popular: false, sort_order: '0' })
    await fetchAll()
    setLoading(false)
  }

  const handlePlanEdit = (plan: PointPlan) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      name: plan.name,
      price: plan.price.toString(),
      points: plan.points.toString(),
      bonus_percent: plan.bonus_percent.toString(),
      is_popular: plan.is_popular,
      sort_order: plan.sort_order.toString(),
    })
  }

  const handlePlanToggle = async (id: string, current: boolean) => {
    await supabase.from('point_plans').update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  const handlePlanDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('point_plans').delete().eq('id', id)
    fetchAll()
  }

  const handleCouponSubmit = async () => {
    if (!couponForm.code) return
    setLoading(true)
    await supabase.from('coupons').insert({
      code: couponForm.code.toUpperCase(),
      discount_percent: Number(couponForm.discount_percent),
      bonus_points: Number(couponForm.bonus_points),
      max_uses: Number(couponForm.max_uses),
      expires_at: couponForm.expires_at || null,
      is_active: true,
      used_count: 0,
    })
    setCouponForm({ code: '', discount_percent: '0', bonus_points: '0', max_uses: '1', expires_at: '' })
    await fetchAll()
    setLoading(false)
  }

  const handleCouponToggle = async (id: string, current: boolean) => {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  const handleCouponDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('coupons').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>ポイント管理</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>購入プラン・クーポンの管理</p>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        {[
          { key: 'plans', label: '購入プラン' },
          { key: 'coupons', label: 'クーポン管理' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#db2777' : '#6b7280', borderBottom: activeTab === tab.key ? '2px solid #db2777' : '2px solid transparent', marginBottom: '-2px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 購入プランタブ */}
      {activeTab === 'plans' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
              {editingPlanId ? 'プランを編集' : 'プランを追加'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>プラン名</label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="例：3,000コイン" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>販売価格（¥）</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} placeholder="3000" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>付与コイン数</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={planForm.points} onChange={(e) => setPlanForm({ ...planForm, points: e.target.value })} placeholder="3000" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>ボーナス増量（%）</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={planForm.bonus_percent} onChange={(e) => setPlanForm({ ...planForm, bonus_percent: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>表示順</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={planForm.sort_order} onChange={(e) => setPlanForm({ ...planForm, sort_order: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                  <input type="checkbox" checked={planForm.is_popular} onChange={(e) => setPlanForm({ ...planForm, is_popular: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  人気No.1バッジ
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePlanSubmit} disabled={loading || !planForm.name} style={{ background: !planForm.name ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !planForm.name ? 'not-allowed' : 'pointer' }}>
                {editingPlanId ? '更新する' : '追加する'}
              </button>
              {editingPlanId && (
                <button onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', price: '', points: '', bonus_percent: '0', is_popular: false, sort_order: '0' }) }} style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>キャンセル</button>
              )}
            </div>
          </div>

          {/* プラン一覧 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>プラン一覧</div>
            {plans.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>プランがまだ登録されていません</div>
            ) : (
              plans.map((plan, i) => {
                const totalPoints = Math.floor(plan.points * (1 + plan.bonus_percent / 100))
                return (
                  <div key={plan.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{plan.name}</span>
                        {plan.is_popular && <span style={{ fontSize: '11px', background: '#e67e00', color: 'white', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>人気No.1</span>}
                        {plan.bonus_percent > 0 && <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>{plan.bonus_percent}%増量</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        ¥{plan.price.toLocaleString()} → {totalPoints.toLocaleString()}コイン付与 / 表示順:{plan.sort_order}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: plan.is_active ? '#10b981' : '#6b7280', background: plan.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
                      {plan.is_active ? '公開中' : '非公開'}
                    </span>
                    <button onClick={() => handlePlanEdit(plan)} style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>編集</button>
                    <button onClick={() => handlePlanToggle(plan.id, plan.is_active)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                      {plan.is_active ? '非公開に' : '公開する'}
                    </button>
                    <button onClick={() => handlePlanDelete(plan.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* クーポンタブ */}
      {activeTab === 'coupons' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>クーポンを作成</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>クーポンコード</label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', textTransform: 'uppercase' }} value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="例：WELCOME2024" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>割引率（%）</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={couponForm.discount_percent} onChange={(e) => setCouponForm({ ...couponForm, discount_percent: e.target.value })} placeholder="0" min="0" max="100" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>ボーナスポイント</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={couponForm.bonus_points} onChange={(e) => setCouponForm({ ...couponForm, bonus_points: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>最大使用回数</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })} placeholder="1" min="1" />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>有効期限（任意）</label>
                <input type="datetime-local" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={couponForm.expires_at} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })} />
              </div>
            </div>
            <button onClick={handleCouponSubmit} disabled={loading || !couponForm.code} style={{ background: !couponForm.code ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !couponForm.code ? 'not-allowed' : 'pointer' }}>
              作成する
            </button>
          </div>

          {/* クーポン一覧 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>クーポン一覧</div>
            {coupons.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>クーポンがまだ登録されていません</div>
            ) : (
              coupons.map((coupon, i) => (
                <div key={coupon.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', fontFamily: 'monospace' }}>{coupon.code}</span>
                      {coupon.discount_percent > 0 && <span style={{ fontSize: '11px', background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>{coupon.discount_percent}%OFF</span>}
                      {coupon.bonus_points > 0 && <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>+{coupon.bonus_points}PT</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      使用回数: {coupon.used_count}/{coupon.max_uses}
                      {coupon.expires_at && ` / 期限: ${new Date(coupon.expires_at).toLocaleDateString('ja-JP')}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: coupon.is_active ? '#10b981' : '#6b7280', background: coupon.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
                    {coupon.is_active ? '有効' : '無効'}
                  </span>
                  <button onClick={() => handleCouponToggle(coupon.id, coupon.is_active)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                    {coupon.is_active ? '無効化' : '有効化'}
                  </button>
                  <button onClick={() => handleCouponDelete(coupon.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}