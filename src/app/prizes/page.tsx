'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Draw = {
  id: string
  created_at: string
  grade: string
  is_exchanged: boolean
  events: { name: string }
  products: { name: string; image_url: string; market_value: number }
}

export default function PrizesPage() {
  const router = useRouter()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'unselected' | 'waiting' | 'shipped'>('unselected')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUser(session.user)
      fetchDraws(session.user.id)
    })
  }, [])

  const fetchDraws = async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('draws')
      .select('*, events(name), products(name, image_url, market_value)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setDraws(data)
    setLoading(false)
  }

  const gradeColors: Record<string, { bg: string; text: string }> = {
    'S賞': { bg: '#fef3c7', text: '#d97706' },
    'A賞': { bg: '#ede9fe', text: '#7c3aed' },
    'B賞': { bg: '#dbeafe', text: '#1d4ed8' },
    'C賞': { bg: '#f3f4f6', text: '#374151' },
    'ラストワン賞': { bg: '#fce7f3', text: '#be185d' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>

      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>獲得商品</h1>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          {[
            { key: 'unselected', label: '未選択' },
            { key: 'waiting', label: '発送待ち' },
            { key: 'shipped', label: '発送済み' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#e67e00' : '#6b7280', borderBottom: activeTab === tab.key ? '2px solid #e67e00' : '2px solid transparent', marginBottom: '-2px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>
        ) : draws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontSize: '15px' }}>未選択の獲得商品がありません</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {draws.map((draw) => {
              const grade = gradeColors[draw.grade] || { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={draw.id} style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e5e7eb' }}>
                  {draw.products?.image_url ? (
                    <img src={draw.products.image_url} alt={draw.products.name} style={{ width: '64px', height: '88px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '64px', height: '88px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🎴</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: grade.text, background: grade.bg, padding: '2px 8px', borderRadius: '999px' }}>{draw.grade}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{draw.products?.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{draw.events?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '14px', height: '14px', background: '#f5c518', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '900', color: '#333' }}>P</div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#e67e00' }}>{draw.products?.market_value?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <a href={'/shipment?draw_id=' + draw.id} style={{ padding: '8px 16px', background: '#e67e00', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'block' }}>発送申請</a>
                    <button style={{ padding: '8px 16px', background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>PT交換</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ボトムナビ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #e0e0e0', zIndex: 50, boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '56px' }}>
          {[
            { href: '/', icon: '🎴', label: 'オリパガチャ' },
            { href: '/prizes', icon: '🏆', label: '獲得商品', active: true },
            { href: '/history', icon: '🕐', label: '当選履歴' },
            { href: '/reports', icon: '📢', label: '当選報告' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((item) => (
            <a key={item.label} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: item.active ? '#e67e00' : '#888', gap: '2px' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}