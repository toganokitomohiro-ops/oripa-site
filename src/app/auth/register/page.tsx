'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Banner = {
  id: string
  image_url: string
  link_url: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  useEffect(() => {
    fetchBanner()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (code) setInviteCode(code)
  }, [])

  const fetchBanner = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('page', 'register')
      .order('sort_order')
      .limit(1)
      .single()
    if (data) setBanner(data)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
    if (error) alert(error.message)
    setLoading(false)
  }


  const handleRegister = async () => {
    if (!email || !password || !passwordConfirm) { setError('全ての項目を入力してください'); return }
    if (password !== passwordConfirm) { setError('パスワードが一致しません'); return }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return }
    if (!agreed) { setError('利用規約に同意してください'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('登録に失敗しました。既に使用されているメールアドレスの可能性があります')
      setLoading(false)
      return
    }
    window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>

      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: '24px', fontWeight: '900', color: '#e67e00', textDecoration: 'none' }}>ORIPA🃏</a>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/auth/register" style={{ fontSize: '13px', color: 'white', background: '#e67e00', padding: '6px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: '700' }}>新規登録</a>
            <a href="/auth/login" style={{ fontSize: '13px', color: '#666', border: '1px solid #ddd', padding: '6px 16px', borderRadius: '4px', textDecoration: 'none' }}>ログイン</a>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>新規登録</h1>
          <button type="button" onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '12px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Googleで登録
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>または</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* バナー */}
          {banner && (
            <div
              style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', cursor: banner.link_url ? 'pointer' : 'default' }}
              onClick={() => banner.link_url && (window.location.href = banner.link_url)}
            >
              <img src={banner.image_url} alt="登録特典" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* メールアドレス */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              メールアドレス <span style={{ color: '#ef4444', fontSize: '11px' }}>*必須</span>
            </label>
            <input
              type="email"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="oripaone@sample.com"
            />
          </div>

          {/* パスワード */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              パスワード <span style={{ color: '#ef4444', fontSize: '11px' }}>*必須</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 44px 12px 14px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* パスワード確認 */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              パスワード確認 <span style={{ color: '#ef4444', fontSize: '11px' }}>*必須</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 44px 12px 14px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="パスワードを再入力"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af' }}
              >
                {showPasswordConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 招待コード */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              招待コード <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '400' }}>（任意）</span>
            </label>
            <input
              type="text"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="招待コードをお持ちの方は入力"
            />
          </div>

          {/* 利用規約 */}
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
            会員登録により
            <a href="#" style={{ color: '#e67e00', textDecoration: 'none' }}>利用規約</a>
            及び
            <a href="#" style={{ color: '#e67e00', textDecoration: 'none' }}>プライバシーポリシー</a>
            に同意したものとみなされます
          </div>

          {/* 同意チェックボックス */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
            />
            <label htmlFor="agree" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
              上記に同意する
            </label>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !agreed}
            style={{ width: '100%', padding: '16px', background: (loading || !agreed) ? '#9ca3af' : '#f5c518', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '17px', fontWeight: '900', cursor: (loading || !agreed) ? 'not-allowed' : 'pointer', marginBottom: '16px', boxShadow: (loading || !agreed) ? 'none' : '0 4px 12px rgba(245,197,24,0.4)' }}
          >
            {loading ? '登録中...' : '無料で新規登録する'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <a href="/auth/login" style={{ fontSize: '14px', color: '#e67e00', textDecoration: 'none', fontWeight: '600' }}>ログインはこちら</a>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>← トップに戻る</a>
          </div>
        </div>
      </div>
    </div>
  )
}