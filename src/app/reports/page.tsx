'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  created_at: string
  grade: string
  user_id: string
  events: { name: string }
  products: { name: string; image_url: string; market_value: number }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('draws')
      .select('*, events(name), products(name, image_url, market_value)')
      .in('grade', ['S賞', 'A賞', 'ラストワン賞'])
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setReports(data)
    setLoading(false)
  }

  const gradeColors: Record<string, { bg: string; text: string }> = {
    'S賞': { bg: 'linear-gradient(135deg, #ffd700, #ff8c00)', text: 'white' },
    'A賞': { bg: 'linear-gradient(135deg, #c084fc, #7c3aed)', text: 'white' },
    'ラストワン賞': { bg: 'linear-gradient(135deg, #f472b6, #be185d)', text: 'white' },
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const maskUserId = (id: string) => id.slice(0, 4) + '****'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>

      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '6px' }}>当選報告</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>S賞・A賞・ラストワン賞の当選情報です</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📢</div>
            <div style={{ fontSize: '15px' }}>まだ当選報告がありません</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reports.map((report) => {
              const grade = gradeColors[report.grade] || { bg: '#94a3b8', text: 'white' }
              return (
                <div key={report.id} style={{ background: 'white', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e5e7eb' }}>
                  {report.products?.image_url ? (
                    <img src={report.products.image_url} alt={report.products.name} style={{ width: '56px', height: '78px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '56px', height: '78px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎴</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: grade.text, background: grade.bg, padding: '3px 10px', borderRadius: '999px' }}>{report.grade}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDate(report.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '3px' }}>{report.products?.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{report.events?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '14px', height: '14px', background: '#f5c518', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '900', color: '#333' }}>P</div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#e67e00' }}>{report.products?.market_value?.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>コイン</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>ユーザー:{maskUserId(report.user_id)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #e0e0e0', zIndex: 50, boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '56px' }}>
          {[
            { href: '/', icon: '🎴', label: 'オリパガチャ' },
            { href: '/prizes', icon: '🏆', label: '獲得商品' },
            { href: '/history', icon: '🕐', label: '当選履歴' },
            { href: '/reports', icon: '📢', label: '当選報告', active: true },
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