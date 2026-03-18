'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type AnimationVideo = {
  id: string
  name: string
  video_url: string
  thumbnail_url: string
  category: string
  is_active: boolean
  sort_order: number
}

type AnimationCategory = {
  id: string
  name: string
  value: string
  sort_order: number
}

export default function AdminAnimationsPage() {
  const [videos, setVideos] = useState<AnimationVideo[]>([])
  const [categories, setCategories] = useState<AnimationCategory[]>([])
  const [form, setForm] = useState({ name: '', video_url: '', thumbnail_url: '', category: '', sort_order: 0 })
  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'videos' | 'categories'>('videos')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const fetchAll = async () => {
    const [{ data: v }, { data: c }] = await Promise.all([
      supabase.from('animation_videos').select('*').order('sort_order'),
      supabase.from('animation_categories').select('*').order('sort_order'),
    ])
    if (v) setVideos(v)
    if (c) {
      setCategories(c)
      if (!form.category && c.length > 0) setForm(prev => ({ ...prev, category: c[0].value }))
    }
  }

  useEffect(() => { fetchAll() }, [])

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(fileName, file)
    if (error) { alert('アップロード失敗'); return null }
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleVideoUpload = async (file: File) => {
    setUploading(true)
    const url = await uploadFile(file, 'animations')
    if (url) setForm(prev => ({ ...prev, video_url: url }))
    setUploading(false)
  }

  const handleThumbUpload = async (file: File) => {
    setUploading(true)
    const url = await uploadFile(file, 'thumbnails')
    if (url) setForm(prev => ({ ...prev, thumbnail_url: url }))
    setUploading(false)
  }

  const handleAdd = async () => {
    if (!form.name || !form.video_url) return
    setLoading(true)
    await supabase.from('animation_videos').insert({ ...form, is_active: true })
    setForm({ name: '', video_url: '', thumbnail_url: '', category: categories[0]?.value || '', sort_order: 0 })
    await fetchAll()
    setLoading(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('animation_videos').update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\nこの操作は取り消せません。`)) return
    await supabase.from('animation_videos').delete().eq('id', id)
    fetchAll()
  }

  const handleAddCategory = async () => {
    if (!categoryForm.name) return
    // 識別キーを自動生成（タイムスタンプベース）
    const autoValue = 'cat_' + Date.now()
    await supabase.from('animation_categories').insert({ name: categoryForm.name, value: autoValue, sort_order: categories.length + 1 })
    setCategoryForm({ name: '' })
    fetchAll()
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`カテゴリー「${name}」を削除しますか？\n関連動画のカテゴリーは変更されません。`)) return
    await supabase.from('animation_categories').delete().eq('id', id)
    fetchAll()
  }

  const filteredVideos = videos.filter(v => {
    const matchCategory = filterCategory === 'all' || v.category === filterCategory
    const matchSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>演出動画ライブラリ</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>ガチャ開封時の演出動画を管理します</p>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
        {[{ key: 'videos', label: '🎬 動画一覧' }, { key: 'categories', label: '🏷️ カテゴリー管理' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? '#1f2937' : '#6b7280', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'videos' && (
        <>
          {/* 追加フォーム */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>動画を追加</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>動画名 *</label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：S賞演出（虹色）" />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.value}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>演出動画ファイル *</label>
              <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleVideoUpload(f) }}
                onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '8px' }}>
                {uploading ? <div style={{ color: '#6b7280' }}>アップロード中...</div>
                  : form.video_url ? <div style={{ color: '#10b981', fontWeight: '600' }}>✅ 動画アップロード済み</div>
                  : <>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎬</div>
                    <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>クリックまたはドラッグ&ドロップ</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>MP4・WebM・MOV対応</div>
                  </>}
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }} style={{ display: 'none' }} />
              <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="または動画URLを直接入力..." />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>サムネイル画像（任意）</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="サムネイルURL" />
                <button onClick={() => thumbInputRef.current?.click()}
                  style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  アップロード
                </button>
              </div>
              <input ref={thumbInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }} style={{ display: 'none' }} />
            </div>

            <button onClick={handleAdd} disabled={loading || !form.name || !form.video_url}
              style={{ background: (!form.name || !form.video_url) ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: (!form.name || !form.video_url) ? 'not-allowed' : 'pointer' }}>
              {loading ? '追加中...' : '追加する'}
            </button>
          </div>

          {/* 検索・フィルター */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: '200px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 動画名で検索..." />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCategory('all')}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid', borderColor: filterCategory === 'all' ? '#db2777' : '#e5e7eb', background: filterCategory === 'all' ? '#fdf2f8' : 'white', color: filterCategory === 'all' ? '#db2777' : '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                すべて（{videos.length}）
              </button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setFilterCategory(c.value)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid', borderColor: filterCategory === c.value ? '#db2777' : '#e5e7eb', background: filterCategory === c.value ? '#fdf2f8' : 'white', color: filterCategory === c.value ? '#db2777' : '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {c.name}（{videos.filter(v => v.category === c.value).length}）
                </button>
              ))}
            </div>
          </div>

          {/* 動画一覧 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {filteredVideos.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
                <div>{searchQuery || filterCategory !== 'all' ? '条件に一致する動画がありません' : '動画がまだ登録されていません'}</div>
              </div>
            ) : filteredVideos.map((video) => (
              <div key={video.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#1e293b', cursor: 'pointer' }}
                  onClick={() => setPreviewId(previewId === video.id ? null : video.id)}>
                  {previewId === video.id ? (
                    <video src={video.video_url} autoPlay controls style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '32px' }}>▶️</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>クリックで再生</div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{video.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '999px' }}>
                      {categories.find(c => c.value === video.category)?.name || video.category}
                    </span>
                    <span style={{ fontSize: '11px', color: video.is_active ? '#10b981' : '#6b7280', background: video.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>
                      {video.is_active ? '有効' : '無効'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleToggle(video.id, video.is_active)}
                      style={{ flex: 1, fontSize: '12px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                      {video.is_active ? '無効化' : '有効化'}
                    </button>
                    <button onClick={() => handleDelete(video.id, video.name)}
                      style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div>
          {/* カテゴリー追加 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>カテゴリーを追加</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー名</label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="例：S賞専用、通常開封、ジャックポット" />
              </div>
              <button onClick={handleAddCategory} disabled={!categoryForm.name}
                style={{ padding: '8px 20px', background: !categoryForm.name ? '#9ca3af' : '#db2777', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: !categoryForm.name ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                追加
              </button>
            </div>
          </div>

          {/* カテゴリー一覧 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
              登録済みカテゴリー（{categories.length}件）
            </div>
            {categories.map((cat, i) => (
              <div key={cat.id} style={{ padding: '14px 20px', borderBottom: i < categories.length - 1 ? '1px solid #f9fafb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{cat.name}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{cat.value}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{videos.filter(v => v.category === cat.value).length}本</span>
                </div>
                <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}