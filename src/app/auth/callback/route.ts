import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { origin } = new URL(req.url)
  
  // ハッシュフラグメントのエラーをクライアント側で処理するためのページにリダイレクト
  return NextResponse.redirect(`${origin}/auth/callback-client`)
}
