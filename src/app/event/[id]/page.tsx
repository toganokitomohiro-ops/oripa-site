'use client'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

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
  end_at?: string
  max_count?: number
  min_guarantee?: number
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

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [gachaOptions, setGachaOptions] = useState<GachaOption[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmOption, setConfirmOption] = useState<GachaOption | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState('')
  const [pendingDrawIds, setPendingDrawIds] = useState<string[]>([])

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!params.id) return
    const eventId = params.id as string

    const prizeChannel = supabase.channel(`prizes-rt-${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'prizes',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const updated = payload.new as { id: string; remaining_count: number }
        setPrizes(prev => prev.map(p => p.id === updated.id ? { ...p, remaining_count: updated.remaining_count } : p))
      })
      .subscribe()

    const eventChannel = supabase.channel(`event-rt-${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        const updated = payload.new as { remaining_count: number; status: string }
        setEvent(prev => prev ? { ...prev, remaining_count: updated.remaining_count, status: updated.status } : prev)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(prizeChannel)
      supabase.removeChannel(eventChannel)
    }
  }, [params.id])

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
    if (userPoints < totalCost) { setError('ポイントが不足しています'); setShowConfirm(false); return }
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
      const bestVideo = data.video_url || getBestVideoUrl(data.results)
      if (bestVideo) { setVideoUrl(bestVideo); setShowVideo(true) }
      else router.push('/gacha-result?draw_ids=' + (data.draw_ids || []).join(',') + '&event_id=' + event.id)
    } catch { setError('通信エラーが発生しました') }
    setPulling(false)
  }

  const formatEndAt = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '800px', padding: '16px' }}>
        <div style={{ width: '100%', paddingBottom: '68%', background: '#e5e7eb', borderRadius: '8px' }} />
        <div style={{ height: '100px', background: '#e5e7eb', borderRadius: '8px' }} />
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

  // フッターボタン: 1000連以上は全幅赤ボタン、それ以外は3列
  const regularOptions = gachaOptions.filter(o => o.count < 1000)
  const bigOption = gachaOptions.find(o => o.count >= 1000)
  const defaultOptions: GachaOption[] = [
    { id: '1', label: '1回ガチャ', count: 1, color: 'linear-gradient(135deg,#f97316,#ea580c)', is_active: true },
    { id: '10', label: '10連ガチャ', count: 10, color: 'linear-gradient(135deg,#22c55e,#16a34a)', is_active: true },
    { id: '100', label: '100連ガチャ', count: 100, color: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', is_active: true },
  ]
  const footerOptions = regularOptions.length > 0 ? regularOptions.slice(0, 3) : defaultOptions

  const gradeBadgeStyle = (grade: string): string => {
    if (grade === 'S賞') return 'linear-gradient(131deg, rgb(45,1,210) 0%, rgb(1,255,255) 20%, rgb(123,254,122) 40%, rgb(253,255,14) 59%, rgb(243,1,1) 79%, rgb(112,1,104) 99%)'
    if (grade === 'A賞') return 'linear-gradient(131deg, rgb(114,79,10) 0%, rgb(223,183,41) 20%, rgb(249,247,196) 40%, rgb(248,251,191) 59%, rgb(202,159,15) 79%, rgb(114,79,10) 99%)'
    if (grade === 'B賞') return 'linear-gradient(130deg, rgb(183,0,0) 12%, rgb(250,1,1) 27%, rgb(253,142,134) 43%, rgb(253,142,134) 58%, rgb(250,1,1) 74%, rgb(183,0,0) 89%)'
    if (grade === 'ラストワン賞') return 'linear-gradient(131deg, rgb(76,10,114) 0%, rgb(210,148,246) 20%, rgb(244,229,253) 40%, rgb(244,229,253) 59%, rgb(210,148,246) 79%, rgb(76,10,114) 99%)'
    return 'linear-gradient(135deg, #9ca3af, #6b7280)'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', paddingBottom: '160px' }}>
      {/* スマホ専用ヘッダー */}
      <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: '20px', color: '#374151', lineHeight: 1 }}>&#8592;</span>
        </button>
        <div style={{ flex: 1, textAlign: 'center', padding: '0 8px', overflow: 'hidden' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{event.name}</span>
        </div>
        <div style={{ width: '80px', flexShrink: 0, textAlign: 'right' }}>
          {userId && (
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f97316' }}>🪙 {userPoints.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* PC専用ヘッダー */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* バナー - 全幅 */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        {event.image_url
          ? <img src={event.image_url} alt={event.name} style={{ width: '100%', display: 'block', aspectRatio: '970/660', objectFit: 'fill' }} />
          : <div style={{ width: '100%', aspectRatio: '970/660', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>🎴</div>
        }
      </div>

      {/* 情報エリア（ベージュ背景） */}
      {(event.end_at || event.max_count != null || event.min_guarantee != null) && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 16px 0' }}>
          <div style={{ background: '#fef9f0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #fde68a' }}>
            {event.end_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '800', background: '#fde68a', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>販売期限</span>
                <span style={{ fontSize: '13px', color: '#78350f', fontWeight: '600' }}>{formatEndAt(event.end_at)}</span>
              </div>
            )}
            {event.max_count != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '800', background: '#fde68a', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>口数制限</span>
                <span style={{ fontSize: '13px', color: '#78350f', fontWeight: '600' }}>残り{event.max_count.toLocaleString()}口</span>
              </div>
            )}
            {event.min_guarantee != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#92400e', fontWeight: '800', background: '#fde68a', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>最低保証</span>
                <span style={{ fontSize: '13px', color: '#78350f', fontWeight: '600' }}>{event.min_guarantee.toLocaleString()}/回</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div style={{ maxWidth: '800px', margin: '12px auto 0', padding: '0 16px' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        </div>
      )}

      {/* 賞品一覧 */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {gradeOrder.filter(g => gradeGroups[g]).map(grade => {
            const prizeList = gradeGroups[grade]
            return (
              <div key={grade} style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '20px', overflow: 'hidden', paddingBottom: '16px' }}>
                {/* グレードバッジ - 全幅 */}
                <div style={{
                  width: '100%', height: '52px',
                  background: gradeBadgeStyle(grade),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: 'white', fontWeight: '900', fontSize: '26px', WebkitTextStroke: '1.5px rgba(0,0,0,0.5)', paintOrder: 'stroke fill' }}>{grade}</span>
                </div>

                {/* カード2カラムグリッド */}
                <div style={{ display: 'flex', flexWrap: 'wrap', padding: '0 10px' }}>
                  {prizeList.map(prize => (
                    <div key={prize.id} style={{ width: '50%', padding: '4px', boxSizing: 'border-box' }}>
                      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '63/88', borderRadius: '8px', background: '#f3f4f6' }}>
                        {prize.products?.image_url
                          ? <img src={prize.products.image_url} alt={prize.products?.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#9ca3af' }}>🃏</div>
                        }
                        {/* 残数バッジ ×N 形式 */}
                        <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: '#000', color: '#fff', fontSize: '13px', fontWeight: '700', padding: '2px 7px', borderRadius: '5px', zIndex: 20 }}>
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
          <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>オリパについて</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </div>
        )}

        {/* 注意事項 */}
        <div style={{ marginTop: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

      {/* 画面下固定フッター */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', zIndex: 60, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* コイン + 価格 / 残数 + プログレスバー */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 6px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c518,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: '11px', fontWeight: '900' }}>C</span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#f97316' }}>{event.price.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>/1回</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '3px', marginBottom: '3px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>残り</span>
                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '700' }}>{event.remaining_count.toLocaleString()}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>/{event.total_count.toLocaleString()}</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '4px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${remainingPercent}%`, background: remainingPercent > 20 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#ef4444,#f87171)', height: '100%', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>

          {/* ガチャボタン */}
          <div style={{ padding: '4px 12px 8px' }}>
            {isSoldOut ? (
              <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', color: '#9ca3af', fontWeight: 'bold', fontSize: '16px' }}>SOLD OUT</div>
            ) : (
              <>
                {/* 1〜100連: 横3列 */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${footerOptions.length}, 1fr)`, gap: '8px', marginBottom: bigOption ? '8px' : '0' }}>
                  {footerOptions.map(opt => (
                    <button key={opt.id} onClick={() => openConfirm(opt)} disabled={pulling}
                      style={{ height: '48px', background: pulling ? '#374151' : opt.color, color: 'white', border: 'none', cursor: pulling ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '900', borderRadius: '8px' }}>
                      {pulling ? '処理中...' : opt.label}
                    </button>
                  ))}
                </div>
                {/* 1000連以上: 全幅赤 */}
                {bigOption && (
                  <button onClick={() => openConfirm(bigOption)} disabled={pulling}
                    style={{ width: '100%', height: '48px', background: pulling ? '#374151' : '#dc2626', color: 'white', border: 'none', cursor: pulling ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '900', borderRadius: '8px' }}>
                    {pulling ? '処理中...' : bigOption.label}
                  </button>
                )}
              </>
            )}
            {!userId && !isSoldOut && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                ガチャを引くには<a href={`/auth/login?redirect=/event/${event.id}`} style={{ color: '#f97316', fontWeight: '700' }}>ログイン</a>が必要です
              </p>
            )}
          </div>
        </div>
      </div>


      {/* 確認ポップアップ */}
      {showConfirm && confirmOption && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '800px', overflow: 'hidden' }}>
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
              <button onClick={handleGacha} disabled={pulling}
                style={{ width: '100%', padding: '18px', background: '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px', boxShadow: '0 4px 14px rgba(245,197,24,0.5)' }}>
                {pulling ? '処理中...' : '🎰 ガチャを引く！'}
              </button>
              <button onClick={() => setShowConfirm(false)}
                style={{ width: '100%', padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>
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
