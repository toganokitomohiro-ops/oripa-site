import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]
    const { data: profile } = await supabase
      .from('profiles')
      .select('fp_points, last_login_bonus_at')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    if (profile.last_login_bonus_at === today) {
      return NextResponse.json({ alreadyReceived: true, bonus: 0 })
    }

    const { data: fpSetting } = await supabase.from('fp_settings').select('login_bonus, fp_expiry_months').single()
    const bonusAmount = fpSetting?.login_bonus || 5
    const expiryMonths = fpSetting?.fp_expiry_months || 6

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths)

    await supabase.from('profiles').update({
      fp_points: (profile.fp_points || 0) + bonusAmount,
      last_login_bonus_at: today,
    }).eq('id', userId)

    await supabase.from('fp_transactions').insert({
      user_id: userId,
      amount: bonusAmount,
      type: 'login_bonus',
      description: `ログインボーナス（${today}）`,
      expires_at: expiresAt.toISOString(),
    })

    return NextResponse.json({ alreadyReceived: false, bonus: bonusAmount })
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
