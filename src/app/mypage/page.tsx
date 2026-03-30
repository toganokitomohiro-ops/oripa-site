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
    if (totalSpent >= 1000000) return { name: 'PLATINUM', color: '#e2e8f0', textColor: '#475569', next: null }
    if (totalSpent >= 300000) return { name: 'GOLD', color: '#fef3c7', textColor: '#d97706', next: 1000000 }
    if (totalSpent >= 100000) return { name: 'SILVER', color: '#f1f5f9', textColor: '#64748b', next: 300000 }
    return { name: 'BRONZE', color: '#fef3c7', textColor: '#b45309', next: 100000 }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#999' }}>読み込み中...</div>
    </div>
  )

  if (!profile) return null

  const rank = getRank(profile.total_spent || 0)
  const totalCards = draws.length
  const totalValue = draws.reduce((sum, d) => sum + (d.products?.market_value || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>

      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '20px' }}>マイページ</h1>

        {/* プロフィール */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e5e7eb' }}>
          <div style={{ width: '52px', height: '52px', background: '#e67e00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white', fontWeight: '900', flexShrink: 0 }}>
            {profile.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{profile.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#e67e00' }}>{profile.points?.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: '#999' }}>PT保有</span>
            </div>
          </div>
          <a href="/buy-points" style={{ padding: '8px 16px', background: '#f5c518', color: '#1a1a1a', borderRadius: '6px', fontSize: '13px', fontWeight: '900', textDecoration: 'none', flexShrink: 0 }}>PT購入</a>
        </div>

        {/* ランク */}
        <div style={{ background: `linear-gradient(135deg, ${rank.color}, ${rank.color})`, borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', background: rank.textColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏅</div>
            <div>
              <div style={{ fontSize: '12px', color: rank.textColor, fontWeight: '600', marginBottom: '2px' }}>現在のランク</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: rank.textColor }}>{rank.name}</div>
              {rank.next && <div style={{ fontSize: '11px', color: rank.textColor, opacity: 0.8 }}>次のランクまで ¥{(rank.next - (profile.total_spent || 0)).toLocaleString()}</div>}
            </div>
          </div>
          <span style={{ color: rank.textColor, fontSize: '18px' }}>›</span>
        </div>

        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: '総開封数', value: totalCards + '回', color: '#1f2937' },
            { label: '獲得カード', value: totalCards + '枚', color: '#3b82f6' },
            { label: '獲得総額', value: '¥' + totalValue.toLocaleString(), color: '#e67e00' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* アカウントメニュー */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>アカウント</div>
          {[
            { label: 'クーポンの利用', href: '#' },
            { label: '購入履歴', href: '#' },
            { label: 'お届け先の登録', href: '#' },
            { label: 'メールアドレス変更', href: '#' },
            { label: 'パスワード変更', href: '#' },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none', color: '#1f2937', fontSize: '14px' }}>
              <span>{item.label}</span>
              <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
            </a>
          ))}
        </div>

        {/* サポート */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>サポート</div>
          {[
            { label: 'お知らせ', href: '#' },
            { label: 'よくある質問/問い合わせ', href: '#' },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none', color: '#1f2937', fontSize: '14px' }}>
              <span>{item.label}</span>
              <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
            </a>
          ))}
        </div>

        {/* その他 */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>その他</div>
          {[
            { label: '利用規約', href: '#' },
            { label: 'プライバシーポリシー', href: '#' },
            { label: '特定商取引法に基づく表記', href: '#' },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', textDecoration: 'none', color: '#1f2937', fontSize: '14px' }}>
              <span>{item.label}</span>
              <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
            </a>
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