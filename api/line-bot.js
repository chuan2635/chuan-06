// YC Studio — LINE Bot v6（支援修改已確認記錄）
import crypto from 'crypto';
import { createStore, applyConfirm, applyMods, uid } from './_store.js';
export const config = { api: { bodyParser: false } };

const SURL = 'https://hrxyylqngkubruivwsdm.supabase.co';
const SKEY = 'sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O';
const APP_URL = 'https://chuan-06.vercel.app/';
// 資料空間：正式為 ''；測試時設環境變數 YS_NS=test:（有 NS+meta 列才用新格式，否則自動退回舊的 main 單列）
const makeStore = () => createStore({ SURL, SKEY, NS: process.env.YS_NS || '', LEGACY_ID: process.env.YS_LEGACY_ID || 'main' });

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
function fmtDate(d) {
  if (!d) return '';
  const p = d.split('-');
  return parseInt(p[1]) + '/' + parseInt(p[2]);
}
function normalize(s) {
  return s.replace(/[-\u2013\u00b7\uff65\s\u3000\u3002\uff0c\u3001\u300c\u300d\u300e\u300f\u3010\u3011()\uff08\uff09]/g, '').toLowerCase();
}
function buildDateMap() {
  const dn = ['日','一','二','三','四','五','六'];
  const map = {};
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const n = dn[d.getDay()], v = d.toISOString().slice(0, 10);
    map['下週'+n] = v; map['下周'+n] = v; map['下禮拜'+n] = v;
    if (i===1){map['明天']=v;map['明日']=v;} if(i===2)map['後天']=v;
  }
  return map;
}
function findBestProject(input, projects) {
  if (!input) return null;
  const active = projects.filter(p => !p.archived);
  const ni = normalize(input);
  const e1 = active.find(p => p.name === input); if(e1) return e1;
  const e2 = active.find(p => normalize(p.name) === ni); if(e2) return e2;
  const e3 = active.find(p => { const np=normalize(p.name); return np.includes(ni)||ni.includes(np); }); if(e3) return e3;
  const e4 = active.find(p => { const np=normalize(p.name); for(let i=0;i<=np.length-4;i++){const c=np.slice(i,i+4);if(/[\u4e00-\u9fff]{4}/.test(c)&&ni.includes(c))return true;} return false; }); if(e4) return e4;
  const sc = active.map(p=>{const np=normalize(p.name),ic=new Set(ni.split('')),pc=new Set(np.split(''));return{p,s:(([...ic].filter(c=>pc.has(c)).length)*2)/(ic.size+pc.size)};}).sort((a,b)=>b.s-a.s);
  return sc[0]&&sc[0].s>=0.45?sc[0].p:null;
}
// 備援（不靠 Claude）：案件名中「只屬於該案件」的連續中文片段（≥2字，如「學澄」）出現在訊息裡就比對；有並列則不猜
function findByFragment(text, projects) {
  const active = projects.filter(p => !p.archived);
  const nt = normalize(text);
  const frags = p => { const np = normalize(p.name), out = new Set(); for (let i = 0; i < np.length; i++) for (let j = i + 2; j <= np.length; j++) { const s = np.slice(i, j); if (/^[一-鿿]+$/.test(s)) out.add(s); } return out; };
  const fs = active.map(p => ({ p, f: frags(p) }));
  const df = new Map(); for (const x of fs) for (const s of x.f) df.set(s, (df.get(s) || 0) + 1);
  const scored = fs.map(x => ({ p: x.p, s: Math.max(0, ...[...x.f].filter(s => df.get(s) === 1 && nt.includes(s)).map(s => s.length)) })).filter(x => x.s >= 2).sort((a, b) => b.s - a.s);
  return scored[0] && (!scored[1] || scored[1].s < scored[0].s) ? scored[0].p : null;
}
function extractMentions(text) {
  const m=[];
  const p1=text.match(/跟(.{2,8}?)(?:的業主|業主|的廠商|廠商|那邊|討論|開會)/); if(p1)m.push(p1[1].trim());
  const p2=text.match(/^(.{2,8}?)(?:的業主|案場|那個|案子)/); if(p2)m.push(p2[1].trim());
  const p3=text.match(/(?:在|到|去|跟|和)(.{2,6}?)(?:那邊|現場|業主|廠商|開|討論)/); if(p3)m.push(p3[1].trim());
  return [...new Set(m)].filter(x=>x.length>=2);
}
// 判斷是否為「修改已有記錄」意圖
function isModificationIntent(text) {
  return /改|修改|更新|完成了|做完了|已完成|標記完成|刪除|刪掉|移除|補充|加上|錯了|寫錯/.test(text);
}

