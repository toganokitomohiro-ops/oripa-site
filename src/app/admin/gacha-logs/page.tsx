'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Draw = {
  id: string
  grade: string
  is_exchanged: boolean
  created_at: string
  events: { id: string; name: string } | null
  products: { name: string } | null
  profiles: { email: string } | null
}

type Event = {
  id: string
  name: string
}

const gradeConfig: Record<string, { color: string; bg: string; border: string }> = {
  'S賞': { color: '#b45309', bg: '#fef3c7', border: '#f59e0b' },
  'A賞': { color: '#7c3aed', bg: '#ede9fe', border: '#8b5cf6' },
  'B賞': { color: '#1d4ed8', bg: '#dbeafe', border: '#3b82f6' },
  'C賞': { color: '#374151', bg: '#f3f4f6', border: '#9ca3af' },
  'ラストワン賞': { color: '#9f1239', bg: '#fff1f2', border: '#f43f5e' },
}

const GRADES = ['S賞', 'A賞', 'B賞', 'C賞', 'ラストワン賞']
const PAGE_SIZE = 100

export default function AdminGachaLogsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name')
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  const fetchDraws = async (p = 0) => {
    setLoading(true)
    let query = supabase
      .from('draws')
      .select(
        'id, grade, is_exchanged, created_at, events(id, name), products(name), profiles!user_id(email)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: selectedEventId ? true : false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)

    if (selectedEventId) query = query.eq('event_id', selectedEventId)
    if (gradeFilter) query = query.eq('grade', gradeFilter)

    const { data, count } = await query
    if (data) setDraws(data as unknown as Draw[])
    if (count !== null) setTotal(count)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  useEffect(() => {
    setPage(0)
    fetchDraws(0)
  }, [selectedEventId, gradeFilter])

  const handlePageChange = (p: number) => {
    setPage(p)
    fetchDraws(p)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

  const getDrawNumber = (index: number) => {
    if (selectedEventId) {
      return page * PAGE_SIZE + index + 1
    }
    return page * PAGE_SIZE + index + 1
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>ガチャ排出履歴</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          各オリパの排出ログを確認できます
        </p>
      </div>

      {/* 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>総排出数</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#1f2937' }}>{total.toLocaleString()}件</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>オリパ数</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#1f2937' }}>{events.length}種</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>表示中</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6' }}>{draws.length}件</div>
        </div>
      </div>

      {/* フィルター */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>オリパ</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1f2937', background: 'white', cursor: 'pointer' }}
          >
            <option value="">すべてのオリパ</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>賞レア</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#1f2937', background: 'white', cursor: 'pointer' }}
          >
            <option value="">すべて</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {(selectedEventId || gradeFilter) && (
          <button
            onClick={() => { setSelectedEventId(''); setGradeFilter('') }}
            style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600' }}
          >
            リセット
          </button>
        )}

        {selectedEventId && (
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 12px' }}>
            ※ オリパ絞り込み時は排出順（古い順）で表示
          </div>
        )}
      </div>

      {/* テーブル */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '15px' }}>
          読み込み中...
        </div>
      ) : draws.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎴</div>
          <div style={{ color: '#9ca3af', fontSize: '15px' }}>排出履歴がありません</div>
        </div>
      ) : (
        <>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>#</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>ガチャ名（オリパ）</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>排出番号</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>カード名</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>グレード（賞）</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>ユーザー</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>排出日時</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw, index) => {
                    const grade = gradeConfig[draw.grade] || gradeConfig['C賞']
                    return (
                      <tr
                        key={draw.id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: '600' }}>
                          {page * PAGE_SIZE + index + 1}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1f2937', fontWeight: '600', maxWidth: '180px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {draw.events?.name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontWeight: '700' }}>
                          {selectedEventId
                            ? `${getDrawNumber(index)}口目`
                            : <span style={{ color: '#9ca3af' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', maxWidth: '200px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {draw.products?.name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: grade.color,
                            background: grade.bg,
                            border: `1px solid ${grade.border}`,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            whiteSpace: 'nowrap',
                          }}>
                            {draw.grade}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: '180px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {draw.profiles?.email || <span style={{ color: '#d1d5db' }}>不明</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {formatDate(draw.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', border: '1px solid #e5e7eb', borderRadius: '8px', background: page === 0 ? '#f9fafb' : 'white', color: page === 0 ? '#9ca3af' : '#374151', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              >
                ← 前へ
              </button>
              <span style={{ fontSize: '13px', color: '#6b7280', padding: '0 8px' }}>
                {page + 1} / {totalPages}ページ（{total.toLocaleString()}件）
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', border: '1px solid #e5e7eb', borderRadius: '8px', background: page >= totalPages - 1 ? '#f9fafb' : 'white', color: page >= totalPages - 1 ? '#9ca3af' : '#374151', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
