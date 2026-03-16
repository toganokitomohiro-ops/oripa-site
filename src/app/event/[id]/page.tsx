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
  notes: string
  category: string
}

type Prize = {
  id: string
  grade: string
  count: number
  remaining_count: number
  pt_exchange: number
  products: { name: string; image_url: string; market_value: number }
}

type GachaOption = {
  id: string
  count: number
  label: string
  color: string
  is_active: boolean
  sort_order: number
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [gachaOptions, setGachaOptions] = useState<GachaOption[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)

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
    const { data: prizesData } = await supabase.from('prizes').select('*, products(*)').eq('event_id', params.id)
    if (prizesData) setPrizes(prizesData.sort((a, b) => (b.products?.market_value || 0) - (a.products?.market_value || 0)))
    const { data: gachaData } = await supabase.from('gacha_options').select('*').eq('event_id', params.id).eq('is_active', true).order('sort_order')
    if (gachaData) setGachaOptions(gachaData)
    setLoading(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#999' }}>読み込み中...</div></div>
  if (!event) return <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#999' }}>オリパが見つかりません</div></div>

  const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)
  const isSoldOut = event.remaining_count <= 0

  const gradeGroups = prizes.reduce((acc, prize) => {
    if (!acc[prize.grade]) acc[prize.grade] = []
    acc[prize.grade].push(prize)
    return acc
  }, {} as Record<string, Prize[]>)

  const gradeOrder = ['S賞', 'A賞', 'B賞', 'C賞', 'ラストワン賞']
  const sortedGrades = Object.keys(gradeGroups).sort((a, b) => {
    const ai = gradeOrder.indexOf(a)
    const bi = gradeOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const gradeStyles: Record<string, string> = {
    'S賞': 'linear-gradient(135deg, #ffd700, #ff8c00)',
    'A賞': 'linear-gradient(135deg, #c084fc, #7c3aed)',
    'B賞': 'linear-gradient(135deg, #60a5fa, #2563eb)',
    'C賞': 'linear-gradient(135deg, #94a3b8, #64748b)',
    'ラストワン賞': 'linear-gradient(135deg, #f472b6, #be185d)',
  }

  const loginUrl = '/auth/login'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '90px' }}>

      <header style={{ background: '#1a1a2e', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => router.push('/')} style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
            <a href="/" style={{ fontSize: '20px', fontWeight: '900', color: '#f5c518', textDecoration: 'none' }}>ORIPA</a>
          </div>
          {userId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5c518', padding: '6px 12px', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', color: '#1a1a2e', fontWeight: '700' }}>PT</span>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a2e' }}>{userPoints.toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>

      <div style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '8px 16px', fontSize: '12px', color: '#999' }}>
        <span style={{ cursor: 'pointer', color: '#666' }} onClick={() => router.push('/')}>トップ</span>
        <span style={{ margin: '0 6px' }}>{'>'}</span>
        <span style={{ color: '#333' }}>{event.name}</span>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: '#111', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {event.image_url
            ? <img src={event.image_url} alt={event.name} style={{ width: '100%', height: 'auto', maxHeight: '480px', objectFit: 'cover', display: 'block' }} />
            : <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.2 }}>?</div>
          }
        </div>

        {event.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
            <button onClick={() => setNotesOpen(!notesOpen)} style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#92400e' }}>
              <span>注意事項・ご利用条件</span>
              <span>{notesOpen ? '▲' : '▼'}</span>
            </button>
            {notesOpen && <div style={{ padding: '0 16px 16px', fontSize: '13px', color: '#78350f', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.notes}</div>}
          </div>
        )}

        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '20px', height: '20px', background: '#f5c518', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: '#333' }}>P</div>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00' }}>{event.price.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: '#999' }}>/回</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                <span>残り{event.remaining_count.toLocaleString()}口</span>
                <span>{event.remaining_count.toLocaleString()}/{event.total_count.toLocaleString()}</span>
              </div>
              <div style={{ background: '#eee', borderRadius: '999px', height: '10px' }}>
                <div style={{ background: remainingPercent > 50 ? '#4caf50' : remainingPercent > 20 ? '#ff9800' : '#f44336', borderRadius: '999px', height: '10px', width: remainingPercent + '%' }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          {sortedGrades.map((grade) => {
            const gradePrizes = gradeGroups[grade]
            const bg = gradeStyles[grade] || 'linear-gradient(135deg, #94a3b8, #64748b)'
            return (
              <div key={grade} style={{ marginBottom: '28px' }}>
                <div style={{ background: bg, borderRadius: '8px', padding: '12px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{grade}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>{gradePrizes.reduce((s, p) => s + p.count, 0)}口</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {gradePrizes.map((prize) => (
                    <div key={prize.id} style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ position: 'relative', paddingBottom: '140%', background: '#f0f0f0' }}>
                        {prize.products?.image_url
                          ? <img src={prize.products.image_url} alt={prize.products.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.2 }}>?</div>
                        }
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.75)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'white', fontWeight: '700' }}>x{prize.count}</div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#333', marginBottom: '3px', lineHeight: 1.3 }}>{prize.products?.name}</div>
                        <div style={{ fontSize: '12px', color: '#e67e00', fontWeight: '700' }}>¥{prize.products?.market_value?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 固定フッターガチャボタン */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #e0e0e0', padding: '10px 16px', zIndex: 50, boxShadow: '0 -4px 16px rgba(0,0,0,0.12)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {event.status !== 'active' || isSoldOut ? (
            <div style={{ textAlign: 'center', padding: '14px', background: '#f0f0f0', borderRadius: '8px', color: '#999', fontSize: '15px', fontWeight: '700' }}>
              {isSoldOut ? '売り切れ' : '開催終了'}
            </div>
          ) : gachaOptions.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '16px', height: '16px', background: '#f5c518', borderRadius: '50%' }} />
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#e67e00' }}>{event.price.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>1回</div>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {gachaOptions.map((opt) => (
                    <a
                    key={opt.id}
                    href={userId ? '/gacha/' + event.id + '?count=' + opt.count : loginUrl}
                    style={{ flex: '1 0 auto', display: 'block', textAlign: 'center', padding: '12px 8px', background: opt.color, color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '900', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={userId ? '/gacha/' + event.id : loginUrl} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '14px', background: '#e67e00', color: 'white', borderRadius: '8px', fontSize: '15px', fontWeight: '900', textDecoration: 'none' }}>1回ガチャ</a>
              <a href={userId ? '/gacha/' + event.id : loginUrl} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '14px', background: '#c0392b', color: 'white', borderRadius: '8px', fontSize: '15px', fontWeight: '900', textDecoration: 'none' }}>5連ガチャ</a>
            </div>
          )}
          {!userId && <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '4px' }}>ガチャを引くには<a href={loginUrl} style={{ color: '#e67e00', fontWeight: '700' }}>ログイン</a>が必要です</p>}
        </div>
      </div>
    </div>
  )
}