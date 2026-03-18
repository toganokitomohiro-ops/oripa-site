'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Draw = {
  id: string
  created_at: string
  grade: string
  events: { name: string; id: string }
  products: { name: string; image_url: string; market_value: number }
}

type SortKey = 'newest' | 'oldest' | 'high' | 'low'

export default function HistoryPage() {
  const router = useRouter()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [filterGrade, setFilterGrade] = useState<string>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      fetchDraws(session.user.id)
    })
  }, [])

  const fetchDraws = async (userId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('draws')
      .select('*, events(name, id), products(name, image_url, market_value)')
      .eq('user_id', userId)
      .in('grade', ['S賞', 'A賞'])
      .order('created_at', { ascending: false })
    if (data) setDraws(data)
    setLoading(false)
  }

  const gradeBadge: Record<string, string> = {
    'S賞': '/pack/1st.png',
    'A賞': '/pack/2nd.png',
  }

  const sortLabels: Record<SortKey, string> = {
    newest: '新しい順',
    oldest: '古い順',
    high: 'コイン高い順',
    low: 'コイン低い順',
  }

  const sorted = [...draws]
    .filter(d => filterGrade === 'all' || d.grade === filterGrade)
    .sort((a, b) => {
      if (sortKey === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortKey === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'high') return (b.products?.market_value || 0) - (a.products?.market_value || 0)
      if (sortKey === 'low') return (a.products?.market_value || 0) - (b.products?.market_value || 0)
      return 0
    })

  const totalCoins = draws.reduce((sum, d) => sum + (d.products?.market_value || 0), 0)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '70px' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>当選履歴</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>S賞・A賞の当選履歴です（合計: {totalCoins.toLocaleString()}コイン）</p>

        {/* コントロールバー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'white', borderRadius: '999px', border: '1px solid #e1e1e1', padding: '4px', overflow: 'hidden' }}>
          {/* リスト表示ボタン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', flex: 1, justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3BE20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/>
              <path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#2e2e2e' }}>リスト表示</span>
          </div>

          <div style={{ width: '1px', height: '40px', background: '#e1e1e1' }} />

          {/* ソートボタン */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', width: '100%', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3BE20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>
                <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#2e2e2e' }}>{sortLabels[sortKey]}</span>
            </button>
            {showSortMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '160px', overflow: 'hidden' }}>
                {(Object.keys(sortLabels) as SortKey[]).map(key => (
                  <button key={key} onClick={() => { setSortKey(key); setShowSortMenu(false) }}
                    style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: sortKey === key ? '#fff7ed' : 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: sortKey === key ? '700' : '400', color: sortKey === key ? '#e67e00' : '#374151' }}>
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* グレードフィルター */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['all', 'S賞', 'A賞'].map(g => (
            <button key={g} onClick={() => setFilterGrade(g)}
              style={{ padding: '6px 16px', borderRadius: '999px', border: '1px solid', borderColor: filterGrade === g ? '#e67e00' : '#e5e7eb', background: filterGrade === g ? '#fff7ed' : 'white', color: filterGrade === g ? '#e67e00' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {g === 'all' ? 'すべて' : g}（{g === 'all' ? draws.length : draws.filter(d => d.grade === g).length}）
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>読み込み中...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕐</div>
            <div style={{ fontSize: '15px' }}>当選履歴がありません</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sorted.map((draw) => (
              <div key={draw.id} style={{ background: 'white', borderRadius: '8px', border: '2px solid #e5e7eb', display: 'flex', gap: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {/* 商品画像 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {draw.products?.image_url ? (
                    <img src={draw.products.image_url} alt={draw.products.name}
                      style={{ width: '96px', height: '134px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '96px', height: '134px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎴</div>
                  )}
                </div>

                {/* 情報 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* グレードバッジ */}
                    <div style={{ marginBottom: '8px' }}>
                      <img src={gradeBadge[draw.grade] || '/pack/lose.png'} alt={draw.grade}
                        style={{ height: '28px', objectFit: 'contain' }} />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{draw.products?.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>{draw.events?.name}</p>
                  </div>
                  {/* コインと日時 */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#f3f4f6', borderRadius: '6px', padding: '6px 12px', marginBottom: '8px' }}>
                      <img src="/coin.png" alt="コイン" style={{ width: '20px', height: '20px' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{draw.products?.market_value?.toLocaleString()}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>コイン</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>{formatDate(draw.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ソートメニュー背景クリックで閉じる */}
      {showSortMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowSortMenu(false)} />
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #e0e0e0', zIndex: 50, boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', height: '56px' }}>
          {[
            { href: '/', icon: '🎴', label: 'オリパガチャ' },
            { href: '/prizes', icon: '🏆', label: '獲得商品' },
            { href: '/history', icon: '🕐', label: '当選履歴', active: true },
            { href: '/reports', icon: '📢', label: '当選報告' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((item) => (
            <a key={item.label} href={item.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: item.active ? '#e67e00' : '#888', gap: '2px' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
