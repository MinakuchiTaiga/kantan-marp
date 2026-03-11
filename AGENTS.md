# AGENTS

## Tech Stack

このリポジトリでは以下を使用すること:

- node
- pnpm
- biome
- react
- vite
- vitest
- tailwind css

## Development Preview

- このリポジトリでは、通常の動作確認・共有確認は `pnpm run build` 後の `pnpm run preview -- --host 127.0.0.1 --port 4173` を基本とすること
- 開発中に「ビルド成果物（dist）」を確認・共有する場合は `pnpm run preview -- --host 127.0.0.1 --port 4173` を使用すること
- `pnpm run dev` は実装中の高速フィードバック（HMR）が必要な場合にのみ使用すること

## Deliverables

最終成果物として以下の2バージョンを提供すること:

- 軽量版（外部CDN依存）
- セキュリティ重視版（外部CDN不使用）
- どちらの版もHTMLを開いた直後はプレゼンテーションモードで開始する
- どちらの版もユーザーがCSSを直接編集できること
- どちらの版もコードシンタックスハイライトに対応すること
- どちらの版も画像をHTMLファイルに添付できること

## Design Principles

- 実装時は高凝集・低結合を意識し、責務を明確に分離すること

## Language Rules

- コミットメッセージは日本語で記述すること
- コードコメントは日本語で記述すること
