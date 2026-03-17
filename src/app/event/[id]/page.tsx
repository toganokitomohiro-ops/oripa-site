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
  animation_videos: { video_url: string } | null
  products: { name: string; image_url: string; market_value: number }
}

type GachaOption = {
  id: string
  label: string
  count: number
  color: string
  is_active: boolean
}

const gradeOrder = ['ラストワン賞', 'S賞', 'A賞', 'B賞', 'C賞']

const gradeBadgeImage: Record<string, string> = {
  'ラストワン賞': '/pack/last.png',
  'S賞': '/pack/1st.png',
  'A賞': '/pack/2nd.png',
  'B賞': '/pack/3rd.png',
  'C賞': '/pack/lose.png',
}

const gradeLabel: Record<string, string> = {
  'ラストワン賞': 'ラストワン賞',
  'S賞': 'S賞',
  'A賞': 'A賞',
  'B賞': 'B賞',
  'C賞': 'C賞',
}

const gradeImages: Record<string, string> = {
  'ラストワン賞': '/pack/last.png',
  'S賞': '/pack/1st.png',
  'A賞': '/pack/2nd.png',
  'B賞': '/pack/3rd.png',
  'C賞': '/pack/lose.png',
}

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
      const { data: ceiling } = await supabase.from('user_ceiling').select('count').eq('user_id', session.user.id).eq('event_id', params.id).single()
      if (ceiling) setUserCeilingCount(ceiling.count)
    }
    const { data: eventData } = await supabase.from('events').select('*').eq('id', params.id).single()
    if (eventData) setEvent(eventData)
    const { data: prizesData } = await supabase.from('prizes').select('*, animation_videos(video_url), products(name, image_url, market_value)').eq('event_id', params.id)
    if (prizesData) setPrizes(prizesData)
    const { data: optionsData } = await supabase.from('gacha_options').select('*').eq('event_id', params.id).eq('is_active', true).order('sort_order')
    if (optionsData) setGachaOptions(optionsData)
    setLoading(false)
  }

  const gradeGroups: Record<string, Prize[]> = {}
  prizes.forEach(p => {
    if (!gradeGroups[p.grade]) gradeGroups[p.grade] = []
    gradeGroups[p.grade].push(p)
  })

  const getBestVideoUrl = (results: any[]) => {
    for (const grade of gradeOrder) {
      const match = results.find((r: any) => r.grade === grade)
      if (match) {
        const prize = prizes.find(p => p.grade === grade)
        if (prize?.animation_videos?.video_url) return prize.animation_videos.video_url
      }
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
    if (userPoints < totalCost) { setError(`ポイントが不足しています`); setShowConfirm(false); return }
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
      // APIが返すvideo_urlを優先、なければ旧ロジックにフォールバック
      const bestVideo = data.video_url || getBestVideoUrl(data.results)
      if (bestVideo) { setVideoUrl(bestVideo); setShowVideo(true) }
      else router.push('/gacha-result?draw_ids=' + (data.draw_ids || []).join(',') + '&event_id=' + event.id)
    } catch { setError('通信エラーが発生しました') }
    setPulling(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '800px', padding: '16px' }}>
        <div style={{ width: '100%', paddingBottom: '65.6%', background: '#e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '200px', background: '#e5e7eb', borderRadius: '8px' }} />
      </div>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#999' }}>オリパが見つかりません</div>
    </div>
  )

  const isSoldOut = event.remaining_count <= 0 || event.status !== 'active'
  const remainingPercent = Math.min(100, Math.round((event.remaining_count / event.total_count) * 100))

  return (
    <div style={{ minHeight: '100vh', background: 'white', paddingBottom: '120px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .gacha-btn:active { transform: scale(0.97); }
      `}</style>

      {/* ヘッダー - TOPと同じ */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none', letterSpacing: '1px' }}>ORIPA 🎴</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {userId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5c518', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#e67e00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '9px', fontWeight: '900' }}>C</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{userPoints.toLocaleString()} PT</span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#e67e00' }}>+</span>
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href="/auth/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'none', padding: '6px 14px', border: '1px solid #ddd', borderRadius: '4px' }}>ログイン</a>
                <a href="/auth/register" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: '700', padding: '6px 14px', background: '#e67e00', borderRadius: '4px' }}>新規登録</a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* パンくずリスト */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9ca3af' }}>
          <a href="/" style={{ color: '#9ca3af', textDecoration: 'none', hover: 'color:#374151' }}>ガチャ一覧</a>
          <span>›</span>
          <span style={{ color: '#374151', fontWeight: '600' }}>{event.name}</span>
        </div>
      </div>

      {/* メイン画像 - オリパワン800×525 */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ position: 'relative', width: '100%', paddingBottom: '65.6%', background: '#f3f4f6', overflow: 'hidden' }}>
          {event.image_url
            ? <img src={event.image_url} alt={event.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>🎴</div>
          }
        </div>
      </div>

      {/* 賞品一覧 - オリパワン完全再現 */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        {/* 天井カウンター */}
        {event.ceiling_count > 0 && userId && (
          <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>🔢 天井カウンター</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>{userCeilingCount} / {event.ceiling_count}回で{event.ceiling_grade}確定</span>
            </div>
            <div style={{ background: '#dbeafe', borderRadius: '999px', height: '4px' }}>
              <div style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: '999px', height: '4px', width: `${Math.min((userCeilingCount / event.ceiling_count) * 100, 100)}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* グレード別賞品 - オリパワンそのまま */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {gradeOrder.filter(g => gradeGroups[g]).map(grade => {
            const prizeList = gradeGroups[grade]
            const count = prizeList.length
            // オリパワンと同じ列数ロジック
            const colWidth = count <= 2 ? '50%' : count <= 4 ? '33.333%' : count <= 8 ? '25%' : '20%'

            return (
              <div key={grade} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                {/* グレードバッジ - DOPA完全コピー */}
                <div style={{
                  width: '248px', height: '56px', borderRadius: '5px',
                  background: grade === 'S賞'
                    ? 'linear-gradient(131deg, rgb(45,1,210) 0%, rgb(1,255,255) 20%, rgb(123,254,122) 40%, rgb(253,255,14) 59%, rgb(243,1,1) 79%, rgb(112,1,104) 99%)'
                    : grade === 'A賞'
                      ? 'linear-gradient(131deg, rgb(114,79,10) 0%, rgb(223,183,41) 20%, rgb(249,247,196) 40%, rgb(248,251,191) 59%, rgb(202,159,15) 79%, rgb(114,79,10) 99%)'
                      : grade === 'B賞'
                        ? 'linear-gradient(130deg, rgb(183,0,0) 12%, rgb(250,1,1) 27%, rgb(253,142,134) 43%, rgb(253,142,134) 58%, rgb(250,1,1) 74%, rgb(183,0,0) 89%)'
                        : grade === 'ラストワン賞'
                          ? 'linear-gradient(131deg, rgb(76,10,114) 0%, rgb(210,148,246) 20%, rgb(244,229,253) 40%, rgb(244,229,253) 59%, rgb(210,148,246) 79%, rgb(76,10,114) 99%)'
                          : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', borderRadius: '4px',
                    background: grade === 'S賞'
                      ? 'linear-gradient(131deg, rgb(45,1,210) 0%, rgb(1,255,255) 20%, rgb(123,254,122) 40%, rgb(253,255,14) 59%, rgb(243,1,1) 79%, rgb(112,1,104) 99%)'
                      : grade === 'A賞'
                        ? 'linear-gradient(131deg, rgb(114,79,10) 0%, rgb(223,183,41) 20%, rgb(249,247,196) 40%, rgb(248,251,191) 59%, rgb(202,159,15) 79%, rgb(114,79,10) 99%)'
                        : grade === 'B賞'
                          ? 'linear-gradient(130deg, rgb(183,0,0) 12%, rgb(250,1,1) 27%, rgb(253,142,134) 43%, rgb(253,142,134) 58%, rgb(250,1,1) 74%, rgb(183,0,0) 89%)'
                          : grade === 'ラストワン賞'
                            ? 'linear-gradient(131deg, rgb(76,10,114) 0%, rgb(210,148,246) 20%, rgb(244,229,253) 40%, rgb(244,229,253) 59%, rgb(210,148,246) 79%, rgb(76,10,114) 99%)'
                            : 'linear-gradient(130deg, rgb(183,0,0) 12%, rgb(250,1,1) 27%, rgb(253,142,134) 43%, rgb(253,142,134) 58%, rgb(250,1,1) 74%, rgb(183,0,0) 89%)',
                    boxShadow: 'inset 6px 6px 7.5px rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: '900', lineHeight: 1, WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>
                      <span style={{ fontSize: '32px' }}>{gradeLabel[grade] || grade}</span>
                    </span>
                  </div>
                </div>

                {/* カードグリッド - オリパワンと同じ flex wrap */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  {prizeList.map(prize => (
                    <div key={prize.id} style={{ width: colWidth, maxWidth: '300px', padding: '8px', boxSizing: 'border-box' }}>
                      <div style={{ position: 'relative', paddingBottom: '139.4%', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                        {prize.products?.image_url
                          ? <img src={prize.products.image_url} alt={prize.products.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#9ca3af' }}>🃏</div>
                        }
                        {/* ×枚数バッジ */}
                        <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '999px' }}>
                          ×{prize.remaining_count}
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#374151', fontWeight: '600', textAlign: 'center', marginTop: '4px', lineHeight: 1.3 }}>{prize.products?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* 説明文 */}
        {event.description && (
          <div style={{ marginTop: '32px', padding: '16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>オリパについて</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </div>
        )}

        {/* 注意事項 - オリパワン風 */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { title: '傷ありカード/ケースについて', body: 'オリパで排出されたカードや鑑定済みカード(ケース)には傷がある場合がございます。' },
            { title: '商品画像の注意', body: '商品画像はイメージであり、実際のカードの状態や排出状況を保証するものではありません。' },
            { title: '返品・交換について', body: '仕様上、商品の交換・返金はできません。' },
            { title: '販売終了について', body: '予告なく販売を終了することがあります。' },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '2px' }}>{item.title}</p>
              <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.6 }}>{item.body}</p>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: '#6b7280' }}>以上、ご了承の上お買い求めください。</p>
        </div>
      </div>

      {/* 固定フッター - オリパワン完全再現 */}
      <div style={{ position: 'sticky', bottom: 0, background: 'white', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 16px rgba(0,0,0,0.12)', padding: '10px 12px 16px', zIndex: 50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* 価格・残り */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5c518, #e67e00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>C</span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#e67e00' }}>{event.price.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>/1回</span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>残り{event.remaining_count.toLocaleString()}/{event.total_count.toLocaleString()}</span>
          </div>

          {/* プログレスバー */}
          <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '4px', marginBottom: '10px' }}>
            <div style={{ background: remainingPercent > 20 ? '#22c55e' : '#ef4444', borderRadius: '999px', height: '4px', width: `${remainingPercent}%`, transition: 'width 0.5s' }} />
          </div>

          {/* ガチャボタン */}
          {isSoldOut ? (
            <div style={{ textAlign: 'center', padding: '14px', background: '#f3f4f6', borderRadius: '10px', color: '#9ca3af', fontWeight: 'bold', fontSize: '16px' }}>SOLD OUT</div>
          ) : gachaOptions.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              {gachaOptions.map(opt => (
                <button
                  key={opt.id}
                  className="gacha-btn"
                  onClick={() => openConfirm(opt)}
                  disabled={pulling}
                  style={{ flex: 1, padding: '14px 4px', background: pulling ? '#9ca3af' : opt.color, color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', transition: 'transform 0.1s', letterSpacing: '0.3px' }}
                >
                  {pulling ? '処理中...' : opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openConfirm({ id: '1', label: '1回ガチャ', count: 1, color: '#f5a623', is_active: true })} style={{ flex: 1, padding: '14px', background: '#f5a623', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>1回ガチャ</button>
              <button onClick={() => openConfirm({ id: '10', label: '10連ガチャ', count: 10, color: '#e63946', is_active: true })} style={{ flex: 1, padding: '14px', background: '#e63946', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>10連ガチャ</button>
            </div>
          )}

          {!userId && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              ガチャを引くには<a href={`/auth/login?redirect=/event/${event.id}`} style={{ color: '#e67e00', fontWeight: '700' }}>ログイン</a>が必要です
            </p>
          )}
        </div>
      </div>

      {/* 確認ポップアップ */}
      {showConfirm && confirmOption && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '800px', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            {/* バナー画像 */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '40%', overflow: 'hidden', background: '#1f2937' }}>
              {event.image_url
                ? <img src={event.image_url} alt={event.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🎴</div>
              }
            </div>
            <div style={{ padding: '20px 20px 32px' }}>
              <p style={{ fontSize: '15px', color: '#374151', textAlign: 'center', marginBottom: '16px' }}>
                コインを消費して、<span style={{ fontWeight: '900', color: '#e67e00' }}>{confirmOption.count}回</span>ガチャを引きますか？
              </p>
              {/* コイン表示 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: '#f9fafb', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#e67e00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: '900' }}>C</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{userPoints.toLocaleString()}</span>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '20px' }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#e67e00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: '900' }}>C</span>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: (userPoints - event.price * confirmOption.count) < 0 ? '#ef4444' : '#1f2937' }}>
                    {(userPoints - event.price * confirmOption.count).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGacha}
                disabled={pulling}
                style={{ width: '100%', padding: '16px', background: '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px', boxShadow: '0 4px 14px rgba(245,197,24,0.5)' }}
              >
                {pulling ? '処理中...' : 'ガチャを引く'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ width: '100%', padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 動画再生 */}
      {showVideo && videoUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <video src={videoUrl} autoPlay playsInline onEnded={() => { setShowVideo(false); router.push('/gacha-result?draw_ids=' + pendingDrawIds.join(',') + '&event_id=' + event?.id) }} style={{ maxWidth: '100%', maxHeight: '100%' }} />
          <button onClick={() => { setShowVideo(false); router.push('/gacha-result?draw_ids=' + pendingDrawIds.join(',') + '&event_id=' + event?.id) }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            スキップ
          </button>
        </div>
      )}
    </div>
  )
}