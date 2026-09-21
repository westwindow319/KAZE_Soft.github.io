/**
 * シフト作成アプリケーション - 掲示板（ご意見・ご感想・ご要望）連携スクリプト
 * 
 * 【使い方】
 * 1. Google スプレッドシートを新規作成（または既存のスプレッドシートを開く）
 * 2. メニュー「拡張機能」>「Apps Script」を開く
 * 3. このコードをエディタに貼り付けて保存
 * 4. 右上の「デプロイ」>「新しいデプロイ」をクリック
 * 5. 種類の選択で「ウェブアプリ」を選択
 * 6. 次のように設定してデプロイ:
 *    - 次のユーザーとして実行: 「自分」
 *    - アクセスできるユーザー: 「全員」
 * 7. 発行された「ウェブアプリのURL」をコピーし、homepage/script.js の GAS_WEB_APP_URL に設定してください。
 */

const SHEET_NAME = '掲示板';

// スプレッドシートとシートの取得（なければ作成して初期化）
function getBbsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // ヘッダー行を設定
    sheet.appendRow(['日時', 'お名前', '種別', '内容']);
    sheet.getRange(1, 1, 1, 4).setBackground('#2563eb').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 500);
  }
  return sheet;
}

// 投稿一覧の取得
function getBbsPosts() {
  const sheet = getBbsSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  // ヘッダーを除く全行を取得
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const posts = [];

  for (let i = values.length - 1; i >= 0; i--) { // 新しい順（下から上）
    const row = values[i];
    if (!row[0] && !row[1] && !row[3]) continue; // 空行スキップ

    let dateStr = '';
    if (row[0] instanceof Date) {
      dateStr = Utilities.formatDate(row[0], 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
    } else {
      dateStr = String(row[0] || '');
    }

    posts.push({
      date: dateStr,
      name: String(row[1] || '匿名'),
      type: String(row[2] || 'ご意見'),
      content: String(row[3] || '')
    });
  }

  return posts;
}

// 投稿の追加
function addBbsPost(name, type, content, timestamp) {
  const sheet = getBbsSheet();
  const dateValue = timestamp || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  sheet.appendRow([dateValue, name || '匿名', type || 'ご意見', content || '']);
}

// GETリクエスト処理（一覧取得、またはGET経由の投稿）
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'get';

  // GET経由での投稿受付（CORS制限回避用）
  if (action === 'post' || params.content) {
    const name = params.name || '匿名';
    const type = params.type || 'ご意見';
    const content = params.content || '';
    if (content) {
      addBbsPost(name, type, content);
    }
    const result = { status: 'success', message: '投稿が完了しました' };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 投稿一覧の返却
  const posts = getBbsPosts();
  return ContentService.createTextOutput(JSON.stringify(posts))
    .setMimeType(ContentService.MimeType.JSON);
}

// POSTリクエスト処理
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const name = payload.name || '匿名';
    const type = payload.type || 'ご意見';
    const content = payload.content || '';

    if (!content) {
      const errRes = { status: 'error', message: '投稿内容が空です' };
      return ContentService.createTextOutput(JSON.stringify(errRes))
        .setMimeType(ContentService.MimeType.JSON);
    }

    addBbsPost(name, type, content);

    const successRes = { status: 'success', message: '投稿が完了しました' };
    return ContentService.createTextOutput(JSON.stringify(successRes))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errRes = { status: 'error', message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errRes))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
