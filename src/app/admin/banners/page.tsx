'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Banner = {
  id: string
  title: string
  image_url: string
  link_url: string
  sort_order: number
  page: string
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: '公開中', color: '#16a34a', bg: '#f0fdf4' },
  draft: { label: '下書き', color: '#6b7280', bg: '#f3f4f6' },
  hidden: { label: '非公開', color: '#dc2626', bg: '#fef2f2' },
}

export default function AdminBannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageFilter, setPageFilter] = useState('all')

  const fetchBanners = async () => {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    if (data) setBanners(data)
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('banners').update({ status }).eq('id', id)
    fetchBanners()
  }

  const filtered = banners.filter(b => {
    const matchSearch = b.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const matchPage = pageFilter === 'all' || b.page === pageFilter
    return matchSearch && matchStatus && matchPage
  })

  const statusCounts = {
    all: banners.length,
    published: banners.filter(b => b.status === 'published').length,
    draft: banners.filter(b => b.status === 'draft').length,
    hidden: banners.filter(b => b.status === 'hidden').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>バナー管理</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>トップページなどのバナーを管理します</p>
        </div>
        <button
          onClick={() => router.push('/admin/banners/new')}
          style={{ background: '#db2777', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
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
              placeholder="バナータイトルで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
          >
            <option value="all">全ページ</option>
            <option value="top">トップ</option>
            <option value="mypage">マイページ</option>
          </select>
        </div>

        {/* ステータスフィルター */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'すべて' },
            { key: 'published', label: '公開中' },
            { key: 'draft', label: '下書き' },
            { key: 'hidden', label: '非公開' },
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
          <div>バナーが見つかりません</div>
          <button onClick={() => router.push('/admin/banners/new')} style={{ marginTop: '16px', background: '#db2777', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>新規作成</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((banner) => {
            const status = STATUS_LABELS[banner.status] || STATUS_LABELS.draft
            return (
              <div key={banner.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px' }}>
                {/* サムネイル */}
                <div style={{ width: '160px', height: '48px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                  {banner.image_url
                    ? <img src={banner.image_url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🖼️</div>
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{banner.title || '無題'}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '999px' }}>
                      {banner.page === 'top' ? 'トップ' : banner.page === 'mypage' ? 'マイページ' : banner.page}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>順序: {banner.sort_order}</span>
                    {banner.link_url && <span style={{ fontSize: '11px', color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{banner.link_url}</span>}
                  </div>
                </div>

                {/* ステータス変更 */}
                <select
                  value={banner.status || 'published'}
                  onChange={(e) => handleStatusChange(banner.id, e.target.value)}
                  style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}40`, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <option value="published">公開中</option>
                  <option value="draft">下書き</option>
                  <option value="hidden">非公開</option>
                </select>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => router.push(`/admin/banners/${banner.id}`)} style={{ fontSize: '12px', color: '#2980b9', background: 'none', border: '1px solid #93c5fd', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>編集</button>
                  <button onClick={() => handleDelete(banner.id, banner.title)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}>削除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}