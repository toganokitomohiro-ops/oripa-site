# fitオリパ (fitoripa.com) - プロジェクト仕様書

最終更新: 2026-04-05

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | fitオリパ（Fit Oripa） |
| ドメイン | fitoripa.com（予定） |
| コンセプト | フィットネス × オリパ。歩くほどお得になる「負けないオリパ」 |
| ターゲット | 主婦層・健康意識層・ライトなポケカファン |
| 差別化ポイント | 外れても日用品（おむつ・お尻拭き等）に交換可能。歩数連動でFP付与 |
| リポジトリ | https://github.com/toganokitomohiro-ops/oripa-site |
| デプロイ | Vercel（mainブランチ自動デプロイ） |

---

## 2. 技術スタック

| 種別 | 技術 |
|------|------|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| DB・認証 | Supabase（PostgreSQL + Auth） |
| 決済 | Stripe（クレカ・コンビニ・銀行振込） |
| スタイリング | インラインスタイル（Tailwindは未使用） |
| デプロイ | Vercel |
| バージョン管理 | GitHub |

### 主要ライブラリ
- `@supabase/ssr` / `@supabase/supabase-js`
- `stripe` / `@stripe/stripe-js`
- `next` 16

---

## 3. デザインシステム

### カラーパレット
| 用途 | カラーコード |
|------|-------------|
| プライマリ（オレンジ） | `#f97316` |
| プライマリホバー | `#ea580c` |
| コイン・ポイント | `#fbbf24` |
| 背景 | `#f8f7f5` |
| テキストメイン | `#1a1a1a` |
| テキストサブ | `#6b7280` |
| 白カード | `#ffffff` |
| エラー | `#ef4444` |
| 成功 | `#22c55e` |

### 賞レアリティカラー
| 賞 | 背景 | テキスト |
|----|------|--------|
| S賞（最高） | `linear-gradient(135deg, #7c3aed, #db2777)` | white |
| A賞 | `#f97316` | white |
| B賞 | `#3b82f6` | white |
| C賞 | `#6b7280` | white |

### レイアウト
- モバイルファースト（スマホ最適化）
- ユーザー向けページ: `maxWidth: 480px`
- 管理画面: `maxWidth: 1100px`
- ボトムナビ分の余白: `paddingBottom: 90px`
- カード角丸: `borderRadius: 12px`
- ボタン角丸: `borderRadius: 12px`
- バッジ・タグ: `borderRadius: 999px`
- モーダル: `borderRadius: 16px`

---

## 4. ページ構成

### ユーザー向けページ
| パス | ページ名 | 概要 |
|------|---------|------|
| `/` | トップページ | オリパ一覧・バナー・カテゴリータブ |
| `/auth/login` | ログイン | メール+パスワード / Google認証 |
| `/auth/register` | 会員登録 | メール+パスワード / Google認証 |
| `/gacha/[id]` | ガチャページ | オリパ詳細・1回/複数回ガチャ・天井カウンター |
| `/gacha-result` | ガチャ結果 | 動画演出・賞表示・売却/発送申請 |
| `/event/[id]` | イベント詳細 | イベント情報 |
| `/buy-points` | ポイント購入 | プラン一覧・クーポン入力 |
| `/buy-points/checkout` | 決済画面 | Stripe決済（クレカ/コンビニ/銀行） |
| `/buy-points/success` | 購入完了 | 完了画面 |
| `/fp-exchange` | FP交換所 | FPコイン残高・商品一覧（PC3列/スマホ2列） |
| `/fp-exchange/[id]` | FP交換詳細 | 商品詳細・交換確認・住所入力・完了 |
| `/mypage` | マイページ | プロフィール・コイン/FP残高・各種リンク |
| `/history` | 履歴 | ガチャ当選履歴 |
| `/prizes` | 獲得商品 | 獲得済み商品一覧・売却・発送申請 |
| `/shipment` | 発送申請 | 発送先住所入力・申請 |
| `/reports` | 当選報告 | 全ユーザーの当選報告一覧 |

### 管理画面
| パス | ページ名 | 概要 |
|------|---------|------|
| `/admin` | 管理TOP | 統計・クイックリンク |
| `/admin/products` | 商品管理 | 商品一覧 |
| `/admin/products/new` | 商品新規作成 | 商品登録フォーム |
| `/admin/products/[pid]` | 商品編集 | 商品編集フォーム |
| `/admin/orders` | 注文管理 | ガチャ注文・発送管理 |
| `/admin/customers` | 顧客管理 | ユーザー一覧・ポイント付与 |
| `/admin/banners` | バナー管理 | バナー一覧 |
| `/admin/banners/new` | バナー新規作成 | |
| `/admin/banners/[bid]` | バナー編集 | |
| `/admin/events` | イベント管理 | オリパ（ガチャ）一覧 |
| `/admin/events/new` | イベント新規作成 | オリパ登録 |
| `/admin/events/[eid]` | イベント編集 | オリパ編集 |
| `/admin/animations` | アニメーション管理 | 動画ファイル管理 |
| `/admin/points` | ポイント管理 | ポイント付与・履歴 |
| `/admin/fp-exchange` | FP交換管理 | 商品登録・注文管理・カテゴリー・設定 |
| `/admin/marketing` | マーケティング | |
| `/admin/settings` | 設定 | サービス設定 |

