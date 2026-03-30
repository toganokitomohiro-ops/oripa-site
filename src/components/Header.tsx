'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [points, setPoints] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points').eq('id', session.user.id).single().then(({ data }) => {
          if (data) setPoints(data.points)
        })
      }
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('points').eq('id', session.user.id).single().then(({ data }) => {
          if (data) setPoints(data.points)
        })
      } else {
        setUser(null)
        setPoints(0)
      }
    })
  }, [])

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img
            src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-4941278f-6db2-42b2-aeb8-0a3928705de1.png"
            alt="fitオリパ"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
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
  )
}
