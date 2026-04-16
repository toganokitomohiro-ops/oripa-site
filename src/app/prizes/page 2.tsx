'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Draw = {
  id: string
  grade: string
  status: string
  created_at: string
  sold_at: string | null
  prizes: { pt_exchange: number }
  products: {
    name: string
    image_url: string
    market_value: number
  }
}

export default function PrizesPage() {
  const router = useRouter()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [selling, setSelling] = useState(false)
  const [tab, setTab] = useState<'pending' | 'sold' | 'shipped'>('pending')
  const [showSellModal, setShowSellModal] = useState(false)
  const [userPoints, setUserPoints] = useState(0)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
    if (profile) setUserPoints(profile.points)

    const { data } = await supabase
      .from('draws')
      .select('*, prizes(pt_exchange), products(name, image_url, market_value)')
      .eq('user_id', session.user.id)
      .is('sold_at', null)
      .order('created_at', { ascending: false })

    if (data) setDraws(data)
    setLoading(false)
  }

  const handleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    const pendingIds = filteredDraws.map(d => d.id)
    if (selected.length === pendingIds.length) {
      setSelected([])
    } else {
      setSelected(pendingIds)
    }
  }

  const getTotalPt = () => {
    return selected.reduce((sum, id) => {
      const draw = draws.find(d => d.id === id)
      return sum + (draw?.prizes?.pt_exchange || 0)
    }, 0)
  }

  const handleSell = async () => {
    if (!userId || selected.length === 0) return
    setShowSellModal(true)
  }
  const handleSellConfirm = async () => {
    setShowSellModal(false)
    setSelling(true)
    try {
      const res = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_ids: selected, user_id: userId }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`✅ ${data.sold_count}枚交換！+${data.total_points.toLocaleString()}コイン獲得！`)
        setSelected([])
        await fetchData()
      } else {
        alert('エラー: ' + data.error)
      }
    } catch {
      alert('通信エラーが発生しました')
    }
    setSelling(false)
  }

  const filteredDraws = draws.filter(d => {
    if (tab === 'pending') return d.status === 'pending'
    if (tab === 'sold') return d.status === 'sold'
    if (tab === 'shipped') return d.status === 'shipped'
    return true
  })

  const gradeColors: Record<string, { bg: string; text: string }> = {
    'S賞': { bg: 'linear-gradient(135deg, #7c3aed, #db2777)', text: 'white' },
    'A賞': { bg: '#f97316', text: 'white' },
    'B賞': { bg: '#3b82f6', text: 'white' },
    'C賞': { bg: '#6b7280', text: 'white' },
    'ラストワン賞': { bg: 'linear-gradient(135deg, #f472b6, #be185d)', text: 'white' },
  }

  const tabs = [
    { key: 'pending', label: '保管中', count: draws.filter(d => d.status === 'pending').length },
    { key: 'sold', label: '交換済み', count: draws.filter(d => d.status === 'sold').length },
    { key: 'shipped', label: '発送申請', count: draws.filter(d => d.status === 'shipped').length },
  ]

  return (
    <div className="has-bottom-nav" style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '160px' }}>
      {/* ヘッダー */}
      <Header />

      {/* タブナビゲーション */}
    <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '900px', width: '100%', display: 'flex' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as 'pending' | 'sold' | 'shipped'); setSelected([]) }}
            style={{ flex: 1, padding: '14px 8px', fontSize: '13px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: tab === t.key ? '#f97316' : '#666', borderBottom: tab === t.key ? '3px solid #f97316' : '3px solid transparent', whiteSpace: 'nowrap' }}
          >
            {t.label}
            {t.count > 0 && <span style={{ marginLeft: '4px', fontSize: '11px', background: tab === t.key ? '#f97316' : '#e5e7eb', color: tab === t.key ? 'white' : '#666', borderRadius: '999px', padding: '1px 6px' }}>{t.count}</span>}
          </button>
        ))}
      </div>
    </div>

    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
          </div>
        ) : filteredDraws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <img src="/characters/alpoo-happy.png" alt="あるぷー" style={{ width: '180px', height: 'auto', marginBottom: '12px', mixBlendMode: 'multiply' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
              {tab === 'pending' ? 'まだ獲得商品がありません' : tab === 'sold' ? '交換済みの商品はありません' : '発送申請した商品はありません'}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              {tab === 'pending' ? 'ガチャを回して商品をゲットしよう！🎰' : 'コインに交換するとここに表示されます'}
            </div>
          </div>
        ) : (
          <div className="prizes-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDraws.map((draw) => {
              const isSelected = selected.includes(draw.id)
              return (
                <div
                  key={draw.id}
                  onClick={() => tab === 'pending' && handleSelect(draw.id)}
                  style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: tab === 'pending' ? 'pointer' : 'default', border: '2px solid', borderColor: isSelected ? '#f97316' : 'transparent' }}
                >
                  {/* チェック */}
                  {tab === 'pending' && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', borderColor: isSelected ? '#f97316' : '#d1d5db', background: isSelected ? '#f97316' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  )}

                  {/* 画像 */}
                  <div style={{ width: '60px', height: '80px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {draw.products?.image_url
                      ? <img src={draw.products.image_url} alt={draw.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🃏</div>
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', background: (gradeColors[draw.grade] || gradeColors['C賞']).bg, color: (gradeColors[draw.grade] || gradeColors['C賞']).text, padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>{draw.grade}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{draw.products?.name || '不明な商品'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316' }}>{draw.prizes?.pt_exchange?.toLocaleString() || 0}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>コイン</span>
                    </div>
                    {tab === 'sold' && draw.sold_at && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>売却日：{new Date(draw.sold_at).toLocaleDateString('ja-JP')}</div>
                    )}
                    {tab === 'shipped' && (
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>発送済み ✓</div>
                    )}
                  </div>

                  {/* 未選択タグ */}
                  {tab === 'pending' && !isSelected && (
                    <div style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>未選択 ›</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 固定フッター */}
      {tab === 'pending' && (
        <div className="prizes-action-footer" style={{ position: 'fixed', bottom: '56px', left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', zIndex: 20 }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316' }}>{getTotalPt().toLocaleString()}</span>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>コイン</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={handleSelectAll} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  全て選択
                </button>
                <button onClick={() => setSelected([])} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  リセット
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSell}
                disabled={selected.length === 0 || selling}
                style={{ flex: 1, padding: '14px', background: selected.length === 0 ? '#f3f4f6' : 'white', color: selected.length === 0 ? '#9ca3af' : '#1f2937', border: `1px solid ${selected.length === 0 ? '#e5e7eb' : '#1f2937'}`, borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                {selling ? '処理中...' : 'コインに交換'}
              </button>
              <button
                onClick={() => router.push('/shipment')}
                disabled={selected.length === 0}
                style={{ flex: 1, padding: '14px', background: selected.length === 0 ? '#d1d5db' : '#3b82f6', color: selected.length === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                発送依頼
              </button>
            </div>
            {selected.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>発送依頼には合計1,500コイン以上の商品選択が必要です</p>
            )}
          </div>
        </div>
      )}
      <BottomNav />

      {/* コイン交換確認モーダル */}
      {showSellModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px 24px' }}>
            <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#1f2937' }}>コインに交換</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>選択した商品をコインに交換します。<br/>よろしいですか？</p>
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#1f2937' }}>{userPoints.toLocaleString()}</span>
              </div>
              <span style={{ fontSize: '24px', color: '#9ca3af', fontWeight: 'bold' }}>›</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a' }}>{(userPoints + selected.reduce((sum, id) => { const d = draws.find(dr => dr.id === id); return sum + (d?.prizes?.pt_exchange || 0); }, 0)).toLocaleString()}</span>
              </div>
            </div>
            <button onClick={handleSellConfirm} style={{ width: '100%', padding: '16px', background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
              コインに交換する
            </button>
            <button onClick={() => setShowSellModal(false)} style={{ width: '100%', padding: '16px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}