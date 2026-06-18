// ═══════════════════════════════════════════════════════════
//  YC Studio — LINE Bot
//  Vercel Serverless Function: /api/line-bot
//
//  設定方式：
//  1. 前往 https://developers.line.biz/ 建立 Messaging API 頻道
//  2. Vercel 環境變數加入：
//     LINE_CHANNEL_SECRET       = 頻道的 Channel Secret
//     LINE_CHANNEL_ACCESS_TOKEN = 長期 Channel Access Token
//     ANTHROPIC_API_KEY         = Anthropic API Key
//     ALLOWED_LINE_USER_ID      = 你的 LINE User ID（安全用）
//
//  3. LINE Developers Console → Messaging API → Webhook URL：
//     https://chuan-06.vercel.app/api/line-bot
//     ✅ 開啟 Use webhook
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto';

// ── 關閉 Vercel 內建 body parser（LINE 簽名驗證需要原始 body）──
export const config = { api: { bodyParser: false } };

const SURL = 'https://hrxyylqngkubruivwsdm.supabase.co';
const SKEY = 'sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O';
const APP_URL = 'https://chuan-06.vercel.app/';

// ── 讀取原始 body ─────────────────────────────────────────
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

// ── LINE 簽名驗證 ─────────────────────────────────────────
function verifySignature(rawBody, signature, secret) {
  const hash = crypto.createHmac('SHA256', secret).update(rawBody).digest('base64');
  return hash === signature;
}

// ── LINE Reply API ────────────────────────────────────────
async function reply(replyToken, messages, token) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      replyToken,
      messages: Array.isArray(messages) ? messages : [messages]
    })
  });
}

// ── 文字訊息 ──────────────────────────────────────────────
function textMsg(text) {
  return { type: 'text', text };
}

// ── Flex 確認卡片 ─────────────────────────────────────────
function confirmFlex(projectName, items) {
  return {
    type: 'flex',
    altText: `✅ 已記錄到 ${projectName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'md',
        backgroundColor: '#584738',
        contents: [{
          type: 'text', text: '✅ YC Studio 記錄成功',
          weight: 'bold', size: 'sm', color: '#F8F4EC'
        }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'md',
        contents: [
          {
            type: 'text', text: projectName,
            weight: 'bold', size: 'md', color: '#2D1F14', wrap: true
          },
          { type: 'separator', margin: 'sm' },
          ...items.map(it => ({
            type: 'box', layout: 'horizontal', margin: 'sm', spacing: 'sm',
            contents: [
              { type: 'text', text: it.icon, size: 'sm', flex: 0, color: '#B59E7D' },
              { type: 'text', text: it.text, size: 'sm', wrap: true, flex: 5, color: '#584738' }
            ]
          }))
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: 'sm',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '查看 YC Studio →', uri: APP_URL },
          style: 'primary', color: '#B59E7D', height: 'sm'
        }]
      }
    }
  };
}

// ── Supabase ──────────────────────────────────────────────
async function fetchData() {
  const r = await fetch(`${SURL}/rest/v1/studio_data?id=eq.main&select=data`, {
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` }
  });
  const rows = await r.json();
  return rows?.[0]?.data || null;
}