### APIルート
| パス | メソッド | 概要 |
|------|---------|------|
| `/api/gacha` | POST | ガチャ処理・FP付与・レアリティボーナス |
| `/api/sell` | POST | 商品売却処理 |
| `/api/login-bonus` | POST | ログインボーナスFP付与（1日1回） |
| `/api/fp-expire` | POST | 期限切れFPの失効処理 |
| `/api/stripe/checkout` | POST | Stripe決済セッション作成 |
| `/api/stripe/webhook` | POST | Stripe Webhookハンドラー |
| `/auth/callback` | GET | Supabase認証コールバック |

---

## 5. データベース設計（Supabase）

### profiles
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | auth.users.id と一致 |
| email | text | メールアドレス |
| points | integer | 保有コイン数（ガチャ用） |
| fp_points | integer | FPコイン残高（交換所用） |
| total_spent | integer | 累計購入コイン |
| is_admin | boolean | 管理者フラグ |
| last_login_bonus_at | date | 最後にログインボーナスを受け取った日 |
| created_at | timestamptz | 登録日時 |

### events（オリパ・ガチャ）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| name | text | オリパ名 |
| image_url | text | サムネイル |
| price | integer | 1口の価格（コイン） |
| total_count | integer | 総枚数 |
| remaining_count | integer | 残り枚数 |
| status | text | draft/active/ended |
| category | text | pokemon/onepiece/yugioh/other |
| ceiling_count | integer | 天井回数（0=無効） |
| ceiling_grade | text | 天井保証賞 |
| last_one_product_id | uuid | ラストワン賞の商品 |

### prizes（賞品）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| event_id | uuid | どのオリパか |
| product_id | uuid | 商品 |
| grade | text | S賞/A賞/B賞/C賞 |
| count | integer | 総枚数 |
| remaining_count | integer | 残り枚数 |
| pt_exchange | integer | 売却時コイン |
| animation_video_id | uuid | 専用演出動画 |

### draws（ガチャ履歴）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| user_id | uuid | |
| event_id | uuid | |
| prize_id | uuid | |
| product_id | uuid | |
| grade | text | 当選賞 |
| status | text | pending/sold/shipment_requested/shipped |
| is_exchanged | boolean | 売却済み |

### fp_exchange_items（FP交換商品）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| name | text | 商品名 |
| description | text | 説明 |
| image_url | text | 画像URL |
| category_id | uuid | カテゴリー |
| fp_price | integer | 必要FP |
| stock | integer | 初期在庫 |
| remaining_stock | integer | 残り在庫 |
| rarity | text | レアリティ（任意） |
| item_code | text | 型番（任意） |
| notes | text | 注意事項 |
| is_active | boolean | 公開フラグ |
| sort_order | integer | 表示順 |

### fp_exchange_orders（FP交換注文）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| user_id | uuid | |
| item_id | uuid | |
| fp_used | integer | 消費FP |
| status | text | pending/processing/shipped/cancelled |
| name | text | 配送先氏名 |
| postal_code | text | 郵便番号 |
| prefecture | text | 都道府県 |
| address | text | 住所 |
| address2 | text | 建物名（任意） |
| phone | text | 電話番号 |
| tracking_number | text | 追跡番号 |
| shipped_at | timestamptz | 発送日時 |
| note | text | 管理メモ |
| updated_at | timestamptz | 更新日時 |

### fp_settings（FP設定）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| fp_rate | numeric | ガチャFP還元率（コイン100に対してFP） |
| s_bonus | integer | S賞レアリティボーナスFP（デフォルト50） |
| a_bonus | integer | A賞レアリティボーナスFP（デフォルト20） |
| b_bonus | integer | B賞レアリティボーナスFP（デフォルト5） |
| c_bonus | integer | C賞レアリティボーナスFP（デフォルト0） |
| login_bonus | integer | ログインボーナスFP（デフォルト5） |
| fp_expiry_months | integer | FP有効期限（月数、0=無期限、デフォルト6） |

### fp_transactions（FPトランザクション履歴）
| カラム | 型 | 概要 |
|--------|-----|------|
| id | uuid | |
| user_id | uuid | |
| amount | integer | 増減量（正=獲得、負=消費/失効） |
| type | text | gacha_earn/rarity_bonus/login_bonus/exchange_use/expired/admin_adjust |
| description | text | 内容メモ |
| expires_at | timestamptz | 有効期限（nullで無期限） |
| created_at | timestamptz | |

