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
  prizes: {
    pt_exchange: number
  }
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
  const [userPoints, setUserPoints] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

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

  const handleSell = async (drawIds: string[]) => {
    if (!userId || drawIds.length === 0) return
    if (!confirm(`${drawIds.length}枚のカードを売却しますか？`)) return
    setSelling(true)
    try {
      const res = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_ids: drawIds, user_id: userId }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`✅ ${data.sold_count}枚を売却！+${data.total_points.toLocaleString()}pt獲得！`)
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

  const getTotalSellPoints = () => {
    return selected.reduce((sum, id) => {
      const draw = draws.find(d => d.id === id)
      return sum + (draw?.prizes?.pt_exchange || 0)
    }, 0)
  }

  const filteredDraws = draws.filter(d => d.status === tab)

  const gradeColors: Record<string, string> = {
    'S賞': '#d97706',
    'A賞': '#7c3aed',
    'B賞': '#1d4ed8',
    'C賞': '#6b7280',
    'ラストワン賞': '#be185d',
  }

  const tabs = [
    { key: 'pending', label: '未申請', count: draws.filter(d => d.status === 'pending').length },
    { key: 'sold', label: '売却済み', count: draws.filter(d => d.status === 'sold').length },
    { key: 'shipped', label: '発送済み', count: draws.filter(d => d.status === 'shipped').length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>獲得商品</h1>
          <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>{userPoints.toLocaleString()}pt</div>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px' }}>
        {/* タブ */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setSelected([]) }}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: tab === t.key ? 'bold' : 'normal', background: tab === t.key ? '#1f2937' : '#f3f4f6', color: tab === t.key ? 'white' : '#6b7280', cursor: 'pointer' }}
            >
              {t.label}
              {t.count > 0 && <span style={{ marginLeft: '4px', background: tab === t.key ? 'rgba(255,255,255,0.3)' : '#e5e7eb', padding: '1px 6px', borderRadius: '999px', fontSize: '11px' }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* 一括操作バー（未申請タブのみ） */}
        {tab === 'pending' && filteredDraws.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
            >
              {selected.length === filteredDraws.length ? '選択解除' : '全て選択'}
            </button>
            {selected.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {selected.length}枚選択中・<span style={{ color: '#f59e0b', fontWeight: 'bold' }}>+{getTotalSellPoints().toLocaleString()}pt</span>
                </span>
                <button
                  onClick={() => handleSell(selected)}
                  disabled={selling}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: selling ? 'not-allowed' : 'pointer' }}
                >
                  {selling ? '処理中...' : 'まとめて売却'}
                </button>
                <button
                  onClick={() => router.push('/shipment')}
                  style={{ background: '#1f2937', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  発送申請
                </button>
              </div>
            )}
          </div>
        )}

        {/* カード一覧 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>読み込み中...</div>
        ) : filteredDraws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <div>{tab === 'pending' ? 'まだ獲得した商品がありません' : tab === 'sold' ? '売却した商品はありません' : '発送済みの商品はありません'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', paddingTop: '8px' }}>
            {filteredDraws.map((draw) => {
              const isSelected = selected.includes(draw.id)
              const gradeColor = gradeColors[draw.grade] || '#6b7280'
              return (
                <div
                  key={draw.id}
                  onClick={() => tab === 'pending' && handleSelect(draw.id)}
                  style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${isSelected ? '#ef4444' : '#e5e7eb'}`, cursor: tab === 'pending' ? 'pointer' : 'default', position: 'relative', transition: 'all 0.15s' }}
                >
                  {/* 選択チェック */}
                  {tab === 'pending' && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', background: isSelected ? '#ef4444' : 'rgba(255,255,255,0.9)', border: `2px solid ${isSelected ? '#ef4444' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  )}

                  {/* 画像 */}
                  <div style={{ aspectRatio: '3/4', background: '#f3f4f6', overflow: 'hidden' }}>
                    {draw.products?.image_url ? (
                      <img src={draw.products.image_url} alt={draw.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🃏</div>
                    )}
                  </div>

                  <div style={{ padding: '10px' }}>
                    <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', color: gradeColor, background: `${gradeColor}20`, padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>{draw.grade}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', lineHeight: 1.3 }}>{draw.products?.name || '不明な商品'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>市場価値：¥{draw.products?.market_value?.toLocaleString() || 0}</div>

                    {tab === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSell([draw.id]) }}
                          disabled={selling}
                          style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          売却 +{draw.prizes?.pt_exchange || 0}pt
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push('/shipment') }}
                          style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '6px', padding: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          発送申請
                        </button>
                      </div>
                    )}

                    {tab === 'sold' && (
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        売却日：{draw.sold_at ? new Date(draw.sold_at).toLocaleDateString('ja-JP') : '-'}
                      </div>
                    )}

                    {tab === 'shipped' && (
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>発送済み ✓</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ボトムナビ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', zIndex: 50 }}>
        {[
          { href: '/', icon: '🏠', label: 'ホーム' },
          { href: '/prizes', icon: '🎁', label: '獲得商品' },
          { href: '/buy-points', icon: '💰', label: 'ポイント' },
          { href: '/mypage', icon: '👤', label: 'マイページ' },
        ].map((item) => (
          <button key={item.href} onClick={() => router.push(item.href)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', color: item.href === '/prizes' ? '#1f2937' : '#9ca3af', fontWeight: item.href === '/prizes' ? 'bold' : 'normal' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}