async function saveData(data) {
  await fetch(`${SURL}/rest/v1/studio_data`, {
    method: 'POST',
    headers: {
      apikey: SKEY, Authorization: `Bearer ${SKEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() })
  });
}

// ── Claude 解析 ───────────────────────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today = new Date().toISOString().slice(0, 10);
  const projList = projects.filter(p => !p.archived).map(p => `- ${p.name}`).join('\n');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `你是室內設計工作室 YC Studio 的助理，從訊息提取結構化資料。
今天：${today}

現有案件：
${projList}

用戶訊息：「${userText}」

回覆純 JSON：
{
  "projectName": "案件完整名稱（必須完全符合上方列表）或 null",
  "confidence": 0到1,
  "actions": [
    {
      "type": "comm",
      "who": "對話對象",
      "note": "溝通內容摘要",
      "date": "YYYY-MM-DD",
      "ch": "Line或電話或會議或現場或Email"
    },
    {
      "type": "todo",
      "text": "待辦事項",
      "due": "YYYY-MM-DD或空字串",
      "prio": "high或mid或low"
    }
  ]
}`
      }]
    })
  });

  const d = await resp.json();
  const raw = (d.content?.[0]?.text || '{}').replace(/```json\n?|```/g, '').trim();
  return JSON.parse(raw);
}

// ── 工具 ─────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 8); }
function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${parseInt(m)}月${parseInt(day)}日`;
}

// ── 處理單一 LINE 事件 ─────────────────────────────────────
async function handleEvent(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.type !== 'message' || event.message?.type !== 'text') return;

  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const text = (event.message?.text || '').trim();

  // 安全驗證
  if (ALLOWED_ID && userId !== ALLOWED_ID) return;

  // ── 指令處理 ──────────────────────────────────────────

  if (text === '說明' || text === '!help' || text === '/help') {
    await reply(replyToken, textMsg(
      '🏠 YC Studio Bot\n\n' +
      '直接傳訊息，我幫你記錄！\n\n' +
      '📝 範例：\n' +
      '「剛跟桃園觀音老妹家業主在Line上聊，她說浴室要換成大理石磚，叫我下週三前報價」\n\n' +
      '⌨️ 指令：\n' +
      '狀態 — 今日待辦摘要\n' +
      '案件 — 所有案件列表\n' +
      '說明 — 查看此說明'
    ), TOKEN);
    return;
  }

  if (text === '狀態' || text === '今日' || text === '/status') {
    const data = await fetchData();
    if (!data) { await reply(replyToken, textMsg('❌ 無法連線'), TOKEN); return; }
    const today = new Date().toISOString().slice(0, 10);
    let overdue = 0, dueToday = 0, total = 0;
    for (const p of data.projects.filter(x => !x.archived)) {
      for (const t of (p.todos || [])) {
        if (t.done) continue; total++;
        if (t.due && t.due < today) overdue++;
        else if (t.due === today) dueToday++;
      }
    }
    await reply(replyToken, textMsg(
      `📊 今日狀態\n\n` +
      `⚠️ 逾期：${overdue} 件\n` +
      `📌 今日截止：${dueToday} 件\n` +
      `📋 總待辦：${total} 件`
    ), TOKEN);
    return;
  }

  if (text === '案件' || text === '/cases') {
    const data = await fetchData();
    if (!data) { await reply(replyToken, textMsg('❌ 無法連線'), TOKEN); return; }
    const active = data.projects.filter(p => !p.archived);
    const msg = `📁 目前案件（${active.length} 件）\n\n` +
      active.map(p => {
        const todos = (p.todos || []).filter(t => !t.done).length;
        return `• ${p.name}（${todos} 待辦）`;
      }).join('\n');
    await reply(replyToken, textMsg(msg), TOKEN);
    return;
  }

  // ── 自然語言記錄 ──────────────────────────────────────
  if (!API_KEY) {
    await reply(replyToken, textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'), TOKEN);
    return;
  }

  try {
    const data = await fetchData();
    if (!data) throw new Error('無法連線到資料庫');

    const parsed = await parseMessage(text, data.projects, API_KEY);

    if (!parsed.projectName || parsed.confidence < 0.5) {
      const caseNames = data.projects.filter(p => !p.archived).map(p => `• ${p.name}`).join('\n');
      await reply(replyToken, textMsg(
        `❓ 找不到對應案件\n\n請在訊息中包含案件名稱。\n\n目前案件：\n${caseNames}`
      ), TOKEN);
      return;
    }

    const project = data.projects.find(p => p.name === parsed.projectName);
    if (!project) throw new Error(`找不到：${parsed.projectName}`);

    const today = new Date().toISOString().slice(0, 10);
    const flexItems = [];

    for (const action of (parsed.actions || [])) {
      if (action.type === 'comm' && action.note) {
        project.comms = project.comms || [];
        project.comms.push({
          id: uid(), who: action.who || '業主',
          note: action.note, ch: action.ch || 'Line',
          date: action.date || today
        });
        flexItems.push({ icon: '📝', text: `${action.who || '業主'}：${action.note}` });
      }
      if (action.type === 'todo' && action.text) {
        project.todos = project.todos || [];
        project.todos.push({
          id: uid(), text: action.text, done: false,
          due: action.due || '', prio: action.prio || 'mid', note: ''
        });
        const prioIcon = action.prio === 'high' ? '🔴' : action.prio === 'mid' ? '🟡' : '⚪';
        flexItems.push({ icon: prioIcon, text: `${action.text}${action.due ? `（${fmtDate(action.due)}）` : ''}` });
      }
    }

    if (flexItems.length === 0) {
      await reply(replyToken, textMsg('🤔 看不出需要記錄什麼，請說得更具體。'), TOKEN);
      return;
    }

    await saveData(data);
    await reply(replyToken, confirmFlex(parsed.projectName, flexItems), TOKEN);

  } catch (err) {
    console.error(err);
    await reply(replyToken, textMsg(`❌ 錯誤：${err.message}`), TOKEN);
  }
}

// ── 主程式 ───────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const SECRET = process.env.LINE_CHANNEL_SECRET;
  const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  const ALLOWED_ID = process.env.ALLOWED_LINE_USER_ID;

  if (!SECRET || !TOKEN) return res.status(500).json({ error: 'Missing LINE env vars' });

  // 讀取原始 body 並驗證簽名
  const rawBody = await getRawBody(req);
  const signature = req.headers['x-line-signature'];

  if (!verifySignature(rawBody, signature, SECRET)) {
    console.error('Invalid LINE signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = JSON.parse(rawBody);
  const events = body.events || [];

  // 平行處理所有事件
  await Promise.all(events.map(e => handleEvent(e, TOKEN, API_KEY, ALLOWED_ID)));

  return res.status(200).json({ ok: true });
}
