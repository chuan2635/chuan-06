// YC Studio — LINE Bot v6（支援修改已確認記錄）
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

// ── Supabase ───────────────────────────────────────────────
async function fetchData() {
  const r = await fetch(SURL+'/rest/v1/studio_data?id=eq.main&select=data',{headers:{apikey:SKEY,Authorization:'Bearer '+SKEY}});
  return (await r.json())?.[0]?.data||null;
}
async function saveData(data) {
  await fetch(SURL+'/rest/v1/studio_data',{method:'POST',headers:{apikey:SKEY,Authorization:'Bearer '+SKEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:'main',data,updated_at:new Date().toISOString()})});
}

// ── Claude：解析新記錄 ────────────────────────────────────
async function parseMessage(userText, projects, apiKey) {
  const today=new Date().toISOString().slice(0,10);
  const dm=buildDateMap();
  const dh=Object.entries(dm).map(e=>e[0]+'='+e[1]).join(', ');
  const pl=projects.filter(p=>!p.archived).map(p=>'- "'+p.name+'"').join('\n');
  const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1200,system:'你是室內設計助理，從訊息提取結構化資料，只回覆 JSON。',messages:[{role:'user',content:'今天：'+today+'\n日期：'+dh+'\n\n案件：\n'+pl+'\n\n規則：\n1. 有溝通內容→comm\n2. 有要做的事/期限→todo\n3. 下禮拜X=下週X\n4. comm+todo都要\n\n訊息：「'+userText+'」\n\nJSON：{"projectName":"完整案件名或null","confidence":0到1,"actions":[{"type":"comm","who":"...","note":"...","date":"YYYY-MM-DD","ch":"..."},{"type":"todo","text":"...","due":"YYYY-MM-DD或空","prio":"high/mid/low"}]}'}]})});
  const d=await resp.json();
  const raw=(d.content?.[0]?.text||'{}').replace(/```json\n?|```/g,'').trim();
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
  const d=await resp.json();
  const raw=(d.content?.[0]?.text||'{}').replace(/```json\n?|```/g,'').trim();
  return JSON.parse(raw);
}

// ── Claude：修改 pending 中的草稿 ────────────────────────
async function applyEdit(editText, currentActions, apiKey) {
  const dm=buildDateMap();
  const dh=Object.entries(dm).map(e=>e[0]+'='+e[1]).join(', ');
  const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,system:'你是室內設計助理，根據指示修改記錄，只回覆 JSON。',messages:[{role:'user',content:'當前記錄：\n'+JSON.stringify(currentActions,null,2)+'\n\n日期：'+dh+'\n\n修改指示：「'+editText+'」\n\nJSON：{"actions":[...]}'}]})});
  const d=await resp.json();
  const raw=(d.content?.[0]?.text||'{}').replace(/```json\n?|```/g,'').trim();
  return JSON.parse(raw).actions||currentActions;
}