// ── LINE API ───────────────────────────────────────────────
async function replyMsg(replyToken, messages, token) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ replyToken, messages: Array.isArray(messages) ? messages : [messages] })
  });
}
function textMsg(text) { return { type: 'text', text }; }

// ── 新增記錄確認卡片 ──────────────────────────────────────
function previewFlex(pendingId, projectName, actions) {
  const items = [];
  for (const a of actions) {
    if (a.type === 'comm') items.push({ type:'box',layout:'vertical',margin:'md',spacing:'xs',contents:[{type:'text',text:'📝 溝通記錄',size:'xs',color:'#B59E7D',weight:'bold'},{type:'text',text:(a.who||'業主')+' · '+(a.ch||'Line')+' · '+fmtDate(a.date),size:'xs',color:'#9A9184'},{type:'text',text:a.note||'',size:'sm',wrap:true,color:'#2D1F14',margin:'xs'}] });
    if (a.type === 'todo') { const pi=a.prio==='high'?'🔴':a.prio==='mid'?'🟡':'⚪'; items.push({ type:'box',layout:'vertical',margin:'md',spacing:'xs',contents:[{type:'text',text:'☑️ 待辦事項',size:'xs',color:'#B59E7D',weight:'bold'},{type:'text',text:pi+' '+(a.text||'')+(a.due?'（截止 '+fmtDate(a.due)+'）':''),size:'sm',wrap:true,color:'#2D1F14',margin:'xs'}] }); }
  }
  return { type:'flex',altText:'📋 請確認：記錄到「'+projectName+'」',contents:{ type:'bubble',size:'kilo',
    header:{ type:'box',layout:'vertical',paddingAll:'md',backgroundColor:'#584738',contents:[{type:'text',text:'📋 請確認以下記錄',weight:'bold',size:'sm',color:'#F8F4EC'},{type:'text',text:'📁 '+projectName,size:'xs',color:'#CEC1A8',margin:'xs'}] },
    body:{ type:'box',layout:'vertical',paddingAll:'md',spacing:'none',contents:items.length>0?items:[{type:'text',text:'（訊息已記錄為溝通記錄）',size:'sm',color:'#9A9184',wrap:true}] },
    footer:{ type:'box',layout:'vertical',spacing:'sm',paddingAll:'sm',contents:[
      { type:'box',layout:'horizontal',spacing:'sm',contents:[
        {type:'button',flex:1,height:'sm',style:'secondary',action:{type:'postback',label:'✕ 取消',data:'action=cancel&id='+pendingId}},
        {type:'button',flex:1,height:'sm',style:'secondary',action:{type:'postback',label:'✎ 修改',data:'action=edit&id='+pendingId}}
      ]},
      {type:'button',height:'sm',style:'primary',color:'#584738',action:{type:'postback',label:'✓ 確認記錄',data:'action=confirm&id='+pendingId}}
    ]}
  }};
}

