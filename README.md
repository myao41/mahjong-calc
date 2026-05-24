# 麻雀点数計算ツール

M-League公式ルール準拠の麻雀点数計算練習Webアプリケーション。

## 機能

- **クイズ** — ランダム生成された手牌で点数計算を練習
- **自作問題** — 自分で問題を作成・保存・出題
- **成績** — 不正解の自動カテゴリ分類、苦手分野ランキング、間違えた問題の復習
- **符計算ルール** — M-League 第3条 得点計算(1) 準拠の符ルール解説
- **点数計算ルール** — M-League 第4条 翻の計算とアガリ点の解説、符×翻 詳細表

## 技術スタック

- React 19 + TypeScript
- Vite
- localStorage（履歴・自作問題の保存）

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド（dist/）
npm run preview  # ビルド結果をローカル確認
npm run lint     # ESLint
```

## デプロイ

`vercel.json` / `netlify.toml` を同梱しているため、Vercel / Netlify でリポジトリを連携するだけでデプロイされます。

```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod
```

設定済みのセキュリティヘッダー:
- Content-Security-Policy（外部リソース読み込みを制限）
- X-Frame-Options: DENY（iframe埋め込み禁止）
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy（不要なブラウザ権限を無効化）

## ルール準拠

このアプリは [M-League 公式ルール](https://m-league.jp/about/) の第3条・第4条に基づいた点数計算を実装しています。

### 主な特徴
- 場ゾロ込みの計算式: 基準点 = 符 × 2^(翻数 + 2)
- 切り上げ満貫（30符4翻、60符3翻など）
- 数え役満なし（11翻以上の通常役は三倍満が上限）
- 連風牌の雀頭は +2符（+4符ではない）
- 役満の倍数（ダブル役満・トリプル役満）対応
- 七対子は25符固定

> ※ 本アプリは M-League 公式とは関係ありません。ルール参照のため公開URLを引用していますが、独自に実装した非公式の練習用ツールです。

## 素材クレジット

牌のイラストは [素材ライブラリー](https://www.sozai-library.com/sozai/7198) のフリー素材を使用しています。

> 個人利用・法人利用問わず無料で利用可能との記載に基づいて使用しています。詳細は [利用規約](https://www.sozai-library.com/policy/) をご確認ください。

## データ保存について

すべての履歴・自作問題は **ブラウザの localStorage に保存** されます。

- サーバーへの送信はありません
- 同じブラウザ・同じ端末でのみデータが保持されます
- ブラウザのキャッシュをクリアするとデータが消えます
- 端末・ブラウザ間の同期はされません（将来クラウドストレージ対応予定）

## ライセンス

MIT License
