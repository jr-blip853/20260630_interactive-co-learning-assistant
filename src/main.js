import { marked } from 'marked';

// アプリケーションの状態管理 (State)
const state = {
  apiKey: localStorage.getItem('gemini_api_key') || '',
  rawText: '',
  sections: [],
  currentSectionIndex: 0,
  chatHistory: [], // 現在セクションのチャット履歴: [{role: 'user'|'model', text: ''}]
  currentNotes: '', // 現在セクションから抽出されたメモ
  allNotes: '', // 蓄積された全ノート
  lang: 'jp' // 'jp' | 'en' (多言語ステータス)
};

// UIエレメントの取得
const el = {
  setupView: document.getElementById('setup-view'),
  learningView: document.getElementById('learning-view'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  textPaste: document.getElementById('text-paste'),
  btnStartLearning: document.getElementById('btn-start-learning'),
  
  progressText: document.getElementById('progress-text'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  activeTextContent: document.getElementById('active-text-content'),
  chatHistory: document.getElementById('chat-history'),
  chatInput: document.getElementById('chat-input'),
  btnSendMessage: document.getElementById('btn-send-message'),
  btnAgree: document.getElementById('btn-agree'),
  
  notesPreview: document.getElementById('notes-preview'),
  btnDownloadNotes: document.getElementById('btn-download-notes'),
  
  btnApiKey: document.getElementById('btn-api-key'),
  apiKeyModal: document.getElementById('api-key-modal'),
  apiKeyInput: document.getElementById('api-key-input'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnSaveKey: document.getElementById('btn-save-key'),
  btnReset: document.getElementById('btn-reset'),
  
  btnLang: document.getElementById('btn-lang'),
  lblResetText: document.getElementById('lbl-reset-text'),
  lblApiKeyText: document.getElementById('lbl-api-key-text'),
  btnDeleteKey: document.getElementById('btn-delete-key'),
  activeTextDetails: document.getElementById('active-text-details')
};

// ==========================================================================
// 多言語対応 (日英切り替え辞書)
// ==========================================================================
const translations = {
  setupTitle: { jp: "学習ドキュメントのアップロード", en: "Upload Learning Document" },
  setupSubtitle: { jp: "対話型学習を開始するため、学習したいテキストまたはMarkdownファイルを読み込ませてください。", en: "Please upload your text or Markdown file to start interactive learning." },
  dropZoneText: { jp: "ファイルをドラッグ＆ドロップするか、クリックして選択", en: "Drag & drop files here, or click to browse" },
  dropZoneSub: { jp: "対応フォーマット: .txt, .md, .pdf", en: "Supported formats: .txt, .md, .pdf" },

  dividerText: { jp: "または", en: "OR" },
  pasteLabel: { jp: "テキストを直接ペーストする", en: "Paste text directly" },
  pastePlaceholder: { jp: "ここに学習したい文章を貼り付けてください...", en: "Paste the text you want to learn here..." },
  btnStartLearning: { jp: "学習を開始する", en: "Start Learning" },
  progressLabel: { jp: "学習の進捗: ", en: "Learning Progress: " },
  cardTag: { jp: "対象の学習セクション", en: "Active Learning Section" },
  chatInputPlaceholder: { jp: "疑問に思ったこと、気づいたことを入力... (Ctrl + Enterで送信)", en: "Enter your questions or insights... (Ctrl + Enter to send)" },
  btnAgreeText: { jp: "納得しました（次のセクションへ）", en: "I understand (Go to next section)" },
  notesTitle: { jp: "📝 Your Co-Learning Notes", en: "📝 Your Co-Learning Notes" },
  downloadText: { jp: "ダウンロード (.md)", en: "Download (.md)" },
  resetText: { jp: "最初に戻る", en: "Back to Start" },
  apiKeyText: { jp: "🔑 APIキー設定", en: "🔑 API Key Settings" },
  apiKeyTextActive: { jp: "🔑 APIキー設定済み", en: "🔑 API Key Configured" },
  modalTitle: { jp: "Google Gemini API キーの設定", en: "Google Gemini API Key Settings" },
  modalDesc: { jp: "対話機能と超訳解説の生成にGoogle Gemini APIを使用します。キーはブラウザにのみ保存され、外部に送信されません。", en: "We use Google Gemini API for dialogue and explanation. The key is saved locally in your browser and never sent to external servers." },
  apiKeyLabel: { jp: "Gemini API キー", en: "Gemini API Key" },
  btnCloseModal: { jp: "キャンセル", en: "Cancel" },
  btnSaveKey: { jp: "保存する", en: "Save Key" },
  btnDeleteKey: { jp: "解除する", en: "Clear Key" },
  loadingText: { jp: "Co-Learning Agentが超訳解説を生成しています...", en: "Co-Learning Agent is generating the explanation..." },
  notesPlaceholder: { jp: "学習が進むと、ここに対話から抽出された気づきが自動的に記録されます。", en: "As you progress, key insights extracted from your chat will be automatically recorded here." },
  confirmReset: { jp: "現在の学習進捗や生成されたノートは消去されますが、最初に戻りますか？", en: "Your current progress and notes will be cleared. Do you want to go back to start?" },
  alertKeySaved: { jp: "APIキーを保存しました。", en: "API Key saved successfully." },
  alertKeyDeleted: { jp: "APIキーを解除しました。", en: "API Key cleared." },
  alertNoText: { jp: "学習するテキストを入力するか、ファイルをアップロードしてください。", en: "Please enter text or upload a file to learn." },
  alertNoKey: { jp: "はじめにAPIキーを設定してください（右上の「APIキー設定」ボタンから行えます）。", en: "Please configure your API Key first (using the 'API Key Settings' button at the top right)." },
  extractingPdf: { jp: "PDFファイルを解析中... しばらくお待ちください。", en: "Analyzing PDF file... Please wait." },
  pdfError: { jp: "PDFファイルの解析に失敗しました: ", en: "Failed to analyze PDF file: " },
  completionTitle: { jp: "🎉 すべての原文の学習が終了しました！", en: "🎉 All sessions completed!" },
  completionDesc: { jp: "ドキュメントの最後まで到達しました。お疲れ様でした。<strong>作成された学習ノートを保存するため、右上の「📥 ダウンロード (.md)」ボタンを押してファイルを保存してください。</strong>", en: "You have reached the end of the document. Well done! <strong>Please click the '📥 Download (.md)' button at the top right to save your generated notes.</strong>" },
  completionChat: { jp: "お疲れ様でした！インプットされた原文の学習はすべて終了しました。学んだ知識がしっかりと腑に落ち、You独自のメモとしてノートにまとまりました。<strong>右上の「📥 ダウンロード (.md)」ボタンからノートの保存をお忘れなく！</strong>また新しい学習を始める際はお声がけください！", en: "Great job! You have finished studying the document. The knowledge has been successfully organized as your own insights in the learning notes. <strong>Don't forget to click the '📥 Download (.md)' button at the top right to save your notes!</strong> Feel free to call me when you want to start a new document!" },
  progressSections: { jp: "セクション", en: "Sections" },
  notesHeader: { jp: "# 学習ノート\n\n", en: "# Co-Learning Notes\n\n" },
  sectionLabel: { jp: "セクション", en: "Section" },
  editingLabel: { jp: "編集中", en: "Editing" },
  noNotes: { jp: "- (このセクションでの特記メモはありません)", en: "- (No specific notes for this section)" }
};

function updateUIStrings() {
  const l = state.lang;
  
  // 国旗切り替え表示
  el.btnLang.innerHTML = l === 'jp' ? '<span class="icon">🇯🇵</span> JP / EN' : '<span class="icon">🇺🇸</span> EN / JP';
  
  // 最初に戻る
  el.lblResetText.textContent = translations.resetText[l];
  
  // APIキー設定ボタンの表示（ステータス連動）
  if (state.apiKey) {
    el.lblApiKeyText.textContent = translations.apiKeyTextActive[l];
    el.btnApiKey.classList.add('btn-success');
    el.btnApiKey.classList.remove('btn-secondary');
    el.btnDeleteKey.style.display = 'inline-flex';
    el.btnDeleteKey.textContent = translations.btnDeleteKey[l];
  } else {
    el.lblApiKeyText.textContent = translations.apiKeyText[l];
    el.btnApiKey.classList.remove('btn-success');
    el.btnApiKey.classList.add('btn-secondary');
    el.btnDeleteKey.style.display = 'none';
  }
  
  // セットアップビュー
  document.getElementById('lbl-setup-title').textContent = translations.setupTitle[l];
  document.getElementById('lbl-setup-subtitle').textContent = translations.setupSubtitle[l];
  document.getElementById('lbl-drop-zone-text').textContent = translations.dropZoneText[l];
  document.getElementById('lbl-drop-zone-sub').textContent = translations.dropZoneSub[l];

  document.getElementById('lbl-divider-text').textContent = translations.dividerText[l];
  document.getElementById('lbl-paste-label').textContent = translations.pasteLabel[l];
  el.textPaste.setAttribute('placeholder', translations.pastePlaceholder[l]);
  el.btnStartLearning.textContent = translations.btnStartLearning[l];
  
  // ラーニングビュー
  document.getElementById('lbl-progress-label').textContent = translations.progressLabel[l];
  document.getElementById('lbl-card-tag').textContent = translations.cardTag[l];
  el.chatInput.setAttribute('placeholder', translations.chatInputPlaceholder[l]);
  document.getElementById('lbl-agree-text').textContent = translations.btnAgreeText[l];
  document.getElementById('lbl-notes-title').textContent = translations.notesTitle[l];
  document.getElementById('lbl-download-text').textContent = translations.downloadText[l];
  
  // モーダル
  document.getElementById('lbl-modal-title').textContent = translations.modalTitle[l];
  document.getElementById('lbl-modal-desc').textContent = translations.modalDesc[l];
  document.getElementById('lbl-api-key-label').textContent = translations.apiKeyLabel[l];
  el.btnCloseModal.textContent = translations.btnCloseModal[l];
  el.btnSaveKey.textContent = translations.btnSaveKey[l];

  // プレースホルダーテキストの翻訳
  const placeholder = el.notesPreview.querySelector('.placeholder-text');
  if (placeholder) {
    placeholder.textContent = translations.notesPlaceholder[l];
  }
  
  // 進行中のプログレスバー表示更新
  if (state.sections.length > 0) {
    updateProgressBar();
  }
}

// ==========================================================================
// 初期化 & イベントリスナー設定
// ==========================================================================
function init() {
  // APIキーの初期確認
  try {
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      state.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.log("Vite env not loaded yet, fallback to localStorage.");
  }
  
  // UIの初期言語とキー状態反映
  updateUIStrings();
  
  // モーダル関連
  el.btnApiKey.addEventListener('click', () => {
    el.apiKeyInput.value = state.apiKey;
    el.apiKeyModal.classList.add('active');
  });
  el.btnCloseModal.addEventListener('click', () => el.apiKeyModal.classList.remove('active'));
  el.btnSaveKey.addEventListener('click', () => {
    const key = el.apiKeyInput.value.trim();
    state.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    el.apiKeyModal.classList.remove('active');
    updateUIStrings();
    alert(translations.alertKeySaved[state.lang]);
  });
  
  // APIキー解除ボタン
  el.btnDeleteKey.addEventListener('click', () => {
    const confirmMsg = state.lang === 'jp' ? 'APIキーを解除してもよろしいですか？' : 'Are you sure you want to clear the API Key?';
    if (confirm(confirmMsg)) {
      state.apiKey = '';
      localStorage.removeItem('gemini_api_key');
      el.apiKeyInput.value = '';
      el.apiKeyModal.classList.remove('active');
      updateUIStrings();
      alert(translations.alertKeyDeleted[state.lang]);
    }
  });

  // 言語切り替えボタン
  el.btnLang.addEventListener('click', () => {
    state.lang = state.lang === 'jp' ? 'en' : 'jp';
    updateUIStrings();
  });



  // ドラッグ＆ドロップ
  el.dropZone.addEventListener('click', () => el.fileInput.click());
  el.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.dropZone.classList.add('dragover');
  });
  el.dropZone.addEventListener('dragleave', () => el.dropZone.classList.remove('dragover'));
  el.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  el.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  // 学習開始
  el.btnStartLearning.addEventListener('click', startLearning);

  // メッセージ送信
  el.btnSendMessage.addEventListener('click', sendMessage);
  el.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 納得（合意）ボタン
  el.btnAgree.addEventListener('click', handleAgreement);

  // ノートダウンロード
  el.btnDownloadNotes.addEventListener('click', downloadNotes);

  // 最初に戻る
  el.btnReset.addEventListener('click', () => {
    if (confirm(translations.confirmReset[state.lang])) {
      state.rawText = '';
      state.sections = [];
      state.currentSectionIndex = 0;
      state.chatHistory = [];
      state.currentNotes = '';
      state.allNotes = '';
      
      el.learningView.classList.remove('active');
      el.setupView.classList.add('active');
      el.btnReset.style.display = 'none';
      
      // UIと入力エリアをリセット
      el.textPaste.value = '';
      updateUIStrings();
    }
  });
  
  // Markedオプション設定 (改行を有効化)
  marked.setOptions({
    breaks: true,
    gfm: true
  });
}

// 初期化の実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ==========================================================================
// ドキュメント処理と分割 (スモールステップ化)
// ==========================================================================
async function handleFile(file) {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    el.textPaste.value = translations.extractingPdf[state.lang];
    try {
      const text = await extractTextFromPDF(file);
      el.textPaste.value = text;
    } catch (error) {
      el.textPaste.value = '';
      alert(translations.pdfError[state.lang] + error.message);
    }
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      el.textPaste.value = e.target.result;
    };
    reader.readAsText(file);
  }
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = '';
    let lastY = undefined;
    
    for (const item of textContent.items) {
      const str = item.str;
      const y = item.transform[5]; // Y座標
      
      if (lastY !== undefined && Math.abs(y - lastY) > 12) {
        pageText += Math.abs(y - lastY) > 20 ? '\n\n' : '\n';
      }
      
      pageText += str + (item.hasEOL ? '\n' : ' ');
      lastY = y;
    }
    fullText += pageText + '\n\n';
  }
  return fullText;
}

