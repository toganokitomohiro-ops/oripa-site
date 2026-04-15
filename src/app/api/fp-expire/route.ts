import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const now = new Date().toISOString()
    const { data: expiredTxs } = await supabase
      .from('fp_transactions')
      .select('id, amount')
      .eq('user_id', userId)
      .gt('amount', 0)
      .lt('expires_at', now)
      .not('type', 'eq', 'expired')

    if (!expiredTxs || expiredTxs.length === 0) {
      return NextResponse.json({ expired: 0 })
    }

    const totalExpired = expiredTxs.reduce((sum, tx) => sum + tx.amount, 0)

    const { data: profile } = await supabase.from('profiles').select('fp_points').eq('id', userId).single()
    const newFp = Math.max(0, (profile?.fp_points || 0) - totalExpired)
    await supabase.from('profiles').update({ fp_points: newFp }).eq('id', userId)

    const expiredIds = expiredTxs.map(tx => tx.id)
    await supabase.from('fp_transactions').update({ type: 'expired' }).in('id', expiredIds)

    await supabase.from('fp_transactions').insert({
      user_id: userId,
      amount: -totalExpired,
      type: 'expired',
      description: `FP有効期限切れ（${expiredTxs.length}件）`,
      expires_at: null,
    })

    return NextResponse.json({ expired: totalExpired })
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
