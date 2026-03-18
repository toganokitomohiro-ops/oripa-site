import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { origin, searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // codeがある場合（PKCEフロー）
  if (code) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // codeがない場合はトップへ（implicitフローはクライアント側で処理）
  return NextResponse.redirect(`${origin}${next}`)
}
