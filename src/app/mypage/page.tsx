'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  points: number
  fp_points: number
  total_spent: number
  is_admin: boolean
}

type Draw = {
  id: string
  grade: string
  created_at: string
  products: { name: string; image_url: string; market_value: number }
}

export default function MyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      fetchData(session.user.id)
    })
  }, [])

  const fetchData = async (userId: string) => {
    setLoading(true)
    const [p, d] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('draws').select('*, products(name, image_url, market_value)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ])
    if (p.data) setProfile(p.data)
    if (d.data) setDraws(d.data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getRank = (totalSpent: number) => {
    if (totalSpent >= 1000000) return { name: 'PLATINUM', color: '#e2e8f0', gradientFrom: '#e2e8f0', gradientTo: '#cbd5e1', textColor: '#475569', next: null, min: 1000000 }
    if (totalSpent >= 300000) return { name: 'GOLD', color: '#fef3c7', gradientFrom: '#fbbf24', gradientTo: '#f59e0b', textColor: '#7c5000', next: 1000000, min: 300000 }
    if (totalSpent >= 100000) return { name: 'SILVER', color: '#f1f5f9', gradientFrom: '#e2e8f0', gradientTo: '#94a3b8', textColor: '#334155', next: 300000, min: 100000 }
    return { name: 'BRONZE', color: '#fef3c7', gradientFrom: '#fdba74', gradientTo: '#ea580c', textColor: '#7c2d00', next: 100000, min: 0 }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
    </div>
  )

  if (!profile) return null

  const rank = getRank(profile.total_spent || 0)
  const totalCards = draws.length
  const totalValue = draws.reduce((sum, d) => sum + (d.products?.market_value || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '70px' }}>

      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '20px' }}>マイページ</h1>

        {/* プロフィール */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e5e7eb' }}>
          {/* SVG人物アイコン */}
          <div style={{ width: '52px', height: '52px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0, background: '#fef3c7', borderRadius: '50%', padding: '2px' }} />
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#f97316' }}>{profile.points?.toLocaleString()}</span>
              <span style={{ fontSize: '11px', color: '#999' }}>コイン</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '14px', lineHeight: 1 }}>👟</span>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#22c55e' }}>{(profile.fp_points || 0).toLocaleString()}</span>
              <span style={{ fontSize: '11px', color: '#999' }}>FPコイン</span>
            </div>
          </div>
          <a href="/buy-points" style={{ padding: '8px 14px', background: '#f97316', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', flexShrink: 0 }}>コイン購入</a>
        </div>

        {/* ランク */}
        <div style={{ background: `linear-gradient(135deg, ${rank.gradientFrom}, ${rank.gradientTo})`, borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏅</div>
              <div>
                <div style={{ fontSize: '11px', color: rank.textColor, fontWeight: '600', marginBottom: '2px', opacity: 0.8 }}>現在のランク</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: rank.textColor, letterSpacing: '1px' }}>{rank.name}</div>
              </div>
            </div>
            {rank.next && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: rank.textColor, opacity: 0.75, marginBottom: '2px' }}>次のランクまで</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: rank.textColor }}>¥{(rank.next - (profile.total_spent || 0)).toLocaleString()}</div>
              </div>
            )}
          </div>
          {rank.next && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.35)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '999px',
                  height: '6px',
                  width: Math.min(100, Math.round(((profile.total_spent || 0) - rank.min) / (rank.next - rank.min) * 100)) + '%',
                  transition: 'width 0.5s'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: rank.textColor, opacity: 0.7 }}>
                <span>¥{(profile.total_spent || 0).toLocaleString()}</span>
                <span>¥{rank.next.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: '総開封数', value: totalCards + '回', color: '#1f2937', icon: '🎰' },
            { label: '獲得カード', value: totalCards + '枚', color: '#3b82f6', icon: '🎴' },
            { label: '獲得総額', value: '¥' + totalValue.toLocaleString(), color: '#f97316', icon: '💰' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* アカウントメニュー */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>アカウント</div>
          <span className="opacity-50 cursor-not-allowed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', color: '#1f2937', fontSize: '14px' }}>
            <span>クーポンの利用</span>
            <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
          </span>
          {[
            { label: '購入履歴', href: '/history' },
            { label: '発送申請', href: '/shipment' },
            { label: 'コイン購入', href: '/buy-points' },
            { label: '獲得賞品', href: '/prizes' },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid #f3f4f6', textDecoration: 'none', color: '#1f2937', fontSize: '14px' }}>
              <span>{item.label}</span>
              <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
            </a>
          ))}
        </div>

        {/* サポート */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>サポート</div>
          {['お知らせ', 'よくある質問/問い合わせ'].map((label, i) => (
            <span key={i} className="opacity-50 cursor-not-allowed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', color: '#1f2937', fontSize: '14px' }}>
              <span>{label}</span>
              <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
            </span>
          ))}
        </div>

        {/* その他 */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>その他</div>
          {[
            '利用規約',
            'プライバシーポリシー',
            '特定商取引法に基づく表記',
          ].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', color: '#9ca3af', fontSize: '14px' }}>
              <span>{label}</span>
              <span style={{ fontSize: '12px' }}>準備中</span>
            </div>
          ))}
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#9ca3af' }}>
            メールアドレス: {profile.email}
          </div>
        </div>

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '14px', background: 'white', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
        >
          ログアウト
        </button>
      </div>
      <BottomNav />
    </div>
  )
}