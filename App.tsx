import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Pedometer } from 'expo-sensors'
import { supabase } from './lib/supabase'

export default function App() {
  const [steps, setSteps] = useState(0)
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [fpPoints, setFpPoints] = useState(0)
  const [todayFpEarned, setTodayFpEarned] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchFpPoints(session.user.id)
        fetchTodayLog(session.user.id)
      }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchFpPoints(session.user.id)
        fetchTodayLog(session.user.id)
      } else {
        setUser(null)
        setFpPoints(0)
      }
    })
    checkPedometer()
  }, [])

  const checkPedometer = async () => {
    const available = await Pedometer.isAvailableAsync()
    setIsPedometerAvailable(available)
    if (available) {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const result = await Pedometer.getStepCountAsync(start, end)
      setSteps(result.steps)
    }
  }

  const fetchFpPoints = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('fp_points').eq('id', userId).single()
    if (data) setFpPoints(data.fp_points || 0)
  }

  const fetchTodayLog = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('step_logs').select('fp_earned').eq('user_id', userId).eq('logged_date', today).single()
    if (data) setTodayFpEarned(data.fp_earned)
  }

  const calcFp = (steps: number) => {
    if (steps >= 10000) return 10
    if (steps >= 5000) return 5
    if (steps >= 3000) return 3
    if (steps >= 1000) return 1
    return 0
  }

  const handleSyncSteps = async () => {
    if (!user) return Alert.alert('エラー', 'ログインが必要です')
    if (!isPedometerAvailable) return Alert.alert('エラー', '歩数計が使えません')
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const fpEarned = calcFp(steps)

    const { data: existingLog } = await supabase
      .from('step_logs')
      .select('id, fp_earned')
      .eq('user_id', user.id)
      .eq('logged_date', today)
      .single()

    if (existingLog) {
      // 既に今日のログがある場合は更新
      const additionalFp = fpEarned - existingLog.fp_earned
      await supabase.from('step_logs').update({ steps, fp_earned: fpEarned }).eq('id', existingLog.id)
      if (additionalFp > 0) {
        const { data: profile } = await supabase.from('profiles').select('fp_points').eq('id', user.id).single()
        await supabase.from('profiles').update({ fp_points: (profile?.fp_points || 0) + additionalFp }).eq('id', user.id)
        setFpPoints(prev => prev + additionalFp)
      }
    } else {
      // 新規ログ
      await supabase.from('step_logs').insert({ user_id: user.id, steps, fp_earned: fpEarned, logged_date: today })
      if (fpEarned > 0) {
        const { data: profile } = await supabase.from('profiles').select('fp_points').eq('id', user.id).single()
        await supabase.from('profiles').update({ fp_points: (profile?.fp_points || 0) + fpEarned }).eq('id', user.id)
        setFpPoints(prev => prev + fpEarned)
      }
    }
    setTodayFpEarned(fpEarned)
    setLoading(false)
    Alert.alert('同期完了！', fpEarned > 0 ? `${fpEarned}FPコインを獲得しました！` : 'あと少し歩いてFPを獲得しよう！')
  }

  const handleAuth = async () => {
    setLoading(true)
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert('エラー', error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) Alert.alert('エラー', error.message)
      else Alert.alert('確認メールを送信しました', 'メールを確認してください')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const fpEarnable = calcFp(steps)

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🏃 フィットネスオリパ</Text>
        <Text style={styles.subtitle}>努力した分だけ、運がついてくる</Text>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{isLogin ? 'ログイン' : '新規登録'}</Text>
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
            <Text style={styles.authButtonText}>{loading ? '処理中...' : isLogin ? 'ログイン' : '登録'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 12 }}>
            <Text style={{ color: '#16a34a', fontSize: 14, textAlign: 'center' }}>
              {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏃 フィットネスオリパ</Text>
      <Text style={styles.subtitle}>努力した分だけ、運がついてくる</Text>

      {/* FPコイン残高 */}
      <View style={styles.fpCard}>
        <Text style={styles.fpLabel}>🪙 FPコイン残高</Text>
        <Text style={styles.fpCount}>{fpPoints.toLocaleString()}</Text>
        <Text style={styles.fpUnit}>FP</Text>
      </View>

      {/* 歩数カード */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsLabel}>今日の歩数</Text>
        <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsUnit}>歩</Text>
      </View>

      {/* FP獲得状況 */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardTitle}>🎯 今日の獲得FP</Text>
        <View style={styles.rewardRow}>
          {[
            { steps: 1000, fp: 1 },
            { steps: 3000, fp: 3 },
            { steps: 5000, fp: 5 },
            { steps: 10000, fp: 10 },
          ].map(item => (
            <View key={item.steps} style={[styles.rewardItem, steps >= item.steps && styles.rewardItemActive]}>
              <Text style={[styles.rewardSteps, steps >= item.steps && styles.rewardTextActive]}>{item.steps.toLocaleString()}歩</Text>
              <Text style={[styles.rewardFp, steps >= item.steps && styles.rewardTextActive]}>+{item.fp}FP</Text>
            </View>
          ))}
        </View>
        {todayFpEarned > 0 && (
          <Text style={styles.earnedText}>✅ 今日は{todayFpEarned}FP獲得済み</Text>
        )}
      </View>

      {/* 同期ボタン */}
      <TouchableOpacity
        style={[styles.syncButton, loading && styles.syncButtonDisabled]}
        onPress={handleSyncSteps}
        disabled={loading}>
        <Text style={styles.syncButtonText}>
          {loading ? '同期中...' : `歩数を同期して${fpEarnable}FP獲得`}
        </Text>
      </TouchableOpacity>

      {/* ログアウト */}
      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 16 }}>
        <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>ログアウト</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '900', color: '#15803d', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  fpCard: { backgroundColor: '#16a34a', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', marginBottom: 12 },
  fpLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  fpCount: { fontSize: 48, fontWeight: '900', color: 'white' },
  fpUnit: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  stepsCard: { backgroundColor: 'white', borderRadius: 16, padding: 28, alignItems: 'center', width: '100%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  stepsLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  stepsCount: { fontSize: 56, fontWeight: '900', color: '#16a34a' },
  stepsUnit: { fontSize: 18, color: '#6b7280' },
  rewardCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  rewardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  rewardRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  rewardItem: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, alignItems: 'center' },
  rewardItemActive: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#16a34a' },
  rewardSteps: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  rewardFp: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  rewardTextActive: { color: '#15803d' },
  earnedText: { fontSize: 13, color: '#16a34a', textAlign: 'center', marginTop: 10, fontWeight: '600' },
  syncButton: { backgroundColor: '#16a34a', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  syncButtonDisabled: { backgroundColor: '#9ca3af' },
  syncButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  authCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  authTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  authButton: { backgroundColor: '#16a34a', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  authButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
})
