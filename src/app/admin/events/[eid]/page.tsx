'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Event = {
  id: string
  name: string
  price: number
  total_count: number
  remaining_count: number
  status: string
  description: string
  notes: string
  image_url: string
  category: string
}

type Prize = {
  id: string
  grade: string
  count: number
  remaining_count: number
  pt_exchange: number
  products: { name: string; market_value: number; image_url: string }
}

type Product = {
  id: string
  name: string
  market_value: number
}

type AnimationVideo = {
  id: string
  name: string
  video_url: string
  category: string
}

type GachaOption = {
  id: string
  count: number
  label: string
  color: string
  is_active: boolean
  sort_order: number
}

const grades = ['S賞', 'A賞', 'B賞', 'C賞', 'ラストワン賞']

export default function AdminEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [gachaOptions, setGachaOptions] = useState<GachaOption[]>([])
  const [animationVideos, setAnimationVideos] = useState<AnimationVideo[]>([])
  const [activeTab, setActiveTab] = useState<'prizes' | 'gacha' | 'settings'>('prizes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prizeForm, setPrizeForm] = useState({ product_id: '', grade: 'C賞', count: 1, pt_exchange: 0, animation_video_id: '' })
  const [gachaForm, setGachaForm] = useState({ label: '1回', count: 1, color: '#e67e00' })

  const eid = params.eid as string

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [e, pr, prod, go, av] = await Promise.all([
      supabase.from('events').select('*').eq('id', eid).single(),
      supabase.from('prizes').select('*, products(*)').eq('event_id', eid).order('grade'),
      supabase.from('products').select('id, name, market_value').order('name'),
      supabase.from('gacha_options').select('*').eq('event_id', eid).order('sort_order'),
      supabase.from('animation_videos').select('*').eq('is_active', true).order('sort_order'),
    ])
    if (e.data) setEvent(e.data)
    if (pr.data) setPrizes(pr.data)
    if (prod.data) setProducts(prod.data)
    if (go.data) setGachaOptions(go.data)
    if (av.data) setAnimationVideos(av.data)
    setLoading(false)
  }

  const handleSaveSettings = async () => {
    if (!event) return
    setSaving(true)
    await supabase.from('events').update({
      name: event.name,
      price: event.price,
      total_count: event.total_count,
      description: event.description,
      notes: event.notes,
      image_url: event.image_url,
      category: event.category,
      status: event.status,
    }).eq('id', eid)
    setSaving(false)
    alert('保存しました！')
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `events/${Date.now()}.${ext}`
    await supabase.storage.from('images').upload(fileName, file)
    const { data } = supabase.storage.from('images').getPublicUrl(fileName)
    setEvent((prev) => prev ? { ...prev, image_url: data.publicUrl } : prev)
    setUploading(false)
  }

  const handleAddPrize = async () => {
    if (!prizeForm.product_id) return
    await supabase.from('prizes').insert({
      event_id: eid,
      product_id: prizeForm.product_id,
      grade: prizeForm.grade,
      count: Number(prizeForm.count),
      remaining_count: Number(prizeForm.count),
      pt_exchange: Number(prizeForm.pt_exchange),
      animation_video_id: prizeForm.animation_video_id || null,
    })
    setPrizeForm({ product_id: '', grade: 'C賞', count: 1, pt_exchange: 0, animation_video_id: '' })
    fetchAll()
  }

  const handleDeletePrize = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('prizes').delete().eq('id', id)
    fetchAll()
  }

  const handleAddGachaOption = async () => {
    if (!gachaForm.label) return
    const maxOrder = gachaOptions.length > 0 ? Math.max(...gachaOptions.map(g => g.sort_order)) + 1 : 0
    await supabase.from('gacha_options').insert({
      event_id: eid,
      label: gachaForm.label,
      count: gachaForm.count === -1 ? 9999 : Number(gachaForm.count),
      color: gachaForm.color,
      sort_order: maxOrder,
      is_active: true,
    })
    setGachaForm({ label: '1回', count: 1, color: '#e67e00' })
    fetchAll()
  }

  const handleDeleteGachaOption = async (id: string) => {
    await supabase.from('gacha_options').delete().eq('id', id)
    fetchAll()
  }

  const handleToggleGachaOption = async (id: string, current: boolean) => {
    await supabase.from('gacha_options').update({ is_active: !current }).eq('id', id)
    fetchAll()
  }

  if (loading) return <div style={{ padding: '40px', color: '#999' }}>読み込み中...</div>
  if (!event) return <div style={{ padding: '40px', color: '#999' }}>オリパが見つかりません</div>

  const totalPrizeValue = prizes.reduce((sum, p) => sum + (p.products?.market_value || 0) * p.count, 0)
  const totalSales = event.price * event.total_count
  const profit = totalSales - totalPrizeValue
  const remainingPercent = Math.round((event.remaining_count / event.total_count) * 100)

  const gradeGroups = prizes.reduce((acc, p) => {
    if (!acc[p.grade]) acc[p.grade] = []
    acc[p.grade].push(p)
    return acc
  }, {} as Record<string, Prize[]>)

  const gradeColors: Record<string, string> = {
    'S賞': '#f59e0b', 'A賞': '#8b5cf6', 'B賞': '#3b82f6', 'C賞': '#6b7280', 'ラストワン賞': '#ec4899'
  }

  const categories = [
    { value: 'pokemon', label: 'ポケモン' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/admin/events')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← 戻る</button>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>{event.name}</h1>
          <span style={{ fontSize: '12px', fontWeight: '600', color: event.status === 'active' ? '#10b981' : event.status === 'ended' ? '#ef4444' : '#6b7280', background: event.status === 'active' ? '#f0fdf4' : event.status === 'ended' ? '#fef2f2' : '#f3f4f6', padding: '4px 10px', borderRadius: '999px' }}>
            {event.status === 'active' ? '公開中' : event.status === 'ended' ? '終了' : '下書き'}
          </span>
        </div>
        <a href={'/event/' + event.id} target="_blank" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', border: '1px solid #3b82f6', padding: '6px 14px', borderRadius: '6px' }}>
          サイトで確認 ↗
        </a>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '登録在庫', value: event.total_count + '口', color: '#1f2937' },
          { label: '残り', value: event.remaining_count + '口', color: '#3b82f6' },
          { label: '販売済み', value: (event.total_count - event.remaining_count) + '口', color: '#10b981' },
          { label: '利益見込み', value: (profit >= 0 ? '+' : '') + '¥' + profit.toLocaleString(), color: profit >= 0 ? '#10b981' : '#ef4444' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 在庫バー */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
          <span>残り在庫</span>
          <span>{event.remaining_count}/{event.total_count}</span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '10px' }}>
          <div style={{ background: remainingPercent > 50 ? '#10b981' : remainingPercent > 20 ? '#f59e0b' : '#ef4444', borderRadius: '999px', height: '10px', width: remainingPercent + '%', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        {[
          { key: 'prizes', label: '賞品・在庫' },
          { key: 'gacha', label: 'ガチャ設定' },
          { key: 'settings', label: '基本設定' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#db2777' : '#6b7280', borderBottom: activeTab === tab.key ? '2px solid #db2777' : '2px solid transparent', marginBottom: '-2px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 賞品タブ */}
      {activeTab === 'prizes' && (
        <div>
          {/* 損益 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>売上見込み</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>¥{totalSales.toLocaleString()}</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>賞品原価</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>¥{totalPrizeValue.toLocaleString()}</div>
            </div>
            <div style={{ background: profit >= 0 ? '#eff6ff' : '#fef2f2', border: '1px solid', borderColor: profit >= 0 ? '#bfdbfe' : '#fecaca', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>利益見込み</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: profit >= 0 ? '#3b82f6' : '#ef4444' }}>{profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}</div>
            </div>
          </div>

          {/* 賞品追加 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>賞品を追加</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>カード</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', background: 'white', boxSizing: 'border-box' }} value={prizeForm.product_id} onChange={(e) => setPrizeForm({ ...prizeForm, product_id: e.target.value })}>
                  <option value="">カードを選択</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}（¥{p.market_value?.toLocaleString()}）</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>賞品ランク</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', background: 'white', boxSizing: 'border-box' }} value={prizeForm.grade} onChange={(e) => setPrizeForm({ ...prizeForm, grade: e.target.value })}>
                  {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>口数</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }} value={prizeForm.count} onChange={(e) => setPrizeForm({ ...prizeForm, count: Number(e.target.value) })} min={1} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>PT交換</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }} value={prizeForm.pt_exchange} onChange={(e) => setPrizeForm({ ...prizeForm, pt_exchange: Number(e.target.value) })} />
              </div>
            </div>
            <button onClick={handleAddPrize} disabled={!prizeForm.product_id} style={{ background: !prizeForm.product_id ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: !prizeForm.product_id ? 'not-allowed' : 'pointer' }}>追加</button>
          </div>

          {/* 賞品一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {grades.filter(g => gradeGroups[g]).map((grade) => (
              <div key={grade} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px', background: '#f9fafb' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gradeColors[grade] || '#6b7280' }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{grade}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{gradeGroups[grade]?.reduce((s, p) => s + p.count, 0)}口</span>
                </div>
                {gradeGroups[grade]?.map((prize) => (
                  <div key={prize.id} style={{ padding: '12px 16px', borderTop: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {prize.products?.image_url && <img src={prize.products.image_url} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>{prize.products?.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{prize.count}口 / PT交換:{prize.pt_exchange}pt / ¥{prize.products?.market_value?.toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleDeletePrize(prize.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ガチャ設定タブ */}
      {activeTab === 'gacha' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>ガチャボタンを追加</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>ボタン名</label>
                <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', boxSizing: 'border-box' }} value={gachaForm.label} onChange={(e) => setGachaForm({ ...gachaForm, label: e.target.value })} placeholder="例：10連" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>連数</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', background: 'white', boxSizing: 'border-box' }} value={gachaForm.count} onChange={(e) => setGachaForm({ ...gachaForm, count: Number(e.target.value) })}>
                  <option value={1}>1回</option>
                  <option value={3}>3連</option>
                  <option value={5}>5連</option>
                  <option value={7}>7連</option>
                  <option value={10}>10連</option>
                  <option value={20}>20連</option>
                  <option value={50}>50連</option>
                  <option value={100}>100連</option>
                  <option value={-1}>ラストまで全部</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>ボタン色</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} value={gachaForm.color} onChange={(e) => setGachaForm({ ...gachaForm, color: e.target.value })} />
                  <div style={{ flex: 1, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['#e67e00', '#c0392b', '#8e44ad', '#2980b9', '#27ae60', '#1a1a2e'].map((c) => (
                      <div key={c} onClick={() => setGachaForm({ ...gachaForm, color: c })} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: gachaForm.color === c ? '2px solid #1f2937' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={handleAddGachaOption} disabled={!gachaForm.label} style={{ background: !gachaForm.label ? '#9ca3af' : '#db2777', color: 'white', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: !gachaForm.label ? 'not-allowed' : 'pointer' }}>追加</button>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                プレビュー：
                <span style={{ display: 'inline-block', padding: '6px 16px', background: gachaForm.color, color: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: '900', marginLeft: '8px' }}>{gachaForm.label}</span>
              </div>
            </div>
          </div>

          {gachaOptions.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              まだガチャボタンが設定されていません
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>設定済みボタン</div>
              {gachaOptions.map((opt, index) => (
                <div key={opt.id} style={{ padding: '14px 16px', borderTop: index > 0 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'inline-block', padding: '8px 20px', background: opt.color, color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '900', minWidth: '80px', textAlign: 'center' }}>{opt.label}</span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{opt.count >= 9999 ? 'ラストまで全部' : opt.count + '連'}</span>
                  <span style={{ fontSize: '11px', color: opt.is_active ? '#10b981' : '#6b7280', background: opt.is_active ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: '999px' }}>{opt.is_active ? '表示中' : '非表示'}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleToggleGachaOption(opt.id, opt.is_active)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>{opt.is_active ? '非表示' : '表示'}</button>
                    <button onClick={() => handleDeleteGachaOption(opt.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 基本設定タブ */}
      {activeTab === 'settings' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>オリパ名</label>
              <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={event.name} onChange={(e) => setEvent({ ...event, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>価格（pt）</label>
                <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={event.price} onChange={(e) => setEvent({ ...event, price: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>カテゴリー</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} value={event.category} onChange={(e) => setEvent({ ...event, category: e.target.value })}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>ステータス</label>
                <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }} value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })}>
                  <option value="draft">下書き</option>
                  <option value="active">公開中</option>
                  <option value="ended">終了</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>説明文</label>
              <textarea style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }} value={event.description || ''} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>注意事項</label>
              <textarea style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }} value={event.notes || ''} onChange={(e) => setEvent({ ...event, notes: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>バナー画像</label>
              <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f) }} onDragOver={(e) => e.preventDefault()} onClick={() => document.getElementById('settings-image-input')?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '8px' }}>
                {uploading ? <div style={{ color: '#6b7280', fontSize: '13px' }}>アップロード中...</div> : <div style={{ fontSize: '13px', color: '#6b7280' }}>クリックまたはドラッグ&ドロップで変更</div>}
              </div>
              <input id="settings-image-input" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} style={{ display: 'none' }} />
              <input style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} value={event.image_url || ''} onChange={(e) => setEvent({ ...event, image_url: e.target.value })} placeholder="画像URL" />
              {event.image_url && <img src={event.image_url} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />}
            </div>
            <button onClick={handleSaveSettings} disabled={saving} style={{ background: saving ? '#9ca3af' : '#db2777', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '保存中...' : '変更を保存する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}