function startLearning() {
  const text = el.textPaste.value.trim();
  if (!text) {
    alert(translations.alertNoText[state.lang]);
    return;
  }
  if (!state.apiKey) {
    alert(translations.alertNoKey[state.lang]);
    el.apiKeyModal.classList.add('active');
    return;
  }

  state.rawText = text;
  state.sections = splitIntoSections(text);
  state.currentSectionIndex = 0;
  state.allNotes = translations.notesHeader[state.lang];
  
  // 画面切り替え
  el.setupView.classList.remove('active');
  el.learningView.classList.add('active');
  el.btnReset.style.display = 'inline-flex';
  
  // 最初のセクション読み込み
  loadSection(0);
}

/**
 * テキストを意味のあるセクション（スモールステップ）に分割する
 */
function splitIntoSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSec = [];
  let hasHeading = false;
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (hasHeading && currentSec.length > 0) {
        sections.push(currentSec.join('\n').trim());
        currentSec = [];
      }
      hasHeading = true;
    }
    currentSec.push(line);
  }
  if (currentSec.length > 0) {
    sections.push(currentSec.join('\n').trim());
  }
  
  if (sections.length <= 1) {
    const paragraphs = text.split(/\n\n+/);
    const autoSections = [];
    let temp = [];
    let charCount = 0;
    const sectionPattern = /^(?:Day\s+\d+|DAY\s+\d+|Chapter\s+\d+|CHAPTER\s+\d+|Section\s+\d+|SECTION\s+\d+|第[一二三四五六七八九十\d]+[章節]|[\d\.]+\s+[A-Z\u3000-\u30FE\u4E00-\u9FA0])/i;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      const isNewSectionStart = sectionPattern.test(trimmedPara);
      
      if (isNewSectionStart && charCount > 300) {
        if (temp.length > 0) {
          autoSections.push(temp.join('\n\n').trim());
          temp = [];
          charCount = 0;
        }
      }
      
      temp.push(trimmedPara);
      charCount += trimmedPara.length;
      
      if (charCount > 1000) {
        autoSections.push(temp.join('\n\n').trim());
        temp = [];
        charCount = 0;
      }
    }
    if (temp.length > 0) {
      autoSections.push(temp.join('\n\n').trim());
    }
    return autoSections;
  }
  
  return sections;
}

