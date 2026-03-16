'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  image_url: string
  category: string
  market_value: number
  psa_grade: string
  created_at: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortBy, setSortBy] = useState('newest')

  const categories = [
    { value: 'pokemon', label: 'ポケモンカード' },
    { value: 'onepiece', label: 'ワンピース' },
    { value: 'yugioh', label: '遊戯王' },
    { value: 'other', label: 'その他' },
  ]

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('削除しますか？')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const getPsaBadge = (grade: string) => {
    if (grade === 'PSA10') return { bg: '#dc2626', text: 'PSA 10' }
    if (grade === 'PSA9') return { bg: '#d97706', text: 'PSA 9' }
    if (grade === 'PSA8') return { bg: '#2563eb', text: 'PSA 8' }
    if (grade === 'PSA7') return { bg: '#6b7280', text: 'PSA 7' }
    return null
  }

  const filteredProducts = products
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'all' || p.category === filterCategory
      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'price_high') return (b.market_value || 0) - (a.market_value || 0)
      if (sortBy === 'price_low') return (a.market_value || 0) - (b.market_value || 0)
      if (sortBy === 'name') return a.name?.localeCompare(b.name || '') || 0
      return 0
    })

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>商品マスター</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>オリパで使用する商品を管理</p>
        </div>
        <button
          onClick={() => router.push('/admin/products/new')}
          style={{ background: '#db2777', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(219,39,119,0.3)' }}
        >
          ＋ 新規追加
        </button>
      </div>

      {/* 検索・フィルターバー */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
        {/* 検索 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
            <input
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px 12px 9px 36px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="カード名で検索..."
            />
          </div>
          <select
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', background: 'white', cursor: 'pointer', color: '#374151' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">作成日（新しい順）</option>
            <option value="oldest">作成日（古い順）</option>
            <option value="price_high">価格（高い順）</option>
            <option value="price_low">価格（低い順）</option>
            <option value="name">名前順</option>
          </select>
          {/* 表示切替 */}
          <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('card')}
              style={{ padding: '8px 14px', background: viewMode === 'card' ? '#f3f4f6' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', color: viewMode === 'card' ? '#1f2937' : '#9ca3af' }}
              title="カード表示"
            >⊞</button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '8px 14px', background: viewMode === 'list' ? '#f3f4f6' : 'white', border: 'none', cursor: 'pointer', fontSize: '16px', color: viewMode === 'list' ? '#1f2937' : '#9ca3af', borderLeft: '1px solid #e5e7eb' }}
              title="リスト表示"
            >☰</button>
          </div>
        </div>

        {/* カテゴリーフィルター */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginRight: '4px' }}>カテゴリー:</span>
          {[{ value: 'all', label: 'すべて' }, ...categories].map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', border: '1px solid', borderColor: filterCategory === c.value ? '#db2777' : '#e5e7eb', background: filterCategory === c.value ? '#fdf2f8' : 'white', color: filterCategory === c.value ? '#db2777' : '#6b7280', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {c.label}
            </button>
          ))}
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{filteredProducts.length}件</span>
        </div>
      </div>

      {/* 商品一覧 */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#9ca3af' }}>読み込み中...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🃏</div>
          <div style={{ fontSize: '15px', marginBottom: '8px' }}>商品が見つかりません</div>
          <button onClick={() => router.push('/admin/products/new')} style={{ marginTop: '8px', padding: '8px 20px', background: '#db2777', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>最初の商品を登録する</button>
        </div>
      ) : viewMode === 'card' ? (
        /* カード表示 */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px' }}>
          {filteredProducts.map((product) => {
            const badge = getPsaBadge(product.psa_grade)
            return (
              <div
                key={product.id}
                onClick={() => router.push('/admin/products/' + product.id)}
                style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ position: 'relative', paddingBottom: '130%', background: '#f3f4f6' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.2 }}>🎴</div>
                  )}
                  {badge && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px', background: badge.bg, color: 'white', fontSize: '9px', fontWeight: '900', padding: '3px 6px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                      {badge.text}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '20px 8px 8px' }}>
                    <div style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{categories.find(c => c.value === product.category)?.label}</div>
                  </div>
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1f2937', marginBottom: '3px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                  <div style={{ fontSize: '13px', color: '#e67e00', fontWeight: '800' }}>¥{product.market_value?.toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push('/admin/products/' + product.id) }}
                      style={{ flex: 1, fontSize: '11px', color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', fontWeight: '600' }}
                    >編集</button>
                    <button
                      onClick={(e) => handleDelete(product.id, e)}
                      style={{ fontSize: '11px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer' }}
                    >🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* リスト表示 */
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>商品名</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>カテゴリー</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>PSA</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>価格</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>作成日</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, i) => {
                const badge = getPsaBadge(product.psa_grade)
                return (
                  <tr
                    key={product.id}
                    onClick={() => router.push('/admin/products/' + product.id)}
                    style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '36px', height: '50px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎴</div>
                        )}
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: '999px' }}>
                        {categories.find(c => c.value === product.category)?.label || product.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {badge ? (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'white', background: badge.bg, padding: '3px 8px', borderRadius: '4px' }}>{badge.text}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#e67e00' }}>
                      ¥{product.market_value?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(product.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push('/admin/products/' + product.id)}
                          style={{ fontSize: '12px', color: '#3b82f6', background: '#eff6ff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: '600' }}
                        >編集</button>
                        <button
                          onClick={(e) => handleDelete(product.id, e)}
                          style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                        >削除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}