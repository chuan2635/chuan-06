// YC Studio — LINE Bot v4
import crypto from 'crypto';
export const config = { api: { bodyParser: false } };

const SURL = 'https://hrxyylqngkubruivwsdm.supabase.co';
const SKEY = 'sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O';
const APP_URL = 'https://chuan-06.vercel.app/';

// ── 工具 ──────────────────────────────────────────────────
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });
}
function verifySignature(rawBody, sig, secret) {
  return crypto.createHmac('SHA256', secret).update(rawBody).digest('base64') === sig;
}
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return parseInt(m) + '/' + parseInt(day);
}
function normalize(s) {
  return s.replace(/[-\u2013\u00b7\uff65\s\u3000\u3002\uff0c\u3001\u300c\u300d\u300e\u300f\u3010\u3011()\uff08\uff09]/g, '').toLowerCase();
}
function findBestProject(input, projects) {
  if (!input) return null;
  const active = projects.filter(p => !p.archived);
  const exact = active.find(p => p.name === input);
  if (exact) return exact;
  const normInput = normalize(input);
  const normExact = active.find(p => normalize(p.name) === normInput);
  if (normExact) return normExact;
  const contains = active.find(p => {
    const np = normalize(p.name);
    return np.includes(normInput) || normInput.includes(np);
  });
  if (contains) return contains;
  const scored = active.map(p => {
    const np = normalize(p.name);
    const ic = new Set(normInput.split(''));
    const pc = new Set(np.split(''));
    const overlap = [...ic].filter(c => pc.has(c)).length;
    return { p, score: (overlap * 2) / (ic.size + pc.size) };
  }).sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score >= 0.45 ? scored[0].p : null;
}

// ── 從訊息中抽取可能的案件名稱提及 ──────────────────────
function extractMentions(text) {
  const mentions = [];
  // 「跟XXX的業主」「跟XXX業主」「跟XXX討論」
  const p1 = text.match(/跟(.{2,12})(?:的業主|業主|的廠商|廠商|那邊|討論|開會)/);
  if (p1) mentions.push(p1[1].trim());
  // 「XXX的業主說」「XXX案場」「XXX那個」
  const p2 = text.match(/^(.{2,12})(?:的業主|案場|那個|案子)/);
  if (p2) mentions.push(p2[1].trim());
  // 「石門湯旅」「小王子」等獨立詞（案件列表中的特徵詞）
  const p3 = text.match(/(?:在|到|去|跟|和)([^\s，,的之]{2,8})(?:那邊|現場|業主|廠商|開|討論)/);
  if (p3) mentions.push(p3[1].trim());
  return [...new Set(mentions)].filter(m => m.length >= 2);
}

// ── LINE API ───────────────────────────────────────────────────
async function replyMsg(replyToken, messages, token) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ replyToken, messages: Array.isArray(messages) ? messages : [messages] })
  });
}
function textMsg(text) { return { type: 'text', text }; }