// ── 修改確認卡片（顯示前後對比）────────────────────────────
function modifyPreviewFlex(pendingId, projectName, modifications) {
  const items = [];
  for (const m of modifications) {
    const icon = m.recordType === 'todo' ? '☑️' : '📝';
    const label = m.recordType === 'todo' ? '待辦' : '溝通記錄';
    const actionLabel = m.action === 'done' ? '標記完成' : m.action === 'delete' ? '刪除' : '編輯';
    items.push({
      type:'box',layout:'vertical',margin:'md',spacing:'xs',
      contents:[
        { type:'text',text:icon+' '+label+'（'+actionLabel+'）',size:'xs',color:'#B59E7D',weight:'bold' },
        { type:'text',text:'原：'+m.originalText,size:'sm',wrap:true,color:'#9A9184',margin:'xs' },
        ...(m.action!=='done'&&m.action!=='delete'?[{ type:'text',text:'改：'+m.newText,size:'sm',wrap:true,color:'#2D1F14',margin:'xs' }]:[])
      ]
    });
  }
  return { type:'flex',altText:'🔄 確認修改？',contents:{ type:'bubble',size:'kilo',
    header:{ type:'box',layout:'vertical',paddingAll:'md',backgroundColor:'#8B6020',contents:[{type:'text',text:'🔄 確認以下修改？',weight:'bold',size:'sm',color:'#F8F4EC'},{type:'text',text:'📁 '+projectName,size:'xs',color:'#F5E6C8',margin:'xs'}] },
    body:{ type:'box',layout:'vertical',paddingAll:'md',spacing:'none',contents:items },
    footer:{ type:'box',layout:'horizontal',spacing:'sm',paddingAll:'sm',contents:[
      {type:'button',flex:1,height:'sm',style:'secondary',action:{type:'postback',label:'✕ 取消',data:'action=cancel&id='+pendingId}},
      {type:'button',flex:2,height:'sm',style:'primary',color:'#8B6020',action:{type:'postback',label:'✓ 確認修改',data:'action=applymod&id='+pendingId}}
    ]}
  }};
}

// ── 成功卡片 ──────────────────────────────────────────────
function successFlex(projectName, flexItems) {
  return { type:'flex',altText:'✅ 已記錄到 '+projectName,contents:{ type:'bubble',size:'kilo',
    header:{ type:'box',layout:'vertical',paddingAll:'md',backgroundColor:'#4D7A5A',contents:[{type:'text',text:'✅ 記錄成功！',weight:'bold',size:'sm',color:'#F8F4EC'}] },
    body:{ type:'box',layout:'vertical',spacing:'sm',paddingAll:'md',contents:[{type:'text',text:projectName,weight:'bold',size:'md',color:'#2D1F14',wrap:true},{type:'separator',margin:'sm'},...flexItems.map(it=>({type:'box',layout:'horizontal',margin:'sm',spacing:'sm',contents:[{type:'text',text:it.icon,size:'sm',flex:0,color:'#B59E7D'},{type:'text',text:it.text,size:'sm',wrap:true,flex:5,color:'#584738'}]}))] },
    footer:{ type:'box',layout:'vertical',paddingAll:'sm',contents:[{type:'button',action:{type:'uri',label:'查看 YC Studio →',uri:APP_URL},style:'primary',color:'#B59E7D',height:'sm'}] }
  }};
}
function modifySuccessFlex(projectName, mods) {
  return { type:'flex',altText:'✅ 修改完成',contents:{ type:'bubble',size:'kilo',
    header:{ type:'box',layout:'vertical',paddingAll:'md',backgroundColor:'#4D7A5A',contents:[{type:'text',text:'✅ 修改完成！',weight:'bold',size:'sm',color:'#F8F4EC'}] },
    body:{ type:'box',layout:'vertical',spacing:'sm',paddingAll:'md',contents:[{type:'text',text:projectName,weight:'bold',size:'md',color:'#2D1F14',wrap:true},{type:'separator',margin:'sm'},...mods.map(m=>({type:'box',layout:'horizontal',margin:'sm',spacing:'sm',contents:[{type:'text',text:m.action==='done'?'✅':m.action==='delete'?'🗑️':'✏️',size:'sm',flex:0,color:'#B59E7D'},{type:'text',text:m.newText||m.originalText,size:'sm',wrap:true,flex:5,color:'#584738'}]}))] },
    footer:{ type:'box',layout:'vertical',paddingAll:'sm',contents:[{type:'button',action:{type:'uri',label:'查看 YC Studio →',uri:APP_URL},style:'primary',color:'#B59E7D',height:'sm'}] }
  }};
}


