# fitオリパ (oripa-site) プロジェクト

## 更新タイミング
- 新機能を実装した時
- 新しいページを追加した時
- DB構成が変わった時
- キャラクター・賞品設計が変わった時
- ※毎回の起動時・普段の開発中は更新不要

## プロジェクト概要
- サービス名：fitオリパ（Fit Oripa）
- ドメイン：fitoripa.com予定
- コンセプト：フィットネス×オリパ
- 仕組み：歩数計連動でポイント付与→ポケカオリパを回せる→外れても日用品に交換可能
- ターゲット：主婦層・健康意識層・ライトなポケカファン
- 差別化：「負けないオリパ」外れても日用品（おむつ・お尻拭き等）に交換できる
- デプロイ：Vercel
- リポジトリ：https://github.com/toganokitomohiro-ops/oripa-site

## 技術スタック
- フレームワーク：Next.js（App Router）
- DB：Supabase (PostgreSQL)
- 認証：Supabase Auth
- 決済：Stripe（クレカ・コンビニ・銀行振込）
- デプロイ：Vercel
- 言語：TypeScript

## 環境変数
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_BASE_URL

## ページ構成

### ユーザー向け
| パス | 内容 |
|------|------|
| / | トップページ |
| /auth/login | ログイン |
| /auth/register | 会員登録 |
| /gacha/[id] | ガチャページ |
| /gacha-result | ガチャ結果 |
| /event/[id] | イベント詳細 |
| /buy-points | ポイント購入 |
| /buy-points/checkout | 決済画面 |
| /buy-points/success | 購入完了 |
| /fp-exchange | FP交換 |
| /fp-exchange/[id] | FP交換詳細 |
| /mypage | マイページ |
| /history | 履歴 |
| /prizes | 賞品一覧 |
| /shipment | 発送申請 |
| /reports | レポート |

### 管理画面
| パス | 内容 |
|------|------|
| /admin | 管理画面TOP |
| /admin/products | 商品管理 |
| /admin/products/new | 商品新規作成 |
| /admin/products/[pid] | 商品編集 |
| /admin/orders | 注文管理 |
| /admin/customers | 顧客管理 |
| /admin/banners | バナー管理 |
| /admin/banners/new | バナー新規作成 |
| /admin/banners/[bid] | バナー編集 |
| /admin/events | イベント管理 |
| /admin/events/new | イベント新規作成 |
| /admin/events/[eid] | イベント編集 |
| /admin/animations | アニメーション管理 |
| /admin/points | ポイント管理 |
| /admin/fp-exchange | FP交換管理 |
| /admin/marketing | マーケティング |
| /admin/settings | 設定 |

### APIルート
| パス | 内容 |
|------|------|
| /api/gacha | ガチャ処理 |
| /api/sell | 売却処理 |
| /api/stripe/checkout | Stripe決済作成 |
| /api/stripe/webhook | Stripeウェブフック |
| /auth/callback | 認証コールバック |

## 実装済み機能
- トップページ・ログイン・会員登録
- ガチャ機能（動画演出含む）
- マイページ・発送申請
- Stripe決済（クレカ・コンビニ・銀行振込）
- 管理画面全ページ
- FP交換機能
- イベント機能

## 未実装・今後の課題
- 歩数計連動（iOS/AndroidヘルスケアAPI連携）
- 歩数偽装対策（異常検知システム）
- 日用品交換機能
- コミュニティ機能（家族対抗歩数チャレンジ等）
- LINEスタンプ・デジタルシール配布
- スマートウォッチ連携

## 事業フェーズ
- フェーズ1（現在）：歩数計連動・ポケカオリパ・日用品交換に特化・主婦層獲得
- フェーズ2（中期）：交換日用品の拡充・ゲーム機追加・コミュニティ機能
- フェーズ3（長期）：スマートウォッチ連携・健康診断連動・海外展開

## キャラクター詳細

### あーるくん（タケル）
- 外見：逆三角形体型・童顔・短髪・ロイヤルブルーのフィットネスウェア
- 胸元にF.O.ロゴ・腕にスマートウォッチ・ダンベル/プロテインシェイカー持参
- 性格：ストイックで真面目・ポケカに熱くなりすぎる・ポジティブ思考
- 素材：16枚完成済み（Grokで生成）
- バリエーション：20代〜40代・金髪あり

### あるぷー（ポチ）
- 外見：アプリコット色トイプードル・背中に歩数計リュック（テラコッタオレンジ）
- F.O.ロゴの刺繍・首輪に鈴
- 性格：天真爛漫・マッスルとニコが大好き・食いしん坊
- 素材：16枚完成済み（Grokで生成）

## 賞レアリティ
S賞（最高）→ A賞 → B賞 → C賞

## 動画演出設計
| 賞 | 演出内容 |
|----|---------|
| S賞 | 虹色オーラ・目が虹色に光る・最大エフェクト |
| A賞 | パーティクル爆発・紙吹雪 |
| B賞 | 青いグロー追加 |
| C賞 | シンプル演出 |

## 動画制作ツール構成
- 静止画生成：Grok
- 動画化：Kling
- 編集：DaVinci Resolve（セットアップ済み・60fps・1920×1080）
- BGM：DOVA-SYNDROME
- SE：効果音ラボ

## 開発環境
- エディタ：VS Code
- ターミナル：VS Codeのターミナル
- コードの相談：Claude.ai（ブラウザ）にファイルを貼り付けて行う
- Supabaseの操作：Claudeデスクトップアプリ（MCP連携済み）
- Claude Codeは消費が大きいので最小限に使う
- コード変更後は必ずgit pushする

## 開発ルール
- コードの相談はClaude.ai（ブラウザ）にファイルを貼り付けて行う
- Supabaseの操作はClaudeデスクトップアプリで行う
- Claude Codeは消費が大きいので最小限に使う
- コード変更後は必ずgit pushする
- .env.localは絶対にGitにpushしない