// ==========================================================================
// セクション進行とGemini API連携
// ==========================================================================
async function loadSection(index) {
  state.currentSectionIndex = index;
  state.chatHistory = [];
  state.currentNotes = '';
  
  // UI更新
  updateProgressBar();
  el.activeTextContent.textContent = state.sections[index];
  
  // アコーディオンを自動で閉じる
  if (el.activeTextDetails) {
    el.activeTextDetails.removeAttribute('open');
  }
  el.chatHistory.innerHTML = `
    <div class="loading-spinner-container">
      <div class="loading-spinner"></div>
      <div>${translations.loadingText[state.lang]}</div>
    </div>
  `;
  el.chatInput.value = '';
  
  // ノートプレビュー更新
  renderNotes();

  // Gemini APIから初期超訳解説を取得
  try {
    const explanation = await callGeminiAPI(buildExplanationPrompt(state.sections[index]));
    el.chatHistory.innerHTML = ''; // ローダー消去
    appendChatBubble('ai', explanation);
    state.chatHistory.push({ role: 'model', text: explanation });
  } catch (error) {
    el.chatHistory.innerHTML = `<div class="error-msg">エラーが発生しました: ${error.message}</div>`;
  }
}

/**
 * Gemini APIへのRESTコール (ブラウザ上での確実な実行を担保)
 */
