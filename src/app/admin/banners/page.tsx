'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Banner = {
  id: string
  image_url: string
  link_url: string
  title: string
  sort_order: number
  is_active: boolean
  page: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [form, setForm] = useState({ image_url: '', link_url: '', title: '', sort_order: 0, page: 'top' })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [filterPage, setFilterPage] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pages = [
    { value: 'top', label: 'トップページ' },
    { value: 'register', label: '会員登録ページ' },
    { value: 'login', label: 'ログインページ' },
  ]

  const fetchBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    if (data) setBanners(data)
  }

  useEffect(() => { fetchBanners() }, [])

  const uploadImage = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `banners/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(fileName, file)
    if (error) { alert('アップロードに失敗しました'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }))
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) uploadImage(file)
  }

  const handleAdd = async () => {
    if (!form.image_url) return
    setLoading(true)
    await supabase.from('banners').insert({ ...form, is_active: true })
    setForm({ image_url: '', link_url: '', title: '', sort_order: 0, page: 'top' })
    await fetchBanners()
    setLoading(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    fetchBanners()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  const filteredBanners = filterPage === 'all' ? banners : banners.filter(b => b.page === filterPage)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>バナー管理</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>各ページのバナーを管理できます</p>
      </div>

      {/* 追加フォーム */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>バナーを追加</h2>

        {/* 画像アップロード */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '8px', fontWeight: '600' }}>バナー画像</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? '#db2777' : '#d1d5db'}`, borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#fdf2f8' : '#f9fafb', marginBottom: '12px', transition: 'all 0.2s' }}
          >
            {uploading ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>アップロード中...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>クリックまたはドラッグ&ドロップ</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PNG・JPG・GIF対応</div>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>または</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>
          <input
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="画像URLを直接入力..."
          />
        </div>

        {/* プレビュー */}
        {form.image_url && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>プレビュー</div>
            <img src={form.image_url} alt="preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '6px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>表示ページ</label>
            <select
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
              value={form.page}
              onChange={(e) => setForm({ ...form, page: e.target.value })}
            >
              {pages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>リンク先URL（任意）</label>
            <input
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>タイトル（任意）</label>
            <input
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="バナーのタイトル"
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px', fontWeight: '600' }}>表示順</label>
            <input
              type="number"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={loading || !form.image_url || uploading}
          style={{ background: (!form.image_url || uploading) ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: (!form.image_url || uploading) ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '追加中...' : '追加する'}
        </button>
      </div>

      {/* バナー一覧 */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>バナー一覧</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ value: 'all', label: 'すべて' }, ...pages].map((p) => (
              <button
                key={p.value}
                onClick={() => setFilterPage(p.value)}
                style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', border: '1px solid', borderColor: filterPage === p.value ? '#db2777' : '#e5e7eb', background: filterPage === p.value ? '#fdf2f8' : 'white', color: filterPage === p.value ? '#db2777' : '#6b7280', cursor: 'pointer' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {filteredBanners.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>バナーがまだ登録されていません</div>
        ) : (
          filteredBanners.map((banner) => (
            <div key={banner.id} style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={banner.image_url} alt={banner.title} style={{ width: '160px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>{banner.title || '無題'}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: '999px' }}>
                    {pages.find(p => p.value === banner.page)?.label || banner.page}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>表示順:{banner.sort_order}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: banner.is_active ? '#10b981' : '#6b7280', background: banner.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
                  {banner.is_active ? '公開中' : '非公開'}
                </span>
                <button onClick={() => handleToggle(banner.id, banner.is_active)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                  {banner.is_active ? '非公開に' : '公開する'}
                </button>
                <button onClick={() => handleDelete(banner.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}