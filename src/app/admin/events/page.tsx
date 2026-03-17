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
  image_url: string
  category: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '下書き', color: '#6b7280', bg: '#f3f4f6' },
  ready: { label: '準備完了', color: '#d97706', bg: '#fef3c7' },
  active: { label: '公開中', color: '#16a34a', bg: '#f0fdf4' },
  sold_out: { label: '売り切れ', color: '#dc2626', bg: '#fef2f2' },
  ended: { label: '終了', color: '#6b7280', bg: '#f3f4f6' },
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\nこの操作は取り消せません。`)) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const filtered = events.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = {
    all: events.length,
    draft: events.filter(e => e.status === 'draft').length,
    ready: events.filter(e => e.status === 'ready').length,
    active: events.filter(e => e.status === 'active').length,
    sold_out: events.filter(e => e.status === 'sold_out').length,
    ended: events.filter(e => e.status === 'ended').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>オリパ管理</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>オリパの作成・編集・公開設定を管理します</p>
        </div>
        <button
          onClick={() => router.push('/admin/events/new')}
          style={{ background: '#db2777', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ＋ 新規作成
        </button>
      </div>

      {/* 検索・フィルター */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
            <input
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px 8px 36px', fontSize: '14px', boxSizing: 'border-box' }}
              placeholder="オリパ名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'white' : 'transparent', fontSize: '16px' }}>⊞</button>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'white' : 'transparent', fontSize: '16px' }}>☰</button>
          </div>
        </div>

        {/* ステータスフィルター */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'すべて' },
            { key: 'active', label: '公開中' },
            { key: 'ready', label: '準備完了' },
            { key: 'draft', label: '下書き' },
            { key: 'sold_out', label: '売り切れ' },
            { key: 'ended', label: '終了' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid', borderColor: statusFilter === s.key ? '#db2777' : '#e5e7eb', background: statusFilter === s.key ? '#db2777' : 'white', color: statusFilter === s.key ? 'white' : '#6b7280', fontSize: '13px', fontWeight: statusFilter === s.key ? 'bold' : 'normal', cursor: 'pointer' }}
            >
              {s.label}
              <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.8 }}>({statusCounts[s.key as keyof typeof statusCounts]})</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>{filtered.length}件</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <div>オリパが見つかりません</div>
          <button onClick={() => router.push('/admin/events/new')} style={{ marginTop: '16px', background: '#db2777', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>新規作成</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* グリッド表示 */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((event) => {
            const status = STATUS_LABELS[event.status] || STATUS_LABELS.draft
            const soldPercent = Math.round(((event.total_count - event.remaining_count) / event.total_count) * 100)
            return (
              <div key={event.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => router.push(`/admin/events/${event.id}`)}>
                <div style={{ position: 'relative', height: '160px', background: '#f3f4f6', overflow: 'hidden' }}>
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎴</div>
                  )}
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: status.bg, color: status.color, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' }}>{status.label}</div>
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>{event.price.toLocaleString()}pt/回</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>残り {event.remaining_count}/{event.total_count}口</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px', marginBottom: '12px' }}>
                    <div style={{ background: soldPercent > 80 ? '#ef4444' : '#10b981', borderRadius: '999px', height: '6px', width: `${soldPercent}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => router.push(`/admin/events/${event.id}`)} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>編集</button>
                    <button onClick={() => handleDelete(event.id, event.name)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer' }}>削除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* リスト表示 */
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '16px', padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
            <div>オリパ名</div>
            <div>価格</div>
            <div>残り口数</div>
            <div>販売済み</div>
            <div>ステータス</div>
            <div>操作</div>
          </div>
          {filtered.map((event, index) => {
            const status = STATUS_LABELS[event.status] || STATUS_LABELS.draft
            const soldPercent = Math.round(((event.total_count - event.remaining_count) / event.total_count) * 100)
            return (
              <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '16px', padding: '14px 16px', borderTop: index > 0 ? '1px solid #f3f4f6' : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    {event.image_url ? <img src={event.image_url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎴</div>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{event.name}</div>
                </div>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>{event.price.toLocaleString()}pt</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{event.remaining_count}/{event.total_count}</div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{soldPercent}%</div>
                <div><span style={{ background: status.bg, color: status.color, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>{status.label}</span></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => router.push(`/admin/events/${event.id}`)} style={{ fontSize: '12px', color: '#2980b9', background: 'none', border: '1px solid #93c5fd', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>編集</button>
                  <button onClick={() => handleDelete(event.id, event.name)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>削除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}