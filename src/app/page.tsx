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
    <div className="has-bottom-nav" style={{ minHeight: '100vh', background: '#0f1117', color: '#f0f4f8', paddingBottom: '70px' }}>
      <Header />

      {/* ============================================================
          HERO SECTION
      ============================================================ */}
      <div className="hero-section" style={{ padding: '28px 16px 32px', position: 'relative' }}>
        {/* Decorative blurred circles */}
        <div style={{ position: 'absolute', top: '-40px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(6,182,212,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-40px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(249,115,22,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', zIndex: 1 }}>
          {/* Text Side */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: '999px', padding: '4px 12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '10px', color: '#06b6d4', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>🔥 限定オリパ開催中</span>
            </div>

            {/* Main headline */}
            <h1 className="hero-title" style={{ fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: '900', lineHeight: 1.15, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              <span className="text-gradient-cyan">今すぐ開封！</span>
              <br />
              <span style={{ color: '#f0f4f8', fontSize: '75%' }}>限定カード獲得チャンス</span>
            </h1>

            {/* Sub copy */}
            <p style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
              フィットネス × カード開封の新体験。<br />
              <span style={{ color: '#f97316', fontWeight: '700' }}>S賞・A賞</span>を狙って引き放題！
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="#oripa-list"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '12px 24px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white', fontWeight: '800', fontSize: '15px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(249,115,22,0.45)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(249,115,22,0.6)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 18px rgba(249,115,22,0.45)' }}
              >
                🎰 オリパを引く
              </a>
              {!user && (
                <a
                  href="/auth/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '12px 20px', borderRadius: '10px',
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.4)',
                    color: '#06b6d4', fontWeight: '700', fontSize: '14px',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(6,182,212,0.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(6,182,212,0.12)'}
                >
                  ✨ 無料登録
                </a>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
              {[
                { label: '開催中', value: `${events.length}種`, icon: '🎴' },
                { label: '会員数', value: '3,200+', icon: '👥' },
                { label: '排出実績', value: '15,000+', icon: '🏆' },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{stat.icon}</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#f0f4f8', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Character — Alpoo */}
          <div className="alpoo-float" style={{ flexShrink: 0, width: 'clamp(100px, 22vw, 200px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              {/* Glow ring behind character */}
              <div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)', filter: 'blur(8px)' }} />
              <img
                src="/characters/alpoo-happy.png"
                alt="あるぷー"
                style={{
                  width: '100%',
                  height: 'auto',
                  position: 'relative',
                  zIndex: 1,
                  mixBlendMode: 'normal',
                  filter: 'drop-shadow(0 4px 20px rgba(6,182,212,0.4))',
                }}
              />
            </div>
            <div style={{
              marginTop: '8px', fontSize: '11px', fontWeight: '700', color: '#06b6d4',
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: '999px', padding: '3px 10px', whiteSpace: 'nowrap',
            }}>
              あるぷー
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BANNER SLIDER
      ============================================================ */}
      {banners.length > 0 && (
        <div className="banner-outer" style={{ position: 'relative', marginTop: '8px' }}>
          {currentBanner > 0 && (
            <button
              onClick={() => setCurrentBanner(prev => Math.max(0, prev - 1))}
              style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-70%)', zIndex: 10, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
          )}
          {currentBanner < banners.length - 1 && (
            <button
              onClick={() => setCurrentBanner(prev => Math.min(banners.length - 1, prev + 1))}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-70%)', zIndex: 10, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >›</button>
          )}
          <div className="banner-slider" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
            {banners.length > 0 && (
              <div style={{ display: 'none' }}>
                <img src={banners[banners.length - 1].image_url} alt="" style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => banner.link_url && (window.location.href = banner.link_url)}
                className="banner-item"
                style={{ flexShrink: 0, width: '100%', overflow: 'hidden', cursor: banner.link_url ? 'pointer' : 'default' }}
              >
                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
            {banners.length > 0 && (
              <div style={{ display: 'none' }}>
                <img src={banners[0].image_url} alt="" style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
          </div>
          {banners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '8px 0 4px' }}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  style={{ width: index === currentBanner ? '16px' : '6px', height: '6px', borderRadius: '999px', background: index === currentBanner ? '#06b6d4' : '#2a3040', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          CATEGORY TABS + SORT
      ============================================================ */}
      <div id="oripa-list" style={{ background: '#151921', borderBottom: '1px solid #1e2736', position: 'sticky', top: '60px', zIndex: 40 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{
                padding: '14px 20px', fontSize: '14px', fontWeight: '700',
                border: 'none', background: 'none', cursor: 'pointer',
                color: activeCategory === cat.value ? '#06b6d4' : '#64748b',
                borderBottom: activeCategory === cat.value ? '3px solid #06b6d4' : '3px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Filter row */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '8px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#f97316', fontWeight: '700' }}>🔥 {filteredEvents.length}件開催中！</span>
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            style={{ padding: '6px 32px 6px 10px', borderRadius: '6px', border: '1px solid #2a3040', background: '#1a1f2e', color: '#f0f4f8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
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

      {/* ============================================================
          ORIPA GRID
      ============================================================ */}
      <div className="oripa-list-wrap" style={{ padding: '12px 8px 80px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#1a1f2e', borderRadius: '16px', border: '1px solid #2a3040' }}>
            <img src="/characters/arukun-greeting.png" alt="あーるくん" style={{ width: '180px', height: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 4px 16px rgba(6,182,212,0.25))' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#f0f4f8', marginBottom: '4px' }}>現在開催中のオリパはありません</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>近日公開予定！お楽しみに！</div>
          </div>
        ) : (
          <div className="oripa-grid">
            {filteredEvents.map((event) => {
              const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)
              const isSoldOut = event.remaining_count <= 0
              const sortedOptions = event.gacha_options ? [...event.gacha_options].sort((a, b) => a.sort_order - b.sort_order) : []
              return (
                <div
                  key={event.id}
                  className="oripa-card"
                  style={{
                    background: '#1a1f2e',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid #2a3040',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    position: 'relative',
                  }}
                >
                  {/* ✨ Sparkle badge (appears on hover) */}
                  <div
                    className="sparkle-badge"
                    style={{
                      position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                      background: 'linear-gradient(135deg, #f5c518, #f97316)',
                      borderRadius: '999px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: '800', color: 'white',
                      boxShadow: '0 2px 8px rgba(245,197,24,0.5)',
                    }}
                  >
                    ✨ HOT
                  </div>

                  {/* Thumbnail */}
                  <a href={'/event/' + event.id} style={{ display: 'block', position: 'relative', paddingBottom: '65.6%', background: '#0d1520', overflow: 'hidden', textDecoration: 'none' }}>
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.2 }}>🎴</div>
                    )}
                    {isSoldOut && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', border: '2px solid rgba(255,255,255,0.7)', padding: '4px 16px', borderRadius: '4px', letterSpacing: '0.1em' }}>SOLD OUT</span>
                      </div>
                    )}
                    {/* Light sheen overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
                  </a>

                  {/* Info */}
                  <div style={{ padding: '10px 10px 12px' }}>
                    {/* Name */}
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', marginBottom: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {event.name}
                    </div>

                    {/* Price + Remaining */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img
                          src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png"
                          style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0, background: '#1f2937', borderRadius: '50%', padding: '2px' }}
                          alt="coin"
                        />
                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#f97316' }}>{event.price.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>/1回</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        残り<span style={{ fontWeight: '700', color: '#94a3b8' }}>{event.remaining_count.toLocaleString()}</span>/{event.total_count.toLocaleString()}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: '#0d1520', borderRadius: '999px', height: '5px', marginBottom: '10px' }}>
                      <div style={{
                        background: remainingPercent > 50 ? '#22c55e' : remainingPercent > 20 ? '#f97316' : '#ef4444',
                        borderRadius: '999px', height: '5px', width: remainingPercent + '%',
                        boxShadow: remainingPercent > 50 ? '0 0 6px rgba(34,197,94,0.6)' : remainingPercent > 20 ? '0 0 6px rgba(249,115,22,0.6)' : '0 0 6px rgba(239,68,68,0.6)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>

                    {/* Gacha Buttons */}
                    {isSoldOut ? (
                      <div style={{ textAlign: 'center', padding: '10px', background: '#0d1520', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '700' }}>売り切れ</div>
                    ) : sortedOptions.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {sortedOptions.map((opt) => (
                          <button
                            key={opt.id}
                            className="gacha-card-btn"
                            onClick={() => openConfirm(event, opt)}
                            style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: opt.color, color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                          >🎰 {opt.label}</button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="gacha-card-btn"
                          onClick={() => openConfirm(event, { count: 1, label: '1回ガチャ' })}
                          style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}
                        >🎰 1回ガチャ</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {/* ============================================================
          CONFIRM BOTTOM SHEET
      ============================================================ */}
      {showConfirm && confirmOption && confirmEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1a1f2e', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px', overflow: 'hidden', border: '1px solid #2a3040' }}>
            {/* Banner */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '40%', overflow: 'hidden', background: '#0d1520' }}>
              {confirmEvent.image_url
                ? <img src={confirmEvent.image_url} alt={confirmEvent.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🎴</div>
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1a1f2e 0%, transparent 60%)', pointerEvents: 'none' }} />
            </div>

            <div style={{ padding: '20px 20px 32px' }}>
              <p style={{ fontSize: '15px', color: '#94a3b8', textAlign: 'center', marginBottom: '16px' }}>
                コインを消費して、<span style={{ fontWeight: '900', color: '#f97316' }}>{confirmOption.count}回</span>ガチャを引きますか？
              </p>

              {/* Coin display */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: '#0f1117', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #2a3040' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '50%', padding: '2px' }} alt="coin" />
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{userPoints.toLocaleString()}</span>
                </div>
                <span style={{ color: '#475569', fontSize: '20px' }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '50%', padding: '2px' }} alt="coin" />
                  <span style={{ fontSize: '20px', fontWeight: '700', color: (userPoints - confirmEvent.price * confirmOption.count) < 0 ? '#ef4444' : '#f0f4f8' }}>
                    {(userPoints - confirmEvent.price * confirmOption.count).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGacha}
                disabled={pulling}
                style={{ width: '100%', padding: '18px', background: pulling ? '#374151' : 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: pulling ? 'not-allowed' : 'pointer', marginBottom: '10px', boxShadow: pulling ? 'none' : '0 4px 18px rgba(249,115,22,0.5)', transition: 'transform 0.1s' }}
              >
                {pulling ? '処理中...' : '🎰 ガチャを引く！'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ width: '100%', padding: '14px', background: 'transparent', color: '#64748b', border: '1px solid #2a3040', borderRadius: '12px', fontSize: '15px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIDEO PLAYER
      ============================================================ */}
      {showVideo && videoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <video
            src={videoUrl}
            autoPlay
            playsInline
            onEnded={() => { setShowVideo(false); window.location.href = '/gacha-result?draw_ids=' + pendingDrawIds.join(',') + '&event_id=' + (confirmEvent?.id || '') }}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <button
            onClick={() => { setShowVideo(false); window.location.href = '/gacha-result?draw_ids=' + pendingDrawIds.join(',') }}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '999px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}
          >スキップ</button>
        </div>
      )}
    </div>
  )
}
