'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  name: string
  price: number
  total_count: number
  remaining_count: number
  status: string
  description: string
  image_url: string
  created_at: string
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('このオリパを削除しますか？')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const handleStatusChange = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('events').update({ status }).eq('id', id)
    fetchEvents()
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '下書き', color: '#6b7280', bg: '#f3f4f6' },
    active: { label: '公開中', color: '#10b981', bg: '#f0fdf4' },
    ended: { label: '終了', color: '#ef4444', bg: '#fef2f2' },
  }

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>オリパ管理</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>オリパの作成・編集・在庫管理を行います</p>
        </div>
        <button
          onClick={() => router.push('/admin/events/new')}
          style={{ background: '#db2777', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ＋ 新規作成
        </button>
      </div>

      {/* フィルタータブ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ value: 'all', label: 'すべて' }, { value: 'active', label: '公開中' }, { value: 'draft', label: '下書き' }, { value: 'ended', label: '終了' }].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', border: '1px solid', borderColor: filter === tab.value ? '#db2777' : '#e5e7eb', background: filter === tab.value ? '#fdf2f8' : 'white', color: filter === tab.value ? '#db2777' : '#6b7280', cursor: 'pointer' }}
          >
            {tab.label}
            {tab.value !== 'all' && <span style={{ marginLeft: '6px', fontSize: '11px' }}>({events.filter(e => e.status === tab.value).length})</span>}
            {tab.value === 'all' && <span style={{ marginLeft: '6px', fontSize: '11px' }}>({events.length})</span>}
          </button>
        ))}
      </div>

      {/* オリパ一覧テーブル */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>オリパ名</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>価格</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>在庫状況</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>ステータス</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>作成日</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>読み込み中...</td></tr>
            ) : filteredEvents.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>オリパが見つかりません</td></tr>
            ) : (
              filteredEvents.map((event) => {
                const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)
                const status = statusConfig[event.status] || statusConfig.draft
                return (
                  <tr
                    key={event.id}
                    onClick={() => router.push('/admin/events/' + event.id)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.name} style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '32px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📦</div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{event.name}</div>
                          {event.description && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{event.description.slice(0, 30)}{event.description.length > 30 ? '...' : ''}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#e67e00' }}>{event.price.toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>pt</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                          <span>残り {event.remaining_count}</span>
                          <span>{event.remaining_count}/{event.total_count}</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px' }}>
                          <div style={{ background: remainingPercent > 50 ? '#10b981' : remainingPercent > 20 ? '#f59e0b' : '#ef4444', borderRadius: '999px', height: '6px', width: remainingPercent + '%' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: status.color, background: status.bg, padding: '4px 10px', borderRadius: '999px' }}>{status.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(event.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <select
                          value={event.status}
                          onChange={(e) => handleStatusChange(event.id, e.target.value, e as any)}
                          style={{ fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 8px', background: 'white', cursor: 'pointer' }}
                        >
                          <option value="draft">下書き</option>
                          <option value="active">公開中</option>
                          <option value="ended">終了</option>
                        </select>
                        <button
                          onClick={(e) => { router.push('/admin/events/' + event.id); e.stopPropagation() }}
                          style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: '1px solid #3b82f6', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          詳細
                        </button>
                        <button
                          onClick={(e) => handleDelete(event.id, e)}
                          style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}