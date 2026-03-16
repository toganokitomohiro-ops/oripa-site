'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  image_url: string
  category: string
  market_value: number
  psa_grade: string
  card_set: string
  tcg_id: string
  created_at: string
}

type LinkedEvent = {
  id: string
  grade: string
  count: number
  remaining_count: number
  events: {
    id: string
    name: string
    status: string
    price: number
  }
}

export default function AdminProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([])
  const [form, setForm] = useState({ name: '', image_url: '', category: 'pokemon', market_value: '', psa_grade: '', card_set: '', tcg_id: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'events'>('edit')

  const pid = params.pid as string

  const categories = [
    { value: 'pokemon', label: 'ポケモンカード' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  const psaGrades = ['PSA10', 'PSA9', 'PSA8', 'PSA7', 'PSA6']

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [p, e] = await Promise.all([
      supabase.from('products').select('*').eq('id', pid).single(),
      supabase.from('prizes').select('*, events(id, name, status, price)').eq('product_id', pid),
    ])
    if (p.data) {
      setProduct(p.data)
      setForm({
        name: p.data.name || '',
        image_url: p.data.image_url || '',
        category: p.data.category || 'pokemon',
        market_value: p.data.market_value?.toString() || '',
        psa_grade: p.data.psa_grade || '',
        card_set: p.data.card_set || '',
        tcg_id: p.data.tcg_id || '',
      })
    }
    if (e.data) setLinkedEvents(e.data)
    setLoading(false)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `products/${Date.now()}.${ext}`
    await supabase.storage.from('images').upload(fileName, file)
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }))
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name) { alert('カード名は必須です'); return }
    setSaving(true)
    await supabase.from('products').update({
      name: form.name,
      image_url: form.image_url,
      category: form.category,
      market_value: Number(form.market_value) || 0,
      psa_grade: form.psa_grade,
      card_set: form.card_set,
      tcg_id: form.tcg_id,
    }).eq('id', pid)
    setSaving(false)
    alert('保存しました！')
    fetchAll()
  }

  const handleDelete = async () => {
    if (!confirm('この商品を削除しますか？\n紐付いているオリパからも削除されます。')) return
    await supabase.from('products').delete().eq('id', pid)
    router.push('/admin/products')
  }

  const getPsaBadge = (grade: string) => {
    if (grade === 'PSA10') return { bg: '#dc2626', text: 'PSA 10' }
    if (grade === 'PSA9') return { bg: '#d97706', text: 'PSA 9' }
    if (grade === 'PSA8') return { bg: '#2563eb', text: 'PSA 8' }
    if (grade === 'PSA7') return { bg: '#6b7280', text: 'PSA 7' }
    return null
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '下書き', color: '#6b7280', bg: '#f3f4f6' },
    active: { label: '公開中', color: '#10b981', bg: '#f0fdf4' },
    ended: { label: '終了', color: '#ef4444', bg: '#fef2f2' },
  }

  if (loading) return <div style={{ padding: '40px', color: '#999' }}>読み込み中...</div>
  if (!product) return <div style={{ padding: '40px', color: '#999' }}>商品が見つかりません</div>

  const badge = getPsaBadge(form.psa_grade)

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/admin/products')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{product.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          style={{ fontSize: '13px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600' }}
        >
          削除
        </button>
      </div>

      {/* プレビューカード */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {form.image_url ? (
            <img src={form.image_url} alt={form.name} style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ) : (
            <div style={{ width: '100px', height: '140px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.3 }}>🎴</div>
          )}
          {badge && (
            <div style={{ position: 'absolute', top: '6px', right: '6px', background: badge.bg, color: 'white', fontSize: '10px', fontWeight: '900', padding: '3px 6px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
              {badge.text}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '6px' }}>{form.name}</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#e67e00', marginBottom: '8px' }}>¥{Number(form.market_value || 0).toLocaleString()}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {form.psa_grade && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: '4px' }}>{form.psa_grade}</span>
            )}
            <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
              {categories.find(c => c.value === form.category)?.label}
            </span>
            {form.card_set && (
              <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>{form.card_set}</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            登録日: {new Date(product.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        {[
          { key: 'edit', label: '基本情報・画像編集' },
          { key: 'events', label: `紐付きオリパ（${linkedEvents.length}件）` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#db2777' : '#6b7280', borderBottom: activeTab === tab.key ? '2px solid #db2777' : '2px solid transparent', marginBottom: '-2px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 編集タブ */}
      {activeTab === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>基本情報</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カード名 <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー</label>
                  <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>市場価格（¥）</label>
                  <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={form.market_value} onChange={(e) => setForm({ ...form, market_value: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>PSAグレード</label>
                  <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} value={form.psa_grade} onChange={(e) => setForm({ ...form, psa_grade: e.target.value })}>
                    <option value="">なし</option>
                    {psaGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カードセット</label>
                  <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={form.card_set} onChange={(e) => setForm({ ...form, card_set: e.target.value })} placeholder="例：スカーレット&バイオレット" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>商品画像</h2>
            <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }} onDragOver={(e) => e.preventDefault()} onClick={() => document.getElementById('edit-img')?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '12px' }}>
              {uploading ? <div style={{ color: '#6b7280', fontSize: '13px' }}>アップロード中...</div> : <div style={{ fontSize: '13px', color: '#6b7280' }}>クリックまたはドラッグ&ドロップで変更</div>}
            </div>
            <input id="edit-img" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} style={{ display: 'none' }} />
            <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="画像URL" />
          </div>

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: saving ? '#9ca3af' : '#db2777', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '保存中...' : '変更を保存する'}
          </button>
        </div>
      )}

      {/* 紐付きオリパタブ */}
      {activeTab === 'events' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          {linkedEvents.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎴</div>
              <div>このカードはまだどのオリパにも登録されていません</div>
            </div>
          ) : (
            linkedEvents.map((prize, i) => {
              const status = statusConfig[prize.events?.status] || statusConfig.draft
              return (
                <div
                  key={prize.id}
                  style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                  onClick={() => router.push('/admin/events/' + prize.events?.id)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{prize.events?.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '999px' }}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {prize.grade} / {prize.count}口（残り{prize.remaining_count}口） / {prize.events?.price}pt/回
                    </div>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}