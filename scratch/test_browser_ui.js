import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const scratchDir = 'scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir);
}

async function runTest() {
  console.log("=== 実機ブラウザ自動UIテストの開始 (Puppeteer) ===");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // ダイアログハンドラー
  page.on('dialog', async dialog => {
    console.log(`   [DIALOG POPUP]: ${dialog.type()} - "${dialog.message()}"`);
    await dialog.accept();
  });

  page.on('console', msg => {
    console.log(`[BROWSER LOG] [${msg.type()}] ${msg.text()}`);
  });
  
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("1. http://localhost:3000/ に接続中...");
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // ダミーAPIキーを設定して保存 (学習開始ができる状態にする)
  console.log("   APIキー設定を初期セットアップします...");
  await page.$eval('#btn-api-key', el => el.click());
  await new Promise(res => setTimeout(res, 500));
  await page.type('#api-key-input', 'AIzaSyFakeKeyForLayoutTesting');
  await page.$eval('#btn-save-key', el => el.click());
  await new Promise(res => setTimeout(res, 1000));

  const img1Path = path.join(scratchDir, 'screenshot_1_initial.png');
  await page.screenshot({ path: img1Path });
  
  // 2. 言語切り替えボタンのテスト
  console.log("2. JP/EN 言語切り替えボタンをクリックします...");
  await page.$eval('#btn-lang', el => el.click());
  await new Promise(res => setTimeout(res, 1000));
  
  const img2Path = path.join(scratchDir, 'screenshot_2_english.png');
  await page.screenshot({ path: img2Path });

  // 3. サンプルテキスト選択 ＆ 学習開始 ＆ アコーディオン折りたたみテスト
  console.log("3. Day 1 のサンプル選択チップをクリックして学習画面に遷移します...");
  const chips = await page.$$('.sample-chip');
  if (chips.length > 0) {
    await page.evaluate(el => el.click(), chips[0]);
    await new Promise(res => setTimeout(res, 1000));
    
    // 学習開始ボタンをクリック
    await page.$eval('#btn-start-learning', el => el.click());
    console.log("   学習画面ロード中...");
    await new Promise(res => setTimeout(res, 4000)); // Gemini API風の超訳ロードを待つ (実際にはダミーキーなのでAPIエラーが出るか、ローディングになる)
    
    // アコーディオンが「閉じている（デフォルト）」状態の確認
    const detailsOpen = await page.$eval('#active-text-details', el => el.hasAttribute('open'));
    console.log(`   [初期アコーディオン開閉状態]: ${detailsOpen ? '展開(open)' : '折りたたみ(closed)'}`);
    
    const img3Path = path.join(scratchDir, 'screenshot_3_accordion_closed.png');
    await page.screenshot({ path: img3Path });
    console.log(`   [保存完了]: ${img3Path}`);
    
    // アコーディオンをクリックして展開
    console.log("   アコーディオンを展開します...");
    await page.$eval('#active-text-details summary', el => el.click());
    await new Promise(res => setTimeout(res, 1000));
    
    const detailsOpenAfter = await page.$eval('#active-text-details', el => el.hasAttribute('open'));
    console.log(`   [クリック後アコーディオン開閉状態]: ${detailsOpenAfter ? '展開(open)' : '折りたたみ(closed)'}`);
    
    const imgOpenPath = path.join(scratchDir, 'screenshot_3_accordion_open.png');
    await page.screenshot({ path: imgOpenPath });
    console.log(`   [保存完了]: ${imgOpenPath}`);
  }

  // 4. 最初に戻る
  console.log("4. 最初に戻るボタンをクリックしてリセットします...");
  await page.$eval('#btn-reset', el => el.click());
  await new Promise(res => setTimeout(res, 1000));
  
  // 5. APIキー解除のテスト
  console.log("5. APIキー設定モーダルを開き、解除テストを実行します...");
  await page.$eval('#btn-api-key', el => el.click());
  await new Promise(res => setTimeout(res, 500));
  await page.$eval('#btn-delete-key', el => el.click());
  await new Promise(res => setTimeout(res, 1000));
  
  const clearedKey = await page.evaluate(() => state.apiKey);
  console.log(`   [解除後のキー]: "${clearedKey}"`);
  
  const img5Path = path.join(scratchDir, 'screenshot_5_deleted.png');
  await page.screenshot({ path: img5Path });
  console.log(`   [保存完了]: ${img5Path}`);

  await browser.close();
  console.log("\n=== 全てのUIおよびUXテストが正常に完了しました！ ===");
}

runTest().catch(err => {
  console.error("ブラウザUIテスト実行エラー:", err);
});
