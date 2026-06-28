/* ── AI Company View ─────────────────────────────────────────
   AI 公司：部門 / 員工 / 執行 / 日誌
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

const TOOLS_META = {
  market_data:   { label: "市場數據",  icon: "∿" },
  news:          { label: "新聞",      icon: "≡" },
  institutional: { label: "三大法人",  icon: "◈" },
  todos_write:   { label: "建立待辦",  icon: "◻" },
  notes_write:   { label: "建立筆記",  icon: "≡" },
  notes_read:    { label: "讀取筆記",  icon: "⊙" },
  cards_read:    { label: "讀取卡片",  icon: "⊞" },
};

const DEFAULT_TOOLS = Object.keys(TOOLS_META);

/* ── Status indicator ─────────────────────────────────────── */
function StatusDot({ status, size = 7 }) {
  const cfg = {
    idle:    { color:"var(--done)",   glow:"rgba(61,112,80,.4)",   pulse:false },
    running: { color:"var(--amber)",  glow:"rgba(135,96,32,.5)",   pulse:true  },
    error:   { color:"var(--red)",    glow:"rgba(135,32,32,.4)",   pulse:false },
    offline: { color:"var(--t4)",     glow:"transparent",          pulse:false },
  }[status] || { color:"var(--t4)", glow:"transparent", pulse:false };

  return (
    <span style={{
      display:"inline-block", width:size, height:size, borderRadius:"50%",
      background:cfg.color,
      boxShadow:cfg.pulse ? `0 0 0 2px ${cfg.glow}` : "none",
      animation:cfg.pulse ? "pulse-ring 1.4s ease-in-out infinite" : "none",
      flexShrink:0,
    }}/>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    idle:    { bg:"rgba(61,112,80,.08)",   color:"var(--done)",  label:"閒置" },
    running: { bg:"rgba(135,96,32,.1)",    color:"var(--amber)", label:"執行中" },
    error:   { bg:"rgba(135,32,32,.08)",   color:"var(--red)",   label:"錯誤" },
    offline: { bg:"var(--b1)",             color:"var(--t3)",    label:"離線" },
  }[status] || { bg:"var(--b1)", color:"var(--t3)", label:status };
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:20,background:cfg.bg,color:cfg.color,fontFamily:"var(--font-mono)",fontSize:".6rem",letterSpacing:".03em"}}>
      <StatusDot status={status} size={5}/>
      {cfg.label}
    </span>
  );
}

/* ── Agent Card ───────────────────────────────────────────── */
function AgentCard({ agent, isActive, recentRun, onClick }) {
  const [hover, setHover] = useState(false);
  const preview = recentRun?.output?.text || recentRun?.output?.error || "";

  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background:"var(--sf)", border:`1px solid ${isActive?"rgba(184,128,74,.35)":"var(--b1)"}`,
        borderRadius:12, padding:"16px 18px", cursor:"pointer",
        transition:"border-color .15s, box-shadow .15s",
        boxShadow:isActive?"0 0 0 3px rgba(184,128,74,.1)":(hover?"var(--shm)":"var(--sh)"),
      }}
    >
      {/* Top row */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:36, height:36, borderRadius:9, background:"var(--sf2)",
            border:"1px solid var(--b1)", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:"1.2rem", flexShrink:0,
          }}>{agent.avatar||"◈"}</div>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600,color:"var(--t1)",letterSpacing:"-.01em",lineHeight:1.2}}>{agent.name}</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)",marginTop:2}}>{agent.role}</div>
          </div>
        </div>
        <StatusBadge status={agent.status}/>
      </div>

      {/* Tool chips */}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
        {(agent.tools_allowed||[]).slice(0,4).map(t=>(
          <span key={t} style={{
            fontFamily:"var(--font-mono)", fontSize:".58rem",
            padding:"2px 7px", borderRadius:4,
            background:"var(--b1)", color:"var(--t3)",
          }}>
            {TOOLS_META[t]?.icon} {TOOLS_META[t]?.label||t}
          </span>
        ))}
        {(agent.tools_allowed||[]).length>4&&(
          <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",padding:"2px 7px",borderRadius:4,background:"var(--b1)",color:"var(--t3)"}}>
            +{(agent.tools_allowed||[]).length-4}
          </span>
        )}
      </div>

      {/* Last run preview */}
      {preview&&(
        <div style={{
          fontFamily:"var(--font-mono)", fontSize:".62rem",
          color:recentRun.status==="error"?"var(--red)":"var(--t3)",
          borderTop:"1px solid var(--b1)", paddingTop:8, lineHeight:1.5,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {recentRun.status==="error" ? `⚠ ${preview.slice(0,80)}` : preview.slice(0,100)}
        </div>
      )}
    </div>
  );
}

