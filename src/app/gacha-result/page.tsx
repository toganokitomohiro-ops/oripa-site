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
  const [sortMode, setSortMode] = useState<'high' | 'low'>('high')
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showSellModal, setShowSellModal] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [soldState, setSoldState] = useState<{ count: number; total: number; newPoints: number } | null>(null)
  const [eventInfo, setEventInfo] = useState<{ title: string; banner_url: string; id: string } | null>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
    if (profile) setUserPoints(profile.points)

    if (!drawIdsParam) { router.push('/'); return }
    const drawIds = drawIdsParam.split(',')

    const { data } = await supabase
      .from('draws')
      .select('*, prizes(pt_exchange), products(name, image_url, market_value)')
      .in('id', drawIds)

    if (data) {
      setResults(data.map((d: any) => ({
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

    if (eventId) {
      const { data: ev } = await supabase.from('events').select('id, title, banner_url').eq('id', eventId).single()
      if (ev) setEventInfo(ev)
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
    setSelected(results.map(r => r.id))
  }

  const handleReset = () => {
    setSelected([])
  }

  const getTotalPt = () => {
    return selected.reduce((sum, id) => {
      const r = results.find(r => r.id === id)
      return sum + (r?.pt_exchange || 0)
    }, 0)
  }

  const getShipmentTotal = () => {
    return selected.reduce((sum, id) => {
      const r = results.find(r => r.id === id)
      return sum + (r?.product.market_value || 0)
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
        setSoldState({
          count: data.sold_count,
          total: data.total_points,
          newPoints: userPoints + data.total_points,
        })
        setUserPoints(prev => prev + data.total_points)
        setSelected([])
        setResults(prev => prev.filter(r => !selected.includes(r.id)))
      } else {
        alert('エラー: ' + data.error)
      }
    } catch {
      alert('通信エラーが発生しました')
    }
    setSelling(false)
  }

  const sorted = getSorted()
  const totalPt = getTotalPt()
  const shipmentTotal = getShipmentTotal()
  const canShip = shipmentTotal >= 1500

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
    </div>
  )

  /* 交換完了画面 */
  if (soldState) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <div style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>ガチャ結果</span>
          <button
            onClick={() => router.push('/')}
            style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', fontSize: '14px', color: '#999', cursor: 'pointer', fontWeight: '500' }}
          >
            閉じる
          </button>
        </div>

        <div style={{ flex: 1, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          {/* 交換完了メッセージ */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px' }}>コインに交換しました🎉</p>
            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '24px', height: '24px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#1a1a1a' }}>{(soldState.newPoints - soldState.total).toLocaleString()}</span>
              </div>
              <span style={{ fontSize: '22px', color: '#999', fontWeight: 'bold' }}>›</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '24px', height: '24px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a' }}>{soldState.newPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* もう一回挑戦 */}
          {eventInfo && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px 16px', width: '100%' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: '16px' }}>もう一回挑戦しますか？</p>
              {eventInfo.banner_url && (
                <img src={eventInfo.banner_url} alt={eventInfo.title} style={{ width: '100%', borderRadius: '10px', marginBottom: '12px' }} />
              )}
              <button
                onClick={() => router.push(`/event/${eventInfo.id}`)}
                style={{ width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              >
                もう一回挑戦する
              </button>
            </div>
          )}

          {!eventInfo && (
            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              オリパ一覧に戻る
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '140px' }}>
      {/* ヘッダー */}
      <div style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 30 }}>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>ガチャ結果</span>
        <button
          onClick={() => router.push('/')}
          style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', fontSize: '14px', color: '#999', cursor: 'pointer', fontWeight: '700' }}
        >
          あとで
        </button>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px' }}>
        {/* フィルターバー */}
        <div style={{
          display: 'flex', background: 'white',
          borderRadius: '10px', border: '1px solid #e8e8e8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          overflow: 'hidden', marginBottom: '12px',
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '10px 0', background: '#f5f5f5',
            fontSize: '13px', fontWeight: '700', color: '#1a1a1a',
            borderRight: '1px solid #e8e8e8',
          }}>
            <span style={{ fontSize: '14px' }}>≡</span>
            <span>リスト表示</span>
          </div>
          <button
            onClick={() => setSortMode(sortMode === 'high' ? 'low' : 'high')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              padding: '10px 0', background: 'white',
              fontSize: '13px', fontWeight: '700', color: '#f97316',
              border: 'none', cursor: 'pointer',
            }}
          >
            <span>↑↓</span>
            <span>{sortMode === 'high' ? 'コインが高い順' : 'コインが低い順'}</span>
          </button>
        </div>

        {/* カードリスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map((result) => {
            const isSelected = selected.includes(result.id)

            return (
              <div
                key={result.id}
                onClick={() => handleSelect(result.id)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  border: `2px solid ${isSelected ? '#f97316' : 'transparent'}`,
                  position: 'relative',
                }}
              >
                {/* 選択バッジ（右上） */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: isSelected ? '#f97316' : '#aaa',
                }}>
                  <span>{isSelected ? '選択中' : '未選択'}</span>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#f97316' : '#ccc'}`,
                    background: isSelected ? '#f97316' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: '900' }}>✓</span>}
                  </div>
                </div>

                {/* 商品画像 */}
                <div style={{ width: '72px', height: '96px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                  {result.product.image_url
                    ? <img src={result.product.image_url} alt={result.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🃏</div>
                  }
                </div>

                {/* テキスト情報 */}
                <div style={{ flex: 1, paddingRight: '60px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px', lineHeight: 1.3 }}>
                    {result.product.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '18px', height: '18px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a' }}>{result.pt_exchange.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>コイン</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 固定フッターアクションバー */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #ebebeb',
        padding: '12px 16px 28px',
        zIndex: 20,
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* コイン合計 + 全て選択 + リセット */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '26px', height: '26px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
              <span style={{ fontSize: '20px', fontWeight: '800', color: totalPt > 0 ? '#f97316' : '#1a1a1a' }}>{totalPt.toLocaleString()}</span>
              <span style={{ fontSize: '13px', color: '#888' }}>コイン</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleSelectAll}
                style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                全て選択
              </button>
              <button
                onClick={handleReset}
                style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                リセット
              </button>
            </div>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSell}
              disabled={selected.length === 0 || selling}
              style={{
                flex: 1,
                padding: '14px',
                background: 'white',
                color: selected.length === 0 ? '#bbb' : '#1a1a1a',
                border: `1px solid ${selected.length === 0 ? '#e0e0e0' : '#ccc'}`,
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              コインに交換
            </button>
            <button
              onClick={() => selected.length > 0 && canShip && router.push('/shipment')}
              disabled={selected.length === 0 || !canShip}
              style={{
                flex: 1,
                padding: '14px',
                background: (selected.length === 0 || !canShip) ? '#e8d8a0' : '#f5c518',
                color: (selected.length === 0 || !canShip) ? '#bbb' : '#1a1a1a',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: (selected.length === 0 || !canShip) ? 'not-allowed' : 'pointer',
              }}
            >
              発送依頼
            </button>
          </div>

          {/* 注意文 */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '8px' }}>
            発送依頼には合計1,500コイン以上の商品選択が必要です
          </p>
        </div>
      </div>

      {/* コイン交換確認モーダル */}
      {showSellModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px', padding: '28px 24px 40px' }}>
            <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>コインに交換</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: 1.6 }}>
              選択した商品をコインに交換します。<br />よろしいですか？
            </p>

            {/* コイン変化表示 */}
            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '28px', height: '28px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a1a' }}>{userPoints.toLocaleString()}</span>
              </div>
              <span style={{ fontSize: '24px', color: '#aaa', fontWeight: 'bold' }}>›</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '28px', height: '28px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" />
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a' }}>{(userPoints + getTotalPt()).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleSellConfirm}
              style={{ width: '100%', padding: '16px', background: '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}
            >
              コインに交換する
            </button>
            <button
              onClick={() => setShowSellModal(false)}
              style={{ width: '100%', padding: '16px', background: 'white', color: '#666', border: '1px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', cursor: 'pointer' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GachaResultPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
      </div>
    }>
      <GachaResultInner />
    </Suspense>
  )
}
