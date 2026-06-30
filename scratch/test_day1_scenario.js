import fs from 'fs';
import path from 'path';

// .env から GEMINI_API_KEY を読み込む
function getApiKey() {
  const envPath = 'c:/Users/strnf/Apps/antigravity/workspace_Kate/0615_5-DayAIagents2026/.env';
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
  return match ? match[1] : null;
}

const apiKey = getApiKey();
if (!apiKey) {
  console.error("APIキーが取得できませんでした。");
  process.exit(1);
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

// splitIntoSections ロジック (main.jsと同等)
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
  return sections;
}

async function callGemini(systemInstruction, prompt, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const contents = [];
  
  for (const turn of history) {
    contents.push({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API Call Failed');
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Day1_text.md を読み込む
const day1Path = 'c:/Users/strnf/Apps/antigravity/workspace_Kate/0615_5-DayAIagents2026/02_whitepaper/notes/Day1_text.md';
const rawText = fs.readFileSync(day1Path, 'utf8');
const sections = splitIntoSections(rawText);

console.log(`=== Day 1 シナリオシミュレーションテストの開始 ===`);
console.log(`総セクション数: ${sections.length}セクション`);
console.log(`代表的なセクション3つで対話・ノートマージのフルフローを実証します。\n`);

const testScenarios = [
  {
    index: 0,
    title: "セクション 1: イントロダクション ＆ 構文から意図への移行",
    question: "Vibe CodingとAgentic Engineeringの具体的な使い分けの境界線って何？"
  },
  {
    index: 1,
    title: "セクション 2: AIエージェントとハーネス",
    question: "ハーネスって、テストを書くこと以外に何をすればいいの？"
  },
  {
    index: 2,
    title: "セクション 3: MCP（Model Context Protocol）とコンテキスト管理",
    question: "MCPを使うことで、コンテキストのパンク（情報の肥大化）はどう防げるの？"
  }
];

const systemInstruction = `あなたは学習者（You）の咀嚼と深い学びを伴走するAIエージェント「Co-Learning Agent」です。
客観的かつ真摯に学習をサポートしてください。
難解なドキュメントに対し、わかりやすい言葉を用いて噛み砕いて説明してください。無理にアナロジー（例え話）を使う必要はありません（アナロジーがかえって理解を妨げる場合があるため、正確で簡潔な説明を優先してください）。
解説や返答の際は、単なる三人称の客観的説明ではなく、非エンジニアの「You」を主語に置き、Youのビジネスや実務においてどのような価値があるかを、Youに直接語りかけるトーンで対話してください。

【コンテキスト】
あなたは現在、以下の「学習ドキュメント全体」に基づいた学習に伴走しています。各セクションの解説や質問への回答は、必ずこのドキュメント全体の文脈と定義に準拠し、ハルシネーション（誤った用語解説など）を起こさないように注意してください。

# 学習ドキュメント全体
${rawText}

【ノート生成ルール】
対話を通じて、学習者が気づいた点、納得した点、独自の視点を抽出し、必ず回答の末尾に以下のXML風のタグ形式で含めてください。
このメモは自動的に右ペインの「学習ノート」にマージされます。
気づきの記述は、本質的な要点のみを簡潔な弾丸リスト（3〜5項目程度、合計300文字以内）に凝縮してください。
必ず「現在のアクティブなセクションの対話全体を通じて得られたすべての気づき」を省略せずに【累積（全量）】した状態で出力してください。対話が進むにつれて過去の気づきを削除したり簡略化（要約による薄め）したりしないでください。ただし、重複や細かすぎる枝葉の記述は整理し、すっきりと要約してください。
<notes>
- [気づき1]
- [気づき2]
</notes>
このタグは他のテキストとは分けて末尾に記述し、Youが発信した本質的な気づきだけを整理して記述してください。`;

let allNotes = "# Your Co-Learning Notes (Day 1 シミュレーション版)\n\n";

async function runScenario() {
  for (const sc of testScenarios) {
    console.log(`\n==================================================`);
    console.log(`【${sc.title}】 のテスト開始`);
    console.log(`==================================================`);
    
    const sectionText = sections[sc.index];
    const history = [];
    
    // 1. 超訳の生成
    const explanationPrompt = `こんにちは、Co-Learning Agentです。今回のセクションについて超訳解説します。

以下の学習セクションテキストについて、非エンジニアのYou向けに、わかりやすい言葉で非常にわかりやすく超訳・解説してください。無理にアナロジーを使用する必要はありません。
解説のボリュームは、2分で読了できる【1000文字以内】（800〜1000文字の範囲）を厳守し、1000文字を超えないように徹底してください。

【解説ルール】
1. 冒頭は必ず「こんにちは、Co-Learning Agentです。」などの挨拶と自称から開始し、Youに直接語りかけてください。
2. 非エンジニアの学習には不要な技術的詳細（具体的なファイル構成、フォルダのセット内容、コードの内部文法など）は思い切って削ぎ落とし、その概念がYouにもたらす本質的なメリットや役割のみに焦点を絞って簡潔に説明してください。

# 学習セクション
${sectionText}`;

    console.log("-> 1. 超訳解説を生成中...");
    const explanation = await callGemini(systemInstruction, explanationPrompt);
    const expTextOnly = explanation.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
    console.log(`   [超訳文字数 (notes除外)]: ${expTextOnly.length} 文字`);
    console.log(`--- [超訳解説プレビュー] ---\n${expTextOnly.substring(0, 400)}...\n---------------------------`);
    
    history.push({ role: 'model', text: explanation });
    await sleep(2000);
    
    // 2. ユーザー質問の送信
    console.log(`-> 2. ユーザーからの質問: "${sc.question}"`);
    const chatPrompt = `あなたは現在、以下の「対象セクション」について学習者と対話しています。

# 対象セクション
${sectionText}

学習者から以下の発言がありました。対話履歴を踏まえて回答してください。
回答は簡潔さを重視し、1回の返答は300〜500文字程度（要点を絞ったコンパクトな記述）にしてください。
また、回答の際は非エンジニアのYouに対して直接語りかけるトーンを維持し、難解な技術用語や細かい実装の詳細には触れず、Youにとっての価値に焦点を当ててください。
さらに、このセクションの対話全体から得られた「本質的な気づき（Youのメモ）」を省略せず、すべて維持・累積した全量を必ず末尾の <notes> タグに含めて出力してください。気づきは簡潔な弾丸リスト（3〜5項目程度、合計300文字以内）に凝縮してください。

学習者の発言: "${sc.question}"`;

    const aiResponse = await callGemini(systemInstruction, chatPrompt, history);
    const replyTextOnly = aiResponse.replace(/<notes>[\s\S]*?<\/notes>/g, '').trim();
    console.log(`   [回答文字数 (notes除外)]: ${replyTextOnly.length} 文字`);
    console.log(`--- [回答プレビュー] ---\n${replyTextOnly}\n---------------------------`);
    
    // 3. notesの抽出と学習ノートへの蓄積
    const notesMatch = aiResponse.match(/<notes>([\s\S]*?)<\/notes>/);
    const currentNotes = notesMatch && notesMatch[1] ? notesMatch[1].trim() : "- (気づきの抽出はありませんでした)";
    
    console.log(`-> 3. 抽出された気づき（Your Notes）:`);
    console.log(currentNotes);
    
    // 全体ノートにマージ
    allNotes += `## ${sc.title}\n\n${currentNotes}\n\n`;
    
    await sleep(2000);
  }
  
  // 4. 学習ノートの書き出し
  const outputPath = 'scratch/day1_simulated_notes.md';
  fs.writeFileSync(outputPath, allNotes, 'utf8');
  console.log(`\n==================================================`);
  console.log(`🎉 シミュレーションテスト完了！`);
  console.log(`生成された学習ノートを [${outputPath}] に保存しました。`);
  console.log(`==================================================`);
}

runScenario().catch(err => {
  console.error("シナリオテスト実行エラー:", err);
});