async function callGeminiAPI(prompt, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
  
  // システム命令を定義（日英で完全に切り分け）
  const systemInstruction = state.lang === 'jp'
    ? `あなたは学習者（You）の咀嚼と深い学びを伴走するAIエージェント「Co-Learning Agent」です。
客観的かつ真摯に学習をサポートしてください。
難解なドキュメントに対し、わかりやすい言葉を用いて噛み砕いて説明してください。無理にアナロジー（例え話）を使う必要はありません。
解説や返答の際は、非エンジニアの「You」を主語に置き、Youのビジネスや実務においてどのような価値があるかを、Youに直接語りかけるトーンで対話してください。

【言語ルール】
解説、会話、および <notes> タグ内の記述はすべて【日本語】で行ってください。学習者には「You」または「あなた」と直接呼びかけてください。

【コンテキスト】
あなたは現在、以下の「学習ドキュメント全体」に基づいた学習に伴走しています。各セクションの解説や質問への回答は、必ずこのドキュメント全体の文脈と定義に準拠し、ハルシネーション（誤った用語解説など）を起こさないように注意してください。

# 学習ドキュメント全体
${state.rawText}

【ノート生成ルール】
対話を通じて、学習者が気づいた点、納得した点、独自の視点を抽出し、必ず回答の末尾に以下のXML風のタグ形式で含めてください。
このメモは自動的に右ペインの「学習ノート」にマージされます。
気づきの記述は、本質的な要点のみを簡潔な弾丸リスト（3〜5項目程度、合計300文字以内）に凝縮してください。
必ず「現在のアクティブなセクションの対話全体を通じて得られたすべての気づき」を省略せずに【累積（全量）】した状態で出力してください。対話が進むにつれて過去の気づきを削除したり簡略化（要約による薄め）したりしないでください。ただし、重複や細かすぎる枝葉の記述は整理し、すっきりと要約してください。
<notes>
- [気づき1]
- [気づき2]
</notes>
このタグは他のテキストとは分けて末尾に記述し、Youが発信した本質的な気づきだけを整理して記述してください。`
    : `You are the AI partner "Co-Learning Agent" who assists the learner ("You") in digesting and deeply understanding the learning document.
Please support the learning objectively and sincerely.
Break down complex texts using plain and easy-to-understand language. Do not force analogies if they hinder accurate understanding; prioritize precise and concise explanations.
When explaining or replying, do not use objective third-person descriptions. Put the non-engineer "You" as the subject, and discuss in a direct tone addressing how it values You's business or daily work.

【Language Rule】
All explanations, dialogues, and notes inside the <notes> tag MUST be in 【English】. Address the learner as "You" directly.

【Context】
You are currently accompanying the learning process based on the following "Entire Learning Document". Make sure all explanations and answers to questions conform strictly to the context and definitions of this entire document to avoid hallucination.

# Entire Learning Document
${state.rawText}

【Note Generation Rule】
Extract insights, agreements, and unique perspectives gained by the learner through the dialogue, and always output them at the very end of your response using the following XML-like tag format.
These notes will be automatically merged into the "Learning Notes" on the right pane.
Condense the insights to their essential points in a concise bulleted list (3-5 items, within 150 words total).
Make sure to output the 【cumulative (full)】 insights gained from the entire active section's dialogue without omitting anything. Do not delete or simplify past insights as the dialogue progresses. However, organize and summarize duplicates or minor details to keep it clean.
<notes>
- [Insight 1]
- [Insight 2]
</notes>
Place this tag separately at the end of your response, and only write the essential insights expressed by You.`;

  // 履歴を含めたコンテンツ構造の構築
  const contents = [];
  
  // 過去の対話履歴をコンテンツに追加
  for (const turn of history) {
    contents.push({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }]
    });
  }
  
  // 最新のプロンプトを追加
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'APIリクエストに失敗しました');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function buildExplanationPrompt(sectionText) {
  if (state.lang === 'jp') {
    return `こんにちは、Co-Learning Agentです。今回のセクションについて超訳解説します。

以下の学習セクションテキストについて、非エンジニア of You向けに、わかりやすい言葉で非常にわかりやすく超訳・解説してください。無理にアナロジーを使用する必要はありません。
解説のボリュームは、1分で読了できる【400〜500文字の範囲】を厳守し、絶対に500文字を超えないように徹底してください。

【解説ルール】
1. 冒頭は必ず「こんにちは、Co-Learning Agentです。」などの挨拶と自称から開始し、Youに直接語りかけてください。
2. 非エンジニアの学習には不要な技術的詳細（具体的なファイル構成、フォルダのセット内容、コードの内部文法など）は思い切って削ぎ落とし、その概念がYouにもたらす本質的なメリットや役割のみに焦点を絞って簡潔に説明してください。

# 学習セクション
${sectionText}`;
  } else {
    return `Hello! I'm Co-Learning Agent. I'll translate and explain this section for you.

Please translate and explain the following learning section text in plain English for a non-engineer "You". Do not force analogies.
The explanation volume must be within 【150-200 words】 (compact and easy to read), keeping it concise and easy to understand. Do not exceed 250 words.

【Explanation Rules】
1. Start the response with a friendly greeting like "Hello, I'm Co-Learning Agent. Let's look into this section." and address the reader as "You".
2. Strip away unnecessary technical details (specific folder structures, filenames, internal code syntax) and focus only on the essential benefits and conceptual understanding for "You".

# Learning Section
${sectionText}`;
  }
}

