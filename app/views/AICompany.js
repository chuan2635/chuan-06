/* ── AI Company View ─────────────────────────────────────────
   AI 公司：部門 / 員工 / 執行 / 日誌
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* ── Tool metadata for display ────────────────────────────── */
const TOOLS_META = {
  market_data:   { label: "市場數據",  icon: "📈" },
  news:          { label: "新聞",      icon: "📰" },
  institutional: { label: "三大法人",  icon: "🏦" },
  todos_write:   { label: "建立待辦",  icon: "✅" },
  notes_write:   { label: "建立筆記",  icon: "📝" },
  notes_read:    { label: "讀取筆記",  icon: "📖" },
  cards_read:    { label: "讀取卡片",  icon: "🗂" },
};

const DEFAULT_TOOLS = Object.keys(TOOLS_META);

/* ── Status badge ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    idle:    { bg:"rgba(77,122,90,.12)",  color:"var(--done)",  dot:"var(--done)",  label:"閒置" },
    running: { bg:"rgba(139,96,32,.15)",  color:"var(--amber)", dot:"var(--amber)", label:"執行中" },
    error:   { bg:"rgba(139,37,37,.12)",  color:"var(--red)",   dot:"var(--red)",   label:"錯誤" },
    offline: { bg:"var(--b1)",            color:"var(--t3)",    dot:"var(--t4)",    label:"離線" },
  }[status] || { bg:"var(--b1)", color:"var(--t3)", dot:"var(--t4)", label:status };
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:".18rem .5rem",borderRadius:20,background:cfg.bg,color:cfg.color,fontFamily:"'DM Mono',monospace",fontSize:".62rem"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:cfg.dot,display:"inline-block"}}/>
      {cfg.label}
    </span>
  );
}

/* ── Agent Card ───────────────────────────────────────────── */
function AgentCard({ agent, isActive, recentRun, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:isActive?"rgba(201,146,79,.06)":"var(--sf)",border:`1px solid ${isActive?"rgba(201,146,79,.3)":hover?"var(--b2)":"var(--b1)"}`,borderRadius:12,padding:"1.1rem 1.2rem",cursor:"pointer",transition:"all .15s",position:"relative"}}
    >
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:".6rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:".55rem"}}>
          <span style={{fontSize:"1.4rem",lineHeight:1}}>{agent.avatar||"🤖"}</span>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600,color:"var(--t1)",lineHeight:1.2}}>{agent.name}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginTop:.5}}>{agent.role}</div>
          </div>
        </div>
        <StatusBadge status={agent.status}/>
      </div>

      {/* Tools */}
      <div style={{display:"flex",flexWrap:"wrap",gap:".28rem",marginBottom:".55rem"}}>
        {(agent.tools_allowed||[]).slice(0,4).map(t=>(
          <span key={t} style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",padding:".15rem .42rem",borderRadius:4,background:"var(--b1)",color:"var(--t3)"}}>
            {TOOLS_META[t]?.icon} {TOOLS_META[t]?.label||t}
          </span>
        ))}
        {(agent.tools_allowed||[]).length>4&&(
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",padding:".15rem .42rem",borderRadius:4,background:"var(--b1)",color:"var(--t3)"}}>
            +{(agent.tools_allowed||[]).length-4}
          </span>
        )}
      </div>

      {/* Recent run */}
      {recentRun&&(
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:recentRun.status==="error"?"var(--red)":"var(--t3)",borderTop:"1px solid var(--b1)",paddingTop:".45rem",lineHeight:1.4}}>
          {recentRun.status==="done"
            ? (recentRun.output?.text||"").slice(0,80)+(recentRun.output?.text?.length>80?"…":"")
            : recentRun.status==="error"
            ? `⚠ ${(recentRun.output?.error||"").slice(0,60)}`
            : "上次執行中…"
          }
        </div>
      )}
    </div>
  );
}

