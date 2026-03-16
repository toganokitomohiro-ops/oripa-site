'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalCustomers: 0,
    totalDraws: 0,
    totalSales: 0,
    todayDraws: 0,
    totalProducts: 0,
    pendingShipments: 0,
  })
  const [recentDraws, setRecentDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [events, customers, draws, products, todayDraws] = await Promise.all([
      supabase.from('events').select('id, status, price, total_count, remaining_count'),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('draws').select('id, created_at, grade, events(name, price), products(name, image_url)', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('draws').select('id', { count: 'exact' }).gte('created_at', today.toISOString()),
    ])

    const activeEvents = events.data?.filter(e => e.status === 'active') || []
    const totalSales = events.data?.reduce((sum, e) => sum + (e.price * (e.total_count - e.remaining_count)), 0) || 0

    setStats({
      totalEvents: events.data?.length || 0,
      activeEvents: activeEvents.length,
      totalCustomers: customers.count || 0,
      totalDraws: draws.count || 0,
      totalSales,
      todayDraws: todayDraws.count || 0,
      totalProducts: products.count || 0,
      pendingShipments: 0,
    })

    if (draws.data) {
      setRecentDraws(draws.data.slice(0, 8))
    }
    setLoading(false)
  }

  const gradeColors: Record<string, string> = {
    'S賞': '#f59e0b', 'A賞': '#8b5cf6', 'B賞': '#3b82f6', 'C賞': '#6b7280', 'ラストワン賞': '#ec4899'
  }

  const menuItems = [
    { label: '商品管理', desc: 'カードの登録・編集・在庫管理', icon: '🃏', href: '/admin/products', color: '#fef3c7', border: '#fde68a' },
    { label: 'オリパ管理', desc: 'イベントの作成・編集・管理', icon: '🎴', href: '/admin/events', color: '#f0fdf4', border: '#bbf7d0' },
    { label: '配送管理', desc: '発送申請の確認・管理', icon: '📦', href: '/admin/orders', color: '#eff6ff', border: '#bfdbfe' },
    { label: '顧客管理', desc: '会員の管理・ポイント付与', icon: '👥', href: '/admin/customers', color: '#fdf4ff', border: '#e9d5ff' },
    { label: 'バナー管理', desc: 'バナー画像の登録・管理', icon: '🖼️', href: '/admin/banners', color: '#fff7ed', border: '#fed7aa' },
    { label: 'マーケティング', desc: 'クーポン・お知らせ管理', icon: '📣', href: '/admin/marketing', color: '#fef2f2', border: '#fecaca' },
    { label: '設定', desc: '店舗情報・デザイン設定', icon: '⚙️', href: '/admin/settings', color: '#f8fafc', border: '#e2e8f0' },
  ]

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>ダッシュボード</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>ショップ全体の管理ができます</p>
      </div>

      {/* KPIカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: '総売上', value: '¥' + stats.totalSales.toLocaleString(), color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: '💰' },
          { label: '今日の開封数', value: stats.todayDraws + '回', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '🎴' },
          { label: '稼働中オリパ', value: stats.activeEvents + '件', color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', icon: '🎪' },
          { label: '総会員数', value: stats.totalCustomers + '人', color: '#8b5cf6', bg: '#fdf4ff', border: '#e9d5ff', icon: '👥' },
        ].map((card) => (
          <div key={card.label} style={{ background: card.bg, border: '1px solid ' + card.border, borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{card.label}</span>
              <span style={{ fontSize: '24px' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* サブKPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: '総開封数', value: stats.totalDraws + '回', icon: '🎰' },
          { label: '総オリパ数', value: stats.totalEvents + '件', icon: '📦' },
          { label: '商品登録数', value: stats.totalProducts + '件', icon: '🃏' },
          { label: '発送待ち', value: stats.pendingShipments + '件', icon: '🚚' },
        ].map((card) => (
          <div key={card.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

        {/* 最近の開封履歴 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>最近の開封履歴</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>直近8件</span>
          </div>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>読み込み中...</div>
          ) : recentDraws.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>まだ開封履歴がありません</div>
          ) : (
            recentDraws.map((draw, i) => (
              <div key={draw.id} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid #f9fafb' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {draw.products?.image_url ? (
                  <img src={draw.products.image_url} alt="" style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '32px', height: '44px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎴</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draw.products?.name || '不明'}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{draw.events?.name}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: gradeColors[draw.grade] || '#6b7280', background: '#f9fafb', padding: '2px 8px', borderRadius: '999px', flexShrink: 0 }}>{draw.grade}</span>
              </div>
            ))
          )}
        </div>

        {/* クイックアクセス */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>クイックアクセス</span>
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: '新規オリパ作成', href: '/admin/events/new', icon: '➕', color: '#db2777' },
                { label: '商品を追加', href: '/admin/products', icon: '🃏', color: '#3b82f6' },
                { label: 'バナーを追加', href: '/admin/banners', icon: '🖼️', color: '#f59e0b' },
                { label: '顧客一覧', href: '/admin/customers', icon: '👥', color: '#8b5cf6' },
                { label: '配送管理', href: '/admin/orders', icon: '📦', color: '#10b981' },
                { label: 'サイトを見る', href: '/', icon: '🌐', color: '#6b7280' },
              ].map((item) => (
                <a key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px', textDecoration: 'none', border: '1px solid #f3f4f6', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: item.color }}>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 管理メニュー */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>管理メニュー</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
          {menuItems.map((item, i) => (
              <a
              key={item.label}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', padding: '20px', textDecoration: 'none', borderRight: i % 4 !== 3 ? '1px solid #f3f4f6' : 'none', borderTop: i >= 4 ? '1px solid #f3f4f6' : 'none', background: 'white', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = item.color}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{item.label}</span>
              <span style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{item.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}