// ==========================================================================
// チャット送受信処理
// ==========================================================================
async function sendMessage() {
  const userInput = el.chatInput.value.trim();
  if (!userInput) return;
  
  // ユーザーメッセージの表示
  appendChatBubble('user', userInput);
  state.chatHistory.push({ role: 'user', text: userInput });
  el.chatInput.value = '';
  
  // ローディング表示 (動的バウンスドット)
  const tempBubble = appendChatBubble('ai', `
    <div class="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `);
  
  try {
    const prompt = state.lang === 'jp'
      ? `あなたは現在、以下の「対象セクション」について学習者と対話しています。

# 対象セクション
${state.sections[state.currentSectionIndex]}

学習者から以下の発言がありました。対話履歴を踏まえて回答してください。
回答は簡潔さを重視し、1回の返答は300〜500文字程度（要点を絞ったコンパクトな記述）にしてください。
また、回答の際は非エンジニアのYouに対して直接語りかけるトーンを維持し、難解な技術用語や細かい実装の詳細には触れず、Youにとっての価値に焦点を当ててください。
さらに、このセクションの対話全体から得られた「本質的な気づき（Youのメモ）」を省略せず、すべて維持・累積した全量を必ず末尾の <notes> タグに含めて出力してください。気づきは簡潔な弾丸リスト（3〜5項目程度、合計300文字以内）に凝縮してください。

学習者の発言: "${userInput}"`
      : `You are currently discussing the following "Target Section" with the learner.

# Target Section
${state.sections[state.currentSectionIndex]}

The learner made the following comment. Please reply based on the conversation history.
Keep your response concise, around 150-250 words per reply.
Maintain a friendly and direct tone addressing a non-engineer "You", focusing on the value rather than minor implementation details.
At the very end of your response, always include the accumulated insights (Your Notes) inside the <notes> tag. Do not drop past insights, keep them aggregated in a clean bulleted list (3-5 items, within 150 words).

Learner's Comment: "${userInput}"`;

    const aiResponse = await callGeminiAPI(prompt, state.chatHistory);
    
    // ローディング吹き出しを消去して正式な回答を表示
    tempBubble.remove();
    appendChatBubble('ai', aiResponse);
    state.chatHistory.push({ role: 'model', text: aiResponse });
    
    // 応答から <notes> タグを解析して抽出
    extractNotes(aiResponse);
    
  } catch (error) {
    tempBubble.remove();
    appendChatBubble('ai', `エラーが発生しました: ${error.message}`);
  }
}

