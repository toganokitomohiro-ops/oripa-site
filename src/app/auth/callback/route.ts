import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // implicitフローではクライアント側で処理するのでトップにリダイレクト
  return NextResponse.redirect('https://oripa-site.vercel.app/')
}
