# fitオリパ (oripa-site) — CLAUDE.md

## 🚀 開発コマンド（必須）
```bash
npm run dev        # 開発サーバー起動 (localhost:3000)
npm run build      # 本番ビルド確認（Vercelと同条件）
git push origin main  # → Vercel自動デプロイ（mainブランチのみ）
```

---

## プロジェクト概要
- **サービス名**: fitオリパ（fitoripa.com）
- **コンセプト**: フィットネス×オリパ。歩数→FPコイン→ポケカオリパを回せる。外れても日用品交換可能（「負けないオリパ」）
- **ターゲット**: 主婦層・健康意識層・ライトなポケカファン
- **リポジトリ**: github.com/toganokitomohiro-ops/oripa-site

## 技術スタック
| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| DB / 認証 | Supabase (PostgreSQL + Auth) |
| 決済 | Stripe（クレカ・コンビニ・銀行振込） |
| スタイリング | Tailwind CSS + インラインstyle（混在OK） |
| デプロイ | Vercel（main push → 自動デプロイ） |

## カラーパレット
| 用途 | カラー |
|------|--------|
| コイン（有償） | `#f97316`（オレンジ） |
| FPコイン（無償） | `#22c55e`（グリーン） |
| Primary | `#3b82f6`（ブルー） |
| 背景 | `#f8f7f4` |

---

<important if="画像・キャラクター実装時">

## 画像実装ルール
- **必ず `<img>` タグを使う**（`next/image` は使わない — 表示不具合の前例あり）
- キャラクター白背景は `style={{ mixBlendMode: 'multiply' }}` を必ず適用
- キャラ画像パス例: `/characters/alpoo-happy.png`, `/characters/alpoo-standby.png`

</important>

<important if="CSS・スタイリング実装時">

## CSS実装ルール
- **`<style>` タグを JSX 内に書かない** → Turbopack でビルドエラーになる
- メディアクエリ・`@keyframes` は必ず `src/app/globals.css` に書く
- レスポンシブ: Tailwindクラス（`md:`, `lg:`）またはインラインstyleで対応
- `md:hidden` = スマホ専用、`hidden md:block` = PC専用

</important>

<important if="git操作・デプロイ時">

## Git / デプロイルール
- `.env.local` は **絶対にGitにpushしない**
- コード変更後は必ず `git push origin main`
- worktreeから push が詰まる場合: メインリポジトリ（`~/Desktop/oripa-site`）で `git merge` → `git push`
- 小さく・頻繁にコミット（1機能1コミット推奨）
- squash merge 推奨 — `git revert` しやすい clean な履歴を保つ

</important>

---

## ページ構成

### ユーザー向け
| パス | 内容 |
|------|------|
| `/` | トップページ（オリパ一覧） |
| `/auth/login` / `/auth/register` | ログイン / 会員登録 |
| `/event/[id]` | イベント詳細・ガチャ |
| `/gacha-result` | ガチャ結果 |
| `/buy-points` | コイン購入 |
| `/fp-exchange` | FPコイン交換 |
| `/mypage` | マイページ |
| `/history` | 当選履歴（S・A賞） |
| `/prizes` | 獲得商品 |
| `/shipment` | 発送申請 |

### 管理画面（`/admin/*`）
商品・注文・顧客・バナー・イベント・アニメーション・ポイント・FP交換・設定

### API
| パス | 内容 |
|------|------|
| `/api/gacha` | ガチャ処理（ポイント消費・当選判定） |
| `/api/stripe/checkout` | Stripe決済作成 |
| `/api/stripe/webhook` | Stripeウェブフック |

---

## コンポーネント設計
- `Header.tsx` — PCナビ付き（max-width 1280px）。ログイン状態で全リンク表示
- `BottomNav.tsx` — スマホ専用（`md:hidden`）。PCはHeaderナビで代替
- `globals.css` — アニメーション・メディアクエリの定義場所

## 賞レアリティ
`S賞（最高）→ A賞 → B賞 → C賞`

## キャラクター
| キャラ | 説明 |
|--------|------|
| あーるくん（タケル） | 逆三角形・ロイヤルブルーウェア・スマートウォッチ。16ポーズ完成済み |
| あるぷー（ポチ） | アプリコット色トイプードル・テラコッタリュック。16ポーズ完成済み |

## 動画演出
| 賞 | 演出 |
|----|------|
| S賞 | 虹色オーラ・最大エフェクト |
| A賞 | パーティクル爆発・紙吹雪 |
| B賞 | 青いグロー |
| C賞 | シンプル演出 |

## 動画制作ツール
Grok（静止画）→ Kling（動画化）→ DaVinci Resolve（編集・60fps・1920×1080）

---

## 環境変数
```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_BASE_URL
```

## 未実装・今後の課題
- 利用規約・プライバシーポリシー・特定商取引法ページ（`/legal/*`）
- パスワードリセット機能
- 歩数計連動（iOS/Android ヘルスケアAPI）・歩数偽装対策
- 日用品交換機能

## 事業フェーズ
- フェーズ1（現在）: ポケカオリパ・主婦層獲得
- フェーズ2（中期）: 交換日用品拡充・コミュニティ機能
- フェーズ3（長期）: スマートウォッチ連携・海外展開

## CLAUDE.md 更新タイミング
新機能実装・新ページ追加・DB構成変更・キャラクター設計変更時に更新
