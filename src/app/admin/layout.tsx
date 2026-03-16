'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [shopName, setShopName] = useState('ORIPA管理')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login')
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const menuGroups = [
    {
      label: 'メイン',
      items: [
        { href: '/admin', icon: '🏠', label: 'ホーム' },
      ]
    },
    {
      label: 'コンテンツ',
      items: [
        { href: '/admin/products', icon: '🃏', label: '商品マスター' },
        { href: '/admin/events', icon: '🎴', label: 'オリパ管理' },
        { href: '/admin/banners', icon: '🖼️', label: 'バナー管理' },
      ]
    },
    {
      label: '注文・顧客',
      items: [
        { href: '/admin/orders', icon: '📦', label: '配送管理' },
        { href: '/admin/customers', icon: '👥', label: '顧客管理' },
      ]
    },
    {
      label: 'マーケティング',
      items: [
        { href: '/admin/marketing', icon: '📣', label: 'マーケティング' },
        { href: '/admin/points', icon: '🪙', label: 'ポイント管理' },
      ]
    },
    {
      label: '設定',
      items: [
        { href: '/admin/settings', icon: '⚙️', label: '設定' },
      ]
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* サイドバー */}
      <aside style={{
        width: '240px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>

        {/* ロゴ */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #e67e00, #f5c518)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎴</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>ORIPA</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* サイトを見るボタン */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}>
            <span>🌐</span>
            <span>サイトを確認する</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px' }}>↗</span>
          </a>
        </div>

        {/* ナビゲーション */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menuGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <div style={{ padding: '8px 20px 4px', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                    <a
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: active ? '700' : '500',
                      textDecoration: 'none',
                      color: active ? 'white' : 'rgba(255,255,255,0.55)',
                      background: active ? 'rgba(230,126,0,0.2)' : 'transparent',
                      borderLeft: active ? '3px solid #e67e00' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {active && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', background: '#e67e00', borderRadius: '50%' }} />}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ログアウト */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'rgba(255,100,100,0.9)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span>🚪</span>
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* トップバー */}
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 9, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* パンくず */}
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>管理画面</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
              {pathname === '/admin' ? 'ダッシュボード' :
               pathname.startsWith('/admin/products') ? '商品マスター' :
               pathname.startsWith('/admin/events') ? 'オリパ管理' :
               pathname.startsWith('/admin/orders') ? '配送管理' :
               pathname.startsWith('/admin/customers') ? '顧客管理' :
               pathname.startsWith('/admin/banners') ? 'バナー管理' :
               pathname.startsWith('/admin/marketing') ? 'マーケティング' :
               pathname.startsWith('/admin/settings') ? '設定' : 'ページ'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500' }}>
              ← サイトへ戻る
            </a>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main style={{ flex: 1, padding: '28px', background: '#f8fafc' }}>
          {children}
        </main>
      </div>
    </div>
  )
}