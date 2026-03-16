import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { draw_ids, user_id } = await req.json()

    if (!draw_ids || !user_id || draw_ids.length === 0) {
      return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })
    }

    // 対象の当選履歴を取得
    const { data: draws } = await supabase
      .from('draws')
      .select('*, prizes(pt_exchange), products(name, market_value)')
      .in('id', draw_ids)
      .eq('user_id', user_id)
      .eq('status', 'pending')

    if (!draws || draws.length === 0) {
      return NextResponse.json({ error: '売却対象が見つかりません' }, { status: 404 })
    }

    // 売却ポイント計算
    let totalPoints = 0
    for (const draw of draws) {
      const ptExchange = draw.prizes?.pt_exchange || 0
      totalPoints += ptExchange
    }

    if (totalPoints <= 0) {
      return NextResponse.json({ error: 'このカードはポイント交換できません' }, { status: 400 })
    }

    // drawのstatusをsoldに更新
    await supabase
      .from('draws')
      .update({ status: 'sold', sold_at: new Date().toISOString() })
      .in('id', draw_ids)
      .eq('user_id', user_id)

    // ユーザーにポイント付与
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user_id)
      .single()

    if (!profile) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })

    await supabase
      .from('profiles')
      .update({ points: profile.points + totalPoints })
      .eq('id', user_id)

    // ポイントログ
    await supabase.from('point_logs').insert({
      user_id,
      amount: totalPoints,
      type: 'sell',
      description: `カード${draws.length}枚を売却`,
    })

    return NextResponse.json({
      success: true,
      sold_count: draws.length,
      total_points: totalPoints,
      new_balance: profile.points + totalPoints,
    })

  } catch (error) {
    console.error('Sell error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}