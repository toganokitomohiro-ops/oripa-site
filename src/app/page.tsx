'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  gacha_options?: { id: string; label: string; color: string; count: number; sort_order: number }[]
}

type Banner = {
  id: string
  image_url: string
  link_url: string
  title: string
}

export default function Home() {
  const pathname = usePathname()
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
      if (!res.ok) { alert(data.error || 'エラー'); setPulling(false); return }
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
    } catch { alert('通信エラー') }
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', color: '#333', paddingBottom: '70px' }}>

      {/* ヘッダー */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #ea580c 100%)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 16px rgba(30,58,138,0.4)' }}>
        {/* アクセントライン */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #3b82f6, #f97316, #fb923c, #3b82f6)', backgroundSize: '200% 100%' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/logo.png" alt="fitオリパ" style={{ height: '56px', width: 'auto', objectFit: 'contain', mixBlendMode: 'screen' }} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(249,115,22,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.9"/><text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#ea580c">P</text></svg>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>{points.toLocaleString()}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>+</span>
                </a>
                <a href="/notices" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: '50%', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="white"/></svg>
                </a>
                <a href="/mypage" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: '50%', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/></svg>
                </a>
              </>
            ) : (
              <>
                <a href="/auth/login" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', fontWeight: '600' }}>ログイン</a>
                <a href="/auth/register" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: '700', padding: '6px 14px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '6px', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}>新規登録</a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* バナースライダー */}
      {banners.length > 0 && (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
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
          <div style={{ display: 'flex', transition: 'transform 0.4s ease', transform: `translateX(calc(-${currentBanner} * 52% - 28%))`, gap: '8px', padding: '4px 0' }}>
            {/* 最後のバナーを先頭に */}
            {banners.length > 0 && (
              <div style={{ flexShrink: 0, width: '52%', borderRadius: '8px', overflow: 'hidden', opacity: 0.7, transform: 'scale(0.95)' }}>
                <img src={banners[banners.length - 1].image_url} alt="" style={{ width: '100%', aspectRatio: '1050/318', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => banner.link_url && (window.location.href = banner.link_url)}
                style={{ flexShrink: 0, width: '52%', borderRadius: '8px', overflow: 'hidden', cursor: banner.link_url ? 'pointer' : 'default', transition: 'transform 0.4s, opacity 0.4s', transform: index === currentBanner ? 'scale(1)' : 'scale(0.95)', opacity: index === currentBanner ? 1 : 0.7 }}
              >
                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', aspectRatio: '1050/318', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
            {/* 最初のバナーを末尾に */}
            {banners.length > 0 && (
              <div style={{ flexShrink: 0, width: '52%', borderRadius: '8px', overflow: 'hidden', opacity: 0.7, transform: 'scale(0.95)' }}>
                <img src={banners[0].image_url} alt="" style={{ width: '100%', aspectRatio: '1050/318', objectFit: 'cover', display: 'block' }} />
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
                  style={{ width: index === currentBanner ? '16px' : '6px', height: '6px', borderRadius: '999px', background: index === currentBanner ? '#e67e00' : '#ddd', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* カテゴリータブ */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: '56px', zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: activeCategory === cat.value ? '#e67e00' : '#666', borderBottom: activeCategory === cat.value ? '3px solid #e67e00' : '3px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* 絞り込みボタン */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 16px 10px', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'recommended', label: 'おすすめ順 ↕' },
            { key: 'high_point', label: 'ポイントが高い順' },
            { key: 'low_point', label: 'ポイントが低い順' },
            { key: 'new', label: '公開が新しい順' },
            { key: 'old', label: '公開が古い順' },
            { key: 'remaining_high', label: '残り割合が多い順' },
            { key: 'remaining_low', label: '残り割合が少ない順' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSortFilter(sortFilter === f.key ? '' : f.key)}
              style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid', borderColor: sortFilter === f.key ? '#e67e00' : '#e5e7eb', background: sortFilter === f.key ? '#e67e00' : 'white', color: sortFilter === f.key ? 'white' : '#374151', fontSize: '12px', fontWeight: sortFilter === f.key ? 'bold' : 'normal', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* オリパ一覧 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '8px' }}>
            <div style={{ color: '#999', fontSize: '15px' }}>現在開催中のオリパはありません</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredEvents.map((event) => {
              const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)
              const isSoldOut = event.remaining_count <= 0
              const sortedOptions = event.gacha_options ? [...event.gacha_options].sort((a, b) => a.sort_order - b.sort_order) : []
              return (
                <div key={event.id} style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {/* バナー画像 */}
                  <a href={'/event/' + event.id} style={{ display: 'block', position: 'relative', paddingBottom: '65.6%', background: '#f0f0f0', overflow: 'hidden', textDecoration: 'none' }}>
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.15 }}>🎴</div>
                    )}
                    {isSoldOut && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', border: '2px solid white', padding: '4px 16px' }}>SOLD OUT</span>
                      </div>
                    )}
                  </a>

                  {/* 情報エリア */}
                  <div style={{ padding: '10px 12px' }}>
                    {/* コイン・残り口数 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '18px', height: '18px', background: '#f5c518', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', color: '#333', flexShrink: 0 }}>P</div>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#e67e00' }}>{event.price.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>/1回</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        残り<span style={{ fontWeight: '700', color: '#333' }}>{event.remaining_count.toLocaleString()}</span>/{event.total_count.toLocaleString()}
                      </div>
                    </div>

                    {/* 残り口数バー */}
                    <div style={{ background: '#eee', borderRadius: '999px', height: '6px', marginBottom: '10px' }}>
                      <div style={{ background: remainingPercent > 50 ? '#4caf50' : remainingPercent > 20 ? '#ff9800' : '#f44336', borderRadius: '999px', height: '6px', width: remainingPercent + '%' }} />
                    </div>

                    {/* ガチャボタン */}
                    {isSoldOut ? (
                      <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', borderRadius: '6px', color: '#999', fontSize: '13px', fontWeight: '700' }}>売り切れ</div>
                    ) : sortedOptions.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {sortedOptions.map((opt) => (
                          <button key={opt.id} onClick={() => openConfirm(event, opt)} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: opt.color, color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>{opt.label}</button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openConfirm(event, { count: 1, label: '1回ガチャ' })} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: '#e67e00', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>1回ガチャ</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* あるぷー走り回る */}
      <style>{`
        @keyframes arupu-run {
          0% { left: -100px; transform: scaleX(1); }
          49% { left: calc(100% + 100px); transform: scaleX(1); }
          50% { left: calc(100% + 100px); transform: scaleX(-1); }
          99% { left: -100px; transform: scaleX(-1); }
          100% { left: -100px; transform: scaleX(1); }
        }
        @keyframes arupu-bounce {
          0%, 100% { bottom: 70px; }
          50% { bottom: 80px; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '70px',
        left: '-100px',
        zIndex: 45,
        animation: 'arupu-run 8s linear infinite, arupu-bounce 0.4s ease-in-out infinite',
        pointerEvents: 'none',
      }}>
        <img
          src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/arupu-run.png"
          alt="あるぷー"
          style={{ width: '60px', height: 'auto' }}
        />
      </div>
      {/* ボトムナビ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)', borderTop: '2px solid transparent', zIndex: 50, boxShadow: '0 -4px 20px rgba(30,58,138,0.5)', backgroundClip: 'padding-box' }}>
        {/* トップアクセントライン */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #3b82f6, #f97316, #3b82f6)', position: 'absolute', top: 0, left: 0, right: 0 }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '60px' }}>
          {[
            {
              href: '/',
              label: 'オリパ',
              icon: (active: boolean) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="11" height="16" rx="2" fill={active ? '#f97316' : 'rgba(255,255,255,0.3)'} stroke={active ? '#fb923c' : 'rgba(255,255,255,0.15)'} strokeWidth="1"/>
                  <rect x="6" y="2" width="11" height="16" rx="2" fill={active ? '#ea580c' : 'rgba(255,255,255,0.2)'} stroke={active ? '#f97316' : 'rgba(255,255,255,0.1)'} strokeWidth="1"/>
                  <rect x="9" y="4" width="11" height="16" rx="2" fill={active ? '#f97316' : 'rgba(255,255,255,0.5)'} stroke={active ? '#fb923c' : 'rgba(255,255,255,0.3)'} strokeWidth="1.2"/>
                  <circle cx="14.5" cy="12" r="2.5" fill={active ? 'white' : 'rgba(30,58,138,0.6)'}/>
                </svg>
              ),
            },
            {
              href: '/prizes',
              label: '獲得商品',
              icon: (active: boolean) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={active ? '#f97316' : 'rgba(255,255,255,0.4)'} stroke={active ? '#fb923c' : 'none'} strokeWidth="0.5"/>
                </svg>
              ),
            },
            {
              href: '/history',
              label: '当選履歴',
              icon: (active: boolean) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke={active ? '#f97316' : 'rgba(255,255,255,0.4)'} strokeWidth="2" fill="none"/>
                  <path d="M12 7V12L15.5 15.5" stroke={active ? '#f97316' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            },
            {
              href: '/fp-exchange',
              label: 'FP交換',
              icon: (active: boolean) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" fill={active ? '#f97316' : 'rgba(255,255,255,0.3)'} stroke={active ? '#fb923c' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5"/>
                  <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={active ? 'white' : 'rgba(30,58,138,0.8)'}>FP</text>
                </svg>
              ),
            },
            {
              href: '/mypage',
              label: 'マイページ',
              icon: (active: boolean) => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill={active ? '#f97316' : 'rgba(255,255,255,0.4)'} stroke={active ? '#fb923c' : 'none'} strokeWidth="0.5"/>
                  <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={active ? '#f97316' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              ),
            },
          ].map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.label}
                href={item.href}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: '3px', position: 'relative', transition: 'all 0.2s' }}
              >
                {/* アクティブインジケーター */}
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px', background: 'linear-gradient(90deg, #f97316, #fb923c)', borderRadius: '0 0 3px 3px' }} />
                )}
                {/* アクティブ背景 */}
                {isActive && (
                  <div style={{ position: 'absolute', inset: '6px 8px', background: 'rgba(249,115,22,0.15)', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.3)' }} />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {item.icon(isActive)}
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: isActive ? '#fb923c' : 'rgba(255,255,255,0.5)', letterSpacing: '0.3px', position: 'relative', zIndex: 1 }}>{item.label}</span>
              </a>
            )
          })}
        </div>
      </nav>
    {/* 確認ポップアップ */}
      {showConfirm && confirmOption && confirmEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', maxWidth: '400px', width: '100%' }}>
            <div style={{ width: '100%', height: '200px', background: '#1f2937', overflow: 'hidden' }}>
              {confirmEvent.image_url
                ? <img src={confirmEvent.image_url} alt={confirmEvent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>🎴</div>
              }
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '16px', color: '#374151', textAlign: 'center', marginBottom: '16px' }}>
                コインを消費して、<span style={{ fontWeight: 'bold', color: '#e67e00' }}>{confirmOption.count}回</span>ガチャを引きますか？
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f9fafb', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'24px', height:'24px', borderRadius:'50%', background:'linear-gradient(135deg,#f5c518,#e67e00)', color:'white', fontSize:'12px', fontWeight:'900', flexShrink:0 }}>C</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{userPoints.toLocaleString()}</span>
                </div>
                <span style={{ fontSize: '18px', color: '#9ca3af' }}>›</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'24px', height:'24px', borderRadius:'50%', background:'linear-gradient(135deg,#f5c518,#e67e00)', color:'white', fontSize:'12px', fontWeight:'900', flexShrink:0 }}>C</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: (userPoints - confirmEvent.price * confirmOption.count) < 0 ? '#ef4444' : '#1f2937' }}>{(userPoints - confirmEvent.price * confirmOption.count).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={handleGacha} disabled={pulling} style={{ width: '100%', padding: '14px', background: '#f59e0b', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px' }}>
                {pulling ? '処理中...' : 'ガチャを引く'}
              </button>
              <button onClick={() => setShowConfirm(false)} style={{ width: '100%', padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一時的な管理画面リンク */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <a href="/admin" style={{ background: '#1f2937', color: 'white', padding: '10px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>⚙️ 管理画面</a>
      </div>
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