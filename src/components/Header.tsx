'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [points, setPoints] = useState(0)
  const [fpPoints, setFpPoints] = useState(0)
  const [user, setUser] = useState<any>(null)

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

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 12px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-4941278f-6db2-42b2-aeb8-0a3928705de1.png"
            alt="fitオリパ"
            style={{ height: '52px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }}
          />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {user ? (
            <>
              {/* FPコイン：グリーン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>👟</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>{fpPoints.toLocaleString()}</span>
              </div>
              {/* 肉球コイン＋購入ボタン：背景なし・画像大きく・白透過 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <img
                  src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                  alt="コイン"
                />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a' }}>{points.toLocaleString()}</span>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: '#f97316', borderRadius: '50%', textDecoration: 'none', color: 'white', fontSize: '14px', fontWeight: '900', marginLeft: '2px' }}>+</a>
              </div>
              {/* ベル：背景なし */}
              <a href="/notices" style={{ textDecoration: 'none', fontSize: '22px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>🔔</a>
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
