'use client'
import React from 'react'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const navItems = [
    { href: '/', label: 'オリパ' },
    { href: '/prizes', label: '獲得商品' },
    { href: '/history', label: '履歴' },
    { href: '/fp-exchange', label: 'FP交換' },
    { href: '/mypage', label: 'マイページ' },
  ]

  const icons: Record<string, (active: boolean) => React.ReactElement> = {
    '/': (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="7" height="10" rx="2" fill={active ? '#f97316' : '#9ca3af'} opacity="0.3"/>
        <rect x="8" y="4" width="7" height="10" rx="2" fill={active ? '#f97316' : '#9ca3af'} opacity="0.6"/>
        <rect x="12" y="6" width="7" height="10" rx="2" fill={active ? '#f97316' : '#9ca3af'}/>
        <circle cx="15.5" cy="11" r="2" fill={active ? 'white' : '#e5e7eb'}/>
      </svg>
    ),
    '/prizes': (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1a3 3 0 00-6 0c0 .12.11.56.18 1H10c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h1v7c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-7h1c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1zM14 5c0-.55.45-1 1-1s1 .45 1 1c0 .12-.11.56-.18 1h-1.64C14.11 5.56 14 5.12 14 5zm5 12h-6v-7h6v7zm1-9H10V7h10v1z" fill={active ? '#f97316' : '#9ca3af'}/>
      </svg>
    ),
    '/history': (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7c-1.93 0-3.68-.79-4.95-2.05L6.61 18.4C8.27 20.01 10.52 21 13 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill={active ? '#f97316' : '#9ca3af'}/>
      </svg>
    ),
    '/fp-exchange': (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" fill={active ? '#22c55e' : '#9ca3af'}/>
      </svg>
    ),
    '/mypage': (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={active ? '#f97316' : '#9ca3af'}/>
      </svg>
    ),
  }

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', zIndex: 50, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '72px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isFp = item.href === '/fp-exchange'
          const activeColor = isFp ? '#22c55e' : '#f97316'
          const activeBg = isFp ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)'
          return (
            <a key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: isActive ? activeBg : 'transparent', borderRadius: '12px', padding: '4px 12px', transition: 'background 0.2s' }}>
                {icons[item.href](isActive)}
                <span style={{ fontSize: '12px', fontWeight: isActive ? '700' : '500', color: isActive ? activeColor : '#9ca3af' }}>{item.label}</span>
              </div>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
