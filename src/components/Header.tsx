'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [points, setPoints] = useState(0)
  const [fpPoints, setFpPoints] = useState(0)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points, fp_points').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setPoints(data.points)
            setFpPoints(data.fp_points || 0)
          }
        })
      }
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points, fp_points').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            setPoints(data.points)
            setFpPoints(data.fp_points || 0)
          }
        })
      } else {
        setUser(null)
        setPoints(0)
      }
    })
  }, [])

  const navLinks = [
    { href: '/', label: 'ホーム' },
    { href: '/prizes', label: '獲得商品' },
    { href: '/fp-exchange', label: 'FP交換' },
    { href: '/history', label: '履歴' },
    { href: '/mypage', label: 'マイページ' },
  ]

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <style>{`
        .header-inner { max-width: 480px; margin: 0 auto; padding: 0 12px; }
        .header-pc-nav { display: none; }
        @media (min-width: 768px) {
          .header-inner { max-width: 1280px; padding: 0 24px; }
          .header-pc-nav { display: flex; align-items: center; gap: 2px; margin-left: 28px; }
          .header-pc-nav a {
            display: inline-flex; align-items: center;
            padding: 6px 14px; border-radius: 6px;
            font-size: 14px; font-weight: 600;
            text-decoration: none; transition: all 0.15s;
            white-space: nowrap;
          }
          .header-pc-nav a:hover { background: #fff7ed; }
        }
      `}</style>
      <div className="header-inner" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 左: ロゴ + PCナビ */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-4941278f-6db2-42b2-aeb8-0a3928705de1.png"
              alt="fitオリパ"
              style={{ height: '52px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
          </a>
          <nav className="header-pc-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: isActive ? '#f97316' : '#374151',
                    fontWeight: isActive ? '700' : '600',
                    borderBottom: isActive ? '2px solid #f97316' : '2px solid transparent',
                    borderRadius: 0,
                    padding: '6px 14px',
                  }}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* 右: コイン・ログイン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {user ? (
            <>
              {/* FPコイン：グリーン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>👟</span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#22c55e', letterSpacing: '-0.5px' }}>{fpPoints.toLocaleString()}</span>
              </div>
              {/* 肉球コイン＋購入ボタン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <img
                  src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                  alt="コイン"
                />
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.5px' }}>{points.toLocaleString()}</span>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: '#f97316', borderRadius: '50%', textDecoration: 'none', color: 'white', fontSize: '14px', fontWeight: '900', marginLeft: '2px' }}>+</a>
              </div>
              {/* ベル */}
              <a href="/notices" style={{ textDecoration: 'none', fontSize: '22px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px' }}>🔔</a>
            </>
          ) : (
            <>
              <a href="/auth/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'none', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>ログイン</a>
              <a href="/auth/register" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: '700', padding: '6px 12px', background: '#f97316', borderRadius: '6px' }}>新規登録</a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
