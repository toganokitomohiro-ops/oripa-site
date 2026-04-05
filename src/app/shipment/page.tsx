'use client'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Draw = {
  id: string
  grade: string
  created_at: string
  events: { name: string }
  products: { name: string; image_url: string; market_value: number }
}

const prefectures = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']

function ShipmentPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const drawId = searchParams.get('draw_id')

  const [draws, setDraws] = useState<Draw[]>([])
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', postal_code: '', prefecture: '東京都',
    address: '', address2: '', phone: '', note: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUserId(session.user.id)
      fetchDraws(session.user.id)
    })
  }, [])

  const fetchDraws = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('draws')
      .select('*, events(name), products(name, image_url, market_value)')
      .eq('user_id', uid)
      .eq('is_exchanged', false)
      .order('created_at', { ascending: false })
    if (data) {
      setDraws(data)
      if (drawId) {
        const target = data.find(d => d.id === drawId)
        if (target) setSelectedDraw(target)
      }
    }
    setLoading(false)
  }

  const handlePostalSearch = async () => {
    const cleaned = form.postal_code.replace('-', '')
    if (cleaned.length !== 7) return
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`)
      const data = await res.json()
      if (data.results?.[0]) {
        const r = data.results[0]
        setForm(prev => ({
          ...prev,
          prefecture: r.address1,
          address: r.address2 + r.address3,
        }))
      }
    } catch {}
  }

  const handleSubmit = async () => {
    if (!selectedDraw) { alert('発送申請するカードを選択してください'); return }
    if (!form.name || !form.postal_code || !form.address || !form.phone) {
      alert('必須項目を入力してください'); return
    }
    setSubmitting(true)
    await supabase.from('shipments').insert({
      user_id: userId,
      draw_id: selectedDraw.id,
      status: 'pending',
      name: form.name,
      postal_code: form.postal_code,
      prefecture: form.prefecture,
      address: form.address,
      address2: form.address2,
      phone: form.phone,
      note: form.note,
    })
    await supabase.from('draws').update({ is_exchanged: true }).eq('id', selectedDraw.id)
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>発送申請完了！</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>発送申請を受け付けました。追跡番号が発行され次第、マイページでご確認いただけます。</p>
        <a href="/prizes" style={{ display: 'block', padding: '12px', background: '#f97316', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', marginBottom: '10px' }}>獲得商品を見る</a>
        <a href="/" style={{ display: 'block', padding: '12px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}>トップに戻る</a>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5', paddingBottom: '40px' }}>
      <Header />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1f2937', marginBottom: '6px' }}>発送申請</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>当選カードの発送先を入力してください</p>

        {/* カード選択 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>発送するカードを選択 <span style={{ color: '#ef4444' }}>*</span></h2>
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>読み込み中...</div>
          ) : draws.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px' }}>発送申請できるカードがありません</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {draws.map((draw) => (
                <div
                  key={draw.id}
                  onClick={() => setSelectedDraw(selectedDraw?.id === draw.id ? null : draw)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: '2px solid', borderColor: selectedDraw?.id === draw.id ? '#f97316' : '#e5e7eb', background: selectedDraw?.id === draw.id ? '#fff7ed' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: selectedDraw?.id === draw.id ? '#f97316' : '#d1d5db', background: selectedDraw?.id === draw.id ? '#f97316' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selectedDraw?.id === draw.id && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />}
                  </div>
                  {draw.products?.image_url ? (
                    <img src={draw.products.image_url} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '40px', height: '56px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎴</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>{draw.products?.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{draw.events?.name} / {draw.grade}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 発送先入力 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>お届け先情報</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>お名前 <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>郵便番号 <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="123-4567"
                  maxLength={8}
                />
                <button
                  onClick={handlePostalSearch}
                  style={{ padding: '10px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  住所検索
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>都道府県 <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', background: 'white', boxSizing: 'border-box' }}
                value={form.prefecture}
                onChange={(e) => setForm({ ...form, prefecture: e.target.value })}
              >
                {prefectures.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>市区町村・番地 <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="渋谷区渋谷1-1-1"
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>建物名・部屋番号（任意）</label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.address2}
                onChange={(e) => setForm({ ...form, address2: e.target.value })}
                placeholder="〇〇マンション101"
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>電話番号 <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="090-1234-5678"
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>備考（任意）</label>
              <textarea
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="ご要望があればご記入ください"
              />
            </div>
          </div>
        </div>

        {/* 確認・送信 */}
        {selectedDraw && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>発送申請内容の確認</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedDraw.products?.image_url && (
                <img src={selectedDraw.products.image_url} alt="" style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
              )}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{selectedDraw.products?.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{selectedDraw.grade} / {selectedDraw.events?.name}</div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedDraw}
          style={{ width: '100%', padding: '16px', background: (!selectedDraw || submitting) ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: (!selectedDraw || submitting) ? 'not-allowed' : 'pointer', boxShadow: (!selectedDraw || submitting) ? 'none' : '0 4px 12px rgba(230,126,0,0.3)' }}
        >
          {submitting ? '申請中...' : '発送申請する'}
        </button>
      </div>
    </div>
  )
}

export default function ShipmentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8f7f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}><div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><p style={{ color: '#6b7280', fontSize: '14px' }}>読み込み中...</p></div>}>
      <ShipmentPageInner />
    </Suspense>
  )
}