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

// Day1_text.md を読み込む
const day1Path = 'c:/Users/strnf/Apps/antigravity/workspace_Kate/0615_5-DayAIagents2026/02_whitepaper/notes/Day1_text.md';
if (!fs.existsSync(day1Path)) {
  console.error("Day1_text.md が見つかりません。");
  process.exit(1);
}
const rawText = fs.readFileSync(day1Path, 'utf8');

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

const sections = splitIntoSections(rawText);
console.log(`【検証結果】`);
console.log(`総文字数: ${rawText.length}`);
console.log(`分割セクション数: ${sections.length}`);
console.log(`セクションごとの平均文字数: ${Math.round(rawText.length / sections.length)} 文字`);
console.log(`各セクションの文字数リスト:`, sections.map(s => s.length));

// 最初のセクションで実際に超訳をテストする
const testSection = sections[0];
console.log(`\n--- テストセクション 1 (文字数: ${testSection.length}) ---`);
console.log(testSection.substring(0, 300) + '...\n');

async function callGemini(systemInstruction, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
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

const systemInstruction = `あなたは学習者（Tさん）の咀嚼と深い学びを伴走するAIエージェント「アンティ」です。
客観的かつ真摯に学習をサポートしてください。
難解なドキュメントに対し、背景知識や身近な「アナロジー（例え話）」を用いて噛み砕いて説明してください。

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
このタグは他のテキストとは分けて末尾に記述し、Tさんが発信した本質的な気づきだけを整理して記述してください。`;

const prompt = `以下の学習セクションテキストについて、背景知識や日常のアナロジーを交えて、非エンジニア向けに非常にわかりやすく超訳・解説してください。
解説のボリュームは、2分で読了できる【1000文字程度】（800〜1200文字の範囲）を目安とし、冗長にならずに要点をしっかりと咀嚼できる簡潔な記述にしてください。

# 学習セクション
${testSection}`;

console.log("Gemini APIを呼び出しています...");
callGemini(systemInstruction, prompt).then(explanation => {
  console.log(`\n--- 生成された超訳解説 (文字数: ${explanation.length}) ---`);
  console.log(explanation);
  
  // 品質評価用のリクエスト
  const evalSystem = "あなたは客観的で厳格な教育工学およびUXの評価スペシャリストです。";
  const evalPrompt = `以下の超訳解説テキストについて、学習者の認知的負荷を減らしつつ本質的な内容を理解させるという観点から評価してください。

評価項目:
1. 【端的さ・ボリューム】: 2分で読了できる適切な量（1000文字前後）になっているか？
2. 【平易さ（非エンジニア向け）】: 専門用語が噛み砕かれ、直感的に理解しやすい表現になっているか？
3. 【アナロジーの妥当性】: 例え話が不自然ではなく、理解を助けているか？
4. 【改善への提言】: さらにわかりやすく、かつ端的にするための具体的なアドバイス（あれば）

対象テキスト:
"""
${explanation}
"""`;
  
  console.log("\n評価用に別のGemini API呼び出しを実行しています...");
  return callGemini(evalSystem, evalPrompt);
}).then(evalResult => {
  console.log("\n--- 超訳解説の評価レポート ---");
  console.log(evalResult);
}).catch(err => {
  console.error("エラー:", err);
});
