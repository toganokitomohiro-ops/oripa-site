'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'

type Event = {
  id: string
  name: string
  price: number
  remaining_count: number
  total_count: number
  description: string
  image_url: string
  status: string
  category: string
  created_at: string
  min_guarantee_rate?: number
  gacha_options?: { id: string; label: string; color: string; count: number; sort_order: number }[]
}

type Banner = {
  id: string
  image_url: string
  link_url: string
  title: string
}

export default function Home() {
  const { showToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [user, setUser] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmEvent, setConfirmEvent] = useState<any>(null)
  const [confirmOption, setConfirmOption] = useState<any>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [pulling, setPulling] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [pendingDrawIds, setPendingDrawIds] = useState<string[]>([])
  const [points, setPoints] = useState(0)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortFilter, setSortFilter] = useState('')

  useEffect(() => {
    fetchEvents()
    fetchBanners()
    // 初回ロード時にセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile) setUserPoints(profile.points)
        })
        fetchPoints(session.user.id)
      }
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile) setUserPoints(profile.points)
        })
        fetchPoints(session.user.id)
      } else {
        setUser(null)
        setPoints(0)
      }
    })
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [banners])

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, gacha_options(*), prizes(*, animation_videos(video_url))')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('sort_order')
    if (data) setBanners(data)
  }

  const fetchPoints = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()
    if (profile) setPoints(profile.points)
  }

  const openConfirm = (event: any, opt: any) => {
    if (!user) { window.location.href = '/auth/login'; return }
    setConfirmEvent(event)
    setConfirmOption(opt)
    setShowConfirm(true)
  }

  const handleGacha = async () => {
    if (!user || !confirmEvent || !confirmOption) return
    setPulling(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: confirmEvent.id, user_id: user.id, count: confirmOption.count }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'エラー', 'error'); setPulling(false); return }
      setUserPoints(data.remaining_points)
      setPendingDrawIds(data.draw_ids || [])
      // APIから返ってきたvideo_urlを使う
      const bestVideo = data.video_url || ''
      if (bestVideo) {
        setVideoUrl(bestVideo)
        setShowVideo(true)
      } else {
        window.location.href = '/gacha-result?draw_ids=' + (data.draw_ids || []).join(',') + '&event_id=' + confirmEvent.id
      }
    } catch { showToast('通信エラー', 'error') }
    setPulling(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const categories = [
    { value: 'all', label: 'すべて' },
    { value: 'pokemon', label: 'ポケモン' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  const filteredEvents = (() => {
    let result = activeCategory === 'all' ? [...events] : events.filter(e => e.category === activeCategory)
    if (sortFilter === 'high_point') result.sort((a, b) => b.price - a.price)
    else if (sortFilter === 'low_point') result.sort((a, b) => a.price - b.price)
    else if (sortFilter === 'new') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortFilter === 'old') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortFilter === 'remaining_high') result.sort((a, b) => (b.remaining_count / b.total_count) - (a.remaining_count / a.total_count))
    else if (sortFilter === 'remaining_low') result.sort((a, b) => (a.remaining_count / a.total_count) - (b.remaining_count / b.total_count))
    return result
  })()

  return (
    <div className="has-bottom-nav" style={{ minHeight: '100vh', background: '#f8f7f5', color: '#1a1a1a', paddingBottom: '70px' }}>

      {/* ヘッダー */}
      <Header />

      {/* バナースライダー */}
      {banners.length > 0 && (
        <div className='banner-outer' style={{ position: 'relative' }}>
          {/* 左矢印 */}
          {currentBanner > 0 && (
            <button
              onClick={() => setCurrentBanner(prev => Math.max(0, prev - 1))}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-70%)', zIndex: 10, background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
          )}
          {/* 右矢印 */}
          {currentBanner < banners.length - 1 && (
            <button
              onClick={() => setCurrentBanner(prev => Math.min(banners.length - 1, prev + 1))}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-70%)', zIndex: 10, background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >›</button>
          )}
          {/* バナー本体 */}
          <div className='banner-slider' style={{ display: 'flex', transition: 'transform 0.4s ease', transform: `translateX(-${currentBanner * 100}%)` }}>
            {/* 最後のバナーを先頭に */}
            {banners.length > 0 && (
              <div style={{ display: 'none' }}>
                <img src={banners[banners.length - 1].image_url} alt="" style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => banner.link_url && (window.location.href = banner.link_url)}
                className='banner-item' style={{ flexShrink: 0, width: '100%', overflow: 'hidden', cursor: banner.link_url ? 'pointer' : 'default' }}
              >
                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
            {/* 最初のバナーを末尾に */}
            {banners.length > 0 && (
              <div style={{ display: 'none' }}>
                <img src={banners[0].image_url} alt="" style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
          </div>
          {/* ドット */}
          {banners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '8px 0 4px' }}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  style={{ width: index === currentBanner ? '16px' : '6px', height: '6px', borderRadius: '999px', background: index === currentBanner ? '#f97316' : '#ddd', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* カテゴリータブ */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: '60px', zIndex: 40 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: activeCategory === cat.value ? '#f97316' : '#666', borderBottom: activeCategory === cat.value ? '3px solid #f97316' : '3px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* 絞り込みドロップダウン */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '8px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>🔥 {filteredEvents.length}件開催中！</span>
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            style={{ padding: '6px 32px 6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            <option value="">おすすめ順</option>
            <option value="high_point">コインが高い順</option>
            <option value="low_point">コインが低い順</option>
            <option value="new">公開が新しい順</option>
            <option value="old">公開が古い順</option>
            <option value="remaining_high">残り割合が多い順</option>
            <option value="remaining_low">残り割合が少ない順</option>
          </select>
        </div>
      </div>

      {/* オリパ一覧 */}
      <div className="oripa-list-wrap" style={{ padding: '10px 8px 80px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <img src="/characters/arukun-greeting.png" alt="あーるくん" style={{ width: '180px', height: 'auto', marginBottom: '12px', mixBlendMode: 'multiply' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>現在開催中のオリパはありません</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>近日公開予定！お楽しみに！</div>
          </div>
        ) : (
          <div className='oripa-grid'>
            {filteredEvents.map((event) => {
              const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)
              const isSoldOut = event.remaining_count <= 0
              const sortedOptions = event.gacha_options ? [...event.gacha_options].sort((a, b) => a.sort_order - b.sort_order) : []
              const regularOpts = sortedOptions.filter(opt => opt.count < 1000)
              const bigOpts = sortedOptions.filter(opt => opt.count >= 1000)
              return (
                <div key={event.id} className="oripa-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  {/* バナー画像 */}
                  <a href={'/event/' + event.id} className="oripa-card-image" style={{ display: 'block', position: 'relative', paddingBottom: '65.6%', background: '#f0f0f0', overflow: 'hidden', textDecoration: 'none' }}>
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.15 }}>🎴</div>
                    )}
                    {/* 最低保証率バッジ（スマホのみ） */}
                    {event.min_guarantee_rate != null && (
                      <div className="dopa-guarantee-badge" style={{ position: 'absolute', top: '8px', left: '8px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.35)', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                        最低保証率 {event.min_guarantee_rate}%
                      </div>
                    )}
                    {isSoldOut && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', border: '2px solid white', padding: '4px 16px' }}>SOLD OUT</span>
                      </div>
                    )}
                  </a>

                  {/* 情報エリア */}
                  <div className="oripa-card-info" style={{ padding: '8px 10px 10px' }}>
                    {/* オリパ名 */}
                    <div className="oripa-card-title" style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {event.name}
                    </div>
                    {/* コイン・残り口数 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" className="oripa-card-price-icon" style={{ width: "20px", height: "20px", objectFit: "contain", flexShrink: 0, background: '#fef3c7', borderRadius: '50%', padding: '2px' }} />
                        <span className="oripa-card-price-val" style={{ fontSize: '16px', fontWeight: '900', color: '#f97316' }}>{event.price.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>/1回</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        残り<span style={{ fontWeight: '700', color: '#333' }}>{event.remaining_count.toLocaleString()}</span>/{event.total_count.toLocaleString()}
                      </div>
                    </div>

                    {/* 残り口数バー */}
                    <div style={{ background: '#eee', borderRadius: '999px', height: '5px', marginBottom: '8px' }}>
                      <div style={{ background: remainingPercent > 50 ? '#4caf50' : remainingPercent > 20 ? '#ff9800' : '#f44336', borderRadius: '999px', height: '6px', width: remainingPercent + '%' }} />
                    </div>

                    {/* ガチャボタン */}
                    {isSoldOut ? (
                      <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', borderRadius: '6px', color: '#999', fontSize: '13px', fontWeight: '700' }}>売り切れ</div>
                    ) : (
                      <>
                        {/* スマホ専用: DOPAスタイルボタン */}
                        <div className="dopa-btns-area-mobile">
                          {sortedOptions.length > 0 ? (
                            <>
                              {regularOpts.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', marginBottom: bigOpts.length > 0 ? '6px' : '0' }}>
                                  {regularOpts.map((opt, i) => {
                                    const isHighlight = regularOpts.length === 1 || i === 1
                                    return (
                                      <button
                                        key={opt.id}
                                        onClick={() => openConfirm(event, opt)}
                                        style={{ flex: 1, padding: '10px 2px', fontSize: regularOpts.length > 2 ? '11px' : '12px', fontWeight: '800', background: isHighlight ? '#f97316' : 'white', color: isHighlight ? 'white' : '#1a1a1a', border: isHighlight ? 'none' : '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', lineHeight: 1.3 }}
                                      >
                                        {opt.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                              {bigOpts.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => openConfirm(event, opt)}
                                  style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: '800', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </>
                          ) : (
                            <button
                              onClick={() => openConfirm(event, { count: 1, label: '1回ガチャ' })}
                              style={{ width: '100%', padding: '11px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              1回ガチャ
                            </button>
                          )}
                        </div>
                        {/* PC専用: ガチャボタン */}
                        <div className="gacha-btns-pc" style={{ gap: '6px' }}>
                          {sortedOptions.length > 0 ? (
                            sortedOptions.map((opt) => (
                              <button key={opt.id} className="gacha-card-btn" onClick={() => openConfirm(event, opt)} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '13px 0', background: opt.color, color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>🎰 {opt.label}</button>
                            ))
                          ) : (
                            <button className="gacha-card-btn" onClick={() => openConfirm(event, { count: 1, label: '1回ガチャ' })} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '13px 0', background: '#f97316', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>🎰 1回ガチャ</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    {/* 確認ポップアップ（ボトムシート） */}
      {showConfirm && confirmOption && confirmEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
            {/* バナー画像 */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '40%', overflow: 'hidden', background: '#1f2937' }}>
              {confirmEvent.image_url
                ? <img src={confirmEvent.image_url} alt={confirmEvent.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🎴</div>
              }
            </div>
            <div style={{ padding: '20px 20px 32px' }}>
              <p style={{ fontSize: '15px', color: '#374151', textAlign: 'center', marginBottom: '16px' }}>
                コインを消費して、<span style={{ fontWeight: '900', color: '#f97316' }}>{confirmOption.count}回</span>ガチャを引きますか？
              </p>
              {/* コイン表示 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: '#f9fafb', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '22px', height: '22px', objectFit: 'contain', background: '#fef3c7', borderRadius: '50%', padding: '2px' }} />
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{userPoints.toLocaleString()}</span>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '20px' }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '22px', height: '22px', objectFit: 'contain', background: '#fef3c7', borderRadius: '50%', padding: '2px' }} />
                  <span style={{ fontSize: '20px', fontWeight: '700', color: (userPoints - confirmEvent.price * confirmOption.count) < 0 ? '#ef4444' : '#1f2937' }}>{(userPoints - confirmEvent.price * confirmOption.count).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handleGacha} disabled={pulling} style={{ width: '100%', padding: '18px', background: pulling ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px', boxShadow: pulling ? 'none' : '0 4px 14px rgba(249,115,22,0.4)', transition: 'transform 0.1s', transform: pulling ? 'none' : undefined }}>
                {pulling ? '処理中...' : '🎰 ガチャを引く！'}
              </button>
              <button onClick={() => setShowConfirm(false)} style={{ width: '100%', padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 動画再生 */}
      {showVideo && videoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <video src={videoUrl} autoPlay playsInline onEnded={() => { setShowVideo(false); window.location.href = '/gacha-result?draw_ids=' + pendingDrawIds.join(',') + '&event_id=' + (confirmEvent?.id || '') }} style={{ maxWidth: '100%', maxHeight: '100%' }} />
          <button onClick={() => { setShowVideo(false); window.location.href = '/gacha-result?draw_ids=' + pendingDrawIds.join(',') }} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>スキップ</button>
        </div>
      )}
    </div>
  )
}