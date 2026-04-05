'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

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
    'S賞': { bg: 'linear-gradient(135deg, #7c3aed, #db2777)', text: 'white' },
    'A賞': { bg: '#f97316', text: 'white' },
    'B賞': { bg: '#3b82f6', text: 'white' },
    'C賞': { bg: '#6b7280', text: 'white' },
    'ラストワン賞': { bg: 'linear-gradient(135deg, #f472b6, #be185d)', text: 'white' },
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const maskUserId = (id: string) => id.slice(0, 4) + '****'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '70px' }}>

      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '6px' }}>当選報告</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>S賞・A賞・ラストワン賞の当選情報です</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
          </div>
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
                        <img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '14px', height: '14px', objectFit: 'contain', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#f97316' }}>{report.products?.market_value?.toLocaleString()}</span>
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
      <BottomNav />
    </div>
  )
}