// ── 確認預覽卡片 ──────────────────────────────────────────
function previewFlex(pendingId, projectName, actions) {
  const items = [];
  for (const a of actions) {
    if (a.type === 'comm') {
      items.push({
        type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
        contents: [
          { type: 'text', text: '📝 溝通記錄', size: 'xs', color: '#B59E7D', weight: 'bold' },
          { type: 'text', text: (a.who || '業主') + ' \u00b7 ' + (a.ch || 'Line') + ' \u00b7 ' + fmtDate(a.date), size: 'xs', color: '#9A9184' },
          { type: 'text', text: a.note || '', size: 'sm', wrap: true, color: '#2D1F14', margin: 'xs' }
        ]
      });
    }
    if (a.type === 'todo') {
      const pi = a.prio === 'high' ? '🔴' : a.prio === 'mid' ? '🟡' : '⚪';
      const dueStr = a.due ? '（截止 ' + fmtDate(a.due) + '）' : '';
      items.push({
        type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
        contents: [
          { type: 'text', text: '☑️ 待辦事項', size: 'xs', color: '#B59E7D', weight: 'bold' },
          { type: 'text', text: pi + ' ' + (a.text || '') + dueStr, size: 'sm', wrap: true, color: '#2D1F14', margin: 'xs' }
        ]
      });
    }
  }
  return {
    type: 'flex',
    altText: '📋 請確認：記錄到「' + projectName + '」',
    contents: {
      type: 'bubble', size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'md', backgroundColor: '#584738',
        contents: [
          { type: 'text', text: '📋 請確認以下記錄', weight: 'bold', size: 'sm', color: '#F8F4EC' },
          { type: 'text', text: '📁 ' + projectName, size: 'xs', color: '#CEC1A8', margin: 'xs' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'md', spacing: 'none',
        contents: items.length > 0 ? items : [{ type: 'text', text: '（訊息已記錄為溝通記錄）', size: 'sm', color: '#9A9184', wrap: true }]
      },
      footer: {
        type: 'box', layout: 'horizontal', spacing: 'sm', paddingAll: 'sm',
        contents: [
          { type: 'button', flex: 1, height: 'sm', style: 'secondary', action: { type: 'postback', label: '✕ 取消', data: 'action=cancel&id=' + pendingId } },
          { type: 'button', flex: 2, height: 'sm', style: 'primary', color: '#584738', action: { type: 'postback', label: '✓ 確認記錄', data: 'action=confirm&id=' + pendingId } }
        ]
      }
    }
  };
}

// ── 成功卡片 ──────────────────────────────────────────────
function successFlex(projectName, flexItems) {
  return {
    type: 'flex', altText: '✅ 已記錄到 ' + projectName,
    contents: {
      type: 'bubble', size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'md', backgroundColor: '#4D7A5A',
        contents: [{ type: 'text', text: '✅ 記錄成功！', weight: 'bold', size: 'sm', color: '#F8F4EC' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'md',
        contents: [
          { type: 'text', text: projectName, weight: 'bold', size: 'md', color: '#2D1F14', wrap: true },
          { type: 'separator', margin: 'sm' },
          ...flexItems.map(it => ({
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
        contents: [{ type: 'button', action: { type: 'uri', label: '查看 YC Studio →', uri: APP_URL }, style: 'primary', color: '#B59E7D', height: 'sm' }]
      }
    }
  };
}

// ── Supabase ───────────────────────────────────────────────
async function fetchData() {
  const r = await fetch(SURL + '/rest/v1/studio_data?id=eq.main&select=data', {
    headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY }
  });
  return (await r.json())?.[0]?.data || null;
}
async function saveData(data) {
  await fetch(SURL + '/rest/v1/studio_data', {
    method: 'POST',
    headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() })
  });
}

// ── Claude 解析 ────────────────────────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today = new Date().toISOString().slice(0, 10);
  const dayNames = ['日','一','二','三','四','五','六'];
  const wd = dayNames[new Date().getDay()];

  // 預先計算未來 7 天日期，給 Claude 參考
  const dateMap = {};
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key1 = '下週' + dayNames[d.getDay()];
    const key2 = '下周' + dayNames[d.getDay()];
    const val = d.toISOString().slice(0, 10);
    dateMap[key1] = val;
    dateMap[key2] = val;
    if (i === 1) dateMap['明天'] = val;
    if (i === 2) dateMap['後天'] = val;
  }
  const dateHints = Object.entries(dateMap).map(([k, v]) => k + '=' + v).join(', ');

  const projList = projects.filter(p => !p.archived).map(p => '- "' + p.name + '"').join('\n');

  const systemPrompt = '你是室內設計工作室助理，從用戶訊息提取結構化資料，只回覆 JSON。';
  const userPrompt = '今天：' + today + '（週' + wd + '）\n日期對照：' + dateHints + '\n\n案件（模糊比對）：\n' + projList + '\n\n規則：\n1. 有對話/溝通內容 → 產生 comm action（必須）\n2. 有要做的事、報價、確認、期限等 → 產生 todo action\n3. 「下禮拜二/三」=「下週二/三」，使用日期對照換算\n4. 通常同時有 comm 和 todo\n\n範例：\n輸入：「跟石門湯旅業主討論，廚具業主自己處理，下禮拜二前要抓報價單給業主確認」\n輸出：{"projectName":"桃園龍潭-石門湯旅B23-9F","confidence":0.95,"actions":[{"type":"comm","who":"業主","note":"業主表示廚具部分自行處理","date":"' + today + '","ch":"現場"},{"type":"todo","text":"抓報價單給業主確認","due":"' + (dateMap['下週二'] || '') + '","prio":"high"}]}\n\n訊息：「' + userText + '」\n\n只回覆 JSON：';

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });
  const d = await resp.json();
  const raw = (d.content?.[0]?.text || '{}').replace(/```json\n?|```/g, '').trim();
  return JSON.parse(raw);
}

