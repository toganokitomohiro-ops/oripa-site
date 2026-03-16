'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Shipment = {
  id: string
  status: string
  name: string
  postal_code: string
  prefecture: string
  address: string
  address2: string
  phone: string
  tracking_number: string
  note: string
  created_at: string
  user_id: string
  draws: {
    grade: string
    events: { name: string }
    products: { name: string; image_url: string }
  }
}

export default function AdminOrdersPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState('')

  const fetchShipments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shipments')
      .select('*, draws(grade, events(name), products(name, image_url))')
      .order('created_at', { ascending: false })
    if (data) setShipments(data)
    setLoading(false)
  }

  useEffect(() => { fetchShipments() }, [])

  const handleStatusUpdate = async (id: string, status: string) => {
    await supabase.from('shipments').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchShipments()
  }

  const handleTrackingUpdate = async (id: string) => {
    if (!trackingInput) return
    await supabase.from('shipments').update({ tracking_number: trackingInput, status: 'shipped', updated_at: new Date().toISOString() }).eq('id', id)
    setTrackingInput('')
    setSelectedId(null)
    fetchShipments()
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '申請中', color: '#d97706', bg: '#fef3c7' },
    processing: { label: '処理中', color: '#2563eb', bg: '#dbeafe' },
    shipped: { label: '発送済み', color: '#10b981', bg: '#f0fdf4' },
    cancelled: { label: 'キャンセル', color: '#ef4444', bg: '#fef2f2' },
  }

  const tabs = [
    { key: 'pending', label: '申請中' },
    { key: 'processing', label: '処理中' },
    { key: 'shipped', label: '発送済み' },
    { key: 'cancelled', label: 'キャンセル' },
    { key: 'all', label: 'すべて' },
  ]

  const filtered = activeTab === 'all' ? shipments : shipments.filter(s => s.status === activeTab)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>配送管理</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>発送申請の確認・追跡番号の登録</p>
      </div>

      {/* 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} style={{ background: config.bg, border: '1px solid', borderColor: config.bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{config.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: config.color }}>{shipments.filter(s => s.status === key).length}件</div>
          </div>
        ))}
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#db2777' : '#6b7280', borderBottom: activeTab === tab.key ? '2px solid #db2777' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}
          >
            {tab.label}
            <span style={{ marginLeft: '6px', fontSize: '11px', color: '#9ca3af' }}>
              ({tab.key === 'all' ? shipments.length : shipments.filter(s => s.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* 一覧 */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
          <div>該当する発送申請がありません</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((shipment) => {
            const status = statusConfig[shipment.status] || statusConfig.pending
            const isSelected = selectedId === shipment.id
            return (
              <div key={shipment.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* カード画像 */}
                  {shipment.draws?.products?.image_url ? (
                    <img src={shipment.draws.products.image_url} alt="" style={{ width: '48px', height: '67px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '48px', height: '67px', background: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎴</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{shipment.draws?.products?.name || '不明'}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '999px' }}>{status.label}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>{formatDate(shipment.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      {shipment.draws?.events?.name} / {shipment.draws?.grade}
                    </div>

                    {/* 配送先 */}
                    <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
                      <div style={{ fontWeight: '700', marginBottom: '2px' }}>{shipment.name}</div>
                      <div style={{ color: '#6b7280' }}>〒{shipment.postal_code} {shipment.prefecture}{shipment.address}{shipment.address2 ? ' ' + shipment.address2 : ''}</div>
                      <div style={{ color: '#6b7280' }}>TEL: {shipment.phone}</div>
                      {shipment.note && <div style={{ color: '#9ca3af', marginTop: '4px', fontSize: '12px' }}>備考: {shipment.note}</div>}
                    </div>

                    {/* 追跡番号 */}
                    {shipment.tracking_number && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        追跡番号: {shipment.tracking_number}
                      </div>
                    )}

                    {/* アクション */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {shipment.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(shipment.id, 'processing')}
                          style={{ fontSize: '12px', color: '#2563eb', background: '#dbeafe', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          処理中にする
                        </button>
                      )}
                      {(shipment.status === 'pending' || shipment.status === 'processing') && (
                        <button
                          onClick={() => { setSelectedId(isSelected ? null : shipment.id); setTrackingInput('') }}
                          style={{ fontSize: '12px', color: '#10b981', background: '#f0fdf4', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          追跡番号を登録
                        </button>
                      )}
                      {shipment.status !== 'cancelled' && shipment.status !== 'shipped' && (
                        <button
                          onClick={() => handleStatusUpdate(shipment.id, 'cancelled')}
                          style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
                        >
                          キャンセル
                        </button>
                      )}
                    </div>

                    {/* 追跡番号入力フォーム */}
                    {isSelected && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input
                          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' }}
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="追跡番号を入力..."
                          onKeyDown={(e) => e.key === 'Enter' && handleTrackingUpdate(shipment.id)}
                        />
                        <button
                          onClick={() => handleTrackingUpdate(shipment.id)}
                          style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          登録・発送済みに
                        </button>
                        <button
                          onClick={() => setSelectedId(null)}
                          style={{ padding: '8px 12px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                        >
                          閉じる
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}