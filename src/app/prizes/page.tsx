'use client'

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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)

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
    if (!confirm(`${selected.length}枚をコインに交換しますか？`)) return
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

  const gradeColors: Record<string, string> = {
    'S賞': '#d97706',
    'A賞': '#7c3aed',
    'B賞': '#1d4ed8',
    'C賞': '#6b7280',
    'ラストワン賞': '#be185d',
  }

  const tabs = [
    { key: 'pending', label: '未選択', count: draws.filter(d => d.status === 'pending').length },
    { key: 'sold', label: '発送待ち', count: draws.filter(d => d.status === 'sold').length },
    { key: 'shipped', label: '発送済み', count: draws.filter(d => d.status === 'shipped').length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '160px' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>獲得商品</h1>
        </div>
        {/* タブ */}
        <div style={{ display: 'flex', borderTop: '1px solid #f3f4f6', maxWidth: '640px', margin: '0 auto' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setSelected([]) }}
              style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? 'bold' : 'normal', color: tab === t.key ? '#f59e0b' : '#6b7280', borderBottom: tab === t.key ? '2px solid #f59e0b' : '2px solid transparent' }}
            >
              {t.label}
              {t.count > 0 && <span style={{ marginLeft: '4px', fontSize: '11px' }}>({t.count})</span>}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>読み込み中...</div>
        ) : filteredDraws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>{tab === 'pending' ? 'まだ獲得した商品がありません' : tab === 'sold' ? '発送待ちの商品はありません' : '発送済みの商品はありません'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDraws.map((draw) => {
              const isSelected = selected.includes(draw.id)
              return (
                <div
                  key={draw.id}
                  onClick={() => tab === 'pending' && handleSelect(draw.id)}
                  style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: tab === 'pending' ? 'pointer' : 'default', border: '2px solid', borderColor: isSelected ? '#f59e0b' : 'transparent' }}
                >
                  {/* チェック */}
                  {tab === 'pending' && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', borderColor: isSelected ? '#f59e0b' : '#d1d5db', background: isSelected ? '#f59e0b' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                    <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', color: gradeColors[draw.grade] || '#6b7280', background: `${gradeColors[draw.grade] || '#6b7280'}20`, padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>{draw.grade}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{draw.products?.name || '不明な商品'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#e67e00)', color: 'white', fontSize: '10px', fontWeight: '900' }}>C</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>{draw.prizes?.pt_exchange?.toLocaleString() || 0}</span>
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
        <div style={{ position: 'fixed', bottom: '60px', left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', zIndex: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#e67e00)', color: 'white', fontSize: '12px', fontWeight: '900' }}>C</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{getTotalPt().toLocaleString()}</span>
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
                style={{ flex: 1, padding: '14px', background: selected.length === 0 ? '#d1d5db' : '#f59e0b', color: selected.length === 0 ? '#9ca3af' : '#1f2937', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}
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

      {/* ボトムナビ */}
      <nav style={{ position: 'fixed', bottom: tab === 'pending' ? '130px' : '0', left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', zIndex: 50 }}>
        {[
          { href: '/', icon: '🎴', label: 'オリパガチャ' },
          { href: '/prizes', icon: '🏆', label: '獲得商品' },
          { href: '/history', icon: '🕐', label: '当選履歴' },
          { href: '/fp-exchange', icon: '🪙', label: 'FP交換所' },
          { href: '/mypage', icon: '👤', label: 'マイページ' },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: item.href === '/prizes' ? '#e67e00' : '#888', gap: '2px', padding: '10px 0' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '600' }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}