// ── 處理訊息 ──────────────────────────────────────────────
async function handleMessage(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.message?.type !== 'text') return;
  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const text = (event.message?.text || '').trim();
  if (ALLOWED_ID && userId !== ALLOWED_ID) return;

  if (text === '說明' || text === '/help') {
    await replyMsg(replyToken, textMsg('🏠 YC Studio Bot\n\n直接傳訊息，解析後讓你確認再儲存。\n\n⌨️ 指令：\n狀態 — 今日摘要\n案件 — 案件列表\n說明 — 查看說明'), TOKEN);
    return;
  }
  if (text === '狀態') {
    const data = await fetchData();
    const today = new Date().toISOString().slice(0, 10);
    let ov = 0, td = 0, tot = 0;
    for (const p of (data?.projects || []).filter(x => !x.archived))
      for (const t of (p.todos || [])) { if (t.done) continue; tot++; if (t.due && t.due < today) ov++; else if (t.due === today) td++; }
    await replyMsg(replyToken, textMsg('📊 今日狀態\n\n⚠️ 逾期：' + ov + ' 件\n📌 今日截止：' + td + ' 件\n📋 總待辦：' + tot + ' 件'), TOKEN);
    return;
  }
  if (text === '案件') {
    const data = await fetchData();
    const active = (data?.projects || []).filter(p => !p.archived);
    await replyMsg(replyToken, textMsg('📁 目前案件（' + active.length + ' 件）\n\n' + active.map(p => '• ' + p.name + '（' + (p.todos||[]).filter(t=>!t.done).length + ' 待辦）').join('\n')), TOKEN);
    return;
  }

  if (!API_KEY) { await replyMsg(replyToken, textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'), TOKEN); return; }

  try {
    const data = await fetchData();
    if (!data) throw new Error('無法連線到資料庫');
    const parsed = await parseMessage(text, data.projects, API_KEY);

    let project = null;
    // 1. Claude 直接返回的案件名稱
    if (parsed.projectName)
      project = data.projects.find(p => p.name === parsed.projectName)
             || findBestProject(parsed.projectName, data.projects);
    // 2. 從訊息抽取關鍵詞比對（處理「跟石門湯旅的業主...」這類說法）
    if (!project) {
      const mentions = extractMentions(text);
      for (const m of mentions) {
        project = findBestProject(m, data.projects);
        if (project) break;
      }
    }
    // 3. 降低門檻的全文比對（最後手段）
    if (!project) {
      const active = data.projects.filter(p => !p.archived);
      const normText = normalize(text);
      project = active.find(p => {
        const parts = p.name.replace(/[-–]/g, ' ').split(/\s+/);
        return parts.some(part => part.length >= 2 && normText.includes(normalize(part)));
      }) || null;
    }

    if (!project) {
      const names = data.projects.filter(p => !p.archived).map(p => '• ' + p.name).join('\n');
      await replyMsg(replyToken, textMsg('❓ 找不到對應案件\n\n請包含更多案件名稱關鍵字。\n\n目前案件：\n' + names), TOKEN);
      return;
    }

    let actions = parsed.actions || [];
    if (actions.length === 0) {
      actions = [{ type: 'comm', who: '業主', note: text, ch: 'Line', date: new Date().toISOString().slice(0, 10) }];
    }

    const pendingId = uid();
    data.pendingRecords = (data.pendingRecords || []).filter(r => new Date() - new Date(r.createdAt) < 30 * 60 * 1000);
    data.pendingRecords.push({ id: pendingId, projectId: project.id, actions, userId, createdAt: new Date().toISOString() });
    await saveData(data);

    await replyMsg(replyToken, previewFlex(pendingId, project.name, actions, text), TOKEN);
  } catch (err) {
    console.error(err);
    await replyMsg(replyToken, textMsg('❌ 錯誤：' + err.message), TOKEN);
  }
}

// ── 處理 Postback ─────────────────────────────────────────
async function handlePostback(event, TOKEN) {
  const replyToken = event.replyToken;
  const params = new URLSearchParams(event.postback?.data || '');
  const action = params.get('action');
  const pendingId = params.get('id');

  const data = await fetchData();
  if (!data) { await replyMsg(replyToken, textMsg('❌ 無法連線'), TOKEN); return; }
  const pending = (data.pendingRecords || []).find(r => r.id === pendingId);

  if (action === 'cancel') {
    data.pendingRecords = (data.pendingRecords || []).filter(r => r.id !== pendingId);
    await saveData(data);
    await replyMsg(replyToken, textMsg('✖️ 已取消，記錄不會儲存。'), TOKEN);
    return;
  }

  if (action === 'confirm') {
    if (!pending) { await replyMsg(replyToken, textMsg('⚠️ 記錄已過期（超過30分鐘），請重新傳訊息。'), TOKEN); return; }
    const project = data.projects.find(p => p.id === pending.projectId);
    if (!project) { await replyMsg(replyToken, textMsg('❌ 找不到案件'), TOKEN); return; }

    const today = new Date().toISOString().slice(0, 10);
    const flexItems = [];
    for (const a of pending.actions) {
      if (a.type === 'comm' && a.note) {
        project.comms = project.comms || [];
        project.comms.push({ id: uid(), who: a.who||'業主', note: a.note, ch: a.ch||'Line', date: a.date||today });
        flexItems.push({ icon: '📝', text: (a.who||'業主') + '：' + a.note });
      }
      if (a.type === 'todo' && a.text) {
        project.todos = project.todos || [];
        project.todos.push({ id: uid(), text: a.text, done: false, due: a.due||'', prio: a.prio||'mid', note: '' });
        const pi = a.prio==='high'?'🔴':a.prio==='mid'?'🟡':'⚪';
        flexItems.push({ icon: pi, text: a.text + (a.due ? '（' + fmtDate(a.due) + '）' : '') });
      }
    }

    data.pendingRecords = (data.pendingRecords || []).filter(r => r.id !== pendingId);
    await saveData(data);
    await replyMsg(replyToken, successFlex(project.name, flexItems), TOKEN);
  }
}

// ── 主程式 ────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const SECRET = process.env.LINE_CHANNEL_SECRET;
  const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  const ALLOWED_ID = process.env.ALLOWED_LINE_USER_ID;
  if (!SECRET || !TOKEN) return res.status(500).json({ error: 'Missing LINE env vars' });

  const rawBody = await getRawBody(req);
  if (!verifySignature(rawBody, req.headers['x-line-signature'], SECRET))
    return res.status(401).json({ error: 'Invalid signature' });

  const body = JSON.parse(rawBody);
  await Promise.all((body.events || []).map(e => {
    if (e.type === 'message') return handleMessage(e, TOKEN, API_KEY, ALLOWED_ID);
    if (e.type === 'postback') return handlePostback(e, TOKEN);
    return Promise.resolve();
  }));

  return res.status(200).json({ ok: true });
}