### その他テーブル
- `products` - 商品マスタ
- `point_logs` - コイン増減ログ
- `point_plans` - ポイント購入プラン
- `banners` - バナー
- `notices` - お知らせ
- `shipments` - 発送申請
- `coupons` - クーポン
- `animation_videos` - 演出動画
- `gacha_options` - ガチャオプション（1口/5口など）
- `user_ceiling` - 天井カウンター
- `step_logs` - 歩数ログ（将来用）
- `fp_exchange_categories` - FP交換カテゴリー

---

## 6. FPコインシステム

### FP獲得の仕組み

| 獲得方法 | 詳細 | 実装状況 |
|----------|------|---------|
| ガチャ消費連動 | 消費コイン × fp_rate ÷ 100 | ✅ 実装済み |
| レアリティボーナス | S賞+50/A賞+20/B賞+5 FP | ✅ 実装済み |
| ログインボーナス | 1日1回+5FP（変更可能） | ✅ 実装済み |
| 歩数連動 | 1000歩=1FP 等 | 🔲 未実装（将来対応） |

### FP有効期限
- 獲得から`fp_expiry_months`ヶ月で失効（デフォルト6ヶ月）
- FP交換所ページアクセス時に自動チェック・失効処理

### FP消費
- FP交換所で商品と交換（住所入力→発送）

---

## 7. キャラクター設定

### あーるくん（タケル）
- 外見：逆三角形体型・童顔・短髪・ロイヤルブルーのフィットネスウェア
- 胸元にF.O.ロゴ・腕にスマートウォッチ
- 性格：ストイックで真面目・ポジティブ思考
- 素材：16枚完成済み（Grok生成）

### あるぷー（ポチ）
- 外見：アプリコット色トイプードル・背中に歩数計リュック（テラコッタオレンジ）
- F.O.ロゴ刺繍・首輪に鈴
- 性格：天真爛漫・食いしん坊
- 素材：16枚完成済み（Grok生成）

---

## 8. 動画演出設計

| 賞 | 演出内容 |
|----|---------|
| S賞 | 虹色オーラ・目が虹色に光る・最大エフェクト |
| A賞 | パーティクル爆発・紙吹雪 |
| B賞 | 青いグロー追加 |
| C賞 | シンプル演出 |

**制作ツール:** Grok（静止画）→ Kling（動画化）→ DaVinci Resolve（編集・60fps・1920×1080）
**BGM:** DOVA-SYNDROME / **SE:** 効果音ラボ

---

## 9. 実装済み機能一覧

### ユーザー機能
- [x] ログイン・会員登録（メール/Google）
- [x] ガチャ機能（1口・複数口・天井カウンター）
- [x] 賞レアリティ別動画演出（S/A/B/C賞）
- [x] マイページ・コイン残高表示
- [x] FPコイン残高表示
- [x] 獲得商品一覧・売却・コイン交換
- [x] ガチャ履歴
- [x] 発送申請
- [x] ポイント購入（Stripe：クレカ/コンビニ/銀行振込）
- [x] FP交換所（商品一覧・詳細・交換・住所入力）
- [x] イベント機能
- [x] 当選報告

### FPシステム
- [x] ガチャ消費連動FP付与
- [x] レアリティボーナス（S/A/B/C賞別設定）
- [x] ログインボーナス（1日1回）
- [x] FP有効期限（設定可能）
- [x] FPトランザクション履歴

### 管理機能
- [x] 商品管理（登録・編集・削除）
- [x] オリパ（イベント）管理（作成・編集・公開切替）
- [x] 注文・発送管理
- [x] 顧客管理・ポイント付与
- [x] バナー管理
- [x] アニメーション動画管理
- [x] ポイントプラン管理
- [x] FP交換所管理（商品・カテゴリー・注文・設定）
- [x] FP設定（還元率・ボーナス量・有効期限）

---

## 10. 未実装・今後の課題

### フェーズ1（近日対応）
- [ ] 歩数計連動（iOS/AndroidヘルスケアAPI）
- [ ] 歩数偽装対策（異常検知）
- [ ] SNS当選共有ボタン（X・LINE）
- [ ] お知らせ表示（フロント側）
- [ ] 古物商許可・18歳未満表示
- [ ] 演出動画の完成（Kling・DaVinci）
- [ ] FP交換履歴ページ（ユーザー向け）

### フェーズ2（中期）
- [ ] 日用品交換機能の拡充
- [ ] コミュニティ機能（家族対抗歩数チャレンジ）
- [ ] LINEスタンプ・デジタルシール配布

### フェーズ3（長期）
- [ ] スマートウォッチ連携
- [ ] 健康診断連動
- [ ] 海外展開

---

## 11. 環境変数

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_BASE_URL
```

---

## 12. 開発ルール

- コード変更後は必ず `git push origin main`
- `.env.local` は絶対にGitにpushしない
- Supabaseの操作はClaudeデスクトップアプリで行う
- DB構成・機能追加時はこのSPEC.mdを更新する
