import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // implicitフローではクライアント側で処理するのでトップにリダイレクト
  const origin = req.nextUrl.origin
  return NextResponse.redirect(`${origin}/`)
}
