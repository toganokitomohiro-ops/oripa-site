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

    // 賞品リスト取得（複数動画も含む）
    const { data: prizes } = await supabase
      .from('prizes')
      .select('*, products(*), prize_animation_videos(animation_video_id, animation_videos(video_url))')
      .eq('event_id', event_id)
      .gt('remaining_count', 0)

    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: '賞品がありません' }, { status: 400 })
    }

    // 天井カウンター取得
    let ceilingRecord = null
    if (event.ceiling_count > 0) {
      const { data: existing } = await supabase
        .from('user_ceiling')
        .select('*')
        .eq('user_id', user_id)
        .eq('event_id', event_id)
        .single()
      ceilingRecord = existing
    }

    // 複数回抽選
    const results = []
    const prizeUpdates: Record<string, number> = {}
    let ceilingCount = ceilingRecord?.count || 0

    // 残り枚数プールを作成
    let pool: typeof prizes = []
    prizes.forEach((prize) => {
      for (let i = 0; i < prize.remaining_count; i++) {
        pool.push(prize)
      }
    })

    for (let i = 0; i < pullCount; i++) {
      if (pool.length === 0) break

      ceilingCount++

      // 天井チェック
      const isCeiling = event.ceiling_count > 0 && ceilingCount >= event.ceiling_count

      let selectedPrize
      if (isCeiling) {
        // 天井：確定賞を強制抽選
        const ceilingPrizes = pool.filter(p => p.grade === event.ceiling_grade)
        if (ceilingPrizes.length > 0) {
          const idx = Math.floor(Math.random() * ceilingPrizes.length)
          selectedPrize = ceilingPrizes[idx]
          ceilingCount = 0 // 天井リセット
        } else {
          const selectedIndex = Math.floor(Math.random() * pool.length)
          selectedPrize = pool[selectedIndex]
        }
      } else {
        const selectedIndex = Math.floor(Math.random() * pool.length)
        selectedPrize = pool[selectedIndex]
        // S賞が出たらカウントリセット
        if (selectedPrize.grade === event.ceiling_grade) ceilingCount = 0
      }

      // 選んだ賞品をプールから削除
      const poolIndex = pool.findIndex(p => p.id === selectedPrize.id && p === selectedPrize)
      if (poolIndex !== -1) pool.splice(poolIndex, 1)

      results.push({
        grade: selectedPrize.grade,
        product: selectedPrize.products,
        prize_id: selectedPrize.id,
        product_id: selectedPrize.product_id,
        is_ceiling: isCeiling,
      })

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
    // FPコイン付与
    const { data: fpSetting } = await supabase
      .from('fp_settings')
      .select('fp_rate, s_bonus, a_bonus, b_bonus, c_bonus, fp_expiry_months')
      .single()
    const fpRate = fpSetting?.fp_rate || 1.0
    const fpEarned = Math.floor(actualCost * fpRate)
    const expiryMonths = fpSetting?.fp_expiry_months || 6
    if (fpEarned > 0) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('fp_points')
        .eq('id', user_id)
        .single()
      await supabase.from('profiles').update({
        fp_points: (currentProfile?.fp_points || 0) + fpEarned,
      }).eq('id', user_id)
      // fp_transactionsに記録
      const expiresAtGacha = new Date()
      expiresAtGacha.setMonth(expiresAtGacha.getMonth() + expiryMonths)
      await supabase.from('fp_transactions').insert({
        user_id,
        amount: fpEarned,
        type: 'gacha_earn',
        description: `ガチャFP獲得（${event.name} ${actualCount}回）`,
        expires_at: expiresAtGacha.toISOString(),
      })
    }
    // レアリティボーナスFP付与
    const gradeBonus: Record<string, number> = {
      'S賞': fpSetting?.s_bonus || 50,
      'A賞': fpSetting?.a_bonus || 20,
      'B賞': fpSetting?.b_bonus || 5,
      'C賞': fpSetting?.c_bonus || 0,
    }
    let totalRarityBonus = 0
    for (const result of results) {
      const bonus = gradeBonus[result.grade] || 0
      totalRarityBonus += bonus
    }
    if (totalRarityBonus > 0) {
      const { data: currentProfile2 } = await supabase.from('profiles').select('fp_points').eq('id', user_id).single()
      await supabase.from('profiles').update({
        fp_points: (currentProfile2?.fp_points || 0) + totalRarityBonus,
      }).eq('id', user_id)
      const expiresAtBonus = new Date()
      expiresAtBonus.setMonth(expiresAtBonus.getMonth() + expiryMonths)
      await supabase.from('fp_transactions').insert({
        user_id,
        amount: totalRarityBonus,
        type: 'rarity_bonus',
        description: `レアリティボーナス（${results.map((r: any) => r.grade).join(', ')}）`,
        expires_at: expiresAtBonus.toISOString(),
      })
    }

    // 天井カウンター更新
    if (event.ceiling_count > 0) {
      await supabase.from('user_ceiling').upsert({
        user_id,
        event_id,
        count: ceilingCount,
        last_ceiling_at: ceilingCount === 0 ? new Date().toISOString() : ceilingRecord?.last_ceiling_at,
      }, { onConflict: 'user_id,event_id' })
    }

    // 賞品残り枚数更新
    for (const [prizeId, newCount] of Object.entries(prizeUpdates)) {
      await supabase.from('prizes').update({ remaining_count: newCount }).eq('id', prizeId)
    }

    // ラストワン賞チェック
    const newRemaining = event.remaining_count - actualCount
    if (newRemaining === 0 && event.last_one_product_id) {
      // ラストワン賞の商品情報取得
      const { data: lastOneProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', event.last_one_product_id)
        .single()

      if (lastOneProduct) {
        // 最後の結果をラストワン賞に置き換え
        results[results.length - 1] = {
          grade: 'ラストワン賞',
          product: lastOneProduct,
          prize_id: results[results.length - 1].prize_id,
          product_id: event.last_one_product_id,
          is_last_one: true,
        }
      }
    }

    // オリパ残り口数更新
    await supabase.from('events').update({
      remaining_count: newRemaining,
      status: newRemaining === 0 ? 'sold_out' : event.status,
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

    // draw_idsを取得
    const { data: insertedDraws } = await supabase
      .from('draws')
      .select('id')
      .eq('user_id', user_id)
      .eq('event_id', event_id)
      .order('created_at', { ascending: false })
      .limit(actualCount)

    // 賞ごとの動画を取得（フォールバック用）
    const { data: gradeVideos } = await supabase
      .from('grade_animation_videos')
      .select('grade, animation_videos(video_url)')
      .eq('event_id', event_id)

    // 最高グレードの動画をランダムで1本選ぶ（カード動画優先、なければ賞動画）
    const gradeOrder = ['ラストワン賞', 'S賞', 'A賞', 'B賞', 'C賞']
    let videoUrl = ''
    for (const grade of gradeOrder) {
      const matched = results.find((r: any) => r.grade === grade)
      if (matched) {
        // カードごとの動画を優先
        const prizeWithVideos = prizes?.find(p => p.id === (matched as any).prize_id)
        const cardVideos = prizeWithVideos?.prize_animation_videos || []
        if (cardVideos.length > 0) {
          const picked = cardVideos[Math.floor(Math.random() * cardVideos.length)]
          videoUrl = picked?.animation_videos?.video_url || ''
        } else {
          // フォールバック：賞ごとの動画
          const fallbackVideos = (gradeVideos || []).filter((v: any) => v.grade === grade)
          if (fallbackVideos.length > 0) {
            const picked = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)]
            videoUrl = (picked as any)?.animation_videos?.video_url || ''
          }
        }
        break
      }
    }

    return NextResponse.json({
      success: true,
      count: actualCount,
      video_url: videoUrl,
      results: results.map((r) => ({
        grade: r.grade,
        product: r.product,
        is_last_one: (r as any).is_last_one || false,
        is_ceiling: (r as any).is_ceiling || false,
      })),
      ceiling_count: ceilingCount,
      draw_ids: insertedDraws?.map(d => d.id) || [],
      remaining_points: profile.points - actualCost,
    })

  } catch (error) {
    console.error('Gacha error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}