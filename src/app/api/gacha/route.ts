import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { event_id, user_id, count = 1 } = await req.json()

    if (!event_id || !user_id) {
      return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })
    }

    const pullCount = Math.min(Number(count) || 1, 100)

    // オリパ情報取得
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (!event) return NextResponse.json({ error: 'オリパが見つかりません' }, { status: 404 })
    if (event.status !== 'active') return NextResponse.json({ error: 'このオリパは現在開催していません' }, { status: 400 })
    if (event.remaining_count < pullCount) {
      return NextResponse.json({ error: `残り${event.remaining_count}口しかありません` }, { status: 400 })
    }

    // ユーザー情報取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (!profile) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })

    const totalCost = event.price * pullCount
    if (profile.points < totalCost) {
      return NextResponse.json({ error: 'ポイントが不足しています' }, { status: 400 })
    }

    // 賞品リスト取得
    const { data: prizes } = await supabase
      .from('prizes')
      .select('*, products(*)')
      .eq('event_id', event_id)
      .gt('remaining_count', 0)

    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: '賞品がありません' }, { status: 400 })
    }

    // 複数回抽選
    const results = []
    const prizeUpdates: Record<string, number> = {}

    // 残り枚数プールを作成
    let pool: typeof prizes = []
    prizes.forEach((prize) => {
      for (let i = 0; i < prize.remaining_count; i++) {
        pool.push(prize)
      }
    })

    for (let i = 0; i < pullCount; i++) {
      if (pool.length === 0) break

      const selectedIndex = Math.floor(Math.random() * pool.length)
      const selectedPrize = pool[selectedIndex]

      // 選んだ賞品をプールから削除
      pool.splice(selectedIndex, 1)

      results.push({
        grade: selectedPrize.grade,
        product: selectedPrize.products,
        prize_id: selectedPrize.id,
        product_id: selectedPrize.product_id,
      })

      // 更新カウント
      prizeUpdates[selectedPrize.id] = (prizeUpdates[selectedPrize.id] || selectedPrize.remaining_count) - 1
    }

    const actualCount = results.length

    // ポイント消費
    const actualCost = event.price * actualCount
    await supabase.from('profiles').update({
      points: profile.points - actualCost,
      total_spent: (profile.total_spent || 0) + actualCost,
    }).eq('id', user_id)

    // ポイントログ
    await supabase.from('point_logs').insert({
      user_id,
      amount: -actualCost,
      type: 'gacha',
      description: `${event.name}を${actualCount}回開封`,
    })

    // 賞品残り枚数更新
    for (const [prizeId, newCount] of Object.entries(prizeUpdates)) {
      await supabase.from('prizes').update({ remaining_count: newCount }).eq('id', prizeId)
    }

    // オリパ残り口数更新
    await supabase.from('events').update({
      remaining_count: event.remaining_count - actualCount,
    }).eq('id', event_id)

    // 開封履歴記録
    const drawInserts = results.map((r) => ({
      user_id,
      event_id,
      prize_id: r.prize_id,
      product_id: r.product_id,
      grade: r.grade,
      is_exchanged: false,
    }))
    await supabase.from('draws').insert(drawInserts)

    return NextResponse.json({
      success: true,
      count: actualCount,
      results: results.map((r) => ({
        grade: r.grade,
        product: r.product,
      })),
      remaining_points: profile.points - actualCost,
    })

  } catch (error) {
    console.error('Gacha error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}