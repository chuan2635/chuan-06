// YC Studio — LINE Bot (v2 改善模糊比對)
import crypto from 'crypto';
export const config = { api: { bodyParser: false } };

const SURL = 'https://hrxyylqngkubruivwsdm.supabase.co';
const SKEY = 'sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O';
const APP_URL = 'https://chuan-06.vercel.app/';

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signature, secret) {
  const hash = crypto.createHmac('SHA256', secret).update(rawBody).digest('base64');
  return hash === signature;
}

async function reply(replyToken, messages, token) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: Array.isArray(messages) ? messages : [messages] })
  });
}

function textMsg(text) { return { type: 'text', text }; }

// ── 改善版模糊比對 ────────────────────────────────────────
function normalize(s) {
  return s.replace(/[-–·・\s　。，、「」『』【】()（）]/g, '').toLowerCase();
}

function findBestProject(input, projects) {
  if (!input) return null;
  const active = projects.filter(p => !p.archived);

  // 1. 完全符合
  const exact = active.find(p => p.name === input);
  if (exact) return exact;

  const normInput = normalize(input);

  // 2. 標準化後符合
  const normExact = active.find(p => normalize(p.name) === normInput);
  if (normExact) return normExact;

  // 3. 包含關係（雙向）
  const contains = active.find(p => {
    const np = normalize(p.name);
    return np.includes(normInput) || normInput.includes(np);
  });
  if (contains) return contains;

  // 4. 字元重疊分數
  const scored = active.map(p => {
    const np = normalize(p.name);
    const inputChars = new Set(normInput.split(''));
    const projChars = new Set(np.split(''));
    const overlap = [...inputChars].filter(c => projChars.has(c)).length;
    const score = (overlap * 2) / (inputChars.size + projChars.size);
    return { p, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score >= 0.45 ? scored[0].p : null;
}

// ── 確認卡片 Flex Message ─────────────────────────────────
function confirmFlex(projectName, items) {
  return {
    type: 'flex', altText: `✅ 已記錄到 ${projectName}`,
    contents: {
      type: 'bubble', size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'md', backgroundColor: '#584738',
        contents: [{ type: 'text', text: '✅ YC Studio 記錄成功', weight: 'bold', size: 'sm', color: '#F8F4EC' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'md',
        contents: [
          { type: 'text', text: projectName, weight: 'bold', size: 'md', color: '#2D1F14', wrap: true },
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
  return (await r.json())?.[0]?.data || null;
}

async function saveData(data) {
  await fetch(`${SURL}/rest/v1/studio_data`, {
    method: 'POST',
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() })
  });
}

// ── Claude 解析（改善版 Prompt）──────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today = new Date().toISOString().slice(0, 10);
  const projList = projects.filter(p => !p.archived)
    .map(p => `- "${p.name}"`).join('\n');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `你是室內設計工作室 YC Studio 的助理，負責從訊息中提取溝通記錄和待辦事項。
今天：${today}（星期${['日','一','二','三','四','五','六'][new Date().getDay()]}）

現有案件（模糊比對，忽略標點）：
${projList}

比對規則：
- "桃園觀音老妹家" ≈ "桃園觀音-老妹家" ✓
- "石門湯旅" ≈ "桃園龍潭-石門湯旅B23-9F" ✓
- "小王子" ≈ "桃園小檜溪-小王子" ✓

用戶訊息：「${userText}」

重要規則：
1. 只要訊息提到任何對話內容（業主說、廠商說、討論...），就必須產生 type:"comm" 的 action
2. 只要訊息提到需要做的事（要報價、要確認、要訂購...），就必須產生 type:"todo" 的 action
3. 日期計算：今天是 ${today}，「下週三」= 計算實際日期，「明天」= 明天日期
4. actions 絕對不能是空陣列，至少要有一個 comm 記錄

回覆純 JSON（不含其他說明）：
{
  "projectName": "案件完整名稱（完全符合列表）或null",
  "confidence": 0到1,
  "actions": [
    {
      "type": "comm",
      "who": "對話對象",
      "note": "溝通內容摘要（要具體）",
      "date": "YYYY-MM-DD",
      "ch": "Line或電話或會議或現場或Email"
    },
    {
      "type": "todo",
      "text": "待辦事項（要具體）",
      "due": "YYYY-MM-DD（沒提到留空）",
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

function uid() { return Math.random().toString(36).slice(2, 8); }
function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${parseInt(m)}月${parseInt(day)}日`;
}

// ── 處理 LINE 事件 ─────────────────────────────────────────
async function handleEvent(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.type !== 'message' || event.message?.type !== 'text') return;
  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const text = (event.message?.text || '').trim();

  if (ALLOWED_ID && userId !== ALLOWED_ID) return;

  // 指令
  if (text === '說明' || text === '/help') {
    await reply(replyToken, textMsg(
      '🏠 YC Studio Bot\n\n直接傳訊息，我幫你記錄！\n\n📝 範例：\n「剛跟觀音老妹家業主在Line上聊，她說浴室要換大理石磚，下週三前報價」\n\n（案件名稱不用打完整，我會自動比對）\n\n⌨️ 指令：\n狀態 — 今日摘要\n案件 — 案件列表\n說明 — 查看說明'
    ), TOKEN);
    return;
  }

  if (text === '狀態' || text === '/status') {
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
    await reply(replyToken, textMsg(`📊 今日狀態\n\n⚠️ 逾期：${overdue} 件\n📌 今日截止：${dueToday} 件\n📋 總待辦：${total} 件`), TOKEN);
    return;
  }

  if (text === '案件' || text === '/cases') {
    const data = await fetchData();
    if (!data) { await reply(replyToken, textMsg('❌ 無法連線'), TOKEN); return; }
    const active = data.projects.filter(p => !p.archived);
    await reply(replyToken, textMsg(
      `📁 目前案件（${active.length} 件）\n\n` +
      active.map(p => `• ${p.name}（${(p.todos||[]).filter(t=>!t.done).length} 待辦）`).join('\n')
    ), TOKEN);
    return;
  }

  if (!API_KEY) { await reply(replyToken, textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'), TOKEN); return; }

  try {
    const data = await fetchData();
    if (!data) throw new Error('無法連線到資料庫');

    // Claude 解析
    const parsed = await parseMessage(text, data.projects, API_KEY);

    // 雙重保險：Claude 找不到時用模糊比對
    let project = null;
    if (parsed.projectName) {
      project = data.projects.find(p => p.name === parsed.projectName)
             || findBestProject(parsed.projectName, data.projects);
    }

    // 還是找不到：從原始訊息直接模糊比對
    if (!project) {
      project = findBestProject(text, data.projects);
    }

    if (!project) {
      const caseNames = data.projects.filter(p => !p.archived).map(p => `• ${p.name}`).join('\n');
      await reply(replyToken, textMsg(`❓ 找不到對應案件\n\n傳「案件」查看完整列表，或在訊息中包含更多案件名稱關鍵字。\n\n目前案件：\n${caseNames}`), TOKEN);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const flexItems = [];

    for (const action of (parsed.actions || [])) {
      if (action.type === 'comm' && action.note) {
        project.comms = project.comms || [];
        project.comms.push({ id: uid(), who: action.who || '業主', note: action.note, ch: action.ch || 'Line', date: action.date || today });
        flexItems.push({ icon: '📝', text: `${action.who || '業主'}：${action.note}` });
      }
      if (action.type === 'todo' && action.text) {
        project.todos = project.todos || [];
        project.todos.push({ id: uid(), text: action.text, done: false, due: action.due || '', prio: action.prio || 'mid', note: '' });
        const pi = action.prio === 'high' ? '🔴' : action.prio === 'mid' ? '🟡' : '⚪';
        flexItems.push({ icon: pi, text: `${action.text}${action.due ? `（${fmtDate(action.due)}）` : ''}` });
      }
    }

    // Fallback：如果 actions 為空，把整段訊息記錄為溝通記錄
    if ((parsed.actions || []).length === 0 || flexItems.length === 0) {
      project.comms = project.comms || [];
      project.comms.push({ id: uid(), who: '業主', note: text, ch: 'Line', date: today });
      flexItems.push({ icon: '📝', text: `業主：${text.slice(0, 60)}${text.length > 60 ? '…' : ''}` });
    }

    if (flexItems.length === 0) {
      await reply(replyToken, textMsg('🤔 找到案件了，但看不出需要記錄什麼，請說得更具體。'), TOKEN);
      return;
    }

    await saveData(data);
    await reply(replyToken, confirmFlex(project.name, flexItems), TOKEN);

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

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-line-signature'];

  if (!verifySignature(rawBody, signature, SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = JSON.parse(rawBody);
  await Promise.all((body.events || []).map(e => handleEvent(e, TOKEN, API_KEY, ALLOWED_ID)));

  return res.status(200).json({ ok: true });
}
