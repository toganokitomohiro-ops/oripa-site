'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  name: string
  price: number
  total_count: number
  remaining_count: number
  status: string
  description: string
  image_url: string
}

type Prize = {
  id: string
  grade: string
  count: number
  remaining_count: number
  pt_exchange: number
  products: {
    name: string
    image_url: string
    market_value: number
  }
}

type GachaResult = {
  grade: string
  product: {
    name: string
    image_url: string
    market_value: number
  }
  remaining_points: number
}

export default function GachaPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState(false)
  const [result, setResult] = useState<GachaResult | null>(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'opening' | 'result'>('idle')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUserId(session.user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', session.user.id)
        .single()
      if (profile) setUserPoints(profile.points)
    }
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    if (eventData) setEvent(eventData)
    const { data: prizesData } = await supabase
      .from('prizes')
      .select('*, products(*)')
      .eq('event_id', params.id)
      .gt('remaining_count', 0)
    if (prizesData) setPrizes(prizesData)
    setLoading(false)
  }

  const handleGacha = async () => {
    if (!userId) { router.push('/auth/login'); return }
    if (!event) return
    if (userPoints < event.price) { setError('ポイントが不足しています'); return }

    setPulling(true)
    setError('')
    setPhase('shaking')

    await new Promise(r => setTimeout(r, 800))
    setPhase('opening')

    try {
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました')
        setPulling(false)
        setPhase('idle')
        return
      }
      await new Promise(r => setTimeout(r, 600))
      setResult(data.result)
      setUserPoints(data.result.remaining_points)
      setPhase('result')
      await fetchData()
    } catch {
      setError('通信エラーが発生しました')
      setPhase('idle')
    }
    setPulling(false)
  }

  const gradeColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    'S賞': { bg: '#fef3c7', text: '#d97706', border: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
    'A賞': { bg: '#ede9fe', text: '#7c3aed', border: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
    'B賞': { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    'C賞': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', glow: 'rgba(209,213,219,0.3)' },
    'ラストワン賞': { bg: '#fce7f3', text: '#be185d', border: '#f472b6', glow: 'rgba(244,114,182,0.5)' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontSize: '18px' }}>読み込み中...</div>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white' }}>オリパが見つかりません</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-8px) rotate(-3deg); }
          20% { transform: translateX(8px) rotate(3deg); }
          30% { transform: translateX(-8px) rotate(-3deg); }
          40% { transform: translateX(8px) rotate(3deg); }
          50% { transform: translateX(-4px) rotate(-1deg); }
          60% { transform: translateX(4px) rotate(1deg); }
          70% { transform: translateX(-4px) rotate(-1deg); }
          80% { transform: translateX(4px) rotate(1deg); }
          90% { transform: translateX(-2px) rotate(-0.5deg); }
        }
        @keyframes burst {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          ← 戻る
        </button>
        {userId && (
          <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '999px', fontSize: '14px' }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{userPoints.toLocaleString()}pt</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{event.name}</h1>
          {event.description && <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{event.description}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>価格</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{event.price}pt</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>残り</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {event.remaining_count}<span style={{ fontSize: '14px', color: '#64748b' }}>/{event.total_count}口</span>
              </div>
            </div>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '999px', height: '8px', margin: '0 auto', maxWidth: '400px' }}>
            <div style={{
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
              borderRadius: '999px',
              height: '8px',
              width: `${(event.remaining_count / event.total_count) * 100}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* 開封ボタンエリア */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {event.status !== 'active' ? (
            <div style={{ color: '#64748b', padding: '20px' }}>このオリパは現在開催していません</div>
          ) : event.remaining_count <= 0 ? (
            <div style={{ color: '#64748b', padding: '20px' }}>このオリパは売り切れです</div>
          ) : (
            <>
              {/* パックのビジュアル */}
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '160px',
                  background: 'linear-gradient(135deg, #1e293b, #334155)',
                  borderRadius: '12px',
                  border: '2px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  boxShadow: phase === 'shaking' ? '0 0 30px rgba(239,68,68,0.8)' : '0 0 20px rgba(239,68,68,0.3)',
                  animation: phase === 'shaking' ? 'shake 0.8s ease-in-out' : phase === 'opening' ? 'pulse 0.3s ease-in-out infinite' : 'none',
                  transition: 'box-shadow 0.3s ease',
                  cursor: pulling ? 'not-allowed' : 'pointer',
                }}
                  onClick={!pulling ? handleGacha : undefined}
                >
                  {phase === 'opening' ? (
                    <div style={{ animation: 'spin 0.5s linear infinite', fontSize: '32px' }}>✨</div>
                  ) : '🎴'}
                </div>
              </div>

              <button
                onClick={handleGacha}
                disabled={pulling}
                style={{
                  background: pulling ? '#475569' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '18px 56px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: pulling ? 'not-allowed' : 'pointer',
                  boxShadow: pulling ? 'none' : '0 0 30px rgba(239,68,68,0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                {phase === 'shaking' ? '開封中...' : phase === 'opening' ? '結果発表！' : '開封する！'}
              </button>

              {!userId && (
                <div style={{ marginTop: '12px' }}>
                  <a href="/auth/login" style={{ color: '#f59e0b', fontSize: '14px' }}>ログインして開封する</a>
                </div>
              )}
              {userId && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  {userPoints >= event.price
                    ? `開封後：${(userPoints - event.price).toLocaleString()}pt`
                    : `あと${(event.price - userPoints).toLocaleString()}pt必要`}
                </div>
              )}
            </>
          )}
        </div>

        {/* 賞品一覧 */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#e2e8f0' }}>賞品一覧</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {prizes.map((prize) => {
              const colors = gradeColors[prize.grade] || gradeColors['C賞']
              return (
                <div key={prize.id} style={{ background: '#1e293b', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {prize.products?.image_url && (
                    <img src={prize.products.image_url} alt={prize.products.name} style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.text, background: colors.bg, padding: '2px 8px', borderRadius: '999px' }}>{prize.grade}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9' }}>{prize.products?.name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      残り{prize.remaining_count}口 / PT交換:{prize.pt_exchange}pt / ¥{prize.products?.market_value?.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 結果モーダル */}
      {phase === 'result' && result && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            animation: 'burst 0.5s ease-out',
            background: '#1e293b',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '90%',
            border: `2px solid ${gradeColors[result.grade]?.border || '#d1d5db'}`,
            boxShadow: `0 0 60px ${gradeColors[result.grade]?.glow || 'rgba(255,255,255,0.1)'}`,
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>当選！</div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: gradeColors[result.grade]?.text || '#374151',
              marginBottom: '16px',
              animation: 'fadeInUp 0.4s ease-out 0.2s both',
            }}>
              {result.grade}
            </div>
            {result.product?.image_url ? (
              <img
                src={result.product.image_url}
                alt={result.product.name}
                style={{
                  width: '120px', height: '160px', objectFit: 'cover', borderRadius: '10px',
                  marginBottom: '16px',
                  boxShadow: `0 8px 32px ${gradeColors[result.grade]?.glow || 'rgba(0,0,0,0.4)'}`,
                  animation: 'fadeInUp 0.4s ease-out 0.3s both',
                }}
              />
            ) : (
              <div style={{ fontSize: '80px', marginBottom: '16px', animation: 'fadeInUp 0.4s ease-out 0.3s both' }}>🎴</div>
            )}
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px', animation: 'fadeInUp 0.4s ease-out 0.4s both' }}>
              {result.product?.name}
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', animation: 'fadeInUp 0.4s ease-out 0.5s both' }}>
              市場価値：¥{result.product?.market_value?.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', animation: 'fadeInUp 0.4s ease-out 0.5s both' }}>
              残りポイント：<span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{result.remaining_points?.toLocaleString()}pt</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', animation: 'fadeInUp 0.4s ease-out 0.6s both' }}>
              <button
                onClick={() => { setPhase('idle'); setResult(null) }}
                style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                もう1回！
              </button>
              <button
                onClick={() => router.push('/mypage')}
                style={{ flex: 1, background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', cursor: 'pointer' }}
              >
                マイページ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
