'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    })
    if (error) alert(error.message)
    setLoading(false)
  }

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
            <button type="button" onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px', marginBottom: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
              Googleでログイン
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>または</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>
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