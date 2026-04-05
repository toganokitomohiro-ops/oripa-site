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
    <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img
            src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-4941278f-6db2-42b2-aeb8-0a3928705de1.png"
            alt="fitオリパ"
            style={{ height: '76px', width: 'auto', objectFit: 'contain' }}
          />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              {/* FPコイン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '6px 10px', borderRadius: '20px' }}>
                <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-1bac3859-a4d0-4504-8497-3ef4cef6a13f.png" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a' }}>{fpPoints.toLocaleString()}</span>
              </div>
              {/* 肉球コイン＋購入ボタン */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '6px 10px', borderRadius: '20px 0 0 20px' }}>
                  <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a' }}>{points.toLocaleString()}</span>
                </div>
                <a href="/buy-points" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '34px', background: '#f97316', borderRadius: '0 20px 20px 0', textDecoration: 'none', color: 'white', fontSize: '18px', fontWeight: '900' }}>+</a>
              </div>
              <a href="/notices" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '50%', textDecoration: 'none', fontSize: '18px' }}>🔔</a>
              <a href="/mypage" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '50%', textDecoration: 'none', fontSize: '18px' }}>👤</a>
            </>
          ) : (
            <>
              <a href="/auth/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'none', padding: '6px 14px', border: '1px solid #ddd', borderRadius: '4px' }}>ログイン</a>
              <a href="/auth/register" style={{ fontSize: '13px', color: 'white', textDecoration: 'none', fontWeight: '700', padding: '6px 14px', background: '#f97316', borderRadius: '4px' }}>新規登録</a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
