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
  s_bonus: number
  a_bonus: number
  b_bonus: number
  c_bonus: number
  login_bonus: number
  fp_expiry_months: number
}

type Order = {
  id: string
  user_id: string
  fp_used: number
  status: string
  name: string
  postal_code: string
  prefecture: string
  address: string
  address2: string
  phone: string
  tracking_number: string
  shipped_at: string
  created_at: string
  fp_exchange_items: { name: string; image_url: string } | null
  profiles: { email: string } | null
}

export default function AdminFpExchangePage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [fpSetting, setFpSetting] = useState<FpSetting | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'orders' | 'categories' | 'settings'>('items')
  const [editingRate, setEditingRate] = useState(false)
  const [newRate, setNewRate] = useState('')
  const [editingBonuses, setEditingBonuses] = useState(false)
  const [newSBonus, setNewSBonus] = useState('')
  const [newABonus, setNewABonus] = useState('')
  const [newBBonus, setNewBBonus] = useState('')
  const [newCBonus, setNewCBonus] = useState('')
  const [editingLoginBonus, setEditingLoginBonus] = useState(false)
  const [newLoginBonus, setNewLoginBonus] = useState('')
  const [editingExpiry, setEditingExpiry] = useState(false)
  const [newExpiryMonths, setNewExpiryMonths] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})

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
    const [itemsRes, catsRes, settingRes, ordersRes] = await Promise.all([
      supabase.from('fp_exchange_items').select('*, fp_exchange_categories(name)').order('sort_order'),
      supabase.from('fp_exchange_categories').select('*').order('sort_order'),
      supabase.from('fp_settings').select('*').single(),
      supabase.from('fp_exchange_orders').select('*, fp_exchange_items(name, image_url), profiles(email)').order('created_at', { ascending: false }),
    ])
    if (itemsRes.data) setItems(itemsRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (settingRes.data) {
      setFpSetting(settingRes.data)
      setNewRate(String(settingRes.data.fp_rate))
      setNewSBonus(String(settingRes.data.s_bonus ?? 50))
      setNewABonus(String(settingRes.data.a_bonus ?? 20))
      setNewBBonus(String(settingRes.data.b_bonus ?? 5))
      setNewCBonus(String(settingRes.data.c_bonus ?? 0))
      setNewLoginBonus(String(settingRes.data.login_bonus ?? 5))
      setNewExpiryMonths(String(settingRes.data.fp_expiry_months ?? 6))
    }
    if (ordersRes.data) setOrders(ordersRes.data as Order[])
    setLoading(false)
  }

  // FP還元率保存
  const saveFpRate = async () => {
    if (!fpSetting) return
    await supabase.from('fp_settings').update({ fp_rate: Number(newRate), updated_at: new Date().toISOString() }).eq('id', fpSetting.id)
    setFpSetting({ ...fpSetting, fp_rate: Number(newRate) })
    setEditingRate(false)
  }

  const saveBonuses = async () => {
    if (!fpSetting) return
    await supabase.from('fp_settings').update({
      s_bonus: Number(newSBonus),
      a_bonus: Number(newABonus),
      b_bonus: Number(newBBonus),
      c_bonus: Number(newCBonus),
      updated_at: new Date().toISOString(),
    }).eq('id', fpSetting.id)
    setFpSetting({ ...fpSetting, s_bonus: Number(newSBonus), a_bonus: Number(newABonus), b_bonus: Number(newBBonus), c_bonus: Number(newCBonus) })
    setEditingBonuses(false)
  }

  const saveLoginBonus = async () => {
    if (!fpSetting) return
    await supabase.from('fp_settings').update({ login_bonus: Number(newLoginBonus), updated_at: new Date().toISOString() }).eq('id', fpSetting.id)
    setFpSetting({ ...fpSetting, login_bonus: Number(newLoginBonus) })
    setEditingLoginBonus(false)
  }

  const saveExpiry = async () => {
    if (!fpSetting) return
    await supabase.from('fp_settings').update({ fp_expiry_months: Number(newExpiryMonths), updated_at: new Date().toISOString() }).eq('id', fpSetting.id)
    setFpSetting({ ...fpSetting, fp_expiry_months: Number(newExpiryMonths) })
    setEditingExpiry(false)
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

  // 注文ステータス更新
  const updateOrderStatus = async (orderId: string, status: string) => {
    const trackingNumber = trackingInputs[orderId] || ''
    const update: Record<string, string> = { status, updated_at: new Date().toISOString() }
    if (status === 'shipped') {
      update.shipped_at = new Date().toISOString()
      if (trackingNumber) update.tracking_number = trackingNumber
    }
    await supabase.from('fp_exchange_orders').update(update).eq('id', orderId)
    fetchAll()
  }

  const statusLabel: Record<string, string> = {
    pending: '受付中',
    processing: '処理中',
    shipped: '発送済み',
  }

  const statusColor: Record<string, string> = {
    pending: '#f97316',
    processing: '#3b82f6',
    shipped: '#22c55e',
  }

  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderStatusFilter)

  const btnStyle = (active: boolean) => ({
    padding: '10px 20px', fontSize: '14px', fontWeight: '600' as const, border: 'none',
    background: 'none', cursor: 'pointer',
    color: active ? '#f97316' : '#6b7280',
    borderBottom: active ? '2px solid #f97316' : '2px solid transparent', marginBottom: '-2px'
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', background: '#f8f8f8', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px' }}><img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '24px', height: '24px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" /> FPコイン交換所 管理</h1>
        <a href="/fp-exchange" target="_blank" style={{ fontSize: '13px', color: '#f97316', textDecoration: 'none' }}>フロント確認 →</a>
      </div>

      {/* タブ */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px', display: 'flex', background: 'white', borderRadius: '12px 12px 0 0', padding: '0 8px' }}>
        <button style={btnStyle(activeTab === 'items')} onClick={() => setActiveTab('items')}>商品管理</button>
        <button style={btnStyle(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>
          注文管理
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span style={{ marginLeft: '6px', background: '#ef4444', color: 'white', borderRadius: '10px', fontSize: '11px', padding: '2px 7px', fontWeight: '700' }}>
              {orders.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
        <button style={btnStyle(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>カテゴリー管理</button>
        <button style={btnStyle(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>FP設定</button>
      </div>

      {/* ===== 商品管理タブ ===== */}
      {activeTab === 'items' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => { resetItemForm(); setShowItemForm(true) }}
              style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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
                <button onClick={saveItem} style={{ padding: '10px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
              </div>
            </div>
          )}

          {/* 商品一覧（グリッド） */}
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>読み込み中...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {items.map(item => (
                <div key={item.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
                  <div style={{ background: '#f9fafb', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>🎴</span>}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', flex: 1 }}>{item.name}</span>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
                        background: item.is_active ? '#dcfce7' : '#f3f4f6',
                        color: item.is_active ? '#166534' : '#9ca3af'
                      }}>{item.is_active ? '公開' : '非公開'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      <span style={{ background: '#fff7ed', color: '#f97316', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '14px', height: '14px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" /> {item.fp_price.toLocaleString()} FP</span>
                      <span>在庫: {item.remaining_stock}/{item.stock}</span>
                      {item.fp_exchange_categories && <span>{item.fp_exchange_categories.name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEditItem(item)} style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>編集</button>
                      <button onClick={() => deleteItem(item.id)} style={{ flex: 1, padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>削除</button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>商品がまだありません</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 注文管理タブ ===== */}
      {activeTab === 'orders' && (
        <div>
          {/* ステータスフィルター */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `すべて（${orders.length}）` },
              { key: 'pending', label: `受付中（${orders.filter(o => o.status === 'pending').length}）` },
              { key: 'processing', label: `処理中（${orders.filter(o => o.status === 'processing').length}）` },
              { key: 'shipped', label: `発送済み（${orders.filter(o => o.status === 'shipped').length}）` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setOrderStatusFilter(tab.key)}
                style={{
                  padding: '8px 18px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                  background: orderStatusFilter === tab.key ? '#f97316' : 'white',
                  color: orderStatusFilter === tab.key ? 'white' : '#374151',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>読み込み中...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredOrders.map(order => (
                <div key={order.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* 商品画像 */}
                    <div style={{ width: '72px', height: '72px', flexShrink: 0, background: '#f9fafb', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {order.fp_exchange_items?.image_url
                        ? <img src={order.fp_exchange_items.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '32px' }}>🎴</span>}
                    </div>

                    {/* 注文情報 */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                          {order.fp_exchange_items?.name || '商品不明'}
                        </span>
                        <span style={{
                          fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700',
                          background: statusColor[order.status] + '20',
                          color: statusColor[order.status] || '#666'
                        }}>
                          {statusLabel[order.status] || order.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(order.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        👤 {order.profiles?.email || order.user_id}
                        <span style={{ marginLeft: '12px', color: '#f97316', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '14px', height: '14px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" /> {order.fp_used?.toLocaleString()} FP</span>
                      </p>
                      {order.name && (
                        <div style={{ fontSize: '13px', color: '#374151', background: '#f9fafb', borderRadius: '8px', padding: '10px 14px', marginTop: '8px' }}>
                          <p style={{ fontWeight: '700', marginBottom: '4px' }}>📦 {order.name}</p>
                          <p>〒{order.postal_code} {order.prefecture}{order.address}{order.address2 ? ` ${order.address2}` : ''}</p>
                          <p>📞 {order.phone}</p>
                          {order.tracking_number && (
                            <p style={{ color: '#22c55e', fontWeight: '700', marginTop: '4px' }}>🚚 追跡番号: {order.tracking_number}</p>
                          )}
                        </div>
                      )}
                      {!order.name && (
                        <p style={{ fontSize: '12px', color: '#f97316', marginTop: '6px' }}>⚠️ 住所未入力</p>
                      )}
                    </div>

                    {/* アクション */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                          処理中にする
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <>
                          <input
                            value={trackingInputs[order.id] || ''}
                            onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="追跡番号（任意）"
                            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                            発送済みにする
                          </button>
                        </>
                      )}
                      {order.status === 'shipped' && order.shipped_at && (
                        <p style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>
                          発送日: {new Date(order.shipped_at).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>注文がありません</div>
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
                  style={{ padding: '9px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap' }}>
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
        <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* FP還元率 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><img src="https://hnmcipstsnrgcfusxjst.supabase.co/storage/v1/object/public/images/grok-image-ea8b89e3-0e81-4e12-8f3e-d58ea76bd706.png" style={{ width: '18px', height: '18px', objectFit: 'contain', mixBlendMode: 'multiply' }} alt="コイン" /> FPコイン還元率設定</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>ガチャ消費コイン100に対して何FPを付与するか設定します</p>
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>現在の還元率：</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#f97316' }}>{fpSetting?.fp_rate || 0}</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 100コイン</span>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>例）還元率1.0 → 100コイン消費で1FP付与、1000コイン消費で10FP付与</p>
            </div>
            {editingRate ? (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>新しい還元率</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="number" step="0.1" min="0" value={newRate} onChange={e => setNewRate(e.target.value)}
                    style={{ width: '120px', border: '2px solid #f97316', borderRadius: '8px', padding: '10px 14px', fontSize: '18px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 100コイン</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setEditingRate(false)} style={{ flex: 1, padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                  <button onClick={saveFpRate} style={{ flex: 1, padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingRate(true)} style={{ width: '100%', padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                還元率を変更する
              </button>
            )}
          </div>

          {/* レアリティボーナス */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>🏆 レアリティボーナス設定</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>ガチャ結果の賞ごとに追加付与するFP量を設定します</p>
            {editingBonuses ? (
              <div>
                {[
                  { label: 'S賞ボーナス', value: newSBonus, onChange: setNewSBonus },
                  { label: 'A賞ボーナス', value: newABonus, onChange: setNewABonus },
                  { label: 'B賞ボーナス', value: newBBonus, onChange: setNewBBonus },
                  { label: 'C賞ボーナス', value: newCBonus, onChange: setNewCBonus },
                ].map(({ label, value, onChange }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600', width: '90px' }}>{label}：</span>
                    <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
                      style={{ width: '80px', border: '2px solid #f97316', borderRadius: '8px', padding: '8px 10px', fontSize: '16px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }} />
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>FP</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setEditingBonuses(false)} style={{ flex: 1, padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                  <button onClick={saveBonuses} style={{ flex: 1, padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'S賞', value: fpSetting?.s_bonus ?? 50, color: '#f59e0b' },
                    { label: 'A賞', value: fpSetting?.a_bonus ?? 20, color: '#8b5cf6' },
                    { label: 'B賞', value: fpSetting?.b_bonus ?? 5, color: '#3b82f6' },
                    { label: 'C賞', value: fpSetting?.c_bonus ?? 0, color: '#6b7280' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}：</span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color }}>{value}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>FP</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEditingBonuses(true)} style={{ width: '100%', padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                  ボーナスを変更する
                </button>
              </div>
            )}
          </div>

          {/* ログインボーナス */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>🎁 ログインボーナス設定</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>毎日ログイン時に付与するFP量を設定します</p>
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>現在の付与量：</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#f97316' }}>{fpSetting?.login_bonus ?? 5}</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 日</span>
              </div>
            </div>
            {editingLoginBonus ? (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>新しい付与量</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="number" min="0" value={newLoginBonus} onChange={e => setNewLoginBonus(e.target.value)}
                    style={{ width: '100px', border: '2px solid #f97316', borderRadius: '8px', padding: '10px 14px', fontSize: '18px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>FP / 日</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setEditingLoginBonus(false)} style={{ flex: 1, padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                  <button onClick={saveLoginBonus} style={{ flex: 1, padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingLoginBonus(true)} style={{ width: '100%', padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                付与量を変更する
              </button>
            )}
          </div>

          {/* FP有効期限 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>⏰ FP有効期限設定</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>獲得したFPの有効期限を設定します（0の場合は無期限）</p>
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>現在の有効期限：</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#f97316' }}>{fpSetting?.fp_expiry_months ?? 6}</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>ヶ月</span>
              </div>
            </div>
            {editingExpiry ? (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>新しい有効期限（ヶ月）</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="number" min="0" value={newExpiryMonths} onChange={e => setNewExpiryMonths(e.target.value)}
                    style={{ width: '100px', border: '2px solid #f97316', borderRadius: '8px', padding: '10px 14px', fontSize: '18px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>ヶ月（0＝無期限）</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setEditingExpiry(false)} style={{ flex: 1, padding: '12px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>キャンセル</button>
                  <button onClick={saveExpiry} style={{ flex: 1, padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>保存</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingExpiry(true)} style={{ width: '100%', padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}>
                有効期限を変更する
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