// ── 處理訊息 ──────────────────────────────────────────────
async function handleMessage(event, TOKEN, API_KEY, ALLOWED_ID) {
  if (event.message?.type !== 'text') return;
  const replyToken=event.replyToken, userId=event.source?.userId;
  const text=(event.message?.text||'').trim();
  if (ALLOWED_ID&&userId!==ALLOWED_ID) return;

  if (text==='說明'||text==='/help') { await replyMsg(replyToken,textMsg('🏠 YC Studio Bot\n\n📌 新增記錄：直接傳訊息\n✎ 修改草稿：確認卡按「✎ 修改」\n🔄 修改已有記錄：直接說「把石門湯旅的XXX改成...」\n✅ 標記完成：「石門湯旅的XXX完成了」\n\n⌨️ 指令：\n狀態 — 今日摘要\n案件 — 案件列表'),TOKEN); return;
  }
  if (text==='狀態') {
    const data=await fetchData(); const today=new Date().toISOString().slice(0,10); let ov=0,td=0,tot=0;
    for(const p of(data?.projects||[]).filter(x=>!x.archived))for(const t of(p.todos||[])){if(t.done)continue;tot++;if(t.due&&t.due<today)ov++;else if(t.due===today)td++;}
    await replyMsg(replyToken,textMsg('📊 今日狀態\n\n⚠️ 逾期：'+ov+' 件\n📌 今日截止：'+td+' 件\n📋 總待辦：'+tot+' 件'),TOKEN); return;
  }
  if (text==='案件') {
    const data=await fetchData(); const active=(data?.projects||[]).filter(p=>!p.archived);
    await replyMsg(replyToken,textMsg('📁 目前案件（'+active.length+' 件）\n\n'+active.map(p=>'• '+p.name+'（'+(p.todos||[]).filter(t=>!t.done).length+' 待辦）').join('\n')),TOKEN); return;
  }
  if (!API_KEY) { await replyMsg(replyToken,textMsg('⚠️ 未設定 ANTHROPIC_API_KEY'),TOKEN); return; }

  try {
    const data=await fetchData();
    if (!data) throw new Error('無法連線到資料庫');

    // ── 修改模式（草稿編輯）──
    const editingRecord=(data.pendingRecords||[]).find(r=>r.userId===userId&&r.editing);
    if (editingRecord) {
      const updatedActions=await applyEdit(text,editingRecord.actions,API_KEY);
      editingRecord.actions=updatedActions; editingRecord.editing=false; editingRecord.createdAt=new Date().toISOString();
      await saveData(data);
      const proj=data.projects.find(p=>p.id===editingRecord.projectId);
      await replyMsg(replyToken,previewFlex(editingRecord.id,proj?proj.name:'案件',updatedActions),TOKEN); return;
    }

    // ── 找案件 ──
    let project=null;
    const parsed=await parseMessage(text,data.projects,API_KEY);
    if(parsed.projectName) project=data.projects.find(p=>p.name===parsed.projectName)||findBestProject(parsed.projectName,data.projects);
    if(!project){const ms=extractMentions(text);for(const m of ms){project=findBestProject(m,data.projects);if(project)break;}}
    if(!project){const nt=normalize(text);project=data.projects.filter(p=>!p.archived).find(p=>{const np=normalize(p.name);for(let i=0;i<=np.length-4;i++){const c=np.slice(i,i+4);if(/[\u4e00-\u9fff]{4}/.test(c)&&nt.includes(c))return true;}return false;})||null;}

    // ── 修改已有記錄流程 ──
    if (project && isModificationIntent(text)) {
      const modResult=await parseModification(text,project,API_KEY);
      const mods=modResult.modifications||[];
      if (mods.length>0) {
        const pendingId=uid();
        data.pendingRecords=(data.pendingRecords||[]).filter(r=>new Date()-new Date(r.createdAt)<30*60*1000);
        data.pendingRecords.push({id:pendingId,type:'modification',projectId:project.id,modifications:mods,userId,createdAt:new Date().toISOString()});
        await saveData(data);
        await replyMsg(replyToken,modifyPreviewFlex(pendingId,project.name,mods),TOKEN); return;
      }
    }

    // ── 新增記錄流程 ──
    if (!project) {
      const names=data.projects.filter(p=>!p.archived).map(p=>'• '+p.name).join('\n');
      await replyMsg(replyToken,textMsg('❓ 找不到對應案件\n\n目前案件：\n'+names),TOKEN); return;
    }
    let actions=(parsed.actions||[]);
    if(actions.length===0) actions=[{type:'comm',who:'業主',note:text,ch:'Line',date:new Date().toISOString().slice(0,10)}];
    const pendingId=uid();
    data.pendingRecords=(data.pendingRecords||[]).filter(r=>new Date()-new Date(r.createdAt)<30*60*1000);
    data.pendingRecords.push({id:pendingId,projectId:project.id,actions,userId,createdAt:new Date().toISOString(),editing:false});
    await saveData(data);
    await replyMsg(replyToken,previewFlex(pendingId,project.name,actions),TOKEN);
  } catch(err) { console.error(err); await replyMsg(replyToken,textMsg('❌ 錯誤：'+err.message),TOKEN); }
}

