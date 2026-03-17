'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminBannerNewPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    page: 'top',
    status: 'published',
    description: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const uploadImage = async (file: File) => {
    setUploading(true)
    const isTopPage = form.page === 'top'
    const resized = await resizeImage(file, isTopPage ? 1050 : 800, isTopPage ? 318 : 200)
    const fileName = `banners/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('images').upload(fileName, resized, { contentType: 'image/jpeg' })
    if (error) { alert('アップロードに失敗しました'); setUploading(false); return }
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setForm(prev => ({ ...prev, image_url: data.publicUrl }))
    setUploading(false)
  }

  const handleSave = async () => {
    
    setSaving(true)
    const { error } = await supabase.from('banners').insert({
      title: form.title,
      image_url: form.image_url,
      link_url: form.link_url,
      sort_order: Number(form.sort_order),
      page: form.page,
      status: form.status,
      description: form.description,
    })
    if (error) { alert('保存に失敗しました'); setSaving(false); return }
    router.push('/admin/banners')
  }

  const statusOptions = [
    { value: 'published', label: '公開中', color: '#16a34a' },
    { value: 'draft', label: '下書き', color: '#6b7280' },
    { value: 'hidden', label: '非公開', color: '#dc2626' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button onClick={() => router.push('/admin/banners')} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '4px' }}>← バナー一覧に戻る</button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>バナー新規作成</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/admin/banners')} style={{ background: 'white', color: '#6b7280', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>キャンセル</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#9ca3af' : '#db2777', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* メインフォーム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 基本情報 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>基本情報</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>タイトル</label>
                <input
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="バナータイトルを入力"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>説明（任意）</label>
                <textarea
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="バナーの説明（管理用）"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>リンクURL（任意）</label>
                <input
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* 画像アップロード */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>バナー画像</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>推奨サイズ：1050×318px（自動リサイズされます）</p>

            <div
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadImage(f) }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('banner-upload')?.click()}
              style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '12px' }}
            >
              {uploading ? (
                <div style={{ color: '#6b7280' }}>アップロード・リサイズ中...</div>
              ) : form.image_url ? (
                <div style={{ color: '#10b981', fontWeight: '600' }}>✅ 画像アップロード済み</div>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>クリックまたはドラッグ&ドロップ</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>JPG・PNG・WebP対応</div>
                </>
              )}
            </div>
            <input id="banner-upload" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} style={{ display: 'none' }} />
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>またはURLで入力</label>
              <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://example.com/banner.jpg" />
            </div>

            {/* プレビュー */}
            {form.image_url && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>プレビュー</div>
                <img src={form.image_url} alt="preview" style={{ width: '100%', aspectRatio: '1050/318', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <button onClick={() => setForm({ ...form, image_url: '' })} style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>画像を削除</button>
              </div>
            )}
          </div>
        </div>

        {/* サイドバー */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 公開設定 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>公開設定</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statusOptions.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: form.status === opt.value ? opt.color : '#e5e7eb', background: form.status === opt.value ? `${opt.color}10` : 'white', cursor: 'pointer' }}>
                  <input type="radio" name="status" value={opt.value} checked={form.status === opt.value} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ accentColor: opt.color }} />
                  <span style={{ fontSize: '14px', fontWeight: form.status === opt.value ? 'bold' : 'normal', color: form.status === opt.value ? opt.color : '#374151' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 表示設定 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>表示設定</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>表示ページ</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.page}
                  onChange={(e) => setForm({ ...form, page: e.target.value })}
                >
                  <option value="top">トップページ</option>
                  <option value="login">ログインページ</option>
                  <option value="register">会員登録ページ</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>表示順</label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '14px', background: saving ? '#9ca3af' : '#db2777', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}