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
  ceiling_count: number
  ceiling_grade: string
}

type Prize = {
  id: string
  grade: string
  count: number
  remaining_count: number
  pt_exchange: number
  animation_video_id: string | null
  animation_videos: { video_url: string } | null
  products: {
    name: string
    image_url: string
    market_value: number
  }
}

type GachaOption = {
  id: string
  label: string
  count: number
  color: string
  is_active: boolean
}

const gradeOrder = ['ラストワン賞', 'S賞', 'A賞', 'B賞', 'C賞']

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [gachaOptions, setGachaOptions] = useState<GachaOption[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [userCeilingCount, setUserCeilingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // ポップアップ・動画・ガチャ状態
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmOption, setConfirmOption] = useState<GachaOption | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState('')
  const [pendingDrawIds, setPendingDrawIds] = useState<string[]>([])

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

    const { data: prizesData } = await supabase
      .from('prizes')
      .select('*, animation_videos(video_url), products(name, image_url, market_value)')
      .eq('event_id', params.id)
    if (prizesData) setPrizes(prizesData)

    const { data: optionsData } = await supabase
      .from('gacha_options')
      .select('*')
      .eq('event_id', params.id)
      .eq('is_active', true)
      .order('count')
    if (optionsData) setGachaOptions(optionsData)

    if (session?.user) {
      const { data: ceiling } = await supabase.from('user_ceiling').select('count').eq('user_id', session.user.id).eq('event_id', params.id).single()
      if (ceiling) setUserCeilingCount(ceiling.count)
    }

    setLoading(false)
  }

  // 賞品をグレード別にグループ化
  const gradeGroups: Record<string, Prize[]> = {}
  prizes.forEach(p => {
    if (!gradeGroups[p.grade]) gradeGroups[p.grade] = []
    gradeGroups[p.grade].push(p)
  })

  const getBestVideoUrl = (results: any[]) => {
    for (const grade of gradeOrder) {
      const match = results.find((r: any) => r.grade === grade)
      if (match?.video_url) return match.video_url
    }
    return ''
  }

  const openConfirm = (opt: GachaOption) => {
    if (!userId) { router.push('/auth/login'); return }
    setConfirmOption(opt)
    setShowConfirm(true)
    setError('')
  }

  const handleGacha = async () => {
    if (!userId || !event || !confirmOption) return
    const totalCost = event.price * confirmOption.count
    if (userPoints < totalCost) { setError(`ポイントが不足しています（必要: ${totalCost.toLocaleString()}pt）`); return }

    setPulling(true)
    setShowConfirm(false)

    try {
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, user_id: userId, count: confirmOption.count }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'エラーが発生しました'); setPulling(false); return }

      setUserPoints(data.remaining_points)
      setPendingDrawIds(data.draw_ids || [])

      // 最高グレードの動画を取得
      const bestVideo = getBestVideoUrl(data.results.map((r: any) => ({
        grade: r.grade,
        video_url: prizes.find(p => p.grade === r.grade)?.animation_videos?.video_url || ''
      })))

      if (bestVideo) {
        setVideoUrl(bestVideo)
        setShowVideo(true)
      } else {
        // 動画なし → 直接結果ページへ
        router.push('/gacha-result?draw_ids=' + (data.draw_ids || []).join(','))
      }
    } catch {
      setError('通信エラーが発生しました')
    }
    setPulling(false)
  }

  const handleVideoEnd = () => {
    setShowVideo(false)
    router.push('/gacha-result?draw_ids=' + pendingDrawIds.join(','))
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

  const isSoldOut = event.remaining_count <= 0 || event.status !== 'active'
  const loginUrl = `/auth/login?redirect=/event/${event.id}`

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>

      {/* ヘッダー */}
      <header style={{ background: '#1f2937', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
        {userId && <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>{userPoints.toLocaleString()}pt</div>}
      </header>

      {/* メイン画像 */}
      <div style={{ width: '100%', height: '240px', background: '#1f2937', overflow: 'hidden' }}>
        {event.image_url
          ? <img src={event.image_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>🎴</div>
        }
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px' }}>
        {/* 基本情報 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#1f2937', marginBottom: '12px' }}>{event.name}</h1>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>価格</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b' }}>{event.price.toLocaleString()}pt/回</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>残り</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#1f2937' }}>{event.remaining_count}<span style={{ fontSize: '12px', color: '#9ca3af' }}>/{event.total_count}口</span></div>
            </div>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px' }}>
            <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '999px', height: '8px', width: `${(event.remaining_count / event.total_count) * 100}%` }} />
          </div>

          {/* 天井カウンター */}
          {event.ceiling_count > 0 && (
            <div style={{ marginTop: '12px', background: '#eff6ff', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>天井カウンター</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>
                {userCeilingCount} / {event.ceiling_count}回で{event.ceiling_grade}確定
              </div>
              <div style={{ background: '#dbeafe', borderRadius: '999px', height: '4px', marginTop: '6px' }}>
                <div style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '999px', height: '4px', width: `${Math.min((userCeilingCount / event.ceiling_count) * 100, 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px', marginBottom: '16px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        {/* 賞品一覧 */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>賞品一覧</h2>
          {gradeOrder.filter(g => gradeGroups[g]).map(grade => (
            <div key={grade} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1f2937', marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #f3f4f6' }}>
                {grade}
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px', fontWeight: 'normal' }}>{gradeGroups[grade].reduce((s, p) => s + p.remaining_count, 0)}口</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {gradeGroups[grade].map(prize => (
                  <div key={prize.id} style={{ textAlign: 'center' }}>
                    <div style={{ aspectRatio: '3/4', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '4px' }}>
                      {prize.products?.image_url
                        ? <img src={prize.products.image_url} alt={prize.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🃏</div>
                      }
                    </div>
                    <div style={{ fontSize: '10px', color: '#374151', fontWeight: '600', lineHeight: 1.3 }}>{prize.products?.name}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{prize.remaining_count}口</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 説明文 */}
        {event.description && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '12px' }}>オリパについて</h2>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </div>
        )}
      </div>

      {/* 固定フッターガチャボタン */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '10px 16px', zIndex: 50 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {isSoldOut ? (
            <div style={{ textAlign: 'center', padding: '14px', background: '#f3f4f6', borderRadius: '8px', color: '#9ca3af', fontWeight: 'bold' }}>SOLD OUT</div>
          ) : gachaOptions.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {gachaOptions.map(opt => (
                <div key={opt.id} style={{ textAlign: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => openConfirm(opt)}
                    disabled={pulling}
                    style={{ padding: '12px 20px', background: opt.color, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {opt.label}
                  </button>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{(event.price * opt.count).toLocaleString()}pt</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openConfirm({ id: '1', label: '1回ガチャ', count: 1, color: '#e67e00', is_active: true })} style={{ flex: 1, padding: '14px', background: '#e67e00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>1回ガチャ</button>
              <button onClick={() => openConfirm({ id: '10', label: '10連ガチャ', count: 10, color: '#c0392b', is_active: true })} style={{ flex: 1, padding: '14px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>10連ガチャ</button>
            </div>
          )}
          {!userId && <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '4px' }}>ガチャを引くには<a href={loginUrl} style={{ color: '#e67e00', fontWeight: '700' }}>ログイン</a>が必要です</p>}
        </div>
      </div>

      {/* 確認ポップアップ */}
      {showConfirm && confirmOption && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', maxWidth: '400px', width: '100%' }}>
            <div style={{ width: '100%', height: '200px', background: '#1f2937', overflow: 'hidden' }}>
              {event.image_url
                ? <img src={event.image_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>🎴</div>
              }
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '16px', color: '#374151', textAlign: 'center', marginBottom: '16px' }}>
                コインを消費して、<span style={{ fontWeight: 'bold', color: '#e67e00' }}>{confirmOption.count}回</span>ガチャを引きますか？
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f9fafb', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '20px' }}>🪙</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{userPoints.toLocaleString()}</span>
                </div>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>›</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '20px' }}>🪙</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{(userPoints - event.price * confirmOption.count).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={handleGacha}
                disabled={pulling}
                style={{ width: '100%', padding: '14px', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px' }}
              >
                {pulling ? '処理中...' : 'ガチャを引く'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ width: '100%', padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 動画再生 */}
      {showVideo && videoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <video
            src={videoUrl}
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <button
            onClick={handleVideoEnd}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}
          >
            スキップ
          </button>
        </div>
      )}
    </div>
  )
}