/* ── Run Log Item ─────────────────────────────────────────── */
function RunLogItem({ run }) {
  const [open, setOpen] = useState(false);
  const ts = run.created_at ? new Date(run.created_at).toLocaleString("zh-TW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  return (
    <div style={{borderRadius:8,border:"1px solid var(--b1)",marginBottom:".5rem",overflow:"hidden"}}>
      <div onClick={()=>setOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:".6rem",padding:".6rem .85rem",cursor:"pointer",background:"var(--sf2)"}}>
        <StatusBadge status={run.status}/>
        <span style={{flex:1,fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {(run.input?.text||"").slice(0,50)}
        </span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)",flexShrink:0}}>{ts}</span>
        <span style={{color:"var(--t3)",fontSize:".7rem"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:".7rem .85rem",background:"var(--sf)",borderTop:"1px solid var(--b1)"}}>
          {run.tool_calls?.length>0&&(
            <div style={{marginBottom:".6rem"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".05em"}}>工具呼叫</div>
              {run.tool_calls.map((tc,i)=>(
                <div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t2)",padding:".25rem .5rem",background:"var(--b1)",borderRadius:5,marginBottom:".25rem"}}>
                  {TOOLS_META[Object.keys(TOOLS_META).find(k=>TOOLS_META[k]&&tc.tool?.includes(TOOLS_META[k].label.toLowerCase()))]?.icon||"⚙"} {tc.tool}
                </div>
              ))}
            </div>
          )}
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".68rem",color:"var(--t1)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
            {run.output?.text || run.output?.error || "(無輸出)"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Agent Detail Panel ───────────────────────────────────── */
function AgentDetailPanel({ agent, runs, runInput, setRunInput, onRun, running, onClose, onUpdate }) {
  const [editPrompt, setEditPrompt] = useState(agent.system_prompt||"");
  const [editTools,  setEditTools]  = useState(agent.tools_allowed||[]);
  const [editName,   setEditName]   = useState(agent.name);
  const [editRole,   setEditRole]   = useState(agent.role);
  const save = useRef(null);

  useEffect(()=>{
    setEditPrompt(agent.system_prompt||""); setEditTools(agent.tools_allowed||[]);
    setEditName(agent.name); setEditRole(agent.role);
  }, [agent.id]);

  const autosave = useCallback((changes) => {
    clearTimeout(save.current);
    save.current = setTimeout(() => onUpdate(changes), 1200);
  }, [onUpdate]);

  const toggleTool = (t) => {
    const next = editTools.includes(t) ? editTools.filter(x=>x!==t) : [...editTools,t];
    setEditTools(next); autosave({ tools_allowed: next });
  };

  return (
    <div style={{width:340,flexShrink:0,background:"var(--sf)",borderLeft:"1px solid var(--b1)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.1rem .75rem",borderBottom:"1px solid var(--b1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
          <span style={{fontSize:"1.2rem"}}>{agent.avatar||"🤖"}</span>
          <div>
            <div style={{fontSize:".88rem",fontWeight:600,color:"var(--t1)"}}>{agent.name}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)"}}>{agent.role}</div>
          </div>
        </div>
        <button onClick={onClose} style={{color:"var(--t3)",fontSize:".85rem",cursor:"pointer",background:"none",border:"none"}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        {/* Manual run */}
        <div style={{padding:".9rem 1.1rem",borderBottom:"1px solid var(--b1)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".4rem",letterSpacing:".05em",textTransform:"uppercase"}}>手動執行</div>
          <textarea value={runInput} onChange={e=>setRunInput(e.target.value)}
            placeholder={"告訴員工要做什麼…\n例如：「幫我分析今日台股走勢」"}
            style={{width:"100%",padding:".55rem .7rem",border:"1px solid var(--b2)",borderRadius:7,fontSize:".83rem",lineHeight:1.6,resize:"none",background:"var(--sf2)",color:"var(--t1)",outline:"none",fontFamily:"inherit",minHeight:72}}
            onFocus={e=>e.target.style.borderColor="var(--acc)"} onBlur={e=>e.target.style.borderColor="var(--b2)"}
          />
          <button onClick={onRun} disabled={running||!runInput.trim()}
            style={{marginTop:".5rem",width:"100%",padding:".5rem",borderRadius:7,border:"none",background:running||!runInput.trim()?"var(--b2)":"var(--acc)",color:running||!runInput.trim()?"var(--t3)":"#fff",fontSize:".84rem",fontWeight:500,cursor:running||!runInput.trim()?"not-allowed":"pointer",transition:"all .15s"}}
          >{running?"⏳ 執行中…":"▶ 執行"}</button>
        </div>

        {/* System prompt */}
        <div style={{padding:".9rem 1.1rem",borderBottom:"1px solid var(--b1)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".4rem",letterSpacing:".05em",textTransform:"uppercase"}}>角色設定 (System Prompt)</div>
          <textarea value={editPrompt}
            onChange={e=>{setEditPrompt(e.target.value);autosave({system_prompt:e.target.value});}}
            placeholder={"你是一位…\n你的任務是…\n回覆時請…"}
            style={{width:"100%",padding:".5rem .7rem",border:"1px solid var(--b2)",borderRadius:7,fontSize:".8rem",lineHeight:1.65,resize:"vertical",background:"var(--sf2)",color:"var(--t1)",outline:"none",fontFamily:"'DM Mono',monospace",minHeight:100}}
          />
        </div>

        {/* Tools */}
        <div style={{padding:".9rem 1.1rem",borderBottom:"1px solid var(--b1)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".5rem",letterSpacing:".05em",textTransform:"uppercase"}}>允許的工具</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
            {DEFAULT_TOOLS.map(t=>{
              const on = editTools.includes(t);
              const m  = TOOLS_META[t];
              return (
                <button key={t} onClick={()=>toggleTool(t)}
                  style={{padding:".28rem .6rem",borderRadius:6,border:`1px solid ${on?"var(--acc)":"var(--b2)"}`,background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",fontSize:".7rem",cursor:"pointer",transition:"all .12s"}}
                >{m?.icon} {m?.label||t}</button>
              );
            })}
          </div>
        </div>

        {/* Run history */}
        <div style={{padding:".9rem 1.1rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".5rem",letterSpacing:".05em",textTransform:"uppercase"}}>執行記錄</div>
          {runs.length===0 ? (
            <div style={{textAlign:"center",paddingTop:"1rem",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".72rem",opacity:.6}}>尚無執行記錄</div>
          ) : runs.slice(0,8).map(r=><RunLogItem key={r.id} run={r}/>)}
        </div>
      </div>
    </div>
  );
}

/* ── New Dept Modal ───────────────────────────────────────── */
function NewDeptModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏢");
  const ICONS = ["🏢","💼","📊","🔬","💡","🎯","⚙️","🚀","📱","🛠"];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"var(--sf)",borderRadius:12,padding:"1.6rem",width:340,boxShadow:"0 12px 48px rgba(0,0,0,.18)"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",color:"var(--t1)",marginBottom:"1.1rem"}}>新增部門</div>
        <div style={{marginBottom:".8rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t3)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".05em"}}>圖示</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
            {ICONS.map(ic=>(
              <button key={ic} onClick={()=>setIcon(ic)}
                style={{width:34,height:34,borderRadius:7,border:`1px solid ${icon===ic?"var(--acc)":"var(--b2)"}`,background:icon===ic?"rgba(201,146,79,.1)":"transparent",fontSize:"1.1rem",cursor:"pointer"}}
              >{ic}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t3)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".05em"}}>部門名稱</div>
          <input autoFocus value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&name.trim())onCreate({name,icon});}}
            placeholder="例如：投資研究部"
            style={{width:"100%",padding:".55rem .8rem",borderRadius:8,border:"1px solid var(--b2)",fontSize:".9rem",outline:"none",color:"var(--t1)",background:"var(--sf2)"}}
          />
        </div>
        <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:".45rem 1rem",borderRadius:7,border:"1px solid var(--b2)",background:"transparent",color:"var(--t2)",fontSize:".83rem",cursor:"pointer"}}>取消</button>
          <button onClick={()=>name.trim()&&onCreate({name,icon})} disabled={!name.trim()}
            style={{padding:".45rem 1.1rem",borderRadius:7,border:"none",background:name.trim()?"var(--acc)":"var(--b2)",color:name.trim()?"#fff":"var(--t3)",fontSize:".83rem",fontWeight:500,cursor:name.trim()?"pointer":"not-allowed"}}
          >建立</button>
        </div>
      </div>
    </div>
  );
}

/* ── New Agent Modal ──────────────────────────────────────── */
function NewAgentModal({ deptId, onClose, onCreate }) {
  const [name,   setName]   = useState("");
  const [role,   setRole]   = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [prompt, setPrompt] = useState("");
  const [tools,  setTools]  = useState(["market_data","news"]);
  const AVATARS = ["🤖","👨‍💼","👩‍💼","🕵️","📊","🔬","✍️","📡","⚙️","🎯"];

  const toggleTool = (t) => setTools(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"var(--sf)",borderRadius:12,padding:"1.5rem",width:440,maxHeight:"88vh",overflow:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.18)"}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.3rem",color:"var(--t1)",marginBottom:"1.1rem"}}>招募新員工</div>

        <div style={{marginBottom:".8rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".63rem",color:"var(--t3)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".05em"}}>頭像</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".3rem"}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)}
                style={{width:36,height:36,borderRadius:8,border:`1px solid ${avatar===a?"var(--acc)":"var(--b2)"}`,background:avatar===a?"rgba(201,146,79,.1)":"transparent",fontSize:"1.15rem",cursor:"pointer"}}
              >{a}</button>
            ))}
          </div>
        </div>

        {[["名稱",name,setName,"例如：消息監控員"],["職稱",role,setRole,"例如：負責監控每日重要新聞"]].map(([label,val,setter,ph])=>(
          <div key={label} style={{marginBottom:".8rem"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".63rem",color:"var(--t3)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div>
            <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
              style={{width:"100%",padding:".5rem .75rem",borderRadius:8,border:"1px solid var(--b2)",fontSize:".87rem",outline:"none",color:"var(--t1)",background:"var(--sf2)"}}
            />
          </div>
        ))}

        <div style={{marginBottom:".8rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".63rem",color:"var(--t3)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".05em"}}>角色設定</div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
            placeholder={"你是一位專業的…\n請用繁體中文回覆，格式清晰…"}
            style={{width:"100%",padding:".5rem .75rem",borderRadius:8,border:"1px solid var(--b2)",fontSize:".82rem",lineHeight:1.65,resize:"vertical",background:"var(--sf2)",color:"var(--t1)",outline:"none",fontFamily:"inherit",minHeight:80}}
          />
        </div>

        <div style={{marginBottom:"1.1rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".63rem",color:"var(--t3)",marginBottom:".5rem",textTransform:"uppercase",letterSpacing:".05em"}}>允許的工具</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".3rem"}}>
            {DEFAULT_TOOLS.map(t=>{
              const on=tools.includes(t); const m=TOOLS_META[t];
              return (
                <button key={t} onClick={()=>toggleTool(t)}
                  style={{padding:".26rem .58rem",borderRadius:6,border:`1px solid ${on?"var(--acc)":"var(--b2)"}`,background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",fontSize:".7rem",cursor:"pointer"}}
                >{m?.icon} {m?.label||t}</button>
              );
            })}
          </div>
        </div>

        <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:".45rem 1rem",borderRadius:7,border:"1px solid var(--b2)",background:"transparent",color:"var(--t2)",fontSize:".83rem",cursor:"pointer"}}>取消</button>
          <button onClick={()=>name.trim()&&onCreate({name,role,avatar,system_prompt:prompt,tools_allowed:tools,status:"idle"})} disabled={!name.trim()}
            style={{padding:".45rem 1.1rem",borderRadius:7,border:"none",background:name.trim()?"var(--acc)":"var(--b2)",color:name.trim()?"#fff":"var(--t3)",fontSize:".83rem",fontWeight:500,cursor:name.trim()?"pointer":"not-allowed"}}
          >招募</button>
        </div>
      </div>
    </div>
  );
}

/* ── AICompanyView ────────────────────────────────────────── */
function AICompanyView() {
  const [departments,   setDepartments]   = useState([]);
  const [agents,        setAgents]        = useState([]);
  const [runs,          setRuns]          = useState([]);
  const [activeDeptId,  setActiveDeptId]  = useState(null);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showNewDept,   setShowNewDept]   = useState(false);
  const [showNewAgent,  setShowNewAgent]  = useState(false);
  const [runInput,      setRunInput]      = useState("");
  const [running,       setRunning]       = useState(false);
  const [dbErr,         setDbErr]         = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [depts, agts, rs] = await Promise.all([
        wsDB.list("ai_departments", {}, { order: "sort_order.asc" }),
        wsDB.list("ai_agents",      {}, { order: "created_at.asc" }),
        wsDB.list("agent_runs",     {}, { order: "created_at.desc", limit: 60 }),
      ]);
      setDepartments(depts); setAgents(agts); setRuns(rs);
      if (depts.length>0 && !activeDeptId) setActiveDeptId(depts[0].id);
    } catch(e) {
      setDbErr("AI 公司資料表尚未建立，請先在 Supabase 執行 schema.sql");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeAgent = useMemo(() => agents.find(a=>a.id===activeAgentId), [agents, activeAgentId]);
  const deptAgents  = useMemo(() => agents.filter(a=>a.department_id===activeDeptId), [agents, activeDeptId]);
  const agentRuns   = useMemo(() => runs.filter(r=>r.agent_id===activeAgentId), [runs, activeAgentId]);

  /* Poll when running */
  useEffect(() => {
    if (!running) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const rs = await wsDB.list("agent_runs", {}, { order: "created_at.desc", limit: 60 });
        setRuns(rs);
        const agts = await wsDB.list("ai_agents", {}, { order: "created_at.asc" });
        setAgents(agts);
      } catch(e){}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [running]);

  const runAgent = useCallback(async () => {
    if (!activeAgent || !runInput.trim() || running) return;
    setRunning(true);
    try {
      const r = await fetch("/api/agent-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: activeAgentId, input: runInput.trim(), trigger_type: "manual" }),
      });
      const result = await r.json();
      if (result.ok) {
        setRunInput("");
        const [rs, agts] = await Promise.all([
          wsDB.list("agent_runs", {}, { order: "created_at.desc", limit: 60 }),
          wsDB.list("ai_agents",  {}, { order: "created_at.asc" }),
        ]);
        setRuns(rs); setAgents(agts);
      } else {
        console.error("Agent run failed:", result.error);
      }
    } catch(e) { console.error(e); }
    finally { setRunning(false); }
  }, [activeAgent, activeAgentId, runInput, running]);

  if (loading) return <div style={{padding:"3rem",textAlign:"center",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".8rem"}}>載入中…</div>;
  if (dbErr)   return <div style={{padding:"3rem",textAlign:"center",color:"var(--t2)",fontFamily:"'DM Mono',monospace",fontSize:".78rem",lineHeight:1.8}}><div style={{fontSize:"2rem",marginBottom:"1rem",opacity:.4}}>⚠</div><div>{dbErr}</div></div>;

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>

      {/* ── Dept sidebar ── */}
      <div style={{width:210,flexShrink:0,background:"var(--sf2)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",padding:".7rem .5rem",overflowY:"auto"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginBottom:".15rem"}}>AI 公司</div>

        {departments.map(dept=>{
          const on = activeDeptId===dept.id;
          return (
            <div key={dept.id} onClick={()=>{setActiveDeptId(dept.id);setActiveAgentId(null);}}
              style={{display:"flex",alignItems:"center",gap:".55rem",padding:".58rem .65rem",borderRadius:7,cursor:"pointer",background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",marginBottom:2,transition:"all .15s"}}
            >
              <span style={{fontSize:".88rem"}}>{dept.icon||"🏢"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:".85rem",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dept.name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)",marginTop:.5}}>
                  {agents.filter(a=>a.department_id===dept.id).length} 位員工
                </div>
              </div>
            </div>
          );
        })}

        <button onClick={()=>setShowNewDept(true)} style={{marginTop:"auto",width:"100%",padding:".5rem",borderRadius:7,border:"1.5px dashed var(--b2)",color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent"}}>
          + 新增部門
        </button>
      </div>

      {/* ── Agent grid ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"1.3rem 1.7rem .75rem",borderBottom:"1px solid var(--b1)",background:"var(--sf)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.55rem",color:"var(--t1)",marginBottom:".18rem"}}>
              {departments.find(d=>d.id===activeDeptId)?.name||"選擇部門"}
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t3)"}}>
              {deptAgents.length} 位員工
            </div>
          </div>
          {activeDeptId&&(
            <button onClick={()=>setShowNewAgent(true)}
              style={{padding:".45rem .95rem",borderRadius:8,border:"1px solid var(--acc)",color:"var(--acc)",background:"transparent",fontSize:".82rem",cursor:"pointer",fontWeight:500}}
            >+ 招募員工</button>
          )}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"1.1rem 1.4rem"}}>
          {!activeDeptId ? (
            <div style={{textAlign:"center",paddingTop:"4rem",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".78rem"}}>
              <div style={{fontSize:"2rem",marginBottom:".6rem",opacity:.3}}>🏢</div>
              先新增一個部門
            </div>
          ) : deptAgents.length===0 ? (
            <div style={{textAlign:"center",paddingTop:"3.5rem",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".76rem"}}>
              <div style={{fontSize:"1.8rem",marginBottom:".6rem",opacity:.35}}>🤖</div>
              <div>這個部門還沒有員工</div>
              <div style={{marginTop:".35rem",opacity:.7}}>點擊「招募員工」開始組建你的 AI 團隊</div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:"1rem"}}>
              {deptAgents.map(agent=>(
                <AgentCard key={agent.id} agent={agent}
                  isActive={activeAgentId===agent.id}
                  recentRun={runs.find(r=>r.agent_id===agent.id)}
                  onClick={()=>setActiveAgentId(agent.id)}
                />
              ))}
              <div onClick={()=>setShowNewAgent(true)}
                style={{border:"1.5px dashed var(--b2)",borderRadius:12,padding:"1.4rem",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:".4rem",color:"var(--t3)",fontSize:".8rem",minHeight:115,transition:"all .15s"}}
              >
                <span style={{fontSize:"1.4rem",opacity:.35}}>+</span>
                <span>招募員工</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Agent detail panel ── */}
      {activeAgent&&(
        <AgentDetailPanel
          agent={activeAgent} runs={agentRuns}
          runInput={runInput} setRunInput={setRunInput}
          onRun={runAgent} running={running}
          onClose={()=>setActiveAgentId(null)}
          onUpdate={async (changes) => {
            setAgents(prev=>prev.map(a=>a.id===activeAgentId?{...a,...changes}:a));
            try { await wsDB.update("ai_agents", activeAgentId, {...changes,updated_at:new Date().toISOString()}); } catch(e){console.error(e);}
          }}
        />
      )}

      {showNewDept&&<NewDeptModal onClose={()=>setShowNewDept(false)} onCreate={async(data)=>{
        try {
          const d = await wsDB.insert("ai_departments",{...data,sort_order:Date.now()});
          setDepartments(prev=>[...prev,d]); setActiveDeptId(d.id);
        } catch(e){console.error(e);}
        setShowNewDept(false);
      }}/>}
      {showNewAgent&&activeDeptId&&<NewAgentModal deptId={activeDeptId} onClose={()=>setShowNewAgent(false)} onCreate={async(data)=>{
        try {
          const a = await wsDB.insert("ai_agents",{...data,department_id:activeDeptId});
          setAgents(prev=>[...prev,a]);
        } catch(e){console.error(e);}
        setShowNewAgent(false);
      }}/>}
    </div>
  );
}

window.AICompanyView = AICompanyView;
})();
