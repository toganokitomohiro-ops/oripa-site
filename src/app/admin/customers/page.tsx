'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  points: number
  total_spent: number
  is_admin: boolean
  created_at: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pointAmount, setPointAmount] = useState(0)
  const [pointNote, setPointNote] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCustomers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleAddPoints = async () => {
    if (!selectedId || !pointAmount) return
    const customer = customers.find((c) => c.id === selectedId)
    if (!customer) return
    await supabase.from('profiles').update({
      points: customer.points + pointAmount
    }).eq('id', selectedId)
    await supabase.from('point_logs').insert({
      user_id: selectedId,
      amount: pointAmount,
      type: 'manual',
      description: pointNote || '管理者による付与',
    })
    setPointAmount(0)
    setPointNote('')
    await fetchCustomers()
  }

  const handleToggleAdmin = async (id: string, current: boolean) => {
    if (!confirm(current ? '管理者権限を剥奪しますか？' : '管理者権限を付与しますか？')) return
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', id)
    await fetchCustomers()
  }

  const filtered = customers.filter((c) =>
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCustomer = customers.find((c) => c.id === selectedId)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>顧客管理</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>ユーザーの確認・ポイント管理ができます</p>
      </div>

      {/* 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>総ユーザー数</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{customers.length}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>総ポイント保有量</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#db2777' }}>
            {customers.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString()}pt
          </div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>総課金額</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
            ¥{customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* 顧客一覧 */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <input
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
              placeholder="メールアドレスで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>ユーザー一覧</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{filtered.length}件</span>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>読み込み中...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                ユーザーが見つかりません
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#6b7280', fontWeight: '500' }}>メールアドレス</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#6b7280', fontWeight: '500' }}>保有PT</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#6b7280', fontWeight: '500' }}>累計課金</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#6b7280', fontWeight: '500' }}>登録日</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#6b7280', fontWeight: '500' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedId(customer.id)}
                      style={{
                        borderTop: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        background: selectedId === customer.id ? '#fdf2f8' : 'white',
                      }}
                    >
                      <td style={{ padding: '12px 20px', color: '#1f2937' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {customer.email || '未設定'}
                          {customer.is_admin && (
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '999px' }}>管理者</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: '#db2777', fontWeight: 'bold' }}>
                        {(customer.points || 0).toLocaleString()}pt
                      </td>
                      <td style={{ padding: '12px 20px', color: '#6b7280' }}>
                        ¥{(customer.total_spent || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#6b7280', fontSize: '13px' }}>
                        {new Date(customer.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleAdmin(customer.id, customer.is_admin) }}
                          style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                        >
                          {customer.is_admin ? '管理者解除' : '管理者に'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 右サイドパネル：ポイント操作 */}
        <div>
          {selectedCustomer ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>ポイント操作</h2>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{selectedCustomer.email}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#db2777' }}>
                  {(selectedCustomer.points || 0).toLocaleString()}pt
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>付与・減算ポイント</label>
                  <input
                    type="number"
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                    value={pointAmount}
                    onChange={(e) => setPointAmount(Number(e.target.value))}
                    placeholder="例：1000（減算は-1000）"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>メモ</label>
                  <input
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                    value={pointNote}
                    onChange={(e) => setPointNote(e.target.value)}
                    placeholder="例：キャンペーン付与"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddPoints}
                    disabled={!pointAmount}
                    style={{ flex: 1, background: !pointAmount ? '#9ca3af' : '#db2777', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !pointAmount ? 'not-allowed' : 'pointer' }}
                  >
                    実行する
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>ユーザーをクリックするとポイント操作ができます</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}