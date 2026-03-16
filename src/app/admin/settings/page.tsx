'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'shop' | 'design' | 'pages'>('shop')
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    twitter_url: '',
    instagram_url: '',
    line_url: '',
    contact_email: '',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { value: 'shop', label: '店舗情報' },
    { value: 'design', label: 'デザイン設定' },
    { value: 'pages', label: 'ページ管理' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>設定</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>店舗情報・デザイン・ページの管理ができます</p>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value as typeof activeTab)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === t.value ? 'bold' : 'normal',
              background: activeTab === t.value ? '#db2777' : 'transparent',
              color: activeTab === t.value ? 'white' : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 店舗情報 */}
      {activeTab === 'shop' && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>店舗情報</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>ショップ名</label>
              <input
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                placeholder="例：ORIPA SITE"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>ショップ説明</label>
              <textarea
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                placeholder="ショップの説明を入力..."
                rows={3}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>お問い合わせメール</label>
              <input
                type="email"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                value={shopForm.contact_email}
                onChange={(e) => setShopForm({ ...shopForm, contact_email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>SNSリンク</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>X（Twitter）URL</label>
                  <input
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                    value={shopForm.twitter_url}
                    onChange={(e) => setShopForm({ ...shopForm, twitter_url: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>Instagram URL</label>
                  <input
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                    value={shopForm.instagram_url}
                    onChange={(e) => setShopForm({ ...shopForm, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>LINE公式アカウントURL</label>
                  <input
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                    value={shopForm.line_url}
                    onChange={(e) => setShopForm({ ...shopForm, line_url: e.target.value })}
                    placeholder="https://line.me/..."
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              style={{ alignSelf: 'flex-start', background: saved ? '#10b981' : '#db2777', color: 'white', padding: '10px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              {saved ? '保存しました！' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* デザイン設定 */}
      {activeTab === 'design' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>カラー設定</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>メインカラー</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" defaultValue="#ef4444" style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>#ef4444</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>アクセントカラー</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" defaultValue="#f59e0b" style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>#f59e0b</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>バナー管理</h2>
            <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>バナー画像をアップロード</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>推奨サイズ：1200 x 400px</div>
              <button style={{ marginTop: '12px', background: '#db2777', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                画像を選択
              </button>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 'bold', marginBottom: '4px' }}>デザイン設定について</div>
            <div style={{ fontSize: '13px', color: '#92400e' }}>
              カラー設定・バナー管理はフロントエンド実装後に連携されます。
            </div>
          </div>
        </div>
      )}

      {/* ページ管理 */}
      {activeTab === 'pages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { title: '利用規約', desc: 'サービス利用規約のページ内容を編集できます' },
            { title: 'プライバシーポリシー', desc: '個人情報の取り扱いについてのページを編集できます' },
            { title: '特定商取引法に基づく表記', desc: '法律に基づく表記ページを編集できます' },
          ].map((page) => (
            <div key={page.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>{page.title}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{page.desc}</div>
              </div>
              <button
                style={{ background: '#f3f4f6', color: '#374151', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                編集する
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}