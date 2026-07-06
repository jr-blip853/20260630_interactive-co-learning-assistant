# Interactive Co-Learning Assistant
### Small-Step Active Learning with Gemini API

> **Transforming passive document reading into an active, AI-guided learning conversation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20API-blue)](https://ai.google.dev/)
[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity-purple)](https://antigravity.dev/)

---

## 🎬 Demo Video
[▶ Watch on YouTube](https://youtu.be/uzS4LRL8ngQ)

---

## 🧩 Problem

In the age of digital learning, many learners (especially non-engineers and non-native speakers) face a common yet often overlooked challenge: **passive reading does not lead to deep understanding.**

Paper-based study allowed flexible engagement — highlighting, margin notes, diagrams. But digital documents often lack that tactile, personal dimension. The result is "flow-reading" without retention.

Additionally, high-quality AI course materials like the "5-Day AI Agents" whitepapers are extremely dense. For non-engineers or non-native English speakers, the language and technical barriers can feel insurmountable — causing many learners to give up before they even begin.

---

## 💡 Solution

**Interactive Co-Learning Assistant** converts any PDF or Markdown document into a structured, AI-assisted active learning session.

- **Drop a PDF or Markdown file** → the app parses and splits it into manageable "small steps"
- **An AI agent (Co-Learning Agent)** generates a plain-language summary for each step
- **Chat with the AI** to ask questions, share analogies, and clarify doubts — just like studying with a tutor
- **Key insights** are auto-extracted from the conversation and merged into a personal learning note (right pane)
- **Download your notes** as a Markdown file at the end of each session

The UI supports **seamless Japanese/English switching** — the entire AI pipeline (system instructions, explanations, chat, and notes) dynamically responds in the selected language.

---

## 🏗️ Architecture

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
│  │          Gemini API (gemini-2.0-flash)               │   │
│  │  - System Instruction (JP/EN dynamic switching)      │   │
│  │  - Explanation generation (small-step summary)       │   │
│  │  - Chat Q&A with context                             │   │
│  │  - Notes extraction via <notes> tag protocol         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **100% client-side** — no backend server required. All text parsing and API calls happen in the browser.
- **API key stored in `localStorage`** — never sent to any third-party server.
- **Vite** as the build tool for fast HMR development and optimized production builds.

---

## 🤖 Course Concepts Applied

This project applies the following key concepts from the "5-Day AI Agents" course:

| Concept | Implementation |
|---|---|
| **AI Agent** | `Co-Learning Agent` — an AI that autonomously generates step-by-step explanations and extracts structured notes from conversations |
| **Structured Output** | `<notes>` tag protocol — the AI embeds structured learning notes within its responses, which are then parsed and rendered separately |
| **System Instruction** | Dynamic system prompts that switch between Japanese and English, controlling agent tone, format, and output length |
| **Security features** | API keys stored only in `localStorage`; prominent "Clear Key" button for user control; full HTML-escaping of user inputs against XSS attacks |
| **Deployability** | Zero backend required — runs entirely in the browser with a single `npm run dev` command. Deployable to any static hosting (GitHub Pages, Vercel, etc.) |
| **Human-AI Co-creation** | Built through pair programming with Antigravity (AI agent), including autonomous Puppeteer E2E testing and self-correction loops |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/jr-blip853/20260630_interactive-co-learning-assistant.git
cd 20260630_interactive-co-learning-assistant
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 4. Set Your API Key
1. Click the **🔑 API Key** button in the top-right corner.
2. Paste your Gemini API key and click **Save**.
3. The key is stored securely in your browser's `localStorage`.
4. To remove it, click the **Clear** (red) button inside the same modal.

### 5. Load a Document & Start Learning
1. Drag and drop any **PDF** or **Markdown (.md)** file onto the upload area.
2. Click **Start Learning**.
3. The Co-Learning Agent will generate your first explanation automatically.
4. Ask questions in the chat, explore the notes pane, and download your notes when done!

---

## 🔒 Security Considerations

- **API Key Safety**: The API key is stored exclusively in the browser's `localStorage` and is never transmitted to any server other than the Google Gemini API directly.
- **Clear Key Feature**: A prominent red "Clear Key" button is always accessible, giving users full control to delete their credentials at any time — following UX best practices for credential management.
- **XSS Prevention**: All user-generated text inputs are HTML-escaped before rendering to prevent cross-site scripting attacks.

---

## 🚀 Future Work

- **Semantic Chunking**: Replace the current character-count-based splitter with a Gemini-API-powered semantic segmentation to produce more logically coherent learning steps.
- **Session Persistence**: Save and restore learning sessions (progress, chat history, notes) across browser sessions.
- **Multi-document support**: Allow learners to load and switch between multiple documents in a single session.

---

## 👤 About the Author

Built by **Tom Kerry** — a non-engineer and non-native English speaker who overcame the language and technical barriers of the "5-Day AI Agents" course through AI-assisted co-learning, and turned that experience into this application.

Developed in pair programming with **Antigravity** (AI agent), including autonomous E2E testing with Puppeteer and iterative self-correction loops.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