/**
 * HTMLエスケープ処理 (XSS対策)
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * チャットログにメッセージを追加する
 */
function appendChatBubble(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble-${role}`;
  
  const header = document.createElement('div');
  header.className = 'chat-bubble-header';
  header.textContent = role === 'ai' ? 'Co-Learning Agent' : 'You';
  
  const body = document.createElement('div');
  body.className = 'chat-bubble-body';
  
  // AI回答内の <notes> タグはチャット欄には表示しないように除外する
  let displayText = text;
  if (role === 'ai') {
    displayText = text.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
  } else if (role === 'user') {
    // ユーザー入力はXSS対策のためHTMLエスケープを実行
    displayText = escapeHTML(text);
  }
  
  // Markdownパース
  body.innerHTML = marked.parse(displayText);
  
  bubble.appendChild(header);
  bubble.appendChild(body);
  
  el.chatHistory.appendChild(bubble);
  
  const container = el.chatHistory.parentElement;
  if (role === 'ai') {
    // 描画と高さの確定を待つため、100ms遅延させてスクロール
    setTimeout(() => {
      container.scrollTo({
        top: bubble.offsetTop - 10,
        behavior: 'smooth'
      });
    }, 100);
  } else {
    // ユーザーの場合は最下部へ（自分が送信した後にすぐ見えるように）
    container.scrollTop = container.scrollHeight;
  }
  
  return bubble;
}

/**
 * AIの応答から <notes> タグを抽出し、リアルタイムノートを更新する
 */
function extractNotes(aiText) {
  const match = aiText.match(/<notes>([\s\S]*?)<\/notes>/);
  if (match && match[1]) {
    state.currentNotes = match[1].trim();
    renderNotes();
  }
}

// ==========================================================================
// 納得（合意）処理とノート保存
// ==========================================================================
function handleAgreement() {
  console.log("【デバッグ】納得しましたボタンが押されました。現在地:", state.currentSectionIndex, "総数:", state.sections.length);
  if (state.sections.length === 0) return;
  
  // 現在のセクションのノートを全体ノートに蓄積
  const l = state.lang;
  const currentSecTitle = `### ${translations.sectionLabel[l]} ${state.currentSectionIndex + 1}`;
  const notesContent = state.currentNotes || translations.noNotes[l];
  
  state.allNotes += `${currentSecTitle}\n${notesContent}\n\n`;
  
  // 次のセクションへ
  const nextIndex = state.currentSectionIndex + 1;
  if (nextIndex < state.sections.length) {
    loadSection(nextIndex);
  } else {
    // 全て完了
    showCompletion();
  }
}

