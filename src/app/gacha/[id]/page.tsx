'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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

type GachaResult = {
  grade: string
  product: {
    name: string
    image_url: string
    market_value: number
  }
}

type GachaOption = {
  id: string
  count: number
  label: string
  color: string
  is_active: boolean
  sort_order: number
}

function GachaPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const countParam = Number(searchParams.get('count') || 1)

  const [event, setEvent] = useState<Event | null>(null)
  const [gachaOptions, setGachaOptions] = useState<GachaOption[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState(false)
  const [results, setResults] = useState<GachaResult[]>([])
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'opening' | 'result'>('idle')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUserId(session.user.id)
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
      if (profile) setUserPoints(profile.points)
    }
    const { data: eventData } = await supabase.from('events').select('*').eq('id', params.id).single()
    if (eventData) setEvent(eventData)
    const { data: optionsData } = await supabase.from('gacha_options').select('*').eq('event_id', params.id).eq('is_active', true).order('sort_order')
    if (optionsData) setGachaOptions(optionsData)
    setLoading(false)
  }

  const handleGacha = async (count: number) => {
    if (!userId) { router.push('/auth/login'); return }
    if (!event) return
    const totalCost = event.price * count
    if (userPoints < totalCost) { setError(`ポイントが不足しています（必要: ${totalCost.toLocaleString()}pt）`); return }
    if (event.remaining_count < count) { setError(`残り${event.remaining_count}口しかありません`); return }

    setPulling(true)
    setError('')
    setPhase('shaking')
    await new Promise(r => setTimeout(r, 800))
    setPhase('opening')

    try {
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, user_id: userId, count }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'エラーが発生しました'); setPulling(false); setPhase('idle'); return }
      await new Promise(r => setTimeout(r, 600))
      setResults(data.results)
      setUserPoints(data.remaining_points)
      setPhase('result')
      setShowResult(true)
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
      <div style={{ color: 'white' }}>読み込み中...</div>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white' }}>オリパが見つかりません</div>
    </div>
  )

  const isSoldOut = event.remaining_count <= 0

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0) rotate(0deg)} 10%{transform:translateX(-8px) rotate(-3deg)} 20%{transform:translateX(8px) rotate(3deg)} 30%{transform:translateX(-8px) rotate(-3deg)} 40%{transform:translateX(8px) rotate(3deg)} 50%{transform:translateX(-4px) rotate(-1deg)} 60%{transform:translateX(4px) rotate(1deg)} 70%{transform:translateX(-4px) rotate(-1deg)} 80%{transform:translateX(4px) rotate(1deg)} }
        @keyframes burst { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeInUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => router.push('/event/' + event.id)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
        {userId && (
          <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '999px', fontSize: '14px' }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{userPoints.toLocaleString()}pt</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{event.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>価格</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b' }}>{event.price}pt/回</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>残り</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{event.remaining_count}<span style={{ fontSize: '13px', color: '#64748b' }}>/{event.total_count}口</span></div>
            </div>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '999px', height: '8px', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '999px', height: '8px', width: `${(event.remaining_count / event.total_count) * 100}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {event.status !== 'active' ? (
            <div style={{ color: '#64748b', padding: '20px' }}>このオリパは現在開催していません</div>
          ) : isSoldOut ? (
            <div style={{ color: '#64748b', padding: '20px' }}>このオリパは売り切れです</div>
          ) : (
            <>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '120px', height: '160px', background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '12px', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', boxShadow: phase === 'shaking' ? '0 0 30px rgba(239,68,68,0.8)' : '0 0 20px rgba(239,68,68,0.3)', animation: phase === 'shaking' ? 'shake 0.8s ease-in-out' : phase === 'opening' ? 'pulse 0.3s ease-in-out infinite' : 'none' }}>
                  {phase === 'opening' ? <div style={{ animation: 'spin 0.5s linear infinite', fontSize: '32px' }}>✨</div> : '🎴'}
                </div>
              </div>

              {gachaOptions.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {gachaOptions.map((opt) => {
                    const cost = event.price * opt.count
                    const canAfford = userPoints >= cost
                    const hasStock = event.remaining_count >= opt.count
                    const disabled = pulling || !canAfford || !hasStock
                    return (
                      <div key={opt.id} style={{ textAlign: 'center' }}>
                        <button onClick={() => handleGacha(opt.count)} disabled={disabled} style={{ background: disabled ? '#475569' : opt.color, color: 'white', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : `0 0 20px ${opt.color}66`, opacity: disabled ? 0.6 : 1, minWidth: '100px' }}>
                          {pulling ? '開封中...' : opt.label}
                        </button>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{cost.toLocaleString()}pt</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <button onClick={() => handleGacha(1)} disabled={pulling} style={{ background: pulling ? '#475569' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '16px', padding: '18px 56px', fontSize: '20px', fontWeight: 'bold', cursor: pulling ? 'not-allowed' : 'pointer', boxShadow: pulling ? 'none' : '0 0 30px rgba(239,68,68,0.4)' }}>
                  {pulling ? '開封中...' : '開封する！'}
                </button>
              )}

              {!userId && (
                <div style={{ marginTop: '12px' }}>
                  <a href="/auth/login" style={{ color: '#f59e0b', fontSize: '14px' }}>ログインして開封する</a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showResult && results.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px', overflowY: 'auto' }}>
          <div style={{ animation: 'burst 0.5s ease-out', background: '#1e293b', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>{results.length}回開封結果！</div>
            {results.length === 1 ? (
              <>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: gradeColors[results[0].grade]?.text || '#fff', marginBottom: '16px', animation: 'fadeInUp 0.4s ease-out' }}>{results[0].grade}</div>
                {results[0].product?.image_url && (
                  <img src={results[0].product.image_url} alt={results[0].product.name} style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px', boxShadow: `0 8px 32px ${gradeColors[results[0].grade]?.glow || 'rgba(0,0,0,0.4)'}` }} />
                )}
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px' }}>{results[0].product?.name}</div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>市場価値：¥{results[0].product?.market_value?.toLocaleString()}</div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                {results.map((result, i) => {
                  const colors = gradeColors[result.grade] || gradeColors['C賞']
                  return (
                    <div key={i} style={{ background: '#0f172a', borderRadius: '10px', padding: '8px', border: `1px solid ${colors.border}`, animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                      {result.product?.image_url && (
                        <img src={result.product.image_url} alt={result.product.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} />
                      )}
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: colors.text, background: colors.bg, padding: '2px 6px', borderRadius: '999px', marginBottom: '4px', display: 'inline-block' }}>{result.grade}</div>
                      <div style={{ fontSize: '10px', color: '#e2e8f0', lineHeight: 1.3 }}>{result.product?.name}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              残りポイント：<span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{userPoints.toLocaleString()}pt</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setShowResult(false); setResults([]); setPhase('idle') }} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', maxWidth: '180px' }}>もう1回！</button>
              <button onClick={() => router.push('/mypage')} style={{ flex: 1, background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', cursor: 'pointer', maxWidth: '180px' }}>マイページ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GachaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: 'white' }}>読み込み中...</div></div>}>
      <GachaPageInner />
    </Suspense>
  )
}
