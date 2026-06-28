/* ── Todos View ──────────────────────────────────────────────
   待辦清單：收件匣 / 今天 / 自訂清單 / 子任務
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

const PRI_CFG = {
  urgent: { label:"緊急", color:"#C0392B", bg:"rgba(192,57,43,.08)", border:"rgba(192,57,43,.25)" },
  high:   { label:"高",   color:"#B07A3E", bg:"rgba(176,122,62,.08)", border:"rgba(176,122,62,.25)" },
  mid:    { label:"中",   color:"var(--t4)", bg:"transparent",         border:"var(--b2)" },
  low:    { label:"低",   color:"var(--t4)", bg:"transparent",         border:"var(--b2)" },
};

/* ─── Detail Panel ─────────────────────────────────────────── */
function TodoDetailPanel({ todo, subtasks, onUpdate, onDelete, onAddSubtask, onToggle, onClose }) {
  const [title,    setTitle]    = useState(todo.title);
  const [notes,    setNotes]    = useState(todo.notes || "");
  const [dueDate,  setDueDate]  = useState(todo.due_date || "");
  const [priority, setPriority] = useState(todo.priority || "mid");
  const [subText,  setSubText]  = useState("");
  const save = useRef(null);

  useEffect(() => {
    setTitle(todo.title); setNotes(todo.notes || "");
    setDueDate(todo.due_date || ""); setPriority(todo.priority || "mid");
  }, [todo.id]);

  const autosave = useCallback((changes) => {
    clearTimeout(save.current);
    save.current = setTimeout(() => onUpdate(todo.id, changes), 900);
  }, [todo.id, onUpdate]);

  const done = todo.status === "done";

  return (
    <div style={{
      width:300, flexShrink:0, background:"var(--sf)",
      borderLeft:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Panel header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px 12px", borderBottom:"1px solid var(--b1)",
        background:"var(--sf2)",
      }}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)",letterSpacing:".1em",textTransform:"uppercase"}}>
          詳情
        </span>
        <button onClick={onClose} style={{
          width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center",
          borderRadius:5, border:"1px solid var(--b2)", color:"var(--t3)", fontSize:".75rem",
          cursor:"pointer", background:"transparent", lineHeight:1, transition:"all .15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="var(--b1)";e.currentTarget.style.color="var(--t1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t3)";}}
        >✕</button>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"16px 18px"}}>
        {/* Title */}
        <textarea value={title} onChange={e=>{setTitle(e.target.value);autosave({title:e.target.value,updated_at:new Date().toISOString()});}}
          style={{
            width:"100%", border:"none", outline:"none",
            fontSize:"1rem", fontWeight:600, lineHeight:1.5,
            resize:"none", background:"transparent", color:"var(--t1)",
            fontFamily:"var(--font-ui)", padding:0, marginBottom:16,
            textDecoration:done?"line-through":"none",
          }}
          rows={2}
        />

        {/* Priority */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t3)",marginBottom:8,letterSpacing:".08em",textTransform:"uppercase"}}>優先度</div>
          <div style={{display:"flex",gap:6}}>
            {Object.entries(PRI_CFG).map(([v,cfg])=>(
              <button key={v} onClick={()=>{setPriority(v);onUpdate(todo.id,{priority:v});}}
                style={{
                  padding:"4px 10px", borderRadius:5,
                  border:`1px solid ${priority===v ? cfg.border : "var(--b2)"}`,
                  background:priority===v ? cfg.bg : "transparent",
                  color:priority===v ? cfg.color : "var(--t3)",
                  fontSize:".72rem", cursor:"pointer", transition:"all .12s",
                  fontFamily:"var(--font-ui)",
                }}
              >{cfg.label}</button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t3)",marginBottom:8,letterSpacing:".08em",textTransform:"uppercase"}}>截止日期</div>
          <input type="date" value={dueDate}
            onChange={e=>{setDueDate(e.target.value);onUpdate(todo.id,{due_date:e.target.value||null,updated_at:new Date().toISOString()});}}
            style={{
              padding:"8px 12px", borderRadius:7, border:"1px solid var(--b2)",
              fontSize:".84rem", background:"var(--sf2)", color:"var(--t1)", outline:"none",
              width:"100%", fontFamily:"var(--font-mono)",
            }}
          />
        </div>

        {/* Notes */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t3)",marginBottom:8,letterSpacing:".08em",textTransform:"uppercase"}}>備註</div>
          <textarea value={notes}
            onChange={e=>{setNotes(e.target.value);autosave({notes:e.target.value,updated_at:new Date().toISOString()});}}
            placeholder="補充說明…"
            style={{
              width:"100%", padding:"10px 12px", borderRadius:7, border:"1px solid var(--b2)",
              background:"var(--sf2)", color:"var(--t1)", fontSize:".84rem",
              resize:"vertical", minHeight:72, outline:"none", fontFamily:"var(--font-ui)",
              lineHeight:1.6,
            }}
          />
        </div>

        {/* Subtasks */}
        <div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t3)",marginBottom:8,letterSpacing:".08em",textTransform:"uppercase"}}>
            子任務 {subtasks.length>0&&`· ${subtasks.filter(s=>s.status==="done").length}/${subtasks.length}`}
          </div>
          {subtasks.map(sub=>(
            <div key={sub.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid var(--b1)"}}>
              <button onClick={()=>onToggle(sub)} style={{
                width:16, height:16, borderRadius:"50%", flexShrink:0, cursor:"pointer",
                border:sub.status==="done"?"none":"1.5px solid var(--b3)",
                background:sub.status==="done"?"var(--done)":"transparent",
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
              }}>{sub.status==="done"&&<span style={{color:"#fff",fontSize:".55rem"}}>✓</span>}</button>
              <span style={{flex:1,fontSize:".82rem",color:sub.status==="done"?"var(--t3)":"var(--t2)",textDecoration:sub.status==="done"?"line-through":"none"}}>{sub.title}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <input value={subText} onChange={e=>setSubText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&subText.trim()){onAddSubtask(todo.id,subText);setSubText("");}}}
              placeholder="新增子任務… Enter"
              style={{
                flex:1, padding:"7px 10px", borderRadius:6, border:"1px solid var(--b2)",
                fontSize:".8rem", outline:"none", color:"var(--t1)", background:"var(--sf2)",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{padding:"12px 18px",borderTop:"1px solid var(--b1)"}}>
        <button onClick={()=>onDelete(todo.id)} style={{
          width:"100%", padding:"9px", borderRadius:7,
          border:"1px solid rgba(135,32,32,.18)", background:"transparent",
          color:"var(--red)", fontSize:".8rem", cursor:"pointer",
          fontFamily:"var(--font-ui)", transition:"background .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="var(--red-bg)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        >刪除此項目</button>
      </div>
    </div>
  );
}

/* ─── TodoItemRow ─────────────────────────────────────────── */
function TodoItemRow({ todo, subtasks, isDetail, onToggle, onUpdate, onDelete, onAddSubtask, onDetail }) {
  const [hover,    setHover]    = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(todo.title);
  const done = todo.status === "done";
  const pri  = PRI_CFG[todo.priority] || PRI_CFG.mid;
  const today = new Date().toISOString().slice(0,10);
  const overdue = todo.due_date && todo.due_date < today && !done;

  const saveEdit = () => {
    if (editText.trim() && editText !== todo.title) onUpdate(todo.id,{title:editText.trim(),updated_at:new Date().toISOString()});
    setEditing(false);
  };

  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:"flex", alignItems:"flex-start", gap:12, padding:"10px 20px",
        borderBottom:"1px solid var(--b1)",
        background:isDetail?"rgba(184,128,74,.04)":(hover?"var(--sf2)":"transparent"),
        borderLeft:isDetail?"2px solid var(--acc)":"2px solid transparent",
        transition:"background .1s, border-left-color .1s",
        cursor:"default",
      }}
    >
      {/* Checkbox */}
      <button onClick={()=>onToggle(todo)} style={{
        width:18, height:18, borderRadius:"50%", flexShrink:0, marginTop:2, cursor:"pointer",
        border:done?"none":"1.5px solid var(--b3)",
        background:done?"var(--done)":"transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .18s", boxShadow:done?"none":"inset 0 0 0 0 var(--done)",
      }}>
        {done&&<span style={{color:"#fff",fontSize:".6rem",lineHeight:1}}>✓</span>}
      </button>

      {/* Content */}
      <div style={{flex:1, minWidth:0}}>
        {editing ? (
          <input autoFocus value={editText}
            onChange={e=>setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape"){setEditText(todo.title);setEditing(false);}}}
            style={{width:"100%",border:"none",outline:"none",fontSize:".9rem",background:"transparent",color:"var(--t1)",fontFamily:"var(--font-ui)"}}
          />
        ) : (
          <div onClick={()=>onDetail(todo)} style={{
            fontSize:".9rem", fontWeight:500, lineHeight:1.45,
            color:done?"var(--t3)":"var(--t1)",
            textDecoration:done?"line-through":"none",
            cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {(todo.priority==="urgent"||todo.priority==="high")&&(
              <span style={{width:5,height:5,borderRadius:"50%",background:pri.color,flexShrink:0,display:"inline-block"}}/>
            )}
            {todo.title}
          </div>
        )}

        {/* Meta row */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap"}}>
          {todo.due_date&&(
            <span style={{
              fontFamily:"var(--font-mono)", fontSize:".6rem",
              color:overdue?"var(--red)":"var(--t3)",
              background:overdue?"var(--red-bg)":"var(--b1)",
              padding:"1px 6px", borderRadius:4,
            }}>
              {todo.due_date}
            </span>
          )}
          {subtasks.length>0&&(
            <span style={{fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)"}}>
              ↳ {subtasks.filter(s=>s.status==="done").length}/{subtasks.length}
            </span>
          )}
          {todo.created_by&&todo.created_by!=="human"&&(
            <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--acc)",opacity:.75}}>AI</span>
          )}
        </div>

        {/* Subtasks inline */}
        {subtasks.length>0&&(
          <div style={{marginTop:4, paddingLeft:2}}>
            {subtasks.slice(0,3).map(sub=>(
              <div key={sub.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0"}}>
                <button onClick={()=>onToggle(sub)} style={{
                  width:13,height:13,borderRadius:"50%",flexShrink:0,cursor:"pointer",
                  border:sub.status==="done"?"none":"1.5px solid var(--b3)",
                  background:sub.status==="done"?"var(--done)":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{sub.status==="done"&&<span style={{color:"#fff",fontSize:".45rem"}}>✓</span>}</button>
                <span style={{fontSize:".78rem",color:sub.status==="done"?"var(--t4)":"var(--t3)",textDecoration:sub.status==="done"?"line-through":"none"}}>{sub.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hover&&!done&&(
        <div style={{display:"flex",gap:3,flexShrink:0}}>
          <button onClick={()=>setEditing(true)} style={{
            padding:"4px 7px", borderRadius:5, border:"1px solid var(--b2)",
            fontSize:".65rem", color:"var(--t3)", cursor:"pointer", background:"var(--sf)",
          }}>✏</button>
          <button onClick={()=>onDelete(todo.id)} style={{
            padding:"4px 7px", borderRadius:5, border:"1px solid var(--b2)",
            fontSize:".65rem", color:"var(--t3)", cursor:"pointer", background:"var(--sf)",
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ─── TodosView ───────────────────────────────────────────── */
function TodosView() {
  const [lists,        setLists]        = useState([]);
  const [todos,        setTodos]        = useState([]);
  const [activeListId, setActiveListId] = useState("__inbox__");
  const [quickInput,   setQuickInput]   = useState("");
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState(null);
  const [addListInput, setAddListInput] = useState("");
  const [showAddList,  setShowAddList]  = useState(false);
  const [dbErr,        setDbErr]        = useState(null);
  const [showDone,     setShowDone]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [ls, ts] = await Promise.all([
        wsDB.list("todo_lists", {}, { order: "sort_order.asc" }),
        wsDB.list("todos",      {}, { order: "sort_order.asc" }),
      ]);
      setLists(ls); setTodos(ts);
    } catch (e) {
      setDbErr("待辦清單資料表尚未建立，請先在 Supabase 執行 schema.sql");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today      = new Date().toISOString().slice(0, 10);
  const inboxList  = useMemo(() => lists.find(l => l.system_key === "inbox"), [lists]);
  const customLsts = useMemo(() => lists.filter(l => !l.system_key), [lists]);

  const inboxCount = useMemo(() =>
    inboxList ? todos.filter(t=>t.list_id===inboxList.id&&!t.parent_id&&t.status==="pending").length : 0,
  [todos, inboxList]);

  const todayCount = useMemo(() =>
    todos.filter(t=>t.due_date===today&&!t.parent_id&&t.status==="pending").length,
  [todos, today]);

  const listCount = useCallback((lid) =>
    todos.filter(t=>t.list_id===lid&&!t.parent_id&&t.status==="pending").length,
  [todos]);

  const visibleTodos = useMemo(() => {
    let arr;
    if      (activeListId==="__inbox__") arr = inboxList ? todos.filter(t=>t.list_id===inboxList.id&&!t.parent_id) : todos.filter(t=>!t.parent_id&&t.status==="pending");
    else if (activeListId==="__today__") arr = todos.filter(t=>t.due_date===today&&!t.parent_id);
    else                                 arr = todos.filter(t=>t.list_id===activeListId&&!t.parent_id);
    return arr.sort((a,b)=>{
      if (a.status==="done"&&b.status!=="done") return 1;
      if (a.status!=="done"&&b.status==="done") return -1;
      return (a.sort_order||0)-(b.sort_order||0);
    });
  }, [todos, activeListId, inboxList, today]);

  const pendingTodos = useMemo(() => visibleTodos.filter(t=>t.status!=="done"), [visibleTodos]);
  const doneTodos    = useMemo(() => visibleTodos.filter(t=>t.status==="done"),  [visibleTodos]);

  const subtasksOf = useCallback((pid) =>
    todos.filter(t=>t.parent_id===pid).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)),
  [todos]);

  const activeListName = useMemo(() => {
    if (activeListId==="__inbox__") return "收件匣";
    if (activeListId==="__today__") return "今天";
    return lists.find(l=>l.id===activeListId)?.name || "";
  }, [activeListId, lists]);

  /* ─ CRUD ─ */
  const addTodo = useCallback(async (text) => {
    if (!text.trim()) return;
    let lid = activeListId==="__inbox__"||activeListId==="__today__" ? inboxList?.id||null : activeListId;
    try {
      const t = await wsDB.insert("todos",{list_id:lid,title:text.trim(),status:"pending",priority:"mid",sort_order:Date.now()});
      setTodos(prev=>[...prev,t]);
    } catch(e){ console.error(e); }
  }, [activeListId, inboxList]);

  const toggleDone = useCallback(async (todo) => {
    const s = todo.status==="done"?"pending":"done";
    const patch = {status:s,completed_at:s==="done"?new Date().toISOString():null,updated_at:new Date().toISOString()};
    setTodos(prev=>prev.map(t=>t.id===todo.id?{...t,...patch}:t));
    try { await wsDB.update("todos",todo.id,patch); } catch(e){ console.error(e); }
  }, []);

  const updateTodo = useCallback(async (id, changes) => {
    setTodos(prev=>prev.map(t=>t.id===id?{...t,...changes}:t));
    if (detail?.id===id) setDetail(prev=>({...prev,...changes}));
    try { await wsDB.update("todos",id,changes); } catch(e){ console.error(e); }
  }, [detail]);

  const deleteTodo = useCallback(async (id) => {
    const subs = todos.filter(t=>t.parent_id===id);
    setTodos(prev=>prev.filter(t=>t.id!==id&&t.parent_id!==id));
    if (detail?.id===id) setDetail(null);
    try { await Promise.all([...subs.map(s=>wsDB.remove("todos",s.id)), wsDB.remove("todos",id)]); } catch(e){ console.error(e); }
  }, [todos, detail]);

  const addSubtask = useCallback(async (parentId, text) => {
    if (!text.trim()) return;
    const parent = todos.find(t=>t.id===parentId);
    try {
      const s = await wsDB.insert("todos",{parent_id:parentId,list_id:parent?.list_id||null,title:text.trim(),status:"pending",priority:"mid",sort_order:Date.now()});
      setTodos(prev=>[...prev,s]);
    } catch(e){ console.error(e); }
  }, [todos]);

  const addCustomList = useCallback(async () => {
    if (!addListInput.trim()) return;
    try {
      const l = await wsDB.insert("todo_lists",{name:addListInput.trim(),icon:"◻",sort_order:Date.now()});
      setLists(prev=>[...prev,l]); setAddListInput(""); setShowAddList(false); setActiveListId(l.id);
    } catch(e){ console.error(e); }
  }, [addListInput]);

  const SB_SEC = {fontFamily:"var(--font-mono)",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",color:"var(--t3)",padding:"16px 14px 6px",marginTop:4};
  const SB_ITEM_BASE = {display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:7,cursor:"pointer",transition:"background .1s,color .1s",marginBottom:1};

  function SbItem({ id, icon, name, count }) {
    const on = activeListId===id;
    return (
      <div onClick={()=>setActiveListId(id)}
        style={{...SB_ITEM_BASE, background:on?"rgba(184,128,74,.1)":"transparent", color:on?"var(--acc)":"var(--t2)", borderLeft:on?"2px solid var(--acc)":"2px solid transparent", paddingLeft:on?"10px":"12px"}}
      >
        <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",opacity:.6,flexShrink:0,lineHeight:1}}>{icon}</span>
        <span style={{flex:1,fontSize:".85rem",fontWeight:500,letterSpacing:"-.01em"}}>{name}</span>
        {count>0&&<span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",minWidth:18,textAlign:"center",background:on?"rgba(184,128,74,.2)":"var(--b1)",color:on?"var(--acc)":"var(--t3)",padding:"1px 6px",borderRadius:10}}>{count}</span>}
      </div>
    );
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".78rem"}}>載入中…</div>;
  if (dbErr)   return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",flexDirection:"column",gap:12,color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".75rem",textAlign:"center",padding:"2rem"}}><span style={{fontSize:"1.5rem",opacity:.3}}>⚠</span>{dbErr}</div>;

  return (
    <div style={{display:"flex",height:"calc(100vh - var(--hh))",overflow:"hidden",background:"var(--bg)"}}>

      {/* ── Lists sidebar ── */}
      <div style={{
        width:212, flexShrink:0, background:"var(--sf)",
        borderRight:"1px solid var(--b1)",
        display:"flex", flexDirection:"column", overflowY:"auto",
      }}>
        <div style={SB_SEC}>清單</div>
        <div style={{padding:"0 8px"}}>
          <SbItem id="__inbox__" icon="⊹" name="收件匣" count={inboxCount}/>
          <SbItem id="__today__" icon="◎" name="今天"   count={todayCount}/>
        </div>

        {customLsts.length>0&&(
          <>
            <div style={SB_SEC}>自訂</div>
            <div style={{padding:"0 8px"}}>
              {customLsts.map(l=><SbItem key={l.id} id={l.id} icon="◻" name={l.name} count={listCount(l.id)}/>)}
            </div>
          </>
        )}

        <div style={{marginTop:"auto",padding:"12px 10px"}}>
          {showAddList ? (
            <div style={{display:"flex",gap:4}}>
              <input autoFocus value={addListInput} onChange={e=>setAddListInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addCustomList();if(e.key==="Escape")setShowAddList(false);}}
                placeholder="清單名稱"
                style={{flex:1,padding:"7px 10px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf2)",outline:"none",color:"var(--t1)"}}
              />
              <button onClick={addCustomList} style={{padding:"7px 10px",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={()=>setShowAddList(true)} style={{
              width:"100%",padding:"9px",borderRadius:7,
              border:"1.5px dashed var(--b2)",color:"var(--t3)",fontSize:".78rem",
              cursor:"pointer",background:"transparent",letterSpacing:"-.01em",
              transition:"border-color .15s,color .15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
            >+ 新增清單</button>
          )}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 24px 14px", background:"var(--sf)", borderBottom:"1px solid var(--b1)", flexShrink:0}}>
          <div style={{fontFamily:"var(--font-serif)",fontSize:"1.65rem",color:"var(--t1)",marginBottom:3,letterSpacing:"-.01em"}}>
            {activeListName}
          </div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:".62rem",color:"var(--t3)"}}>
            {pendingTodos.length} 件待辦
            {doneTodos.length>0&&<span> · <span style={{opacity:.5}}>{doneTodos.length} 已完成</span></span>}
          </div>
        </div>

        {/* Quick add */}
        <div style={{padding:"12px 24px",background:"var(--sf)",borderBottom:"1px solid var(--b1)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:8,border:"1px solid var(--b2)",background:"var(--sf2)",transition:"border-color .15s"}}
            onFocus={e=>e.currentTarget.style.borderColor="var(--acc)"}
            onBlur={e=>e.currentTarget.style.borderColor="var(--b2)"}
          >
            <span style={{fontFamily:"var(--font-mono)",fontSize:".75rem",color:"var(--t3)",flexShrink:0}}>+</span>
            <input value={quickInput} onChange={e=>setQuickInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&quickInput.trim()){addTodo(quickInput);setQuickInput("");}}}
              placeholder={`在「${activeListName}」中新增… (Enter)`}
              style={{flex:1,border:"none",outline:"none",fontSize:".88rem",background:"transparent",color:"var(--t1)",fontFamily:"var(--font-ui)"}}
            />
          </div>
        </div>

        {/* List */}
        <div style={{flex:1, overflowY:"auto", background:"var(--sf)"}}>
          {pendingTodos.length===0&&doneTodos.length===0 ? (
            <div style={{textAlign:"center",paddingTop:"4rem",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".75rem"}}>
              <div style={{fontSize:"1.6rem",marginBottom:8,opacity:.25}}>○</div>
              <div>這裡還沒有待辦事項</div>
            </div>
          ) : <>
            {pendingTodos.map(todo=>(
              <TodoItemRow key={todo.id} todo={todo} subtasks={subtasksOf(todo.id)}
                isDetail={detail?.id===todo.id}
                onToggle={toggleDone} onUpdate={updateTodo} onDelete={deleteTodo}
                onAddSubtask={addSubtask} onDetail={setDetail}
              />
            ))}
            {doneTodos.length>0&&(
              <>
                <button onClick={()=>setShowDone(v=>!v)} style={{
                  width:"100%", padding:"10px 24px", display:"flex", alignItems:"center", gap:6,
                  background:"transparent", border:"none", borderTop:"1px solid var(--b1)",
                  color:"var(--t3)", fontSize:".78rem", cursor:"pointer", fontFamily:"var(--font-mono)",
                  letterSpacing:".03em",
                }}>
                  <span style={{fontSize:".62rem"}}>{showDone?"▼":"▶"}</span>
                  已完成 ({doneTodos.length})
                </button>
                {showDone&&doneTodos.map(todo=>(
                  <TodoItemRow key={todo.id} todo={todo} subtasks={subtasksOf(todo.id)}
                    isDetail={detail?.id===todo.id}
                    onToggle={toggleDone} onUpdate={updateTodo} onDelete={deleteTodo}
                    onAddSubtask={addSubtask} onDetail={setDetail}
                  />
                ))}
              </>
            )}
          </>}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {detail&&<TodoDetailPanel todo={detail} subtasks={subtasksOf(detail.id)}
        onUpdate={updateTodo} onDelete={deleteTodo} onAddSubtask={addSubtask}
        onToggle={toggleDone} onClose={()=>setDetail(null)}
      />}
    </div>
  );
}

window.TodosView = TodosView;
})();