// Claude 回應檢查：API 失敗或沒有內容時丟出明確錯誤（原本會靜默當成空物件，導致誤報「找不到對應案件」）
async function claudeText(resp) {
  const d = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error('AI 解析失敗（Claude API ' + resp.status + '：' + (d?.error?.message || d?.error?.type || '無回應內容').slice(0, 80) + '）');
  const text = d?.content?.[0]?.text;
  if (!text) throw new Error('AI 解析失敗（Claude 沒有回傳內容）');
  return text.replace(/```json\n?|```/g, '').trim();
}

// ── Claude：解析新記錄 ────────────────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today=new Date().toISOString().slice(0,10);
  const dm=buildDateMap();
  const dh=Object.entries(dm).map(e=>e[0]+'='+e[1]).join(', ');
  const pl=projects.filter(p=>!p.archived).map(p=>'- "'+p.name+'"').join('\n');
  const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1200,system:'你是室內設計助理，從訊息提取結構化資料，只回覆 JSON。',messages:[{role:'user',content:'今天：'+today+'\n日期：'+dh+'\n\n案件：\n'+pl+'\n\n規則：\n1. 有溝通內容→comm\n2. 有要做的事/期限→todo\n3. 下禮拜X=下週X\n4. comm+todo都要\n\n訊息：「'+userText+'」\n\nJSON：{"projectName":"完整案件名或null","confidence":0到1,"actions":[{"type":"comm","who":"...","note":"...","date":"YYYY-MM-DD","ch":"..."},{"type":"todo","text":"...","due":"YYYY-MM-DD或空","prio":"high/mid/low"}]}'}]})});
  const raw=await claudeText(resp);
  return JSON.parse(raw);
}

// ── Claude：解析修改指令 ──────────────────────────────────
async function parseModification(userText, project, apiKey) {
  const dm=buildDateMap();
  const dh=Object.entries(dm).map(e=>e[0]+'='+e[1]).join(', ');
  const today=new Date().toISOString().slice(0,10);
  // 整理現有記錄給 Claude 參考
  const todos=(project.todos||[]).filter(t=>!t.done).map((t,i)=>'[T'+i+'] '+t.text+(t.due?' 截止:'+t.due:'')).join('\n');
  const comms=(project.comms||[]).slice(-5).map((c,i)=>'[C'+i+'] '+c.who+':'+c.note+' ('+c.date+')').join('\n');
  const allTodos=(project.todos||[]).map((t,i)=>'[T'+i+'] '+(t.done?'✓':'')+t.text+(t.due?' '+t.due:'')).join('\n');

  const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,system:'你是室內設計助理，解析修改指令，只回覆 JSON。',messages:[{role:'user',content:'今天：'+today+'\n日期對照：'+dh+'\n\n案件：'+project.name+'\n\n現有待辦（未完成）：\n'+todos+'\n\n現有待辦（全部）：\n'+allTodos+'\n\n最近溝通記錄：\n'+comms+'\n\n修改指令：「'+userText+'」\n\n請分析要修改什麼，回覆 JSON：\n{"modifications":[\n  {\n    "recordType":"todo或comm",\n    "recordIndex":記錄的索引號(T0/C0等的數字),\n    "action":"done（標記完成）/edit（編輯）/delete（刪除）",\n    "originalText":"原始內容摘要",\n    "newText":"修改後內容（done/delete時與原本相同）",\n    "changes":{"text":"新文字","due":"新日期YYYY-MM-DD","note":"補充內容","done":true/false}\n  }\n]}'}]})});
  const raw=await claudeText(resp);
  return JSON.parse(raw);
}

