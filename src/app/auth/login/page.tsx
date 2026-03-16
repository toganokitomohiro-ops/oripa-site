'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが間違っています')
      setLoading(false)
      return
    }
    window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>

      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <a href="/" style={{ fontSize: '24px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>ログイン</h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>アカウントにログインしてガチャを楽しもう！</p>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>メールアドレス</label>
              <input
                type="email"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>パスワード</label>
                <a href="#" style={{ fontSize: '12px', color: '#e67e00', textDecoration: 'none' }}>パスワードを忘れた方</a>
              </div>
              <input
                type="password"
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : '#e67e00', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 12px rgba(230,126,0,0.3)', transition: 'all 0.2s' }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>アカウントをお持ちでない方は</span>
              <a href="/auth/register" style={{ fontSize: '13px', color: '#e67e00', fontWeight: '700', textDecoration: 'none', marginLeft: '4px' }}>新規登録</a>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href="/" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← トップに戻る</a>
          </div>
        </div>
      </div>
    </div>
  )
}