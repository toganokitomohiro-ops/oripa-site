'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [cols, setCols] = useState('repeat(2, 1fr)')
  const [showLoginBonus, setShowLoginBonus] = useState(false)
  const [loginBonusAmount, setLoginBonusAmount] = useState(0)

  useEffect(() => {
    const update = () => setCols(window.innerWidth >= 768 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const checkFpSystem = async (uid: string) => {
    await fetch('/api/fp-expire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid }),
    })
    const res = await fetch('/api/login-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid }),
    })
    const data = await res.json()
    if (!data.alreadyReceived && data.bonus > 0) {
      setLoginBonusAmount(data.bonus)
      setShowLoginBonus(true)
      setTimeout(() => setShowLoginBonus(false), 3000)
    }
    fetchUserFp(uid)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true)
        checkFpSystem(session.user.id)
      } else {
        setIsLoggedIn(false)
      }
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '70px' }}>
      {showLoginBonus && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white', borderRadius: '12px', padding: '12px 24px',
          boxShadow: '0 4px 20px rgba(34,197,94,0.4)', zIndex: 9999,
          fontSize: '15px', fontWeight: '800', whiteSpace: 'nowrap',
        }}>
          🎉 ログインボーナス +{loginBonusAmount}FPコイン 獲得！
        </div>
      )}
      <Header />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>

        {/* FP残高バナー */}
        {isLoggedIn === true && (
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(34,197,94,0.35)'
          }}>
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px', fontWeight: '600' }}>あなたのFPコイン残高</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px' }}>👟</span>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>{userFp.toLocaleString()}</span>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>FPコイン</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>ガチャを回すと<br />FPが貯まります</p>
            </div>
          </div>
        )}

        {/* 未ログインバナー */}
        {isLoggedIn === false && (
          <div style={{
            background: 'white',
            border: '2px dashed #f97316',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <p style={{ fontSize: '14px', color: '#374151' }}>👟 ログインするとFPコイン残高を確認できます</p>
            <a href="/auth/login" style={{
              fontSize: '13px', fontWeight: '700', color: 'white',
              background: '#22c55e', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none'
            }}>ログイン</a>
          </div>
        )}

        {/* タイトル */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>👟 FPコイン交換所</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>ガチャを回すともらえるFPコインを商品と交換できます</p>
        </div>

        {/* カテゴリータブ */}
        <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', borderRadius: '12px 12px 0 0', marginBottom: '16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', minWidth: 'max-content' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '14px 20px', fontSize: '14px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                color: activeCategory === 'all' ? '#22c55e' : '#666',
                borderBottom: activeCategory === 'all' ? '3px solid #22c55e' : '3px solid transparent',
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
                    padding: '14px 20px', fontSize: '14px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                    color: activeCategory === cat.id ? '#22c55e' : '#666',
                    borderBottom: activeCategory === cat.id ? '3px solid #22c55e' : '3px solid transparent',
                  }}>
                  {cat.name}（{count}）
                </button>
              )
            })}
          </div>
        </div>

        {/* 商品グリッド */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <img src="/characters/alpoo-standby.png" alt="あるぷー" style={{ width: '96px', height: 'auto', marginBottom: '12px', mixBlendMode: 'multiply' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>商品がありません</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>別のカテゴリーも確認してみてください</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '12px' }}>
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
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '48px' }}>🎴</span>
                  )}
                </div>
                {/* 商品情報 */}
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
                  {item.remaining_stock > 0 && item.remaining_stock <= 3 ? (
                    <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', marginBottom: '8px' }}>残りわずか！（{item.remaining_stock}枚）</p>
                  ) : item.remaining_stock > 0 ? (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>残り {item.remaining_stock} 枚</p>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', borderRadius: '6px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '14px' }}>👟</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#22c55e' }}>{item.fp_price.toLocaleString()}</span>
                    <span style={{ fontSize: '11px', color: '#15803d' }}>FPコイン</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
