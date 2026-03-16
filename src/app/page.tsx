'use client'

import { useEffect, useState } from 'react'
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
  gacha_options?: { id: string; label: string; color: string; count: number; sort_order: number }[]
}

type Banner = {
  id: string
  image_url: string
  link_url: string
  title: string
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchEvents()
    fetchBanners()
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
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
      .select('*, gacha_options(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
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

  const filteredEvents = activeCategory === 'all'
    ? events
    : events.filter((e) => e.category === activeCategory)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', color: '#333', paddingBottom: '70px' }}>

      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none', letterSpacing: '1px' }}>
            ORIPA🃏
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5c518', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#1a1a1a' }}>{points.toLocaleString()}</span>
                  <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: '700' }}>PT+</span>
                </a>
                <a href="/notices" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '50%', textDecoration: 'none', fontSize: '18px' }}>🔔</a>
                <a href="/mypage" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '50%', textDecoration: 'none', fontSize: '18px' }}>👤</a>
              </>
            ) : (
              <>
                <a href="/auth/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'none', padding: '6px 14px', border: '1px solid #ddd', borderRadius: '4px' }}>ログイン</a>
                <a href="/auth/register" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: '700', padding: '6px 14px', background: '#e67e00', borderRadius: '4px' }}>新規登録</a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* バナースライダー */}
      {banners.length > 0 && (
        <div style={{ background: '#f5f5f5', padding: '8px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '8px', padding: '0 8px', scrollbarWidth: 'none' }}>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                style={{ flexShrink: 0, width: 'calc(50% - 4px)', scrollSnapAlign: 'start', cursor: banner.link_url ? 'pointer' : 'default', borderRadius: '8px', overflow: 'hidden' }}
                onClick={() => banner.link_url && (window.location.href = banner.link_url)}
              >
                <img src={banner.image_url} alt={banner.title} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
              {banners.map((_, index) => (
                <button key={index} onClick={() => setCurrentBanner(index)} style={{ width: index === currentBanner ? '16px' : '6px', height: '6px', borderRadius: '999px', background: index === currentBanner ? '#e67e00' : '#ddd', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* カテゴリータブ */}
      <div style={{ background: 'white', borderBottom: '2px solid #f0f0f0', position: 'sticky', top: '56px', zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{ padding: '14px 24px', fontSize: '14px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: activeCategory === cat.value ? '#e67e00' : '#666', borderBottom: activeCategory === cat.value ? '3px solid #e67e00' : '3px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            >
              {cat.label}
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
                  <a href={'/event/' + event.id} style={{ display: 'block', position: 'relative', paddingBottom: '56%', background: '#f0f0f0', overflow: 'hidden', textDecoration: 'none' }}>
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
                          <a key={opt.id} href={user ? '/gacha/' + event.id + '?count=' + opt.count : '/auth/login'} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: opt.color, color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '900', textDecoration: 'none' }}>{opt.label}</a>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={user ? '/gacha/' + event.id : '/auth/login'} style={{ flex: 1, display: 'block', textAlign: 'center', padding: '11px 0', background: '#e67e00', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '900', textDecoration: 'none' }}>1回ガチャ</a>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ボトムナビ（オリパワン風） */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #e0e0e0', zIndex: 50, boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '56px' }}>
          {[
            { href: '/', icon: '🎴', label: 'オリパガチャ' },
            { href: '/mypage', icon: '🏆', label: '獲得商品' },
            { href: '/mypage', icon: '🕐', label: '当選履歴' },
            { href: '/mypage', icon: '📢', label: '当選報告' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((item) => (
            <a key={item.label} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#888', gap: '2px' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}