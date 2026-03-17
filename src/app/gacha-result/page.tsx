'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type DrawResult = {
  id: string
  grade: string
  status: string
  pt_exchange: number
  product: {
    name: string
    image_url: string
    market_value: number
  }
}

function GachaResultInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const drawIdsParam = searchParams.get('draw_ids')
  const eventId = searchParams.get('event_id')

  const [results, setResults] = useState<DrawResult[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortMode, setSortMode] = useState<'high' | 'low'>('high')
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)

    if (!drawIdsParam) { router.push('/'); return }
    const drawIds = drawIdsParam.split(',')

    const { data } = await supabase
      .from('draws')
      .select('*, prizes(pt_exchange), products(name, image_url, market_value)')
      .in('id', drawIds)

    if (data) {
      setResults(data.map(d => ({
        id: d.id,
        grade: d.grade,
        status: d.status,
        pt_exchange: d.prizes?.pt_exchange || 0,
        product: {
          name: d.products?.name || '',
          image_url: d.products?.image_url || '',
          market_value: d.products?.market_value || 0,
        }
      })))
    }
    setLoading(false)
  }

  const getSorted = () => {
    return [...results].sort((a, b) =>
      sortMode === 'high' ? b.pt_exchange - a.pt_exchange : a.pt_exchange - b.pt_exchange
    )
  }

  const handleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selected.length === results.length) {
      setSelected([])
    } else {
      setSelected(results.map(r => r.id))
    }
  }

  const getTotalPt = () => {
    return selected.reduce((sum, id) => {
      const r = results.find(r => r.id === id)
      return sum + (r?.pt_exchange || 0)
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
        fetchResults()
      } else {
        alert('エラー: ' + data.error)
      }
    } catch {
      alert('通信エラーが発生しました')
    }
    setSelling(false)
  }

  const gradeColors: Record<string, string> = {
    'S賞': '#d97706',
    'A賞': '#7c3aed',
    'B賞': '#1d4ed8',
    'C賞': '#6b7280',
    'ラストワン賞': '#be185d',
  }

  const sorted = getSorted()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#999' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>ガチャ結果</h1>
          <button
            onClick={() => router.push(eventId ? '/event/' + eventId : '/')}
            style={{ fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            あとで
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '12px 16px' }}>
        {/* 表示切替・ソート */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '999px', border: '1px solid', borderColor: viewMode === 'list' ? '#1f2937' : '#e5e7eb', background: viewMode === 'list' ? '#1f2937' : 'white', color: viewMode === 'list' ? 'white' : '#6b7280', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ☰ リスト表示
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '999px', border: '1px solid', borderColor: viewMode === 'grid' ? '#1f2937' : '#e5e7eb', background: viewMode === 'grid' ? '#1f2937' : 'white', color: viewMode === 'grid' ? 'white' : '#6b7280', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ⊞ グリッド表示
            </button>
          </div>
          <button
            onClick={() => setSortMode(sortMode === 'high' ? 'low' : 'high')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '999px', border: '1px solid #e5e7eb', background: 'white', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {sortMode === 'high' ? '↑ コインが高い順' : '↓ コインが低い順'}
          </button>
        </div>

        {/* リスト表示 */}
        {viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '100px' }}>
            {sorted.map((result) => {
              const isSelected = selected.includes(result.id)
              return (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result.id)}
                  style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '2px solid', borderColor: isSelected ? '#f59e0b' : 'transparent', position: 'relative' }}
                >
                  {/* 選択チェック */}
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', borderColor: isSelected ? '#f59e0b' : '#d1d5db', background: isSelected ? '#f59e0b' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>

                  {/* 画像 */}
                  <div style={{ width: '60px', height: '80px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {result.product.image_url
                      ? <img src={result.product.image_url} alt={result.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🃏</div>
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', color: gradeColors[result.grade] || '#6b7280', background: `${gradeColors[result.grade] || '#6b7280'}20`, padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>{result.grade}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{result.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '16px' }}>🪙</span>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b' }}>{result.pt_exchange.toLocaleString()}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>コイン</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* グリッド表示 */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '100px' }}>
            {sorted.map((result) => {
              const isSelected = selected.includes(result.id)
              return (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result.id)}
                  style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '2px solid', borderColor: isSelected ? '#f59e0b' : 'transparent', position: 'relative' }}
                >
                  {/* 選択チェック */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', borderColor: isSelected ? '#f59e0b' : '#d1d5db', background: isSelected ? '#f59e0b' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>

                  {/* 画像 */}
                  <div style={{ aspectRatio: '3/4', background: '#f3f4f6', overflow: 'hidden' }}>
                    {result.product.image_url
                      ? <img src={result.product.image_url} alt={result.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🃏</div>
                    }
                  </div>

                  <div style={{ padding: '10px' }}>
                    <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', color: gradeColors[result.grade] || '#6b7280', background: `${gradeColors[result.grade] || '#6b7280'}20`, padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>{result.grade}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', lineHeight: 1.3 }}>{result.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '14px' }}>🪙</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>{result.pt_exchange.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 固定フッター */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', zIndex: 20 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px' }}>🪙</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{getTotalPt().toLocaleString()}</span>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>コイン</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSelectAll}
                style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                {selected.length === results.length ? 'リセット' : '全て選択'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSell}
              disabled={selected.length === 0 || selling}
              style={{ flex: 1, padding: '14px', background: selected.length === 0 ? '#f3f4f6' : 'white', color: selected.length === 0 ? '#9ca3af' : '#1f2937', border: `1px solid ${selected.length === 0 ? '#e5e7eb' : '#1f2937'}`, borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              コインに交換
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
    </div>
  )
}

export default function GachaResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#999' }}>読み込み中...</div></div>}>
      <GachaResultInner />
    </Suspense>
  )
}