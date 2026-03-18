'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Item = {
  id: string
  name: string
  image_url: string
  fp_price: number
  stock: number
  remaining_stock: number
  rarity: string
  item_code: string
  notes: string
  description: string
  is_active: boolean
  sort_order: number
  fp_exchange_categories: { name: string } | null
}

type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
}

type FpSetting = {
  id: string
  fp_rate: number
}

export default function AdminFpExchangePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [fpSetting, setFpSetting] = useState<FpSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'settings'>('items')
  const [editingRate, setEditingRate] = useState(false)
  const [newRate, setNewRate] = useState('')

  // カテゴリーフォーム
  const [catForm, setCatForm] = useState({ name: '', slug: '', sort_order: 0 })
  const [editingCat, setEditingCat] = useState<Category | null>(null)

  // 商品フォーム
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [itemForm, setItemForm] = useState({
    name: '', description: '', image_url: '', category_id: '',
    fp_price: 0, stock: 0, remaining_stock: 0,
    rarity: '', item_code: '', notes: '', is_active: true, sort_order: 0
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [itemsRes, catsRes, settingRes] = await Promise.all([
      supabase.from('fp_exchange_items').select('*, fp_exchange_categories(name)').order('sort_order'),
      supabase.from('fp_exchange_categories').select('*').order('sort_order'),
      supabase.from('fp_settings').select('*').single(),
    ])
    if (itemsRes.data) setItems(itemsRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (settingRes.data) {
      setFpSetting(settingRes.data)
      setNewRate(String(settingRes.data.fp_rate))
    }
    setLoading(false)
  }

  // FP還元率保存
  const saveFpRate = async () => {
    if (!fpSetting) return
    await supabase.from('fp_settings').update({ fp_rate: Number(newRate), updated_at: new Date().toISOString() }).eq('id', fpSetting.id)
    setFpSetting({ ...fpSetting, fp_rate: Number(newRate) })
    setEditingRate(false)
  }

  // カテゴリー保存
  const saveCategory = async () => {
    if (!catForm.name || !catForm.slug) return
    if (editingCat) {
      await supabase.from('fp_exchange_categories').update(catForm).eq('id', editingCat.id)
    } else {
      await supabase.from('fp_exchange_categories').insert(catForm)
    }
    setCatForm({ name: '', slug: '', sort_order: 0 })
    setEditingCat(null)
    fetchAll()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('fp_exchange_categories').delete().eq('id', id)
    fetchAll()
  }

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileName = `fp-exchange/${Date.now()}.jpg`
    await supabase.storage.from('images').upload(fileName, file)
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setItemForm(prev => ({ ...prev, image_url: data.publicUrl }))
    setUploading(false)
  }

  // 商品保存
  const saveItem = async () => {
    if (!itemForm.name || itemForm.fp_price <= 0) return
    if (editingItem) {
      await supabase.from('fp_exchange_items').update(itemForm).eq('id', editingItem.id)
    } else {
      await supabase.from('fp_exchange_items').insert({ ...itemForm, remaining_stock: itemForm.stock })
    }
    resetItemForm()
    fetchAll()
  }

  const resetItemForm = () => {
    setItemForm({ name: '', description: '', image_url: '', category_id: '', fp_price: 0, stock: 0, remaining_stock: 0, rarity: '', item_code: '', notes: '', is_active: true, sort_order: 0 })
    setEditingItem(null)
    setShowItemForm(false)
  }

  const startEditItem = (item: Item) => {
    setEditingItem(item)
    setItemForm({
      name: item.name, description: '', image_url: item.image_url || '',
      category_id: item.fp_exchange_categories ? (categories.find(c => c.name === item.fp_exchange_categories?.name)?.id || '') : '',
      fp_price: item.fp_price, stock: item.stock, remaining_stock: item.remaining_stock,
      rarity: item.rarity || '', item_code: item.item_code || '', notes: item.notes || '',
      is_active: item.is_active, sort_order: item.sort_order
    })
    setShowItemForm(true)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('fp_exchange_items').delete().eq('id', id)
    fetchAll()
  }

  const btnStyle = (active: boolean) => ({
    padding: '10px 20px', fontSize: '14px', fontWeight: '600' as const, border: 'none',
    background: 'none', cursor: 'pointer', color: active ? '#ea580c' : '#6b7280',
    borderBottom: active ? '2px solid #ea580c' : '2px solid transparent', marginBottom: '-2px'
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937' }}>🪙 FPコイン交換所 管理</h1>
        <a href="/fp-exchange" target="_blank" style={{ fontSize: '13px', color: '#ea580c', textDecoration: 'none' }}>フロント確認 →</a>
      </div>

      {/* タブ */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px', display: 'flex' }}>
        <button style={btnStyle(activeTab === 'items')} onClick={() => setActiveTab('items')}>商品管理</button>
        <button style={btnStyle(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>カテゴリー管理</button>
        <button style={btnStyle(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>FP設定</button>
      </div>

      {/* ===== 商品管理タブ ===== */}
      {activeTab === 'items' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => { resetItemForm(); setShowItemForm(true) }}
              style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              ＋ 商品追加
            </button>
          </div>

          {/* 商品フォーム */}
          {showItemForm && (
            <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>{editingItem ? '商品編集' : '商品追加'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>商品名 *</label>
                  <input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>必要FP *</label>
                  <input type="number" value={itemForm.fp_price} onChange={e => setItemForm({ ...itemForm, fp_price: Number(e.target.value) })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>在庫数</label>
                  <input type="number" value={itemForm.stock} onChange={e => setItemForm({ ...itemForm, stock: Number(e.target.value), remaining_stock: Number(e.target.value) })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>カテゴリー</label>
                  <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
                    <option value="">未選択</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>レアリティ</label>
                  <input value={itemForm.rarity} onChange={e => setItemForm({ ...itemForm, rarity: e.target.value })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>型番</label>
                  <input value={itemForm.item_code} onChange={e => setItemForm({ ...itemForm, item_code: e.target.value })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>表示順</label>
                  <input type="number" value={itemForm.sort_order} onChange={e => setItemForm({ ...itemForm, sort_order: Number(e.target.value) })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>公開</label>
                  <select value={itemForm.is_active ? '1' : '0'} onChange={e => setItemForm({ ...itemForm, is_active: e.target.value === '1' })}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}>
                    <option value="1">公開</option>
                    <option value="0">非公開</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>説明</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={2}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>注意事項</label>
                  <textarea value={itemForm.notes} onChange={e => setItemForm({ ...itemForm, notes: e.target.value })} rows={2}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>商品画像</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '8px' }} />
                  {uploading && <span style={{ fontSize: '13px', color: '#6b7280' }}>アップロード中...</span>}
                  {itemForm.image_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={itemForm.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <input value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                        style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', boxSizing: 'border-box' }} placeholder="またはURLを直接入力" />
                    </div>
                  )}
                  {!itemForm.image_url && (
                    <input value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }} placeholder="画像URLを直接入力" />
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button onClick={resetItemForm} style={{ padding: '10px 20px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                <button onClick={saveItem} style={{ padding: '10px 20px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
              </div>
            </div>
          )}

          {/* 商品一覧 */}
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>読み込み中...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '56px', height: '56px', flexShrink: 0, background: '#f9fafb', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '24px' }}>🎴</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{item.name}</span>
                      {!item.is_active && <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px' }}>非公開</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                      <span>🪙 {item.fp_price.toLocaleString()} FP</span>
                      <span>在庫: {item.remaining_stock}/{item.stock}</span>
                      {item.fp_exchange_categories && <span>{item.fp_exchange_categories.name}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEditItem(item)} style={{ padding: '6px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>編集</button>
                    <button onClick={() => deleteItem(item.id)} style={{ padding: '6px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>削除</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>商品がまだありません</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== カテゴリー管理タブ ===== */}
      {activeTab === 'categories' && (
        <div>
          {/* カテゴリーフォーム */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#1f2937' }}>{editingCat ? 'カテゴリー編集' : 'カテゴリー追加'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>カテゴリー名 *</label>
                <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="例：ポケモン" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>スラッグ *</label>
                <input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="例：pokemon" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>表示順</label>
                <input type="number" value={catForm.sort_order} onChange={e => setCatForm({ ...catForm, sort_order: Number(e.target.value) })}
                  style={{ width: '80px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingCat && (
                  <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', sort_order: 0 }) }}
                    style={{ padding: '9px 16px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    キャンセル
                  </button>
                )}
                <button onClick={saveCategory}
                  style={{ padding: '9px 20px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {editingCat ? '更新' : '追加'}
                </button>
              </div>
            </div>
          </div>

          {/* カテゴリー一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{cat.name}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{cat.slug}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>順: {cat.sort_order}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, sort_order: cat.sort_order }) }}
                    style={{ padding: '6px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>編集</button>
                  <button onClick={() => deleteCategory(cat.id)}
                    style={{ padding: '6px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>削除</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>カテゴリーがまだありません</div>
            )}
          </div>
        </div>
      )}

      {/* ===== FP設定タブ ===== */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>🪙 FPコイン還元率設定</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>ガチャ消費コイン100に対して何FPを付与するか設定します</p>
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>現在の還元率：</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#ea580c' }}>{fpSetting?.fp_rate || 0}</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 100コイン</span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>例）還元率1.0 → 100コイン消費で1FP付与、1000コイン消費で10FP付与</p>
            </div>
            {editingRate ? (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>新しい還元率</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="number" step="0.1" min="0" value={newRate} onChange={e => setNewRate(e.target.value)}
                    style={{ width: '120px', border: '2px solid #ea580c', borderRadius: '8px', padding: '10px 14px', fontSize: '18px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 100コイン</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setEditingRate(false)} style={{ flex: 1, padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                  <button onClick={saveFpRate} style={{ flex: 1, padding: '12px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingRate(true)} style={{ width: '100%', padding: '12px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                還元率を変更する
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
