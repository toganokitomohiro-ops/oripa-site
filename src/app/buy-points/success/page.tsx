'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function BuyPointsSuccessPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('points').eq('id', session.user.id).single()
        if (data) setPoints(data.points || 0)
      }
      setLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>ポイント付与中...</h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>しばらくお待ちください</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>購入完了！</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>ポイントが付与されました！</p>
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>現在の保有ポイント</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#f5c518' }}>{points.toLocaleString()} PT</div>
            </div>
            <a href="/" style={{ display: 'block', padding: '14px', background: '#e67e00', color: 'white', borderRadius: '10px', fontSize: '16px', fontWeight: '900', textDecoration: 'none', marginBottom: '10px', boxShadow: '0 4px 12px rgba(230,126,0,0.3)' }}>
              ガチャを引く！
            </a>
            <a href="/buy-points" style={{ display: 'block', padding: '14px', background: '#f3f4f6', color: '#374151', borderRadius: '10px', fontSize: '14px', textDecoration: 'none' }}>
              ポイントをもっと購入する
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function BuyPointsSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#999' }}>読み込み中...</div></div>}>
      <BuyPointsSuccessPageInner />
    </Suspense>
  )
}