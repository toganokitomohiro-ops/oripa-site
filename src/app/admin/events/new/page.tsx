'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminEventsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    price: '',
    total_count: '',
    description: '',
    notes: '',
    category: 'pokemon',
    status: 'draft',
    image_url: '',
  })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `events/${Date.now()}.jpg`
    const resizeImage = (file: File, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
      }
      img.src = url
    })
  }

  const resized = await resizeImage(file, 416, 273)
    const { error } = await supabase.storage.from('images').upload(fileName, resized, { contentType: 'image/jpeg' })
    if (error) { alert('アップロード失敗'); setUploading(false); return }
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }))
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.total_count) {
      alert('オリパ名・価格・総口数は必須です')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('events').insert({
      name: form.name,
      price: Number(form.price),
      total_count: Number(form.total_count),
      remaining_count: Number(form.total_count),
      description: form.description,
      notes: form.notes,
      category: form.category,
      status: form.status,
      image_url: form.image_url,
    }).select().single()
    setLoading(false)
    if (error) { alert('エラーが発生しました'); return }
    router.push('/admin/events/' + data.id)
  }

  const categories = [
    { value: 'pokemon', label: 'ポケモン' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/admin/events')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>新しいオリパを作成</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 基本情報 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>基本情報</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                オリパ名 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：超激熱ポケモンオリパ"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  価格（pt） <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  総口数 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.total_count}
                  onChange={(e) => setForm({ ...form, total_count: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>ステータス</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">下書き</option>
                  <option value="active">公開中</option>
                  <option value="ended">終了</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>説明文</label>
              <textarea
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="オリパの説明を入力..."
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>注意事項</label>
              <textarea
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="口数制限・発送についてなど..."
              />
            </div>
          </div>
        </div>

        {/* バナー画像 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>バナー画像</h2>
          <div
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('event-image-input')?.click()}
            style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '12px' }}
          >
            {uploading ? (
              <div style={{ color: '#6b7280' }}>アップロード中...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>クリックまたはドラッグ&ドロップ</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PNG・JPG対応</div>
              </>
            )}
          </div>
          <input id="event-image-input" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} style={{ display: 'none' }} />
          <input
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="または画像URLを直接入力..."
          />
          {form.image_url && (
            <div style={{ marginTop: '12px' }}>
              <img src={form.image_url} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          )}
        </div>

        {/* 作成ボタン */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.price || !form.total_count}
            style={{ flex: 1, background: (!form.name || !form.price || !form.total_count) ? '#9ca3af' : '#db2777', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: (!form.name || !form.price || !form.total_count) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '作成中...' : 'オリパを作成する'}
          </button>
          <button
            onClick={() => router.push('/admin/events')}
            style={{ padding: '12px 24px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '15px', border: 'none', cursor: 'pointer' }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}