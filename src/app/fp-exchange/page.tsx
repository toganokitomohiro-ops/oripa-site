'use client'
import BottomNav from '@/components/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
}

type Item = {
  id: string
  name: string
  image_url: string
  fp_price: number
  remaining_stock: number
  rarity: string
  category_id: string
}

export default function FpExchangePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [userFp, setUserFp] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserFp(session.user.id)
    })
    fetchCategories()
    fetchItems()
  }, [])

  const fetchUserFp = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('fp_points').eq('id', userId).single()
    if (data) setUserFp(data.fp_points || 0)
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('fp_exchange_categories').select('*').order('sort_order')
    if (data) setCategories(data)
  }

  const fetchItems = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fp_exchange_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (data) setItems(data)
    setLoading(false)
  }

  const filtered = activeCategory === 'all'
    ? items
    : items.filter(i => i.category_id === activeCategory)

  const navItems = [
    { href: '/', icon: '🎴', label: 'オリパガチャ' },
    { href: '/prizes', icon: '🏆', label: '獲得商品' },
    { href: '/history', icon: '🕐', label: '当選履歴' },
    { href: '/fp-exchange', icon: '🪙', label: 'FP交換所', active: true },
    { href: '/mypage', icon: '👤', label: 'マイページ' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '999px', padding: '6px 14px' }}>
            <span style={{ fontSize: '18px' }}>🪙</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ea580c' }}>{userFp.toLocaleString()}</span>
            <span style={{ fontSize: '12px', color: '#9a3412' }}>FP</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        {/* タイトル */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>🪙 FPコイン交換所</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>ガチャで貯めたFPコインを商品と交換できます</p>
        </div>

        {/* カテゴリータブ */}
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content', paddingBottom: '4px' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '8px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap',
                background: activeCategory === 'all' ? '#ea580c' : 'white',
                color: activeCategory === 'all' ? 'white' : '#374151',
                boxShadow: activeCategory === 'all' ? '0 2px 8px rgba(234,88,12,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}>
              すべて（{items.length}）
            </button>
            {categories.map(cat => {
              const count = items.filter(i => i.category_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '8px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap',
                    background: activeCategory === cat.id ? '#ea580c' : 'white',
                    color: activeCategory === cat.id ? 'white' : '#374151',
                    boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(234,88,12,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                  {cat.name}（{count}）
                </button>
              )
            })}
          </div>
        </div>

        {/* 商品グリッド */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🪙</div>
            <div style={{ fontSize: '15px' }}>商品がありません</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => router.push(`/fp-exchange/${item.id}`)}
                style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #e5e7eb', position: 'relative' }}
              >
                {/* SOLD OUT オーバーレイ */}
                {item.remaining_stock === 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '12px' }}>
                    <div style={{ background: '#ef4444', color: 'white', fontWeight: '900', fontSize: '16px', padding: '8px 20px', borderRadius: '6px', letterSpacing: '2px' }}>SOLD OUT</div>
                  </div>
                )}
                {/* 商品画像 */}
                <div style={{ background: '#f9fafb', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                  ) : (
                    <span style={{ fontSize: '48px' }}>🎴</span>
                  )}
                </div>
                {/* 商品情報 */}
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>残り {item.remaining_stock} 枚</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', borderRadius: '6px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '14px' }}>🪙</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#ea580c' }}>{item.fp_price.toLocaleString()}</span>
                    <span style={{ fontSize: '11px', color: '#9a3412' }}>FP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッターナビ */}
      <BottomNav />
    </div>
  )
}