// ── Claude：修改 pending 中的草稿 ────────────────────────
async function applyEdit(editText, currentActions, apiKey) {
  const dm=buildDateMap();
  const dh=Object.entries(dm).map(e=>e[0]+'='+e[1]).join(', ');
  const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,system:'你是室內設計助理，根據指示修改記錄，只回覆 JSON。',messages:[{role:'user',content:'當前記錄：\n'+JSON.stringify(currentActions,null,2)+'\n\n日期：'+dh+'\n\n修改指示：「'+editText+'」\n\nJSON：{"actions":[...]}'}]})});
  const raw=await claudeText(resp);
  return JSON.parse(raw).actions||currentActions;
}

// ── 處理訊息 ──────────────────────────────────────────────
async function handleMessage(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.message?.type !== 'text') return;
  const replyToken=event.replyToken, userId=event.source?.userId;
  const text=(event.message?.text||'').trim();
  if (ALLOWED_ID&&userId!==ALLOWED_ID) return;
  const store=makeStore();

  if (text==='說明'||text==='/help') { await replyMsg(replyToken,textMsg('🏠 YC Studio Bot\n\n📌 新增記錄：直接傳訊息\n✎ 修改草稿：確認卡按「✎ 修改」\n🔄 修改已有記錄：直接說「把石門湯旅的XXX改成...」\n✅ 標記完成：「石門湯旅的XXX完成了」\n\n⌨️ 指令：\n狀態 — 今日摘要\n案件 — 案件列表'),TOKEN); return;
  }
  if (text==='狀態') {
    const projects=await store.listProjects(); const today=new Date().toISOString().slice(0,10); let ov=0,td=0,tot=0;
    for(const p of projects.filter(x=>!x.archived))for(const t of(p.todos||[])){if(t.done)continue;tot++;if(t.due&&t.due<today)ov++;else if(t.due===today)td++;}
    await replyMsg(replyToken,textMsg('📊 今日狀態\n\n⚠️ 逾期：'+ov+' 件\n📌 今日截止：'+td+' 件\n📋 總待辦：'+tot+' 件'),TOKEN); return;
  }
  if (text==='案件') {
    const active=(await store.listProjects()).filter(p=>!p.archived);
    await replyMsg(replyToken,textMsg('📁 目前案件（'+active.length+' 件）\n\n'+active.map(p=>'• '+p.name+'（'+(p.todos||[]).filter(t=>!t.done).length+' 待辦）').join('\n')),TOKEN); return;
  }
  if (!API_KEY) { await replyMsg(replyToken,textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'),TOKEN); return; }

  try {
    const projects=await store.listProjects();
    if (!projects.length) throw new Error('無法連線到資料庫');

    // ── 修改模式（草稿編輯）──
    const editingRecord=await store.pendEditing(userId);
    if (editingRecord) {
      const updatedActions=await applyEdit(text,editingRecord.actions,API_KEY);
      await store.pendUpdate(editingRecord.id,{actions:updatedActions,editing:false,createdAt:new Date().toISOString()});
      const proj=projects.find(p=>p.id===editingRecord.projectId);
      await replyMsg(replyToken,previewFlex(editingRecord.id,proj?proj.name:'案件',updatedActions),TOKEN); return;
    }

    // ── 找案件 ──
    let project=null;
    const parsed=await parseMessage(text,projects,API_KEY);
    if(parsed.projectName) project=projects.find(p=>p.name===parsed.projectName)||findBestProject(parsed.projectName,projects);
    if(!project){const ms=extractMentions(text);for(const m of ms){project=findBestProject(m,projects);if(project)break;}}
    if(!project){const nt=normalize(text);project=projects.filter(p=>!p.archived).find(p=>{const np=normalize(p.name);for(let i=0;i<=np.length-4;i++){const c=np.slice(i,i+4);if(/[\u4e00-\u9fff]{4}/.test(c)&&nt.includes(c))return true;}return false;})||null;}

    if(!project) project=findByFragment(text,projects);

    // ── 修改已有記錄流程 ──
    if (project && isModificationIntent(text)) {
      const modResult=await parseModification(text,project,API_KEY);
      const mods=modResult.modifications||[];
      if (mods.length>0) {
        const pendingId=uid();
        await store.pendPut({id:pendingId,type:'modification',projectId:project.id,modifications:mods,userId,createdAt:new Date().toISOString()});
        await replyMsg(replyToken,modifyPreviewFlex(pendingId,project.name,mods),TOKEN); return;
      }
    }

    // ── 新增記錄流程 ──
    if (!project) {
      const names=projects.filter(p=>!p.archived).map(p=>'• '+p.name).join('\n');
      await replyMsg(replyToken,textMsg('❓ 找不到對應案件\n\n目前案件：\n'+names),TOKEN); return;
    }
    let actions=(parsed.actions||[]);
    if(actions.length===0) actions=[{type:'comm',who:'業主',note:text,ch:'Line',date:new Date().toISOString().slice(0,10)}];
    const pendingId=uid();
    await store.pendPut({id:pendingId,projectId:project.id,actions,userId,createdAt:new Date().toISOString(),editing:false});
    await replyMsg(replyToken,previewFlex(pendingId,project.name,actions),TOKEN);
  } catch(err) { console.error(err); await replyMsg(replyToken,textMsg('❌ 錯誤：'+err.message),TOKEN); }
}

// ── 處理 Postback ─────────────────────────────────────────
async function handlePostback(event, TOKEN, API_KEY) {
  const replyToken=event.replyToken;
  const params=new URLSearchParams(event.postback?.data||'');
  const action=params.get('action'), pendingId=params.get('id');
  const store=makeStore();
  const expired=()=>replyMsg(replyToken,textMsg('⚠️ 記錄已過期，請重新傳訊息。'),TOKEN);
  try {
    if(action==='cancel'){
      await store.pendClaim(pendingId); await replyMsg(replyToken,textMsg('✖️ 已取消。'),TOKEN); return;
    }
    if(action==='edit'){
      if(!await store.pendUpdate(pendingId,{editing:true})){await expired();return;}
      await replyMsg(replyToken,textMsg('✎ 請告訴我要修改什麼：\n\n例如：\n・時間改成下禮拜三\n・待辦改成抓規格書給業主\n・溝通內容加上：業主希望保留窗簾盒'),TOKEN); return;
    }
    if(action==='confirm'||action==='applymod'){
      const pending=await store.pendClaim(pendingId);   // 取走草稿；重複按只會成功一次
      if(!pending){await expired();return;}
      const today=new Date().toISOString().slice(0,10);
      const res=await store.mutateProject(pending.projectId,proj=>action==='confirm'
        ?applyConfirm(proj,pending,{fmtDate,today})
        :applyMods(proj,pending.modifications||[],{fmtDate}));
      if(!res){await replyMsg(replyToken,textMsg('❌ 找不到案件'),TOKEN);return;}
      if(action==='confirm') await replyMsg(replyToken,successFlex(res.project.name,res.out),TOKEN);
      else await replyMsg(replyToken,modifySuccessFlex(res.project.name,res.out.length>0?res.out:(pending.modifications||[])),TOKEN);
    }
  } catch(err) { console.error(err); await replyMsg(replyToken,textMsg('❌ 錯誤：'+err.message),TOKEN); }
}

// ── 主程式 ────────────────────────────────────────────────
export default async function handler(req, res) {
  if(req.method!=='POST') return res.status(405).end();
  const SECRET=process.env.LINE_CHANNEL_SECRET, TOKEN=process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const API_KEY=process.env.ANTHROPIC_API_KEY, ALLOWED_ID=process.env.ALLOWED_LINE_USER_ID;
  if(!SECRET||!TOKEN) return res.status(500).json({error:'Missing LINE env vars'});
  const rawBody=await getRawBody(req);
  if(!verifySignature(rawBody,req.headers['x-line-signature'],SECRET)) return res.status(401).json({error:'Invalid signature'});
  const body=JSON.parse(rawBody);
  await Promise.all((body.events||[]).map(e=>{
    if(e.type==='message') return handleMessage(e,TOKEN,API_KEY,ALLOWED_ID);
    if(e.type==='postback') return handlePostback(e,TOKEN,API_KEY);
    return Promise.resolve();
  }));
  return res.status(200).json({ok:true});
}