function showCompletion() {
  const l = state.lang;
  updateProgressBar(true);
  
  el.activeTextContent.innerHTML = `<div class="completion-card">
    <h3>${translations.completionTitle[l]}</h3>
    <p>${translations.completionDesc[l]}</p>
  </div>`;
  
  el.chatHistory.innerHTML = `<div class="chat-bubble chat-bubble-ai">
    <div class="chat-bubble-header">Co-Learning Agent</div>
    <div class="chat-bubble-body"><p>${translations.completionChat[l]}</p></div>
  </div>`;
  
  renderNotes();
}

// ==========================================================================
// UI描画 & ダウンロードユーティリティ
// ==========================================================================
function renderNotes() {
  const l = state.lang;
  let previewContent = state.allNotes;
  
  if (state.currentNotes && state.currentSectionIndex < state.sections.length) {
    previewContent += `### ${translations.sectionLabel[l]} ${state.currentSectionIndex + 1} (${translations.editingLabel[l]})\n${state.currentNotes}\n`;
  }
  
  el.notesPreview.innerHTML = marked.parse(previewContent || `<p class="placeholder-text">${translations.notesPlaceholder[l]}</p>`);
}

function updateProgressBar(completed = false) {
  const total = state.sections.length;
  const current = completed ? total : state.currentSectionIndex + 1;
  const l = state.lang;
  
  el.progressText.textContent = `${current} / ${total} ${translations.progressSections[l]}`;
  const pct = total > 0 ? (current / total) * 100 : 0;
  el.progressBarFill.style.width = `${pct}%`;
}

function downloadNotes() {
  const l = state.lang;
  let finalNotes = state.allNotes;
  if (state.currentNotes && state.currentSectionIndex < state.sections.length) {
    finalNotes += `### ${translations.sectionLabel[l]} ${state.currentSectionIndex + 1}\n${state.currentNotes}\n`;
  }

  const blob = new Blob([finalNotes], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  link.setAttribute('href', url);
  link.setAttribute('download', `${dateStr}_learning_notes.md`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// デバッグ用エクスポート
window.state = state;