/* ── Run Log Item ─────────────────────────────────────────── */
function RunLogItem({ run }) {
  const [open, setOpen] = useState(false);
  const ts = run.created_at ? new Date(run.created_at).toLocaleString("zh-TW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  const inputPreview = (run.input?.text||"").slice(0,55);

  return (
    <div style={{borderRadius:8,border:"1px solid var(--b1)",marginBottom:6,overflow:"hidden"}}>
      <div onClick={()=>setOpen(v=>!v)} style={{
        display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
        cursor:"pointer", background:"var(--sf2)",
        transition:"background .1s",
      }}>
        <StatusDot status={run.status} size={6}/>
        <span style={{flex:1,fontFamily:"var(--font-mono)",fontSize:".65rem",color:"var(--t2)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {inputPreview}
        </span>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t3)",flexShrink:0}}>{ts}</span>
        <span style={{color:"var(--t4)",fontSize:".58rem"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"10px 14px",background:"var(--sf)",borderTop:"1px solid var(--b1)"}}>
          {run.tool_calls?.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:".57rem",color:"var(--t3)",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>工具呼叫</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {run.tool_calls.map((tc,i)=>(
                  <span key={i} style={{fontFamily:"var(--font-mono)",fontSize:".62rem",color:"var(--acc)",padding:"2px 8px",background:"var(--acc-bg)",borderRadius:4,border:"1px solid rgba(184,128,74,.2)"}}>
                    {tc.tool}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{
            fontFamily:"var(--font-mono)", fontSize:".72rem", color:"var(--t1)",
            lineHeight:1.75, whiteSpace:"pre-wrap", background:"var(--sf2)",
            borderRadius:6, padding:"10px 12px",
            maxHeight:180, overflowY:"auto",
          }}>
            {run.output?.text || run.output?.error || "(無輸出)"}
          </div>
          {run.tokens_used&&(
            <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t4)",marginTop:6}}>
              {run.tokens_used} tokens
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Agent Detail Panel ───────────────────────────────────── */
function AgentDetailPanel({ agent, runs, runInput, setRunInput, onRun, running, onClose, onUpdate }) {
  const [editPrompt, setEditPrompt] = useState(agent.system_prompt||"");
  const [editTools,  setEditTools]  = useState(agent.tools_allowed||[]);
  const save = useRef(null);

  useEffect(()=>{
    setEditPrompt(agent.system_prompt||""); setEditTools(agent.tools_allowed||[]);
  }, [agent.id]);

  const autosave = useCallback((changes) => {
    clearTimeout(save.current);
    save.current = setTimeout(() => onUpdate(changes), 1200);
  }, [onUpdate]);

  const toggleTool = (t) => {
    const next = editTools.includes(t) ? editTools.filter(x=>x!==t) : [...editTools,t];
    setEditTools(next); autosave({ tools_allowed: next });
  };

  const SECTION = {fontFamily:"var(--font-mono)",fontSize:".57rem",color:"var(--t3)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8};

  return (
    <div style={{
      width:340, flexShrink:0, background:"var(--sf)",
      borderLeft:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 12px", borderBottom:"1px solid var(--b1)", background:"var(--sf2)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:32, height:32, borderRadius:8, background:"var(--sf3)",
            border:"1px solid var(--b1)", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:"1.1rem", flexShrink:0,
          }}>{agent.avatar||"◈"}</div>
          <div>
            <div style={{fontSize:".9rem",fontWeight:600,color:"var(--t1)",letterSpacing:"-.01em"}}>{agent.name}</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)"}}>{agent.role}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center",
          borderRadius:5, border:"1px solid var(--b2)", color:"var(--t3)", fontSize:".72rem",
          cursor:"pointer", background:"transparent",
        }}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        {/* Run input */}
        <div style={{padding:"16px 18px",borderBottom:"1px solid var(--b1)"}}>
          <div style={SECTION}>手動執行</div>
          <textarea value={runInput} onChange={e=>setRunInput(e.target.value)}
            placeholder={"告訴員工要做什麼…\n例：幫我分析今日台股走勢"}
            style={{
              width:"100%", padding:"10px 12px", border:"1px solid var(--b2)", borderRadius:7,
              fontSize:".83rem", lineHeight:1.6, resize:"none", background:"var(--sf2)",
              color:"var(--t1)", outline:"none", fontFamily:"var(--font-ui)", minHeight:76,
              transition:"border-color .15s",
            }}
            onFocus={e=>e.target.style.borderColor="var(--acc)"}
            onBlur={e=>e.target.style.borderColor="var(--b2)"}
          />
          <button onClick={onRun} disabled={running||!runInput.trim()}
            style={{
              marginTop:8, width:"100%", padding:"9px", borderRadius:7, border:"none",
              background:running||!runInput.trim()?"var(--b2)":"var(--acc)",
              color:running||!runInput.trim()?"var(--t3)":"#fff",
              fontSize:".84rem", fontWeight:600, cursor:running||!runInput.trim()?"not-allowed":"pointer",
              transition:"all .15s", letterSpacing:"-.01em", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}
          >
            {running ? (<><span style={{fontFamily:"var(--font-mono)",fontSize:".7rem"}}>●</span> 執行中…</>) : "▶ 執行"}
          </button>
        </div>

        {/* System prompt */}
        <div style={{padding:"16px 18px",borderBottom:"1px solid var(--b1)"}}>
          <div style={SECTION}>角色設定</div>
          <textarea value={editPrompt}
            onChange={e=>{setEditPrompt(e.target.value);autosave({system_prompt:e.target.value});}}
            placeholder={"你是一位…\n你的任務是…\n請用繁體中文回覆…"}
            style={{
              width:"100%", padding:"10px 12px", border:"1px solid var(--b2)", borderRadius:7,
              fontSize:".78rem", lineHeight:1.65, resize:"vertical",
              background:"var(--sf2)", color:"var(--t1)", outline:"none",
              fontFamily:"var(--font-mono)", minHeight:90,
            }}
          />
        </div>

        {/* Tools */}
        <div style={{padding:"16px 18px",borderBottom:"1px solid var(--b1)"}}>
          <div style={SECTION}>允許工具</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {DEFAULT_TOOLS.map(t=>{
              const on = editTools.includes(t);
              const m  = TOOLS_META[t];
              return (
                <button key={t} onClick={()=>toggleTool(t)} style={{
                  padding:"4px 9px", borderRadius:5,
                  border:`1px solid ${on?"var(--acc)":"var(--b2)"}`,
                  background:on?"var(--acc-bg)":"transparent",
                  color:on?"var(--acc)":"var(--t3)",
                  fontSize:".68rem", cursor:"pointer", transition:"all .12s",
                  fontFamily:"var(--font-mono)",
                }}>
                  {m?.icon} {m?.label||t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Run history */}
        <div style={{padding:"16px 18px"}}>
          <div style={SECTION}>執行記錄</div>
          {runs.length===0 ? (
            <div style={{textAlign:"center",paddingTop:16,color:"var(--t4)",fontFamily:"var(--font-mono)",fontSize:".7rem"}}>尚無執行記錄</div>
          ) : runs.slice(0,8).map(r=><RunLogItem key={r.id} run={r}/>)}
        </div>
      </div>
    </div>
  );
}

/* ── Modals ───────────────────────────────────────────────── */
function BaseModal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div style={{background:"var(--sf)",borderRadius:14,padding:"24px 28px",width:400,maxHeight:"90vh",overflow:"auto",boxShadow:"0 16px 56px rgba(0,0,0,.2)",border:"1px solid var(--b1)"}}>
        <div style={{fontFamily:"var(--font-serif)",fontSize:"1.3rem",color:"var(--t1)",marginBottom:20,letterSpacing:"-.01em"}}>{title}</div>
        {children}
      </div>
    </div>
  );
}

const FIELD_LABEL = {fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em",display:"block"};
const FIELD_INPUT = {width:"100%",padding:"9px 12px",borderRadius:7,border:"1px solid var(--b2)",fontSize:".88rem",outline:"none",color:"var(--t1)",background:"var(--sf2)",marginBottom:14};

function NewDeptModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const ICONS = ["◈","⊹","◎","⊞","∿","≡","◻","⊟","⬡","⊙"];
  const [icon, setIcon] = useState("◈");
  return (
    <BaseModal title="新增部門" onClose={onClose}>
      <div style={{marginBottom:14}}>
        <span style={FIELD_LABEL}>圖示</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {ICONS.map(ic=>(
            <button key={ic} onClick={()=>setIcon(ic)} style={{
              width:34, height:34, borderRadius:7,
              border:`1px solid ${icon===ic?"var(--acc)":"var(--b2)"}`,
              background:icon===ic?"var(--acc-bg)":"transparent",
              fontSize:"1rem", cursor:"pointer", fontFamily:"var(--font-mono)",
              color:icon===ic?"var(--acc)":"var(--t2)",
            }}>{ic}</button>
          ))}
        </div>
      </div>
      <span style={FIELD_LABEL}>部門名稱</span>
      <input autoFocus value={name} onChange={e=>setName(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&name.trim())onCreate({name,icon});}}
        placeholder="例如：投資研究部" style={FIELD_INPUT}
      />
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
        <button onClick={onClose} style={{padding:"8px 16px",borderRadius:7,border:"1px solid var(--b2)",background:"transparent",color:"var(--t2)",fontSize:".83rem",cursor:"pointer"}}>取消</button>
        <button onClick={()=>name.trim()&&onCreate({name,icon})} disabled={!name.trim()}
          style={{padding:"8px 18px",borderRadius:7,border:"none",background:name.trim()?"var(--acc)":"var(--b2)",color:name.trim()?"#fff":"var(--t3)",fontSize:".83rem",fontWeight:600,cursor:name.trim()?"pointer":"not-allowed"}}
        >建立</button>
      </div>
    </BaseModal>
  );
}

function NewAgentModal({ onClose, onCreate }) {
  const [name,   setName]   = useState("");
  const [role,   setRole]   = useState("");
  const [avatar, setAvatar] = useState("◈");
  const [prompt, setPrompt] = useState("");
  const [tools,  setTools]  = useState(["market_data","news"]);
  const AVATARS = ["◈","⊹","⬡","◎","∿","≡","⊞","⊟","⊙","◻"];
  const toggleTool = (t) => setTools(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]);

  return (
    <BaseModal title="招募新員工" onClose={onClose}>
      <div style={{marginBottom:14}}>
        <span style={FIELD_LABEL}>識別圖示</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {AVATARS.map(a=>(
            <button key={a} onClick={()=>setAvatar(a)} style={{
              width:34, height:34, borderRadius:7,
              border:`1px solid ${avatar===a?"var(--acc)":"var(--b2)"}`,
              background:avatar===a?"var(--acc-bg)":"transparent",
              fontSize:"1rem", cursor:"pointer", fontFamily:"var(--font-mono)",
              color:avatar===a?"var(--acc)":"var(--t2)",
            }}>{a}</button>
          ))}
        </div>
      </div>
      <span style={FIELD_LABEL}>名稱</span>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="例：消息監控員" style={FIELD_INPUT}/>
      <span style={FIELD_LABEL}>職稱</span>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="例：負責監控每日重要新聞" style={FIELD_INPUT}/>
      <span style={FIELD_LABEL}>角色設定 (System Prompt)</span>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
        placeholder={"你是一位專業的…\n請用繁體中文回覆，格式清晰…"}
        style={{...FIELD_INPUT,minHeight:80,resize:"vertical",lineHeight:1.6,fontFamily:"var(--font-mono)",fontSize:".8rem"}}
      />
      <span style={FIELD_LABEL}>允許工具</span>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
        {DEFAULT_TOOLS.map(t=>{
          const on=tools.includes(t); const m=TOOLS_META[t];
          return (
            <button key={t} onClick={()=>toggleTool(t)} style={{
              padding:"4px 9px", borderRadius:5, fontFamily:"var(--font-mono)",
              border:`1px solid ${on?"var(--acc)":"var(--b2)"}`,
              background:on?"var(--acc-bg)":"transparent",
              color:on?"var(--acc)":"var(--t3)", fontSize:".68rem", cursor:"pointer",
            }}>{m?.icon} {m?.label||t}</button>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"8px 16px",borderRadius:7,border:"1px solid var(--b2)",background:"transparent",color:"var(--t2)",fontSize:".83rem",cursor:"pointer"}}>取消</button>
        <button onClick={()=>name.trim()&&onCreate({name,role,avatar,system_prompt:prompt,tools_allowed:tools,status:"idle"})} disabled={!name.trim()}
          style={{padding:"8px 18px",borderRadius:7,border:"none",background:name.trim()?"var(--acc)":"var(--b2)",color:name.trim()?"#fff":"var(--t3)",fontSize:".83rem",fontWeight:600,cursor:name.trim()?"pointer":"not-allowed"}}
        >招募</button>
      </div>
    </BaseModal>
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeAgent = useMemo(() => agents.find(a=>a.id===activeAgentId), [agents, activeAgentId]);
  const deptAgents  = useMemo(() => agents.filter(a=>a.department_id===activeDeptId), [agents, activeDeptId]);
  const agentRuns   = useMemo(() => runs.filter(r=>r.agent_id===activeAgentId), [runs, activeAgentId]);

  useEffect(() => {
    if (!running) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const [rs, agts] = await Promise.all([
          wsDB.list("agent_runs", {}, { order: "created_at.desc", limit: 60 }),
          wsDB.list("ai_agents",  {}, { order: "created_at.asc" }),
        ]);
        setRuns(rs); setAgents(agts);
      } catch(e){}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [running]);

  const runAgent = useCallback(async () => {
    if (!activeAgent || !runInput.trim() || running) return;
    setRunning(true);
    try {
      const r = await fetch("/api/agent-run", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({agent_id:activeAgentId,input:runInput.trim(),trigger_type:"manual"}),
      });
      const result = await r.json();
      if (result.ok) {
        setRunInput("");
        const [rs, agts] = await Promise.all([
          wsDB.list("agent_runs", {}, { order: "created_at.desc", limit: 60 }),
          wsDB.list("ai_agents",  {}, { order: "created_at.asc" }),
        ]);
        setRuns(rs); setAgents(agts);
      }
    } catch(e) { console.error(e); }
    finally { setRunning(false); }
  }, [activeAgent, activeAgentId, runInput, running]);

  const SB_SEC = {fontFamily:"var(--font-mono)",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",color:"var(--t3)",padding:"16px 14px 6px"};

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".78rem"}}>載入中…</div>
  );
  if (dbErr) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",flexDirection:"column",gap:12,color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".75rem",textAlign:"center",padding:"2rem"}}>
      <span style={{fontSize:"1.5rem",opacity:.3}}>⚠</span>{dbErr}
    </div>
  );

  return (
    <div style={{display:"flex",height:"calc(100vh - var(--hh))",overflow:"hidden"}}>

      {/* ── Dept sidebar ── */}
      <div style={{
        width:208, flexShrink:0, background:"var(--sf)",
        borderRight:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflowY:"auto",
      }}>
        <div style={SB_SEC}>部門</div>
        <div style={{padding:"0 8px"}}>
          {departments.map(dept=>{
            const on = activeDeptId===dept.id;
            return (
              <div key={dept.id} onClick={()=>{setActiveDeptId(dept.id);setActiveAgentId(null);}} style={{
                display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                borderRadius:7, cursor:"pointer", marginBottom:1, transition:"all .12s",
                background:on?"rgba(184,128,74,.1)":"transparent",
                borderLeft:on?"2px solid var(--acc)":"2px solid transparent",
                paddingLeft:on?"10px":"12px",
              }}>
                <span style={{fontFamily:"var(--font-mono)",fontSize:".82rem",color:on?"var(--acc)":"var(--t3)",flexShrink:0}}>{dept.icon||"◈"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:".86rem",fontWeight:500,color:on?"var(--acc)":"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:"-.01em"}}>{dept.name}</div>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t4)",marginTop:1}}>
                    {agents.filter(a=>a.department_id===dept.id).length} 人
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:"auto",padding:"12px 10px"}}>
          <button onClick={()=>setShowNewDept(true)} style={{
            width:"100%", padding:"9px", borderRadius:7, border:"1.5px dashed var(--b2)",
            color:"var(--t3)", fontSize:".78rem", cursor:"pointer", background:"transparent",
            letterSpacing:"-.01em", transition:"border-color .15s,color .15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
          >+ 新增部門</button>
        </div>
      </div>

      {/* ── Agent grid ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)"}}>
        <div style={{
          padding:"18px 24px 14px", borderBottom:"1px solid var(--b1)",
          background:"var(--sf)", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <div style={{fontFamily:"var(--font-serif)",fontSize:"1.6rem",color:"var(--t1)",marginBottom:2,letterSpacing:"-.01em"}}>
              {departments.find(d=>d.id===activeDeptId)?.name||"選擇部門"}
            </div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:".62rem",color:"var(--t3)"}}>
              {deptAgents.length} 位員工
            </div>
          </div>
          {activeDeptId&&(
            <button onClick={()=>setShowNewAgent(true)} style={{
              padding:"8px 18px", borderRadius:8, border:"1px solid var(--acc)",
              color:"var(--acc)", background:"transparent", fontSize:".82rem",
              cursor:"pointer", fontWeight:500, transition:"all .15s", letterSpacing:"-.01em",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--acc-bg)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
            >+ 招募員工</button>
          )}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {!activeDeptId ? (
            <div style={{textAlign:"center",paddingTop:"5rem",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".78rem"}}>
              <div style={{fontSize:"2rem",marginBottom:8,opacity:.25}}>◈</div>
              先新增一個部門
            </div>
          ) : deptAgents.length===0 ? (
            <div style={{textAlign:"center",paddingTop:"5rem",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".76rem"}}>
              <div style={{fontSize:"1.6rem",marginBottom:8,opacity:.25}}>⊹</div>
              <div>這個部門還沒有員工</div>
              <div style={{marginTop:4,opacity:.6}}>點擊「招募員工」組建你的 AI 團隊</div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
              {deptAgents.map(agent=>(
                <AgentCard key={agent.id} agent={agent}
                  isActive={activeAgentId===agent.id}
                  recentRun={runs.find(r=>r.agent_id===agent.id)}
                  onClick={()=>setActiveAgentId(agent.id)}
                />
              ))}
              <div onClick={()=>setShowNewAgent(true)} style={{
                border:"1.5px dashed var(--b2)", borderRadius:12, padding:"24px",
                cursor:"pointer", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:6,
                color:"var(--t3)", fontSize:".8rem", minHeight:120,
                transition:"all .15s", fontFamily:"var(--font-mono)",
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
              >
                <span style={{fontSize:"1.4rem",opacity:.5,fontFamily:"var(--font-mono)"}}>+</span>
                <span>招募員工</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {activeAgent&&(
        <AgentDetailPanel
          agent={activeAgent} runs={agentRuns}
          runInput={runInput} setRunInput={setRunInput}
          onRun={runAgent} running={running}
          onClose={()=>setActiveAgentId(null)}
          onUpdate={async(changes)=>{
            setAgents(prev=>prev.map(a=>a.id===activeAgentId?{...a,...changes}:a));
            try { await wsDB.update("ai_agents",activeAgentId,{...changes,updated_at:new Date().toISOString()}); } catch(e){console.error(e);}
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
      {showNewAgent&&activeDeptId&&<NewAgentModal onClose={()=>setShowNewAgent(false)} onCreate={async(data)=>{
        try {
          const a = await wsDB.insert("ai_agents",{...data,department_id:activeDeptId});
          setAgents(prev=>[...prev,a]);
        } catch(e){console.error(e);}
        setShowNewAgent(false);
      }}/>}

      <style>{`
        @keyframes pulse-ring {
          0%,100%{box-shadow:0 0 0 0 rgba(135,96,32,.6);}
          50%{box-shadow:0 0 0 4px rgba(135,96,32,0);}
        }
      `}</style>
    </div>
  );
}

window.AICompanyView = AICompanyView;
})();
