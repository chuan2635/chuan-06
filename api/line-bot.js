// YC Studio — LINE Bot v3（確認機制）
import crypto from 'crypto';
export const config = { api: { bodyParser: false } };

const SURL = 'https://hrxyylqngkubruivwsdm.supabase.co';
const SKEY = 'sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O';
const APP_URL = 'https://chuan-06.vercel.app/';

// ── 工具 ─────────────────────────────────────────────────
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
  return `${parseInt(m)}/${parseInt(day)}`;
}
function normalize(s) {
  return s.replace(/[-–·・\s　。，、「」『』【】()（）]/g, '').toLowerCase();
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
  return scored[0]?.score >= 0.45 ? scored[0].p : null;
}

// ── LINE API ──────────────────────────────────────────────
async function replyMsg(replyToken, messages, token) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: Array.isArray(messages) ? messages : [messages] })
  });
}
function textMsg(text) { return { type: 'text', text }; }

// ── 確認卡片（按鈕為 postback）──────────────────────────
function previewFlex(pendingId, projectName, actions, originalText) {
  const items = [];
  for (const a of actions) {
    if (a.type === 'comm') {
      items.push({
        type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
        contents: [
          { type: 'text', text: '📝 溝通記錄', size: 'xs', color: '#B59E7D', weight: 'bold' },
          { type: 'text', text: `${a.who || '業主'} · ${a.ch || 'Line'} · ${fmtDate(a.date)}`, size: 'xs', color: '#9A9184' },
          { type: 'text', text: a.note, size: 'sm', wrap: true, color: '#2D1F14', margin: 'xs' }
        ]
      });
    }
    if (a.type === 'todo') {
      const pi = a.prio === 'high' ? '🔴' : a.prio === 'mid' ? '🟡' : '⚪';
      items.push({
        type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
        contents: [
          { type: 'text', text: '☑️ 待辦事項', size: 'xs', color: '#B59E7D', weight: 'bold' },
          { type: 'text', text: `${pi} ${a.text}${a.due ? `（截止 ${fmtDate(a.due)}）` : ''}`, size: 'sm', wrap: true, color: '#2D1F14', margin: 'xs' }
        ]
      });
    }
  }

  return {
    type: 'flex',
    altText: `📋 請確認：記錄到「${projectName}」`,
    contents: {
      type: 'bubble', size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'md', backgroundColor: '#584738',
        contents: [
          { type: 'text', text: '📋 請確認以下記錄', weight: 'bold', size: 'sm', color: '#F8F4EC' },
          { type: 'text', text: `📁 ${projectName}`, size: 'xs', color: '#CEC1A8', margin: 'xs' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'md', spacing: 'none',
        contents: items.length > 0 ? items : [{ type: 'text', text: '（原始訊息已記錄）', size: 'sm', color: '#9A9184', wrap: true }]
      },
      footer: {
        type: 'box', layout: 'horizontal', spacing: 'sm', paddingAll: 'sm',
        contents: [
          {
            type: 'button', flex: 1, height: 'sm', style: 'secondary',
            action: { type: 'postback', label: '✕ 取消', data: `action=cancel&id=${pendingId}` }
          },
          {
            type: 'button', flex: 2, height: 'sm', style: 'primary', color: '#584738',
            action: { type: 'postback', label: '✓ 確認記錄', data: `action=confirm&id=${pendingId}` }
          }
        ]
      }
    }
  };
}

// ── 成功卡片 ──────────────────────────────────────────────
function successFlex(projectName, flexItems) {
  return {
    type: 'flex', altText: `✅ 已記錄到 ${projectName}`,
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

// ── Claude 解析 ───────────────────────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today = new Date().toISOString().slice(0, 10);
  const wd = ['日','一','二','三','四','五','六'][new Date().getDay()];
  const projList = projects.filter(p => !p.archived).map(p => `- "${p.name}"`).join('\n');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `你是室內設計工作室助理。今天：${today}（週${wd}）

案件列表（模糊比對，忽略標點）：
${projList}

用戶訊息：「${userText}」

規則：
1. 有對話內容（業主說/廠商說/討論...）→ 必須產生 comm action
2. 有要做的事（報價/確認/訂購...）→ 必須產生 todo action  
3. "下週三" = 從今天算，"明天" = 明天
4. 至少要有一個 action

只回覆 JSON：
{
  "projectName": "完整案件名稱或null",
  "confidence": 0到1,
  "actions": [
    {"type":"comm","who":"對話對象","note":"溝通內容","date":"YYYY-MM-DD","ch":"Line或電話或會議或現場"},
    {"type":"todo","text":"待辦內容","due":"YYYY-MM-DD或空","prio":"high或mid或low"}
  ]
}`
      }]
    })
  });
  const d = await resp.json();
  const raw = (d.content?.[0]?.text || '{}').replace(/```json\n?|```/g, '').trim();
  return JSON.parse(raw);
}

