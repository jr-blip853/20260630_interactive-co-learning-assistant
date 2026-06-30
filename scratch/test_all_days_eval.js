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
    // 最初の見出し（##）が見つかるまでは分割を開始しない
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

const days = [1, 2, 3, 4, 5];
const results = [];

async function runTest() {
  console.log("=== 5-Day ホワイトペーパー自動分割＆品質評価テストの開始 ===");
  
  for (const day of days) {
    const filePath = `c:/Users/strnf/Apps/antigravity/workspace_Kate/0615_5-DayAIagents2026/02_whitepaper/notes/Day${day}_text.md`;
    if (!fs.existsSync(filePath)) {
      console.warn(`Day ${day} のファイルが見つかりません: ${filePath}`);
      continue;
    }
    
    const rawText = fs.readFileSync(filePath, 'utf8');
    const sections = splitIntoSections(rawText);
    
    console.log(`\n--------------------------------------------------`);
    console.log(`Day ${day} ファイルの解析完了`);
    console.log(`- 総文字数: ${rawText.length}`);
    console.log(`- セクション数: ${sections.length}`);
    console.log(`- 各セクション文字数:`, sections.map(s => s.length));
    
    // セクション1の超訳を生成して品質を検証
    const testSection = sections[0];
    const systemInstruction = `あなたは学習者（You）の咀嚼と深い学びを伴走するAIエージェント「Co-Learning Agent」です。
客観的かつ真摯に学習をサポートしてください。
難解なドキュメントに対し、わかりやすい言葉を用いて噛み砕いて説明してください。無理にアナロジー（例え話）を使う必要はありません（アナロジーがかえって理解を妨げる場合があるため、正確で簡潔な説明を優先してください）。

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

    const prompt = `以下の学習セクションテキストについて、わかりやすい言葉を用いて、非エンジニア向けに非常にわかりやすく超訳・解説してください。無理にアナロジーを使用する必要はありません。
解説のボリュームは、2分で読了できる【1000文字以内】（800〜1000文字の範囲）を厳守し、冗長にならずに要点をしっかりと咀嚼できる簡潔な記述にしてください。1000文字を超えないように徹底してください。

# 学習セクション
${testSection}`;

    console.log(`Day ${day} のセクション 1 にて超訳解説を生成中...`);
    let explanation = "";
    try {
      explanation = await callGemini(systemInstruction, prompt);
      console.log(`- 生成完了 (文字数: ${explanation.replace(/<notes>[\s\S]*?<\/notes>/g, '').length} 文字)`);
    } catch (err) {
      console.error(`Day ${day} 超訳生成エラー:`, err.message);
      continue;
    }
    
    // 品質評価
    const evalSystem = "あなたは客観的で厳格な教育工学およびUXの評価スペシャリストです。";
    const evalPrompt = `以下の「Co-Learning Agentによる超訳解説」について、学習者（You）の認知的負荷を減らしつつ本質を理解させるという観点から評価してください。

評価項目:
1. 【ボリューム】: notesタグを除いた文字数が1000文字以内（800〜1000文字）に収まっているか？
2. 【平易さ】: 専門用語がわかりやすく平易に説明されているか？（Youという対象者呼称、Co-Learning Agentという自称が正しく使われているか？）
3. 【アナロジーの処理】: 無理な例え話がなく、正確さが優先されているか？
4. 【改善のアドバイス】: 

対象テキスト:
"""
${explanation}
"""`;

    console.log(`Day ${day} の超訳解説を評価中...`);
    let evalResult = "";
    try {
      evalResult = await callGemini(evalSystem, evalPrompt);
    } catch (err) {
      console.error(`Day ${day} 評価エラー:`, err.message);
    }
    
    results.push({
      day: day,
      textLength: rawText.length,
      sectionsCount: sections.length,
      sampleExplanationLength: explanation.replace(/<notes>[\s\S]*?<\/notes>/g, '').length,
      evaluation: evalResult
    });
    
    await sleep(2000); // レートリミット回避用のウェイト
  }
  
  console.log("\n=== 全日程の評価レポートの書き出し ===");
  fs.writeFileSync('scratch/all_days_eval_report.md', generateReportMarkdown(results), 'utf8');
  console.log("レポートを scratch/all_days_eval_report.md に書き出しました。");
}

function generateReportMarkdown(results) {
  let md = "# 5-Day ホワイトペーパー分割＆品質評価テストレポート\n\n";
  md += "| 日程 | 総文字数 | 分割セクション数 | サンプル超訳文字数 | 評価サマリー |\n";
  md += "|---|---|---|---|---|\n";
  
  for (const r of results) {
    const summaryLine = r.evaluation.split('\n')[0] || '評価完了';
    md += `| Day ${r.day} | ${r.textLength} 文字 | ${r.sectionsCount} | ${r.sampleExplanationLength} 文字 | ${summaryLine} |\n`;
  }
  
  md += "\n## 各日程の詳細評価結果\n\n";
  for (const r of results) {
    md += `### Day ${r.day} 評価結果\n\n`;
    md += `**総文字数:** ${r.textLength} 文字  \n`;
    md += `**分割セクション数:** ${r.sectionsCount} セクション  \n`;
    md += `**サンプル超訳解説文字数 (notes除く):** ${r.sampleExplanationLength} 文字  \n\n`;
    md += `#### 評価詳細\n${r.evaluation}\n\n`;
    md += `---\n\n`;
  }
  
  return md;
}

runTest().catch(err => {
  console.error("テスト実行エラー:", err);
});
