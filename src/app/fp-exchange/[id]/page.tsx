'use client'
import BottomNav from '@/components/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  category_id: string
  fp_exchange_categories: { name: string } | null
}

export default function FpExchangeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [item, setItem] = useState<Item | null>(null)
  const [userFp, setUserFp] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [exchanging, setExchanging] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        fetchUserFp(session.user.id)
      }
    })
    fetchItem()
  }, [id])

  const fetchUserFp = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('fp_points').eq('id', uid).single()
    if (data) setUserFp(data.fp_points || 0)
  }

  const fetchItem = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fp_exchange_items')
      .select('*, fp_exchange_categories(name)')
      .eq('id', id)
      .single()
    if (data) setItem(data)
    setLoading(false)
  }

  const handleExchange = async () => {
    if (!userId || !item) return
    if (userFp < item.fp_price) return alert('FPが不足しています')
    if (item.remaining_stock <= 0) return alert('在庫がありません')
    setExchanging(true)
    try {
      // FP消費
      const { error: fpError } = await supabase
        .from('profiles')
        .update({ fp_points: userFp - item.fp_price })
        .eq('id', userId)
      if (fpError) throw fpError

      // 在庫減らす
      const { error: stockError } = await supabase
        .from('fp_exchange_items')
        .update({ remaining_stock: item.remaining_stock - 1 })
        .eq('id', item.id)
      if (stockError) throw stockError

      // 交換履歴
      await supabase.from('fp_exchange_orders').insert({
        user_id: userId,
        item_id: item.id,
        fp_used: item.fp_price,
      })

      setUserFp(prev => prev - item.fp_price)
      setItem(prev => prev ? { ...prev, remaining_stock: prev.remaining_stock - 1 } : prev)
      setShowConfirm(false)
      setDone(true)
    } catch (e) {
      alert('エラーが発生しました')
    }
    setExchanging(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center', color: '#999' }}>読み込み中...</div>
      <BottomNav />
    </div>
  )

  if (!item) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center', color: '#999' }}>商品が見つかりません</div>
    </div>
  )

  const canExchange = userId && userFp >= item.fp_price && item.remaining_stock > 0

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/fp-exchange')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← FP交換所一覧へ戻る
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '999px', padding: '6px 14px' }}>
            <span style={{ fontSize: '18px' }}>🪙</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ea580c' }}>{userFp.toLocaleString()}</span>
            <span style={{ fontSize: '12px', color: '#9a3412' }}>FP</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>
        {/* 商品画像 */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', minHeight: '280px' }}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '80px' }}>🎴</span>
            )}
          </div>
        </div>

        {/* 商品情報カード */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>{item.name}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>残り {item.remaining_stock} 枚</p>

          {/* FP価格 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🪙</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#ea580c' }}>{item.fp_price.toLocaleString()}</span>
            <span style={{ fontSize: '16px', color: '#9a3412', fontWeight: '700' }}>FP</span>
          </div>

          {/* 交換ボタン */}
          {item.remaining_stock === 0 ? (
            <div style={{ textAlign: 'center', background: '#f3f4f6', borderRadius: '12px', padding: '16px', color: '#9ca3af', fontWeight: '700', fontSize: '16px' }}>
              SOLD OUT
            </div>
          ) : !userId ? (
            <button onClick={() => router.push('/auth/login')} style={{ width: '100%', padding: '16px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
              ログインして交換する
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canExchange}
              style={{ width: '100%', padding: '16px', background: canExchange ? '#ea580c' : '#9ca3af', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: canExchange ? 'pointer' : 'not-allowed' }}>
              {userFp < item.fp_price ? `FP不足（あと${(item.fp_price - userFp).toLocaleString()}FP必要）` : '交換する'}
            </button>
          )}
        </div>

        {/* 商品詳細 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }}>商品の詳細</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {item.fp_exchange_categories?.name && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '80px' }}>カテゴリー</span>
                <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>{item.fp_exchange_categories.name}</span>
              </div>
            )}
            {item.item_code && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '80px' }}>型番</span>
                <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>{item.item_code}</span>
              </div>
            )}
            {item.rarity && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '80px' }}>レアリティ</span>
                <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>{item.rarity}</span>
              </div>
            )}
            {item.description && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '80px' }}>説明</span>
                <span style={{ fontSize: '13px', color: '#1f2937' }}>{item.description}</span>
              </div>
            )}
            {item.notes && (
              <div style={{ marginTop: '8px', background: '#fef9c3', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '12px', color: '#713f12', lineHeight: '1.6' }}>⚠️ {item.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 確認モーダル */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px 24px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', textAlign: 'center', marginBottom: '8px' }}>交換の確認</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginBottom: '20px' }}>{item.name}</p>
            <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '14px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '22px' }}>🪙</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#ea580c', marginLeft: '6px' }}>{item.fp_price.toLocaleString()} FP</span>
              <p style={{ fontSize: '12px', color: '#9a3412', marginTop: '4px' }}>残り {(userFp - item.fp_price).toLocaleString()} FP</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '14px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '700' }}>
                キャンセル
              </button>
              <button onClick={handleExchange} disabled={exchanging} style={{ flex: 1, padding: '14px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '800' }}>
                {exchanging ? '処理中...' : '交換する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 完了モーダル */}
      {done && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>交換完了！</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>商品の発送をお待ちください</p>
            <button onClick={() => router.push('/fp-exchange')} style={{ width: '100%', padding: '14px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
              交換所トップへ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
