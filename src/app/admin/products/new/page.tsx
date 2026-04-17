'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PokemonCard = {
  id: string
  name: string
  imageSmall: string
  imageLarge: string
  setName: string
  series: string
  number: string
  rarity: string
}

export default function AdminProductNewPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', image_url: '', category: 'pokemon',
    market_value: '', psa_grade: '', card_set: '', tcg_id: ''
  })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  // カード検索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categories = [
    { value: 'pokemon', label: 'ポケモンカード' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  const psaGrades = ['PSA10', 'PSA9', 'PSA8', 'PSA7', 'PSA6']

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`/api/pokemon-search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.error) {
        setSearchError('検索に失敗しました')
        setSearchResults([])
      } else {
        setSearchResults(json.data ?? [])
      }
    } catch {
      setSearchError('通信エラーが発生しました')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(q), 500)
  }

  const handleSelectCard = (card: PokemonCard) => {
    setForm((prev) => ({
      ...prev,
      name: card.name,
      image_url: card.imageLarge,
      card_set: card.setName,
      tcg_id: card.id,
    }))
    setSearchQuery('')
    setSearchResults([])
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

  const handleSubmit = async () => {
    if (!form.name) { alert('カード名は必須です'); return }
    setLoading(true)
    const { data, error } = await supabase.from('products').insert({
      name: form.name,
      image_url: form.image_url,
      category: form.category,
      market_value: Number(form.market_value) || 0,
      psa_grade: form.psa_grade,
      card_set: form.card_set,
      tcg_id: form.tcg_id,
    }).select().single()
    setLoading(false)
    if (error) { alert('エラーが発生しました'); return }
    router.push('/admin/products/' + data.id)
  }

  const getPsaBadge = (grade: string) => {
    if (grade === 'PSA10') return { bg: '#dc2626', text: 'PSA 10' }
    if (grade === 'PSA9') return { bg: '#d97706', text: 'PSA 9' }
    if (grade === 'PSA8') return { bg: '#2563eb', text: 'PSA 8' }
    if (grade === 'PSA7') return { bg: '#6b7280', text: 'PSA 7' }
    return null
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/admin/products')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>新規商品登録</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ポケモンカード検索 */}
        {form.category === 'pokemon' && (
          <div style={{ background: 'white', border: '2px solid #3b82f6', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
              🔍 ポケモンカード検索
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              カード名を入力すると自動で画像・セット名が入力されます
            </p>
            <div style={{ position: 'relative' }}>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder="例：リザードン、ピカチュウ、Charizard..."
              />
              {searching && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '12px' }}>
                  検索中...
                </div>
              )}
            </div>

            {searchError && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{searchError}</p>
            )}

            {searchResults.length > 0 && (
              <div style={{ marginTop: '12px', maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {searchResults.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', background: 'white', border: 'none',
                      borderBottom: '1px solid #f3f4f6', cursor: 'pointer', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    <img
                      src={card.imageSmall}
                      alt={card.name}
                      style={{ width: '40px', height: '56px', objectFit: 'contain', flexShrink: 0, borderRadius: '4px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {card.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {card.setName} · {card.series}
                      </div>
                      {card.rarity && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                          {card.rarity} · #{card.number}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', flexShrink: 0 }}>選択 →</div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !searchError && (
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>該当するカードが見つかりませんでした</p>
            )}
          </div>
        )}

        {/* 基本情報 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>基本情報</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カード名 <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：リザードンex SAR"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.category}
                  onChange={(e) => { setForm({ ...form, category: e.target.value }); setSearchResults([]) }}
                >
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>市場価格（¥）</label>
                <input
                  type="number"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.market_value}
                  onChange={(e) => setForm({ ...form, market_value: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>PSAグレード</label>
                <select
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                  value={form.psa_grade}
                  onChange={(e) => setForm({ ...form, psa_grade: e.target.value })}
                >
                  <option value="">なし</option>
                  {psaGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カードセット</label>
                <input
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.card_set}
                  onChange={(e) => setForm({ ...form, card_set: e.target.value })}
                  placeholder="例：スカーレット&バイオレット"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 画像 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>商品画像</h2>
          <div
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('product-img')?.click()}
            style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '12px' }}
          >
            {uploading ? (
              <div style={{ color: '#6b7280' }}>アップロード中...</div>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>クリックまたはドラッグ&ドロップ</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PNG・JPG対応（カード検索で自動入力も可）</div>
              </>
            )}
          </div>
          <input id="product-img" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} style={{ display: 'none' }} />
          <input
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="または画像URLを直接入力..."
          />

          {/* プレビュー */}
          {form.image_url && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={form.image_url} alt="preview" style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                {form.psa_grade && (() => {
                  const badge = getPsaBadge(form.psa_grade)
                  return badge ? (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', background: badge.bg, color: 'white', fontSize: '8px', fontWeight: '900', padding: '2px 4px', borderRadius: '3px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                      {badge.text}
                    </div>
                  ) : null
                })()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{form.name || 'カード名未入力'}</div>
                <div style={{ fontSize: '13px', color: '#e67e00', fontWeight: '700', marginBottom: '4px' }}>¥{Number(form.market_value || 0).toLocaleString()}</div>
                {form.psa_grade && <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>{form.psa_grade}</div>}
                {form.card_set && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{form.card_set}</div>}
              </div>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            style={{ flex: 1, background: (!form.name || loading) ? '#9ca3af' : '#db2777', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: (!form.name || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '登録中...' : '商品を登録する'}
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            style={{ padding: '12px 24px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '15px', border: 'none', cursor: 'pointer' }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
