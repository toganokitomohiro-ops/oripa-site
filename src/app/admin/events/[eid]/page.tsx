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
  prize_animation_videos?: { id: string; animation_video_id: string; animation_videos: { id: string; name: string; video_url: string } }[]
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
  const [prizeViewMode, setPrizeViewMode] = useState<'grid' | 'list'>('list')
  const [activeTab, setActiveTab] = useState<'prizes' | 'grade_videos' | 'gacha' | 'settings'>('prizes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prizeForm, setPrizeForm] = useState({ product_id: '', grade: 'C賞', count: 1, pt_exchange: 0 })
  const [videoModalPrizeId, setVideoModalPrizeId] = useState<string | null>(null)
  const [gradeVideos, setGradeVideos] = useState<{id:string,grade:string,animation_video_id:string,animation_videos:{id:string,name:string,video_url:string}}[]>([])
  const [gradeVideoForm, setGradeVideoForm] = useState({ grade: 'S賞', animation_video_id: '' })
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [videoSearch, setVideoSearch] = useState('')
  const [videoFilterCategory, setVideoFilterCategory] = useState('all')
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [animationCategories, setAnimationCategories] = useState<{id:string,name:string,value:string}[]>([])
  const [gachaForm, setGachaForm] = useState<{ label: string; count: number; color: string; editing_id?: string }>({ label: '1回', count: 1, color: '#e67e00' })

  const eid = params.eid as string

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [e, pr, prod, go, av, ac] = await Promise.all([
      supabase.from('events').select('*').eq('id', eid).single(),
      supabase.from('prizes').select('*, products(*), prize_animation_videos(id, animation_video_id, animation_videos(id, name, video_url))').eq('event_id', eid).order('grade'),
      supabase.from('products').select('id, name, market_value').order('name'),
      supabase.from('gacha_options').select('*').eq('event_id', eid).order('sort_order'),
      supabase.from('animation_videos').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('animation_categories').select('*').order('sort_order'),
    ])
    if (e.data) setEvent(e.data)
    if (pr.data) setPrizes(pr.data)
    if (prod.data) setProducts(prod.data)
    if (go.data) setGachaOptions(go.data)
    if (av.data) setAnimationVideos(av.data)
    if (ac.data) setAnimationCategories(ac.data)
    const { data: gv } = await supabase.from('grade_animation_videos').select('*, animation_videos(id, name, video_url)').eq('event_id', eid)
    if (gv) setGradeVideos(gv)
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
    const fileName = `events/${Date.now()}.jpg`
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
    })
    setPrizeForm({ product_id: '', grade: 'C賞', count: 1, pt_exchange: 0 })
    fetchAll()
  }

  const handleDeletePrize = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('prizes').delete().eq('id', id)
    fetchAll()
  }
  const handleAddPrizeVideo = async () => {
    if (!videoModalPrizeId || !selectedVideoId) return
    await supabase.from('prize_animation_videos').insert({
      prize_id: videoModalPrizeId,
      animation_video_id: selectedVideoId,
    })
    setSelectedVideoId('')
    fetchAll()
  }
  const handleDeletePrizeVideo = async (id: string) => {
    await supabase.from('prize_animation_videos').delete().eq('id', id)
    fetchAll()
  }

  const handleAddGachaOption = async () => {
    if (!gachaForm.label) return
    if (gachaForm.editing_id) {
      await supabase.from('gacha_options').update({
        label: gachaForm.label,
        count: gachaForm.count === -1 ? 9999 : Number(gachaForm.count),
        color: gachaForm.color,
      }).eq('id', gachaForm.editing_id)
    } else {
      const maxOrder = gachaOptions.length > 0 ? Math.max(...gachaOptions.map(g => g.sort_order)) + 1 : 0
      await supabase.from('gacha_options').insert({
        event_id: eid,
        label: gachaForm.label,
        count: gachaForm.count === -1 ? 9999 : Number(gachaForm.count),
        color: gachaForm.color,
        sort_order: maxOrder,
        is_active: true,
      })
    }
    setGachaForm({ label: '1回', count: 1, color: '#e67e00' })
    fetchAll()
  }

  const handleDeleteGachaOption = async (id: string) => {
    if (!confirm('このガチャボタンを削除しますか？')) return
    await supabase.from('gacha_options').delete().eq('id', id)
    fetchAll()
  }

  const handleMoveGachaOption = async (index: number, direction: 'up' | 'down') => {
    const newOptions = [...gachaOptions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOptions.length) return
    const temp = newOptions[index].sort_order
    newOptions[index].sort_order = newOptions[targetIndex].sort_order
    newOptions[targetIndex].sort_order = temp
    await supabase.from('gacha_options').update({ sort_order: newOptions[index].sort_order }).eq('id', newOptions[index].id)
    await supabase.from('gacha_options').update({ sort_order: newOptions[targetIndex].sort_order }).eq('id', newOptions[targetIndex].id)
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
          { key: 'grade_videos', label: '賞別動画' },
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>登録済み賞品</div>
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setPrizeViewMode('grid')} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: prizeViewMode === 'grid' ? 'white' : 'transparent', fontSize: '14px' }}>⊞</button>
              <button onClick={() => setPrizeViewMode('list')} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: prizeViewMode === 'list' ? 'white' : 'transparent', fontSize: '14px' }}>☰</button>
            </div>
          </div>
{prizeViewMode === 'list' ? (
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
                      <button onClick={() => { setVideoModalPrizeId(prize.id); setSelectedVideoId('') }} style={{ fontSize: '12px', color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', marginRight: '6px' }}>
                        🎬 動画{(prize.prize_animation_videos?.length ?? 0) > 0 ? `(${prize.prize_animation_videos!.length})` : ''}
                      </button>
                      <button onClick={() => handleDeletePrize(prize.id)} style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>削除</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {grades.filter(g => gradeGroups[g]).map((grade) => (
                <div key={grade}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gradeColors[grade] || '#6b7280' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{grade}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{gradeGroups[grade]?.reduce((s, p) => s + p.count, 0)}口</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                    {gradeGroups[grade]?.map((prize) => (
                      <div key={prize.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ aspectRatio: '3/4', background: '#f3f4f6', overflow: 'hidden' }}>
                          {prize.products?.image_url
                            ? <img src={prize.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🃏</div>
                          }
                        </div>
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#1f2937', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prize.products?.name}</div>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>{prize.count}口 / {prize.pt_exchange}pt</div>
                          <button onClick={() => handleDeletePrize(prize.id)} style={{ width: '100%', fontSize: '11px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {['#e67e00', '#c0392b', '#8e44ad', '#2980b9', '#27ae60', '#1a1a2e', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', 'linear-gradient(135deg, #f59e0b, #ef4444)', 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 'linear-gradient(135deg, #f43f5e, #f59e0b, #84cc16, #3b82f6, #8b5cf6)'].map((c) => (
                      <div key={c} onClick={() => setGachaForm({ ...gachaForm, color: c })} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: gachaForm.color === c ? '2px solid #1f2937' : '2px solid transparent', flexShrink: 0 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={handleAddGachaOption} disabled={!gachaForm.label} style={{ background: !gachaForm.label ? '#9ca3af' : gachaForm.editing_id ? '#2980b9' : '#db2777', color: 'white', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: !gachaForm.label ? 'not-allowed' : 'pointer' }}>{gachaForm.editing_id ? '更新' : '追加'}</button>
              {gachaForm.editing_id && <button onClick={() => setGachaForm({ label: '1回', count: 1, color: '#e67e00' })} style={{ background: 'none', color: '#6b7280', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>キャンセル</button>}
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
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* 並び替えボタン */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button onClick={() => handleMoveGachaOption(index, 'up')} disabled={index === 0} style={{ fontSize: '10px', color: index === 0 ? '#d1d5db' : '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 6px', cursor: index === 0 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>↑</button>
                      <button onClick={() => handleMoveGachaOption(index, 'down')} disabled={index === gachaOptions.length - 1} style={{ fontSize: '10px', color: index === gachaOptions.length - 1 ? '#d1d5db' : '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 6px', cursor: index === gachaOptions.length - 1 ? 'not-allowed' : 'pointer', lineHeight: 1 }}>↓</button>
                    </div>
                    <button onClick={() => setGachaForm({ label: opt.label, count: opt.count >= 9999 ? -1 : opt.count, color: opt.color, editing_id: opt.id })} style={{ fontSize: '12px', color: '#2980b9', background: 'none', border: '1px solid #93c5fd', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>編集</button>
                    <button onClick={() => handleToggleGachaOption(opt.id, opt.is_active)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>{opt.is_active ? '非表示' : '表示'}</button>
                    <button onClick={() => handleDeleteGachaOption(opt.id)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>削除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 基本設定タブ */}
      {activeTab === 'grade_videos' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>🎬 賞ごとの演出動画</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>カードに動画が設定されていない場合、ここで設定した動画が再生されます。</p>

          {/* 追加フォーム */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>賞</label>
              <select value={gradeVideoForm.grade} onChange={(e) => setGradeVideoForm({...gradeVideoForm, grade: e.target.value})}
                style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', background: 'white' }}>
                {['S賞','A賞','B賞','C賞','ラストワン賞'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>動画</label>
              <select value={gradeVideoForm.animation_video_id} onChange={(e) => setGradeVideoForm({...gradeVideoForm, animation_video_id: e.target.value})}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', background: 'white' }}>
                <option value="">動画を選択してください</option>
                {animationVideos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <button
              onClick={async () => {
                if (!gradeVideoForm.animation_video_id) return
                await supabase.from('grade_animation_videos').insert({ event_id: eid, grade: gradeVideoForm.grade, animation_video_id: gradeVideoForm.animation_video_id })
                const { data: gv } = await supabase.from('grade_animation_videos').select('*, animation_videos(id, name, video_url)').eq('event_id', eid)
                if (gv) setGradeVideos(gv)
                setGradeVideoForm({ grade: 'S賞', animation_video_id: '' })
              }}
              disabled={!gradeVideoForm.animation_video_id}
              style={{ padding: '8px 20px', background: gradeVideoForm.animation_video_id ? '#7c3aed' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: gradeVideoForm.animation_video_id ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
              追加
            </button>
          </div>

          {/* 登録済み一覧 */}
          {gradeVideos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', color: '#9ca3af', fontSize: '14px' }}>
              まだ登録されていません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['ラストワン賞','S賞','A賞','B賞','C賞'].map(grade => {
                const vids = gradeVideos.filter(v => v.grade === grade)
                if (vids.length === 0) return null
                return (
                  <div key={grade}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>{grade}</div>
                    {vids.map(v => (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎬</span>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{v.animation_videos?.name || '不明'}</span>
                        </div>
                        <button onClick={async () => {
                          if (!confirm('削除しますか？')) return
                          await supabase.from('grade_animation_videos').delete().eq('id', v.id)
                          const { data: gv } = await supabase.from('grade_animation_videos').select('*, animation_videos(id, name, video_url)').eq('event_id', eid)
                          if (gv) setGradeVideos(gv)
                        }} style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>削除</button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
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
    {/* 動画設定モーダル */}
    {videoModalPrizeId && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>🎬 演出動画の設定</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{prizes.find(p => p.id === videoModalPrizeId)?.products?.name}</p>
            </div>
            <button onClick={() => { setVideoModalPrizeId(null); setPreviewVideoUrl(null); setVideoSearch(''); setVideoFilterCategory('all') }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>
          <div style={{ overflow: 'auto', padding: '20px 24px', flex: 1 }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>登録済み動画（{prizes.find(p => p.id === videoModalPrizeId)?.prize_animation_videos?.length || 0}本）</div>
              {(prizes.find(p => p.id === videoModalPrizeId)?.prize_animation_videos?.length || 0) === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', padding: '16px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>動画が登録されていません</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prizes.find(p => p.id === videoModalPrizeId)?.prize_animation_videos?.map((pv: any) => (
                    <div key={pv.id} style={{ background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>🎬</span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{pv.animation_videos?.name || '不明'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setPreviewVideoUrl(previewVideoUrl === pv.animation_videos?.video_url ? null : pv.animation_videos?.video_url)} style={{ fontSize: '12px', color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>{previewVideoUrl === pv.animation_videos?.video_url ? '閉じる' : '▶ 再生'}</button>
                          <button onClick={() => { if (confirm('この動画を削除しますか？')) handleDeletePrizeVideo(pv.id) }} style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>削除</button>
                        </div>
                      </div>
                      {previewVideoUrl === pv.animation_videos?.video_url && (
                        <video src={pv.animation_videos?.video_url} autoPlay controls style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#000' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>動画を追加</div>
              <input value={videoSearch} onChange={(e) => setVideoSearch(e.target.value)} placeholder="🔍 動画名で検索..."
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button onClick={() => setVideoFilterCategory('all')} style={{ padding: '4px 12px', borderRadius: '999px', border: '1px solid', borderColor: videoFilterCategory === 'all' ? '#7c3aed' : '#e5e7eb', background: videoFilterCategory === 'all' ? '#f5f3ff' : 'white', color: videoFilterCategory === 'all' ? '#7c3aed' : '#6b7280', fontSize: '12px', cursor: 'pointer' }}>すべて</button>
                {animationCategories.map(c => (
                  <button key={c.id} onClick={() => setVideoFilterCategory(c.value)} style={{ padding: '4px 12px', borderRadius: '999px', border: '1px solid', borderColor: videoFilterCategory === c.value ? '#7c3aed' : '#e5e7eb', background: videoFilterCategory === c.value ? '#f5f3ff' : 'white', color: videoFilterCategory === c.value ? '#7c3aed' : '#6b7280', fontSize: '12px', cursor: 'pointer' }}>{c.name}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                {animationVideos.filter(v => (videoFilterCategory === 'all' || v.category === videoFilterCategory) && (!videoSearch || v.name.includes(videoSearch))).map(v => (
                  <div key={v.id} style={{ border: '1px solid', borderColor: selectedVideoId === v.id ? '#7c3aed' : '#e5e7eb', borderRadius: '8px', overflow: 'hidden', background: selectedVideoId === v.id ? '#f5f3ff' : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }} onClick={() => setSelectedVideoId(selectedVideoId === v.id ? '' : v.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid', borderColor: selectedVideoId === v.id ? '#7c3aed' : '#d1d5db', background: selectedVideoId === v.id ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedVideoId === v.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{v.name}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px' }}>{animationCategories.find(c => c.value === v.category)?.name || v.category}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setPreviewVideoUrl(previewVideoUrl === v.video_url ? null : v.video_url) }} style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>{previewVideoUrl === v.video_url ? '閉じる' : '▶'}</button>
                    </div>
                    {previewVideoUrl === v.video_url && (
                      <video src={v.video_url} autoPlay controls style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', background: '#000' }} />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleAddPrizeVideo} disabled={!selectedVideoId} style={{ width: '100%', padding: '12px', background: selectedVideoId ? '#7c3aed' : '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: selectedVideoId ? 'pointer' : 'not-allowed', marginTop: '12px' }}>追加する</button>
            </div>
          </div>
          <div style={{ padding: '12px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>複数登録するとランダムで再生されます。最高グレードの動画が優先されます。</p>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
