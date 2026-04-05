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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill={active ? '#f97316' : '#9ca3af'}/>
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
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '56px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <a key={item.href} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: '2px', borderTop: isActive ? '2px solid #f97316' : '2px solid transparent' }}>
              {icons[item.href](isActive)}
              <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500', color: isActive ? '#f97316' : '#9ca3af' }}>{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
