'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [banners, setBanners] = useState<any[]>([])

  useEffect(() => {
    supabase.from('banners').select('*').eq('page', 'register').eq('status', 'published').order('sort_order').then(({ data }) => {
      if (data) setBanners(data)
    })
  }, [])

  const handleRegister = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return }
    if (password !== passwordConfirm) { setError('パスワードが一致しません'); return }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return }
    if (!agreed) { setError('利用規約に同意してください'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('登録に失敗しました: ' + error.message)
      setLoading(false)
      return
    }
    router.push('/')
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f5' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontSize: '22px', fontWeight: '900', color: '#f97316', textDecoration: 'none' }}>fitオリパ</a>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/auth/register" style={{ fontSize: '13px', color: 'white', background: '#f97316', padding: '6px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: '700' }}>新規登録</a>
          <a href="/auth/login" style={{ fontSize: '13px', color: '#374151', border: '1px solid #d1d5db', padding: '6px 16px', borderRadius: '4px', textDecoration: 'none' }}>ログイン</a>
        </div>
      </header>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Image src="/logo.png" alt="fitオリパ" width={180} height={60} style={{ height: 'auto', display: 'inline-block' }} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>新規登録</h1>

        {/* バナー */}
        {banners.length > 0 && (
          <div style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden' }}>
            <img src={banners[0].image_url} alt={banners[0].title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ef4444', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
          {/* メールアドレス */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>メールアドレス <span style={{ color: '#ef4444' }}>*必須</span></label>
            <input
              type="email"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="oripaone@sample.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* パスワード */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>パスワード <span style={{ color: '#ef4444' }}>*必須</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 44px 12px 12px', fontSize: '15px', boxSizing: 'border-box' }}
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* パスワード確認 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>パスワード確認 <span style={{ color: '#ef4444' }}>*必須</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 44px 12px 12px', fontSize: '15px', boxSizing: 'border-box' }}
                placeholder="パスワードを再入力"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}>
                {showPasswordConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* 招待コード */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>招待コード（任意）</label>
            <input
              type="text"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', fontSize: '15px', boxSizing: 'border-box' }}
              placeholder="招待コードをお持ちの方は入力"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>

          {/* 利用規約 */}
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#6b7280' }}>
            会員登録により<a href="/legal/terms" style={{ color: '#f97316' }}>利用規約</a>及び<a href="/legal/privacy" style={{ color: '#f97316' }}>プライバシーポリシー</a>に同意したものとみなされます
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#f97316' }} />
            <span style={{ fontSize: '14px', color: '#374151' }}>上記に同意する</span>
          </label>

          {/* 登録ボタン */}
          <button
            onClick={handleRegister}
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
          >
            {loading ? '登録中...' : '無料で新規登録する'}
          </button>

          {/* 区切り線 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>または</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Googleログイン */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Googleで登録
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/auth/login" style={{ fontSize: '14px', color: '#f97316', fontWeight: '700', textDecoration: 'none' }}>ログインはこちら</a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <Image src="/characters/alpoo-standby.png" alt="あるぷー" width={100} height={100} style={{ width: '100px', height: 'auto' }} />
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
          ← <a href="/" style={{ color: '#9ca3af' }}>トップに戻る</a>
        </p>
      </div>
    </div>
  )
}