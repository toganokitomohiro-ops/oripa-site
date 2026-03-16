'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Coupon = {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
  created_at: string
}

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'coupon' | 'invite' | 'notice'>('coupon')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'point',
    discount_value: 0,
    max_uses: 0,
    expires_at: '',
  })
  const [notices, setNotices] = useState<{ id: string; title: string; content: string; is_active: boolean; created_at: string }[]>([])
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' })

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (data) setCoupons(data)
  }

  const fetchNotices = async () => {
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    if (data) setNotices(data)
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleAddCoupon = async () => {
    if (!couponForm.code) return
    const { error } = await supabase.from('coupons').insert({
      code: couponForm.code.toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      max_uses: Number(couponForm.max_uses) || null,
      expires_at: couponForm.expires_at || null,
      is_active: true,
      used_count: 0,
    })
    if (!error) {
      setCouponForm({ code: '', discount_type: 'point', discount_value: 0, max_uses: 0, expires_at: '' })
      fetchCoupons()
    }
  }

  const handleAddNotice = async () => {
    if (!noticeForm.title) return
    await supabase.from('notices').insert({
      title: noticeForm.title,
      content: noticeForm.content,
      is_active: true,
    })
    setNoticeForm({ title: '', content: '' })
    fetchNotices()
  }

  const handleToggleNotice = async (id: string, current: boolean) => {
    await supabase.from('notices').update({ is_active: !current }).eq('id', id)
    fetchNotices()
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('notices').delete().eq('id', id)
    fetchNotices()
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setCouponForm({ ...couponForm, code })
  }

  const tabs = [
    { value: 'coupon', label: 'クーポン管理' },
    { value: 'invite', label: '招待コード' },
    { value: 'notice', label: 'お知らせ管理' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>マーケティング</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>クーポン・招待コード・お知らせの管理ができます</p>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value as typeof activeTab)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === t.value ? 'bold' : 'normal',
              background: activeTab === t.value ? '#db2777' : 'transparent',
              color: activeTab === t.value ? 'white' : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* クーポン管理 */}
      {activeTab === 'coupon' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>クーポンを作成</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>クーポンコード</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', textTransform: 'uppercase' }}
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="例：SUMMER2024"
                  />
                  <button
                    onClick={generateCode}
                    style={{ background: '#f3f4f6', color: '#374151', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    自動生成
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>割引タイプ</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                >
                  <option value="point">ポイント付与</option>
                  <option value="percent">割引（%）</option>
                  <option value="fixed">割引（円）</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  {couponForm.discount_type === 'point' ? '付与ポイント' : couponForm.discount_type === 'percent' ? '割引率（%）' : '割引額（円）'}
                </label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })}
                  placeholder="例：500"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>最大使用回数（0=無制限）</label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={couponForm.max_uses}
                  onChange={(e) => setCouponForm({ ...couponForm, max_uses: Number(e.target.value) })}
                  placeholder="例：100"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>有効期限</label>
                <input
                  type="date"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={handleAddCoupon}
              disabled={!couponForm.code}
              style={{ marginTop: '16px', background: !couponForm.code ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !couponForm.code ? 'not-allowed' : 'pointer' }}
            >
              クーポンを作成
            </button>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 'bold', marginBottom: '4px' }}>クーポン機能について</div>
            <div style={{ fontSize: '13px', color: '#92400e' }}>
              クーポン機能を使うには「coupons」テーブルをSupabaseに作成する必要があります。ガチャ機能実装後に連携されます。
            </div>
          </div>
        </div>
      )}

      {/* 招待コード */}
      {activeTab === 'invite' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔗</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>招待コード機能</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>ガチャ機能・ユーザー機能実装後に追加されます</div>
        </div>
      )}

      {/* お知らせ管理 */}
      {activeTab === 'notice' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>お知らせを作成</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>タイトル</label>
                <input
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="例：新パック登場のお知らせ"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>内容</label>
                <textarea
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="お知らせの内容を入力..."
                  rows={3}
                />
              </div>
              <button
                onClick={handleAddNotice}
                disabled={!noticeForm.title}
                style={{ alignSelf: 'flex-start', background: !noticeForm.title ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !noticeForm.title ? 'not-allowed' : 'pointer' }}
              >
                投稿する
              </button>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>お知らせ一覧</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{notices.length}件</span>
            </div>
            {notices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                まだお知らせがありません
              </div>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{notice.title}</span>
                        <span style={{ fontSize: '11px', color: notice.is_active ? '#10b981' : '#6b7280', background: notice.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
                          {notice.is_active ? '公開中' : '非公開'}
                        </span>
                      </div>
                      {notice.content && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{notice.content}</div>
                      )}
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                        {new Date(notice.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleToggleNotice(notice.id, notice.is_active)}
                        style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                      >
                        {notice.is_active ? '非公開に' : '公開する'}
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}