// ── 處理訊息（建立 pending record）──────────────────────
async function handleMessage(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.message?.type !== 'text') return;
  const replyToken = event.replyToken;
  const userId = event.source?.userId;
  const text = (event.message?.text || '').trim();
  if (ALLOWED_ID && userId !== ALLOWED_ID) return;

  // 指令
  if (text === '說明' || text === '/help') {
    await replyMsg(replyToken, textMsg('🏠 YC Studio Bot\n\n直接傳訊息，我會先解析讓你確認，按「✓ 確認記錄」才會儲存。\n\n⌨️ 指令：\n狀態 — 今日摘要\n案件 — 案件列表'), TOKEN); return;
  }
  if (text === '狀態' || text === '/status') {
    const data = await fetchData();
    const today = new Date().toISOString().slice(0, 10);
    let ov = 0, td = 0, tot = 0;
    for (const p of (data?.projects || []).filter(x => !x.archived))
      for (const t of (p.todos || [])) { if (t.done) continue; tot++; if (t.due && t.due < today) ov++; else if (t.due === today) td++; }
    await replyMsg(replyToken, textMsg(`📊 今日狀態\n\n⚠️ 逾期：${ov} 件\n📌 今日截止：${td} 件\n📋 總待辦：${tot} 件`), TOKEN); return;
  }
  if (text === '案件' || text === '/cases') {
    const data = await fetchData();
    const active = (data?.projects || []).filter(p => !p.archived);
    await replyMsg(replyToken, textMsg(`📁 目前案件（${active.length} 件）\n\n` + active.map(p => `• ${p.name}（${(p.todos||[]).filter(t=>!t.done).length} 待辦）`).join('\n')), TOKEN); return;
  }

  if (!API_KEY) { await replyMsg(replyToken, textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'), TOKEN); return; }

  try {
    const data = await fetchData();
    if (!data) throw new Error('無法連線');
    const parsed = await parseMessage(text, data.projects, API_KEY);

    // 找案件（Claude + 模糊比對雙保險）
    let project = null;
    if (parsed.projectName)
      project = data.projects.find(p => p.name === parsed.projectName) || findBestProject(parsed.projectName, data.projects);
    if (!project) project = findBestProject(text, data.projects);

    if (!project) {
      const names = data.projects.filter(p => !p.archived).map(p => `• ${p.name}`).join('\n');
      await replyMsg(replyToken, textMsg(`❓ 找不到對應案件\n\n請包含更多案件名稱關鍵字。\n\n目前案件：\n${names}`), TOKEN); return;
    }

    // 若 actions 為空，把原始訊息當 comm
    let actions = parsed.actions || [];
    if (actions.length === 0) {
      actions = [{ type: 'comm', who: '業主', note: text, ch: 'Line', date: new Date().toISOString().slice(0,10) }];
    }

    // 建立 pending record（存入 Supabase 暫存）
    const pendingId = uid();
    data.pendingRecords = (data.pendingRecords || []).filter(r => {
      // 清除超過 30 分鐘的舊 pending
      return new Date() - new Date(r.createdAt) < 30 * 60 * 1000;
    });
    data.pendingRecords.push({ id: pendingId, projectId: project.id, actions, userId, createdAt: new Date().toISOString() });
    await saveData(data);

    // 發送確認卡片
    await replyMsg(replyToken, previewFlex(pendingId, project.name, actions, text), TOKEN);

  } catch (err) {
    console.error(err);
    await replyMsg(replyToken, textMsg(`❌ 錯誤：${err.message}`), TOKEN);
  }
}

// ── 處理 Postback（確認 / 取消）────────────────────────
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
    await replyMsg(replyToken, textMsg('✖️ 已取消，記錄不會儲存。'), TOKEN); return;
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
        flexItems.push({ icon: '📝', text: `${a.who||'業主'}：${a.note}` });
      }
      if (a.type === 'todo' && a.text) {
        project.todos = project.todos || [];
        project.todos.push({ id: uid(), text: a.text, done: false, due: a.due||'', prio: a.prio||'mid', note: '' });
        const pi = a.prio==='high'?'🔴':a.prio==='mid'?'🟡':'⚪';
        flexItems.push({ icon: pi, text: `${a.text}${a.due?`（${fmtDate(a.due)}）`:''}` });
      }
    }

    // 清除 pending
    data.pendingRecords = (data.pendingRecords || []).filter(r => r.id !== pendingId);
    await saveData(data);
    await replyMsg(replyToken, successFlex(project.name, flexItems), TOKEN);
  }
}

// ── 主程式 ────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const SECRET = process.env.LINE_CHANNEL_SECRET;
  const TOKEN  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
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
  }));

  return res.status(200).json({ ok: true });
}
