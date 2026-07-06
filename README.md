# Interactive Co-Learning Assistant
### Small-Step Active Learning with Gemini API

> **Transforming passive document reading into an active, AI-guided learning conversation.**
> **一方向的なドキュメント精読を、AIとの対話による能動的な学習体験へ。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20API-blue)](https://ai.google.dev/)
[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity-purple)](https://antigravity.dev/)

---

## 🎬 Demo Video / デモ動画
[▶ Watch on YouTube](https://youtu.be/uzS4LRL8ngQ)

---

## 🧩 Problem / 課題

**[English]**
In the age of digital learning, many learners (especially non-engineers and non-native speakers) face a common yet often overlooked challenge: **passive reading does not lead to deep understanding.**

Paper-based study allowed flexible engagement — highlighting, margin notes, diagrams. But digital documents often lack that tactile, personal dimension. The result is "flow-reading" without retention.

Additionally, high-quality AI course materials like the "5-Day AI Agents" whitepapers are extremely dense. For non-engineers or non-native English speakers, the language and technical barriers can feel insurmountable — causing many learners to give up before they even begin.

**[日本語]**
デジタル学習の時代において、多くの学習者（特に非エンジニアや非英語ネイティブ）は共通の課題に直面しています。**受動的な読書は深い理解につながらない**という問題です。

紙の教材では、マーカーで線を引いたり、余白にメモやイラストを書き込んだりする柔軟性がありました。しかし、デジタルドキュメントにはその自由さがなかなかありません。結果として「流し読み」になり、内容が定着しません。

また、「5-Day AI Agents」のような高品質なAI教材は非常に難解です。非エンジニアや英語ネイティブでない学習者にとって、言語と技術の壁は圧倒的で、学習を諦めてしまう原因になりえます。

---

## 💡 Solution / 解決策

**[English]**
**Interactive Co-Learning Assistant** converts any PDF or Markdown document into a structured, AI-assisted active learning session.

- **Drop a PDF or Markdown file** → the app parses and splits it into manageable "small steps"
- **An AI agent (Co-Learning Agent)** generates a plain-language summary for each step
- **Chat with the AI** to ask questions, share analogies, and clarify doubts — just like studying with a tutor
- **Key insights** are auto-extracted from the conversation and merged into a personal learning note (right pane)
- **Download your notes** as a Markdown file at the end of each session
- **Seamless JP/EN toggle** — the entire AI pipeline switches language instantly

**[日本語]**
**Interactive Co-Learning Assistant** は、PDFやMarkdownファイルを、AIガイドつきの能動的な学習セッションへと変換します。

- **PDFまたはMarkdownをドロップ** → ブラウザ内でテキストが解析され、「スモールステップ」に分割されます
- **AIエージェント（Co-Learning Agent）** が各ステップのわかりやすい解説を自動生成します
- **AIとチャット** しながら疑問点を解消できます — まるで個別指導のようです
- **会話から得られた気づき** が自動抽出され、右ペインの学習ノートにリアルタイムでマージされます
- **ノートをMarkdownとしてダウンロード** できます
- **日英シームレス切り替え** — AIのパイプライン全体が瞬時に言語切り替えに対応します

---

## 🏗️ Architecture / アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client-Side)                    │
│                                                             │
│  ┌──────────────┐    ┌─────────────────────────────────┐   │
│  │  PDF/MD Drop │───▶│  Text Parser & Section Splitter │   │
│  │  (File API)  │    │  (Heading-based / Char-count)   │   │
│  └──────────────┘    └──────────────┬──────────────────┘   │
│                                     │                       │
│  ┌──────────────────────────────────▼──────────────────┐   │
│  │              2-Pane Learning UI                      │   │
│  │  ┌─────────────────┐  ┌────────────────────────┐   │   │
│  │  │  Left Pane       │  │  Right Pane             │   │   │
│  │  │ - Section Card   │  │ - Co-Learning Notes     │   │   │
│  │  │   (Accordion)    │  │   (Auto-extracted)      │   │   │
│  │  │ - Chat Interface │  │ - Download (.md)        │   │   │
│  │  └────────┬─────────┘  └────────────────────────┘   │   │
│  └───────────┼──────────────────────────────────────────┘   │
│              │                                              │
│  ┌───────────▼──────────────────────────────────────────┐   │
│  │          Gemini API (gemini-2.5-flash)               │   │
│  │  - System Instruction (JP/EN dynamic switching)      │   │
│  │  - Explanation generation (small-step summary)       │   │
│  │  - Chat Q&A with context                             │   │
│  │  - Notes extraction via <notes> tag protocol         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions / 主な設計方針:**
- **100% client-side** — no backend server required. All text parsing and API calls happen in the browser. / バックエンドサーバー不要。テキスト解析とAPI呼び出しはすべてブラウザ内で完結。
- **API key stored in `localStorage`** — never sent to any third-party server. / APIキーはブラウザの`localStorage`にのみ保存。サードパーティサーバーには一切送信されません。
- **Vite** as the build tool for fast HMR development and optimized production builds. / ビルドツールとして**Vite**を採用。高速なHMR開発と最適化されたプロダクションビルドを実現します。

---

## 🤖 Course Concepts Applied / コースコンセプトの適用

This project applies the following key concepts from the "5-Day AI Agents" course.
The evaluation criteria require **at least 3 major concepts** — this project covers all 5.

本プロジェクトは「5-Day AI Agents」コースの主要コンセプトを以下の5つ適用しています。評価基準の「最低3つ」をすべて満たしています。

---

### ✅ 1. AI Agent / AIエージェント

**[English]**
The `Co-Learning Agent` is a conversational AI agent powered by the Gemini API (`gemini-2.5-flash`).
It autonomously:
- Generates plain-language summaries for each learning section (step-by-step explanation)
- Responds to user questions in context-aware chat
- Extracts and structures key insights via a `<notes>` tag protocol, rendered in the right pane in real time

**[日本語]**
`Co-Learning Agent` は、Gemini API（`gemini-2.5-flash`）を搭載した会話型AIエージェントです。
自律的に以下を実行します：
- 各学習セクションのわかりやすい超訳解説を自動生成
- ユーザーの質問にコンテキストを保ちながら回答
- `<notes>`タグプロトコルで重要な気づきを抽出し、右ペインにリアルタイム表示

---

### ✅ 2. Built with Antigravity / Antigravityによる開発

**[English]**
This application was developed through **human-AI pair programming with Antigravity**.
- **Kate** (Human UX Designer) defined pedagogical requirements and UX principles
- **Antigravity** autonomously set up Puppeteer E2E browser tests, captured DOM screenshots, identified uncaught runtime exceptions (e.g., DOMContentLoaded timing issues under ESM), and performed self-correction loops
- The entire development cycle — from initial scaffold to final bug fixes — was a collaborative co-creation process

**[日本語]**
本アプリは、**AntigravityとのHuman-AIペアプログラミング**によって開発されました。
- **Kate**（人間のUXデザイナー）が教育工学的な要件とUX方針を定義
- **Antigravity** がPuppeteer E2Eブラウザテストを自律構築し、DOMのスクリーンショット取得、未キャッチ例外（ESMモードでのDOMContentLoadedのタイミングズレ等）の特定、自己修正ループを実施
- 初期スキャフォールドから最終バグ修正まで、開発サイクル全体が協働による共同制作プロセスでした

---

### ✅ 3. Security Features / セキュリティ機能

**[English]**
Security was a first-class concern throughout the project:
- **API Key Safety**: Keys are stored exclusively in the browser's `localStorage` and never sent to any server other than Google's Gemini API
- **Clear Key Feature**: A prominent red "Clear Key" button lets users delete their credentials at any time (UX-compliant credential management)
- **XSS Prevention**: All user-generated text inputs are HTML-escaped before rendering to prevent cross-site scripting attacks

**[日本語]**
セキュリティはプロジェクト全体を通じて最優先事項でした：
- **APIキーの安全性**: キーはブラウザの`localStorage`にのみ保存。GoogleのGemini API以外のサーバーには一切送信されません
- **Clear Key機能**: 目立つ赤い「解除する」ボタンにより、ユーザーがいつでも認証情報を削除可能（UXガイドラインに準拠した認証情報管理）
- **XSS対策**: ユーザー入力テキストはすべてHTMLエスケープ処理を施してからレンダリング

---

### ✅ 4. Deployability / デプロイの容易さ

**[English]**
- **Zero backend required** — the entire app runs client-side in the browser
- Start instantly with a single command: `npm run dev`
- Deployable to any static hosting (GitHub Pages, Vercel, Netlify, etc.) with no server configuration
- No database, no authentication server, no infrastructure to manage

**[日本語]**
- **バックエンド不要** — アプリはすべてブラウザのクライアントサイドで動作します
- `npm run dev` の1コマンドで即座に起動
- GitHub Pages、Vercel、Netlifyなど任意の静的ホスティングにサーバー設定なしでデプロイ可能
- データベース・認証サーバー・インフラの管理は一切不要

---

### ✅ 5. Structured Output & System Instruction / 構造化出力とシステム命令

**[English]**
- **Dynamic System Instructions**: The Gemini API system prompt switches between Japanese and English at runtime, controlling the agent's tone, format, word count limits, and output language
- **Structured Output via `<notes>` protocol**: The AI embeds structured learning notes within its responses using a custom tag (`<notes>...</notes>`), which are parsed client-side and rendered in the notes pane separately from the chat

**[日本語]**
- **動的システム命令**: Gemini APIのシステムプロンプトが日本語・英語間でランタイムに切り替わり、エージェントのトーン・フォーマット・文字数制限・出力言語を制御します
- **`<notes>`プロトコルによる構造化出力**: AIはカスタムタグ（`<notes>...</notes>`）を使って応答内に構造化された学習ノートを埋め込み、クライアントサイドで解析してチャットとは独立してノートペインに表示します

---

## ⚙️ Setup Instructions / セットアップ手順

### Prerequisites / 前提条件
- Node.js (v18 or later)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository / リポジトリをクローン
```bash
git clone https://github.com/jr-blip853/20260630_interactive-co-learning-assistant.git
cd 20260630_interactive-co-learning-assistant
```

### 2. Install Dependencies / 依存パッケージをインストール
```bash
npm install
```

### 3. Start the Development Server / 開発サーバーを起動
```bash
npm run dev
```

Open your browser at `http://localhost:3000`. / ブラウザで `http://localhost:3000` を開いてください。

### 4. Set Your API Key / APIキーを設定
1. Click the **🔑 API Key** button in the top-right corner. / 右上の「🔑 APIキー設定」ボタンをクリック。
2. Paste your Gemini API key and click **Save**. / Gemini APIキーを貼り付けて「保存」をクリック。
3. The key is stored securely in your browser's `localStorage`. / キーはブラウザの`localStorage`に安全に保存されます。
4. To remove it, click the **Clear** (red) button inside the same modal. / 削除するには同じモーダル内の「解除する」（赤）ボタンをクリック。

### 5. Load a Document & Start Learning / ドキュメントを読み込んで学習開始
1. Drag and drop any **PDF** or **Markdown (.md)** file onto the upload area. / PDFまたはMarkdownファイルをアップロードエリアにドロップ。
2. Click **Start Learning**. / 「学習を開始する」をクリック。
3. The Co-Learning Agent will generate your first explanation automatically. / Co-Learning Agentが最初の解説を自動生成します。
4. Ask questions in the chat, explore the notes pane, and download your notes when done! / チャットで質問し、ノートを確認し、完了したらダウンロード！

---

## 🔒 Security Considerations / セキュリティへの配慮

- **API Key Safety / APIキーの安全性**: The API key is stored exclusively in the browser's `localStorage` and is never transmitted to any server other than the Google Gemini API directly. / APIキーはブラウザの`localStorage`にのみ保存され、Google Gemini API以外のサーバーには一切送信されません。
- **Clear Key Feature / Clear Key機能**: A prominent red "Clear Key" button is always accessible, giving users full control to delete their credentials at any time. / 目立つ赤い「解除する」ボタンを常に利用可能にし、ユーザーがいつでも認証情報を完全に削除できます。
- **XSS Prevention / XSS対策**: All user-generated text inputs are HTML-escaped before rendering to prevent cross-site scripting attacks. / ユーザー入力テキストはすべてHTMLエスケープ処理を施してからレンダリングし、クロスサイトスクリプティング攻撃を防止します。

---

## 🚀 Future Work / 今後の展望

- **Semantic Chunking / セマンティック分割**: Replace the current character-count-based splitter with a Gemini-API-powered semantic segmentation for more logically coherent learning steps. / 現在の文字数ベースの分割を、Gemini APIによる意味論的分割に置き換え、より論理的に一貫したスモールステップを実現します。
- **Session Persistence / セッション保存**: Save and restore learning sessions (progress, chat history, notes) across browser sessions. / 学習の進捗・チャット履歴・ノートをブラウザセッションをまたいで保存・復元します。
- **Multi-document support / 複数ドキュメント対応**: Allow learners to load and switch between multiple documents in a single session. / 1つのセッション内で複数のドキュメントを読み込み、切り替えられるようにします。

---

## 👤 About the Author / 著者について

**[English]**
Built by **Kate** — a non-engineer and non-native English speaker who overcame the language and technical barriers of the "5-Day AI Agents" course through AI-assisted co-learning, and turned that experience into this application.

Developed in pair programming with **Antigravity** (AI agent), including autonomous E2E testing with Puppeteer and iterative self-correction loops.

**[日本語]**
**Kate** による開発 — 非エンジニアかつ英語ネイティブでないKateが、AIとの共同学習を通じて「5-Day AI Agents」講座の言語・技術の壁を乗り越え、その体験をそのままアプリとして具現化しました。

**Antigravity**（AIエージェント）とのペアプログラミングにより開発。PuppeteerによるE2E自動テストと自己修正ループを含む全開発サイクルをAIと協働で完遂しました。

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
