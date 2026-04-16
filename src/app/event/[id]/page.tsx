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
  end_at?: string | null
  max_count?: number | null
  min_guarantee?: number | null
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

type DrawHistory = {
  id: string
  user_id: string
  grade: string
  created_at: string
  products: { name: string; image_url: string } | null
}

const gradeOrder = ['ラストワン賞', 'S賞', 'A賞', 'B賞', 'C賞']

const gradeColor: Record<string, string> = {
  'ラストワン賞': '#7c3aed',
  'S賞': '#2563eb',
  'A賞': '#d97706',
  'B賞': '#dc2626',
  'C賞': '#6b7280',
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}時間前`
  return `${Math.floor(hr / 24)}日前`
}

const anonymizeUser = (userId: string) => `ユーザー****${userId.slice(-4)}`

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const gradeBadgeBackground = (grade: string): string => {
  if (grade === 'S賞') return 'linear-gradient(131deg, rgb(45,1,210) 0%, rgb(1,255,255) 20%, rgb(123,254,122) 40%, rgb(253,255,14) 59%, rgb(243,1,1) 79%, rgb(112,1,104) 99%)'
  if (grade === 'A賞') return 'linear-gradient(131deg, rgb(114,79,10) 0%, rgb(223,183,41) 20%, rgb(249,247,196) 40%, rgb(248,251,191) 59%, rgb(202,159,15) 79%, rgb(114,79,10) 99%)'
  if (grade === 'B賞') return 'linear-gradient(130deg, rgb(183,0,0) 12%, rgb(250,1,1) 27%, rgb(253,142,134) 43%, rgb(253,142,134) 58%, rgb(250,1,1) 74%, rgb(183,0,0) 89%)'
  if (grade === 'ラストワン賞') return 'linear-gradient(131deg, rgb(76,10,114) 0%, rgb(210,148,246) 20%, rgb(244,229,253) 40%, rgb(244,229,253) 59%, rgb(210,148,246) 79%, rgb(76,10,114) 99%)'
  return 'linear-gradient(135deg, #9ca3af, #6b7280)'
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
  const [drawHistory, setDrawHistory] = useState<DrawHistory[]>([])

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!params.id) return
    const eventId = params.id as string

    const fetchDrawHistory = async () => {
      const { data } = await supabase
        .from('draws')
        .select('id, user_id, grade, created_at, products(name, image_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setDrawHistory(data as unknown as DrawHistory[])
    }
    fetchDrawHistory()

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

    const drawChannel = supabase.channel(`draws-rt-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'draws',
        filter: `event_id=eq.${eventId}`,
      }, async () => {
        const { data } = await supabase
          .from('draws')
          .select('id, user_id, grade, created_at, products(name, image_url)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(20)
        if (data) setDrawHistory(data as unknown as DrawHistory[])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(prizeChannel)
      supabase.removeChannel(eventChannel)
      supabase.removeChannel(drawChannel)
    }
  }, [params.id])

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
      const bestVideo = data.video_url || getBestVideoUrl(data.results)
      if (bestVideo) { setVideoUrl(bestVideo); setShowVideo(true) }
      else router.push('/gacha-result?draw_ids=' + (data.draw_ids || []).join(',') + '&event_id=' + event.id)
    } catch { setError('通信エラーが発生しました') }
    setPulling(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '800px', padding: '16px' }}>
        <div style={{ width: '100%', paddingBottom: '68%', background: '#e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '80px', background: '#e5e7eb', borderRadius: '8px' }} />
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

  // フッターボタン分類: count < 1000 → 3列, count >= 1000 → 全幅赤ボタン
  const smallOptions = gachaOptions.filter(o => o.count < 1000).slice(0, 3)
  const bigOption = gachaOptions.find(o => o.count >= 1000) ?? null

  const defaultSmallOptions: GachaOption[] = [
    { id: '1', label: '1回ガチャ', count: 1, color: 'linear-gradient(135deg,#f97316,#ea580c)', is_active: true },
    { id: '10', label: '10連ガチャ', count: 10, color: 'linear-gradient(135deg,#3b82f6,#2563eb)', is_active: true },
    { id: '100', label: '100連ガチャ', count: 100, color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', is_active: true },
  ]
  const footerSmallOptions = smallOptions.length > 0 ? smallOptions : defaultSmallOptions

  return (
    <div className="has-bottom-nav" style={{ minHeight: '100vh', background: 'white', paddingBottom: '200px' }}>

      <Header />

      {/* 1. バナー - 全幅・アスペクト比そのまま */}
      <div style={{ width: '100%' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '970/660' }}>
          {event.image_url
            ? <img src={event.image_url} alt={event.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', background: '#f3f4f6' }}>🎴</div>
          }
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 16px 16px' }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        {/* 2. 情報エリア - ベージュ背景・角丸カード */}
        {(event.end_at || event.max_count || event.min_guarantee) && (
          <div style={{ background: '#fef9f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #f5e6cc' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {event.end_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>販売期限</span>
                  <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '700' }}>{formatDate(event.end_at)}</span>
                </div>
              )}
              {event.max_count && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>口数制限</span>
                  <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '700' }}>残り{event.remaining_count.toLocaleString()}口</span>
                </div>
              )}
              {event.min_guarantee && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>最低保証</span>
                  <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '700' }}>{event.min_guarantee}/回</span>
                </div>
              )}
            </div>
          </div>
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

        {/* 3. 賞品一覧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '32px' }}>
          {gradeOrder.filter(g => gradeGroups[g]).map(grade => {
            const prizeList = gradeGroups[grade]
            return (
              <div key={grade} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* グレードバッジ - 横幅いっぱい */}
                <div style={{
                  width: '100%', height: '52px', borderRadius: '6px', marginBottom: '12px',
                  background: gradeBadgeBackground(grade),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.2)',
                }}>
                  <span style={{ color: 'white', fontWeight: '900', fontSize: '28px', WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}>
                    {grade}
                  </span>
                </div>

                {/* カード2カラム */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {prizeList.map(prize => (
                    <div key={prize.id}>
                      <div style={{ position: 'relative', aspectRatio: '63/88', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6' }}>
                        {prize.products?.image_url
                          ? <img src={prize.products.image_url} alt={prize.products.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#9ca3af' }}>🃏</div>
                        }
                        {/* 残数バッジ x8 形式 */}
                        <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: '#000', color: '#fff', fontSize: '14px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fff', zIndex: 20 }}>
                          x{prize.remaining_count}
                        </div>
                      </div>
                      <p className="event-nova-card-name" style={{ fontSize: '11px', color: '#374151', fontWeight: '600', textAlign: 'center', marginTop: '4px', lineHeight: 1.3 }}>
                        {prize.products?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* 排出履歴 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="event-nova-history-title" style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>排出履歴</span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          </div>
          {drawHistory.length === 0 ? (
            <div className="event-nova-history-empty" style={{ textAlign: 'center', padding: '32px 16px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>まだ排出履歴はありません</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {drawHistory.map((draw, i) => (
                <div key={draw.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    position: 'relative', paddingBottom: '139.4%', borderRadius: '8px', overflow: 'hidden',
                    background: '#f3f4f6',
                    boxShadow: i === 0 ? '0 0 0 2px #f97316' : 'none',
                  }}>
                    {draw.products?.image_url
                      ? <img src={draw.products.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🃏</div>
                    }
                    <div style={{
                      position: 'absolute', top: '4px', left: '4px',
                      fontSize: '9px', fontWeight: '900', color: 'white',
                      background: gradeColor[draw.grade] || '#6b7280',
                      padding: '1px 5px', borderRadius: '3px', lineHeight: '14px'
                    }}>{draw.grade}</div>
                    {i === 0 && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', fontSize: '8px', fontWeight: '900', padding: '1px 4px', borderRadius: '3px', lineHeight: '14px' }}>NEW</div>
                    )}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <p className="event-nova-draw-name" style={{ fontSize: '10px', color: '#111827', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
                      {draw.products?.name || '商品'}
                    </p>
                    <p className="event-nova-draw-user" style={{ fontSize: '9px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {anonymizeUser(draw.user_id)}
                    </p>
                    <p className="event-nova-draw-time" style={{ fontSize: '9px', color: '#d1d5db', margin: 0 }}>
                      {formatTimeAgo(draw.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 説明文 */}
        {event.description && (
          <div className="event-nova-desc" style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>オリパについて</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </div>
        )}

        {/* 注意事項 */}
        <div className="event-nova-terms" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

      {/* 4. 画面下固定フッター */}
      <div style={{ position: 'fixed', bottom: '56px', left: 0, right: 0, background: '#000', zIndex: 60 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* 上段: コインアイコン + 価格/1回 | 残り 残数/総数 + プログレスバー */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 4px', gap: '12px', background: '#111', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {/* 左: コイン + 価格 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5c518, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>C</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{event.price.toLocaleString()}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>/1回</span>
            </div>
            {/* 右: 残数 + プログレス */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>残り</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{event.remaining_count.toLocaleString()}/{event.total_count.toLocaleString()}</span>
              </div>
              <div style={{ background: '#374151', height: '4px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${remainingPercent}%`, background: '#7c02d0', height: '100%', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>

          {/* ガチャボタンエリア */}
          <div style={{ padding: '4px 8px 6px' }}>
            {isSoldOut ? (
              <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '16px' }}>SOLD OUT</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {/* 横3列ボタン: 1回 / 10連 / 100連 */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${footerSmallOptions.length}, 1fr)`, gap: '5px' }}>
                  {footerSmallOptions.map(opt => (
                    <button key={opt.id} className="gacha-btn" onClick={() => openConfirm(opt)} disabled={pulling}
                      style={{ height: '48px', background: pulling ? '#374151' : opt.color, color: 'white', border: 'none', cursor: pulling ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '900', borderRadius: '8px' }}>
                      {pulling ? '処理中...' : opt.label}
                    </button>
                  ))}
                </div>
                {/* 1,000連ガチャ - 全幅・赤背景 */}
                {bigOption && (
                  <button className="gacha-btn" onClick={() => openConfirm(bigOption)} disabled={pulling}
                    style={{ width: '100%', height: '48px', background: pulling ? '#374151' : '#dc2626', color: 'white', border: 'none', cursor: pulling ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '900', borderRadius: '8px' }}>
                    {pulling ? '処理中...' : bigOption.label}
                  </button>
                )}
              </div>
            )}
            {!userId && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                ガチャを引くには<a href={`/auth/login?redirect=/event/${event.id}`} style={{ color: '#f97316', fontWeight: '700' }}>ログイン</a>が必要です
              </p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* 確認ポップアップ */}
      {showConfirm && confirmOption && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '800px', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
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
              <button
                className="gacha-btn"
                onClick={handleGacha}
                disabled={pulling}
                style={{ width: '100%', padding: '18px', background: '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px', boxShadow: '0 4px 14px rgba(245,197,24,0.5)' }}
              >
                {pulling ? '処理中...' : '🎰 ガチャを引く！'}
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
