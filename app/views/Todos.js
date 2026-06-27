/* ── Todos View ──────────────────────────────────────────────
   待辦清單：收件匣 / 今天 / 自訂清單 / 子任務 / GTD 模式
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

/* ─── TodoDetailPanel ─────────────────────────────────────── */
function TodoDetailPanel({ todo, subtasks, lists, onUpdate, onDelete, onAddSubtask, onToggle, onClose }) {
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

  const PRI = [["urgent","緊急","var(--red)"],["high","高","#8B6020"],["mid","中","var(--t3)"],["low","低","var(--t4)"]];

  return (
    <div style={{width:300,flexShrink:0,background:"var(--sf)",borderLeft:"1px solid var(--b1)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.1rem .75rem",borderBottom:"1px solid var(--b1)"}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",letterSpacing:".06em",textTransform:"uppercase"}}>詳情</span>
        <button onClick={onClose} style={{color:"var(--t3)",fontSize:".85rem",cursor:"pointer",background:"none",border:"none",lineHeight:1}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:".9rem 1.1rem"}}>
        <textarea value={title}
          onChange={e=>{setTitle(e.target.value);autosave({title:e.target.value,updated_at:new Date().toISOString()});}}
          style={{width:"100%",border:"none",outline:"none",fontSize:".97rem",fontWeight:600,lineHeight:1.45,resize:"none",background:"transparent",color:"var(--t1)",fontFamily:"inherit",padding:0,marginBottom:".85rem"}}
          rows={2}
        />

        <div style={{marginBottom:".9rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".35rem",letterSpacing:".05em",textTransform:"uppercase"}}>優先度</div>
          <div style={{display:"flex",gap:".3rem",flexWrap:"wrap"}}>
            {PRI.map(([v,l,c])=>(
              <button key={v} onClick={()=>{setPriority(v);onUpdate(todo.id,{priority:v});}}
                style={{padding:".22rem .55rem",borderRadius:5,border:`1px solid ${priority===v?c:"var(--b2)"}`,background:priority===v?`${c}18`:"transparent",color:priority===v?c:"var(--t3)",fontSize:".7rem",cursor:"pointer",transition:"all .12s"}}
              >{l}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:".9rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".35rem",letterSpacing:".05em",textTransform:"uppercase"}}>截止日期</div>
          <input type="date" value={dueDate}
            onChange={e=>{setDueDate(e.target.value);onUpdate(todo.id,{due_date:e.target.value||null,updated_at:new Date().toISOString()});}}
            style={{padding:".4rem .65rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".84rem",background:"var(--sf2)",color:"var(--t1)",outline:"none",width:"100%"}}
          />
        </div>

        <div style={{marginBottom:".9rem"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".35rem",letterSpacing:".05em",textTransform:"uppercase"}}>備註</div>
          <textarea value={notes}
            onChange={e=>{setNotes(e.target.value);autosave({notes:e.target.value,updated_at:new Date().toISOString()});}}
            placeholder="補充說明..."
            style={{width:"100%",padding:".5rem .65rem",borderRadius:6,border:"1px solid var(--b2)",background:"var(--sf2)",color:"var(--t1)",fontSize:".84rem",resize:"vertical",minHeight:72,outline:"none",fontFamily:"inherit",lineHeight:1.6}}
          />
        </div>

        <div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".4rem",letterSpacing:".05em",textTransform:"uppercase"}}>
            子任務 {subtasks.length>0&&`(${subtasks.filter(s=>s.status==="done").length}/${subtasks.length})`}
          </div>
          {subtasks.map(sub=>(
            <div key={sub.id} style={{display:"flex",alignItems:"center",gap:".5rem",padding:".32rem 0",borderBottom:"1px solid var(--b1)"}}>
              <button onClick={()=>onToggle(sub)}
                style={{width:15,height:15,borderRadius:"50%",border:sub.status==="done"?"none":"1.5px solid var(--b3)",background:sub.status==="done"?"var(--done)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
              >{sub.status==="done"&&<span style={{color:"#fff",fontSize:".52rem"}}>✓</span>}</button>
              <span style={{flex:1,fontSize:".82rem",color:sub.status==="done"?"var(--t3)":"var(--t2)",textDecoration:sub.status==="done"?"line-through":"none"}}>{sub.title}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:".35rem",marginTop:".4rem"}}>
            <input value={subText} onChange={e=>setSubText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&subText.trim()){onAddSubtask(todo.id,subText);setSubText("");}}}
              placeholder="新增子任務… (Enter)"
              style={{flex:1,padding:".36rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".81rem",outline:"none",color:"var(--t1)",background:"var(--sf2)"}}
            />
          </div>
        </div>
      </div>

      <div style={{padding:".75rem 1.1rem",borderTop:"1px solid var(--b1)"}}>
        <button onClick={()=>onDelete(todo.id)}
          style={{width:"100%",padding:".45rem",borderRadius:6,border:"1px solid rgba(139,37,37,.2)",background:"transparent",color:"var(--red)",fontSize:".8rem",cursor:"pointer"}}
        >刪除此項目</button>
      </div>
    </div>
  );
}

/* ─── TodoItemRow ─────────────────────────────────────────── */
function TodoItemRow({ todo, subtasks, isDetail, onToggle, onUpdate, onDelete, onAddSubtask, onDetail }) {
  const [hover,        setHover]        = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [editText,     setEditText]     = useState(todo.title);
  const [showSubInput, setShowSubInput] = useState(false);
  const [subText,      setSubText]      = useState("");
  const done = todo.status === "done";

  const saveEdit = () => {
    if (editText.trim() && editText !== todo.title) onUpdate(todo.id,{title:editText.trim(),updated_at:new Date().toISOString()});
    setEditing(false);
  };

  const addSub = () => {
    if (subText.trim()) { onAddSubtask(todo.id, subText); setSubText(""); setShowSubInput(false); }
  };

  const PRI_DOT = {urgent:"var(--red)",high:"#8B6020",mid:"transparent",low:"transparent"};

  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{borderRadius:8,marginBottom:2,background:isDetail?"rgba(201,146,79,.05)":(hover?"var(--sf2)":"transparent"),border:isDetail?"1px solid rgba(201,146,79,.15)":"1px solid transparent",transition:"all .1s"}}
    >
      <div style={{display:"flex",alignItems:"center",gap:".65rem",padding:".65rem .85rem"}}>
        <button onClick={()=>onToggle(todo)}
          style={{width:19,height:19,borderRadius:"50%",border:done?"none":"1.5px solid var(--b3)",background:done?"var(--done)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s"}}
        >{done&&<span style={{color:"#fff",fontSize:".6rem"}}>✓</span>}</button>

        <div style={{flex:1,minWidth:0}}>
          {editing ? (
            <input autoFocus value={editText}
              onChange={e=>setEditText(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape"){setEditText(todo.title);setEditing(false);}}}
              style={{width:"100%",border:"none",outline:"none",fontSize:".88rem",background:"transparent",color:"var(--t1)"}}
            />
          ) : (
            <div onClick={()=>onDetail(todo)}
              style={{fontSize:".88rem",fontWeight:500,color:done?"var(--t3)":"var(--t1)",textDecoration:done?"line-through":"none",cursor:"pointer",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}
            >
              {todo.priority!=="mid"&&todo.priority!=="low"&&<span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:PRI_DOT[todo.priority],marginRight:6,verticalAlign:"middle",flexShrink:0}}/>}
              {todo.title}
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:".45rem",marginTop:".18rem"}}>
            {todo.due_date&&(
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:(!done&&todo.due_date<new Date().toISOString().slice(0,10))?"var(--red)":"var(--t3)"}}>
                📅 {todo.due_date}
              </span>
            )}
            {subtasks.length>0&&(
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)"}}>
                ↳ {subtasks.filter(s=>s.status==="done").length}/{subtasks.length}
              </span>
            )}
            {todo.created_by&&todo.created_by!=="human"&&(
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--acc)",opacity:.7}}>🤖 AI</span>
            )}
          </div>
        </div>

        {(hover&&!done)&&(
          <div style={{display:"flex",gap:".25rem",flexShrink:0}}>
            <button onClick={()=>setEditing(true)} style={{padding:".22rem .45rem",borderRadius:5,border:"1px solid var(--b2)",fontSize:".68rem",color:"var(--t3)",cursor:"pointer",background:"var(--sf)"}}>✏</button>
            <button onClick={()=>setShowSubInput(v=>!v)} style={{padding:".22rem .45rem",borderRadius:5,border:"1px solid var(--b2)",fontSize:".68rem",color:"var(--t3)",cursor:"pointer",background:"var(--sf)"}}>⊕</button>
            <button onClick={()=>onDelete(todo.id)} style={{padding:".22rem .45rem",borderRadius:5,border:"1px solid var(--b2)",fontSize:".68rem",color:"var(--t3)",cursor:"pointer",background:"var(--sf)"}}>✕</button>
          </div>
        )}
      </div>

      {subtasks.length>0&&(
        <div style={{paddingLeft:"2.4rem",paddingBottom:".35rem"}}>
          {subtasks.map(sub=>(
            <div key={sub.id} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".3rem .5rem"}}>
              <button onClick={()=>onToggle(sub)}
                style={{width:15,height:15,borderRadius:"50%",border:sub.status==="done"?"none":"1.5px solid var(--b3)",background:sub.status==="done"?"var(--done)":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
              >{sub.status==="done"&&<span style={{color:"#fff",fontSize:".52rem"}}>✓</span>}</button>
              <span style={{fontSize:".81rem",color:sub.status==="done"?"var(--t3)":"var(--t2)",textDecoration:sub.status==="done"?"line-through":"none",flex:1}}>{sub.title}</span>
              <button onClick={()=>onDelete(sub.id)} style={{padding:".18rem .38rem",border:"none",fontSize:".62rem",color:"var(--t4)",cursor:"pointer",background:"transparent",opacity:.5}}>✕</button>
            </div>
          ))}
        </div>
      )}

      {showSubInput&&(
        <div style={{paddingLeft:"2.4rem",paddingRight:".85rem",paddingBottom:".45rem",display:"flex",gap:".3rem"}}>
          <input autoFocus value={subText} onChange={e=>setSubText(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addSub();if(e.key==="Escape")setShowSubInput(false);}}
            placeholder="新增子任務… (Enter)"
            style={{flex:1,padding:".32rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",outline:"none",color:"var(--t1)",background:"var(--sf2)"}}
          />
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

  const load = useCallback(async () => {
    try {
      const [ls, ts] = await Promise.all([
        wsDB.list("todo_lists", {}, { order: "sort_order.asc" }),
        wsDB.list("todos",      {}, { order: "sort_order.asc" }),
      ]);
      setLists(ls); setTodos(ts);
    } catch (e) {
      setDbErr("待辦清單資料表尚未建立，請先在 Supabase 執行 schema.sql");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today      = new Date().toISOString().slice(0, 10);
  const inboxList  = useMemo(() => lists.find(l => l.system_key === "inbox"),  [lists]);
  const customLsts = useMemo(() => lists.filter(l => !l.system_key), [lists]);

  const inboxCount = useMemo(() =>
    inboxList ? todos.filter(t => t.list_id===inboxList.id && !t.parent_id && t.status==="pending").length : 0,
  [todos, inboxList]);

  const todayCount = useMemo(() =>
    todos.filter(t => t.due_date===today && !t.parent_id && t.status==="pending").length,
  [todos, today]);

  const listCount = useCallback((lid) =>
    todos.filter(t => t.list_id===lid && !t.parent_id && t.status==="pending").length,
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

  const subtasksOf = useCallback((pid) =>
    todos.filter(t=>t.parent_id===pid).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)),
  [todos]);

  const activeListName = useMemo(() => {
    if (activeListId==="__inbox__") return "收件匣";
    if (activeListId==="__today__") return "今天";
    return lists.find(l=>l.id===activeListId)?.name || "";
  }, [activeListId, lists]);

  /* ─ CRUD ─ */
  const addTodo = useCallback(async (text, targetListId) => {
    if (!text.trim()) return;
    let lid = targetListId;
    if (!lid) {
      if (activeListId==="__inbox__"||activeListId==="__today__") lid = inboxList?.id || null;
      else lid = activeListId;
    }
    try {
      const t = await wsDB.insert("todos", { list_id:lid, title:text.trim(), status:"pending", priority:"mid", sort_order:Date.now() });
      setTodos(prev=>[...prev,t]);
    } catch (e) { console.error(e); }
  }, [activeListId, inboxList]);

  const toggleDone = useCallback(async (todo) => {
    const s = todo.status==="done" ? "pending" : "done";
    const patch = { status:s, completed_at:s==="done"?new Date().toISOString():null, updated_at:new Date().toISOString() };
    setTodos(prev=>prev.map(t=>t.id===todo.id?{...t,...patch}:t));
    try { await wsDB.update("todos", todo.id, patch); } catch(e){ console.error(e); }
  }, []);

  const updateTodo = useCallback(async (id, changes) => {
    setTodos(prev=>prev.map(t=>t.id===id?{...t,...changes}:t));
    if (detail?.id===id) setDetail(prev=>({...prev,...changes}));
    try { await wsDB.update("todos", id, changes); } catch(e){ console.error(e); }
  }, [detail]);

  const deleteTodo = useCallback(async (id) => {
    const subs = todos.filter(t=>t.parent_id===id);
    setTodos(prev=>prev.filter(t=>t.id!==id&&t.parent_id!==id));
    if (detail?.id===id) setDetail(null);
    try {
      await Promise.all(subs.map(s=>wsDB.remove("todos",s.id)));
      await wsDB.remove("todos", id);
    } catch(e){ console.error(e); }
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
      const l = await wsDB.insert("todo_lists",{name:addListInput.trim(),icon:"📋",sort_order:Date.now()});
      setLists(prev=>[...prev,l]);
      setAddListInput(""); setShowAddList(false); setActiveListId(l.id);
    } catch(e){ console.error(e); }
  }, [addListInput]);

  /* ─ Sidebar item ─ */
  function SbItem({ id, icon, name, count }) {
    const on = activeListId===id;
    return (
      <div onClick={()=>setActiveListId(id)} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".58rem .65rem",borderRadius:7,cursor:"pointer",background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",marginBottom:2,transition:"all .15s"}}>
        <span style={{fontSize:".88rem"}}>{icon}</span>
        <span style={{flex:1,fontSize:".85rem",fontWeight:500}}>{name}</span>
        {count>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",background:on?"rgba(201,146,79,.2)":"var(--b1)",color:on?"var(--acc)":"var(--t3)",padding:"1px 6px",borderRadius:10}}>{count}</span>}
      </div>
    );
  }

  if (loading) return <div style={{padding:"3rem",textAlign:"center",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".8rem"}}>載入中…</div>;
  if (dbErr)   return (
    <div style={{padding:"3rem",textAlign:"center",color:"var(--t2)",fontFamily:"'DM Mono',monospace",fontSize:".78rem",lineHeight:1.8}}>
      <div style={{fontSize:"2rem",marginBottom:"1rem",opacity:.4}}>⚠</div>
      <div>{dbErr}</div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>

      {/* ── Lists sidebar ── */}
      <div style={{width:215,flexShrink:0,background:"var(--sf2)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",padding:".7rem .5rem",overflowY:"auto"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginBottom:".15rem"}}>待辦</div>
        <SbItem id="__inbox__" icon="📥" name="收件匣"  count={inboxCount}/>
        <SbItem id="__today__" icon="🌅" name="今天"    count={todayCount}/>

        {customLsts.length>0&&(
          <>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginTop:".5rem",marginBottom:".15rem"}}>自訂清單</div>
            {customLsts.map(l=><SbItem key={l.id} id={l.id} icon={l.icon||"📋"} name={l.name} count={listCount(l.id)}/>)}
          </>
        )}

        <div style={{marginTop:"auto",paddingTop:".65rem"}}>
          {showAddList ? (
            <div style={{display:"flex",gap:".3rem",padding:"0 .3rem"}}>
              <input autoFocus value={addListInput} onChange={e=>setAddListInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addCustomList();if(e.key==="Escape")setShowAddList(false);}}
                placeholder="清單名稱"
                style={{flex:1,padding:".38rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf)",outline:"none",color:"var(--t1)"}}
              />
              <button onClick={addCustomList} style={{padding:".38rem .6rem",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={()=>setShowAddList(true)} style={{width:"100%",padding:".5rem",borderRadius:7,border:"1.5px dashed var(--b2)",color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent"}}>
              + 新增清單
            </button>
          )}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"1.3rem 1.7rem .75rem",borderBottom:"1px solid var(--b1)",background:"var(--sf)",flexShrink:0}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.55rem",color:"var(--t1)",marginBottom:".18rem"}}>{activeListName}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:".65rem",color:"var(--t3)"}}>
            {visibleTodos.filter(t=>t.status==="pending").length} 件待辦
            {visibleTodos.filter(t=>t.status==="done").length>0&&` · ${visibleTodos.filter(t=>t.status==="done").length} 件已完成`}
          </div>
        </div>

        <div style={{padding:".8rem 1.7rem",borderBottom:"1px solid var(--b1)",background:"var(--sf)",flexShrink:0}}>
          <input value={quickInput} onChange={e=>setQuickInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&quickInput.trim()){addTodo(quickInput);setQuickInput("");}}}
            placeholder={`在「${activeListName}」中新增項目… (Enter 確認)`}
            style={{width:"100%",padding:".62rem .9rem",border:"1px solid var(--b2)",borderRadius:8,fontSize:".88rem",background:"var(--sf2)",outline:"none",color:"var(--t1)",transition:"border-color .15s"}}
            onFocus={e=>e.target.style.borderColor="var(--acc)"}
            onBlur={e=>e.target.style.borderColor="var(--b2)"}
          />
        </div>

        <div style={{flex:1,overflowY:"auto",padding:".4rem .9rem"}}>
          {visibleTodos.length===0 ? (
            <div style={{textAlign:"center",paddingTop:"3.5rem",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".75rem"}}>
              <div style={{fontSize:"1.8rem",marginBottom:".6rem",opacity:.35}}>○</div>
              <div>這裡還沒有待辦事項</div>
            </div>
          ) : visibleTodos.map(todo=>(
            <TodoItemRow key={todo.id} todo={todo} subtasks={subtasksOf(todo.id)}
              isDetail={detail?.id===todo.id}
              onToggle={toggleDone} onUpdate={updateTodo} onDelete={deleteTodo}
              onAddSubtask={addSubtask} onDetail={setDetail}
            />
          ))}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {detail&&<TodoDetailPanel todo={detail} subtasks={subtasksOf(detail.id)} lists={lists}
        onUpdate={updateTodo} onDelete={deleteTodo} onAddSubtask={addSubtask}
        onToggle={toggleDone} onClose={()=>setDetail(null)}
      />}
    </div>
  );
}

window.TodosView = TodosView;
})();
