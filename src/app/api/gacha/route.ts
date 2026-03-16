import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { event_id, user_id } = await req.json()

    if (!event_id || !user_id) {
      return NextResponse.json({ error: 'パラメータが不足しています' }, { status: 400 })
    }

    // 1. オリパ情報を取得
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'オリパが見つかりません' }, { status: 404 })
    }

    if (event.status !== 'active') {
      return NextResponse.json({ error: 'このオリパは現在開催していません' }, { status: 400 })
    }

    if (event.remaining_count <= 0) {
      return NextResponse.json({ error: 'このオリパは売り切れです' }, { status: 400 })
    }

    // 2. ユーザーのポイントを確認
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    if (profile.points < event.price) {
      return NextResponse.json({ error: 'ポイントが不足しています' }, { status: 400 })
    }

    // 3. 残っている賞品リストを取得
    const { data: prizes } = await supabase
      .from('prizes')
      .select('*, products(*)')
      .eq('event_id', event_id)
      .gt('remaining_count', 0)

    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: '賞品がありません' }, { status: 400 })
    }

    // 4. ランダムに賞品を選ぶ（口数に比例した重み付き抽選）
    const pool: typeof prizes = []
    prizes.forEach((prize) => {
      for (let i = 0; i < prize.remaining_count; i++) {
        pool.push(prize)
      }
    })

    const selectedPrize = pool[Math.floor(Math.random() * pool.length)]

    // 5. ポイントを消費
    const { error: pointError } = await supabase
      .from('profiles')
      .update({
        points: profile.points - event.price,
        total_spent: (profile.total_spent || 0) + event.price,
      })
      .eq('id', user_id)

    if (pointError) {
      return NextResponse.json({ error: 'ポイント処理に失敗しました' }, { status: 500 })
    }

    // 6. ポイント履歴に記録
    await supabase.from('point_logs').insert({
      user_id,
      amount: -event.price,
      type: 'gacha',
      description: `${event.name}を開封`,
    })

    // 7. 賞品の残り枚数を減らす
    await supabase
      .from('prizes')
      .update({ remaining_count: selectedPrize.remaining_count - 1 })
      .eq('id', selectedPrize.id)

    // 8. オリパの残り口数を減らす
    await supabase
      .from('events')
      .update({ remaining_count: event.remaining_count - 1 })
      .eq('id', event_id)

    // 9. 開封履歴に記録
    await supabase.from('draws').insert({
      user_id,
      event_id,
      prize_id: selectedPrize.id,
      product_id: selectedPrize.product_id,
      grade: selectedPrize.grade,
      is_exchanged: false,
    })

    // 10. 結果を返す
    return NextResponse.json({
      success: true,
      result: {
        grade: selectedPrize.grade,
        product: selectedPrize.products,
        remaining_points: profile.points - event.price,
      },
    })

  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}