// ── 處理 Postback ─────────────────────────────────────────
async function handlePostback(event, TOKEN, API_KEY) {
  const replyToken=event.replyToken;
  const params=new URLSearchParams(event.postback?.data||'');
  const action=params.get('action'), pendingId=params.get('id');
  const data=await fetchData();
  if(!data){await replyMsg(replyToken,textMsg('❌ 無法連線'),TOKEN);return;}
  const pending=(data.pendingRecords||[]).find(r=>r.id===pendingId);

  if(action==='cancel'){
    data.pendingRecords=(data.pendingRecords||[]).filter(r=>r.id!==pendingId);
    await saveData(data); await replyMsg(replyToken,textMsg('✖️ 已取消。'),TOKEN); return;
  }
  if(action==='edit'){
    if(!pending){await replyMsg(replyToken,textMsg('⚠️ 記錄已過期，請重新傳訊息。'),TOKEN);return;}
    pending.editing=true; await saveData(data);
    await replyMsg(replyToken,textMsg('✎ 請告訴我要修改什麼：\n\n例如：\n・時間改成下禮拜三\n・待辦改成抓規格書給業主\n・溝通內容加上：業主希望保留窗簾盒'),TOKEN); return;
  }
  if(action==='confirm'){
    if(!pending){await replyMsg(replyToken,textMsg('⚠️ 記錄已過期，請重新傳訊息。'),TOKEN);return;}
    const proj=data.projects.find(p=>p.id===pending.projectId);
    if(!proj){await replyMsg(replyToken,textMsg('❌ 找不到案件'),TOKEN);return;}
    const today=new Date().toISOString().slice(0,10); const fi=[];
    for(const a of pending.actions){
      if(a.type==='comm'&&a.note){proj.comms=proj.comms||[];proj.comms.push({id:uid(),who:a.who||'業主',note:a.note,ch:a.ch||'Line',date:a.date||today});fi.push({icon:'📝',text:(a.who||'業主')+'：'+a.note});}
      if(a.type==='todo'&&a.text){proj.todos=proj.todos||[];proj.todos.push({id:uid(),text:a.text,done:false,due:a.due||'',prio:a.prio||'mid',note:''});const pi=a.prio==='high'?'🔴':a.prio==='mid'?'🟡':'⚪';fi.push({icon:pi,text:a.text+(a.due?'（'+fmtDate(a.due)+'）':'')});}
    }
    data.pendingRecords=(data.pendingRecords||[]).filter(r=>r.id!==pendingId);
    await saveData(data); await replyMsg(replyToken,successFlex(proj.name,fi),TOKEN); return;
  }

  // ── 套用已有記錄修改 ──
  if(action==='applymod'){
    if(!pending){await replyMsg(replyToken,textMsg('⚠️ 記錄已過期，請重新傳訊息。'),TOKEN);return;}
    const proj=data.projects.find(p=>p.id===pending.projectId);
    if(!proj){await replyMsg(replyToken,textMsg('❌ 找不到案件'),TOKEN);return;}
    const mods=pending.modifications||[]; const appliedMods=[];
    for(const m of mods){
      if(m.recordType==='todo'){
        const idx=m.recordIndex;
        const todos=proj.todos||[];
        if(m.action==='done'&&todos[idx]){todos[idx].done=true;appliedMods.push({...m,newText:todos[idx].text+' ✅'});}
        else if(m.action==='delete'&&todos[idx]){appliedMods.push({...m,newText:'已刪除：'+todos[idx].text});todos.splice(idx,1);}
        else if(m.action==='edit'&&todos[idx]){
          if(m.changes?.text)todos[idx].text=m.changes.text;
          if(m.changes?.due)todos[idx].due=m.changes.due;
          if(m.changes?.done!==undefined)todos[idx].done=m.changes.done;
          appliedMods.push({...m,newText:todos[idx].text+(todos[idx].due?'（截止 '+fmtDate(todos[idx].due)+'）':'')});
        }
      }
      if(m.recordType==='comm'){
        const idx=m.recordIndex; const comms=proj.comms||[];
        if(m.action==='delete'&&comms[idx]){appliedMods.push({...m,newText:'已刪除：'+comms[idx].note});comms.splice(idx,1);}
        else if(m.action==='edit'&&comms[idx]){
          if(m.changes?.note)comms[idx].note=m.changes.note;
          if(m.changes?.who)comms[idx].who=m.changes.who;
          appliedMods.push({...m,newText:comms[idx].note});
        }
      }
    }
    data.pendingRecords=(data.pendingRecords||[]).filter(r=>r.id!==pendingId);
    await saveData(data); await replyMsg(replyToken,modifySuccessFlex(proj.name,appliedMods.length>0?appliedMods:mods),TOKEN); return;
  }
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
