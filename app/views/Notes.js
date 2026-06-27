/* ── Notes View ──────────────────────────────────────────────
   筆記：隨手記 / 筆記本 / Markdown 編輯 / 預覽
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

function NotesView() {
  const [notebooks,      setNotebooks]      = useState([]);
  const [notes,          setNotes]          = useState([]);
  const [activeSection,  setActiveSection]  = useState("quick");
  const [activeNoteId,   setActiveNoteId]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [preview,        setPreview]        = useState(false);
  const [newNbInput,     setNewNbInput]     = useState("");
  const [showNewNb,      setShowNewNb]      = useState(false);
  const [dbErr,          setDbErr]          = useState(null);
  const save = useRef(null);

  const load = useCallback(async () => {
    try {
      const [nbs, ns] = await Promise.all([
        wsDB.list("notebooks", {}, { order: "sort_order.asc" }),
        wsDB.list("notes",     {}, { order: "updated_at.desc" }),
      ]);
      setNotebooks(nbs); setNotes(ns);
      const qn = ns.find(n => n.is_quick_note);
      if (qn) setActiveNoteId(qn.id);
    } catch(e) {
      setDbErr("筆記資料表尚未建立，請先在 Supabase 執行 schema.sql");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const visibleNotes = useMemo(() => {
    if (activeSection === "quick") return notes.filter(n => n.is_quick_note);
    return notes.filter(n => n.notebook_id === activeSection && !n.is_quick_note);
  }, [notes, activeSection]);

  const updateContent = useCallback((id, changes) => {
    const now = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id===id ? {...n,...changes,updated_at:now} : n));
    clearTimeout(save.current);
    save.current = setTimeout(async () => {
      try { await wsDB.update("notes", id, {...changes, updated_at:now}); } catch(e){ console.error(e); }
    }, 1400);
  }, []);

  const createNote = useCallback(async (notebookId, isQuick) => {
    try {
      const n = await wsDB.insert("notes", {
        notebook_id: notebookId||null, title:"未命名筆記", content:"",
        is_quick_note: isQuick||false
      });
      setNotes(prev => [n, ...prev]);
      setActiveNoteId(n.id);
      setPreview(false);
    } catch(e){ console.error(e); }
  }, []);

  const deleteNote = useCallback(async (id) => {
    const remaining = visibleNotes.filter(n => n.id !== id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    try { await wsDB.remove("notes", id); } catch(e){ console.error(e); }
  }, [activeNoteId, visibleNotes]);

  const createNotebook = useCallback(async () => {
    if (!newNbInput.trim()) return;
    try {
      const nb = await wsDB.insert("notebooks", { name:newNbInput.trim(), icon:"📓", sort_order:Date.now() });
      setNotebooks(prev => [...prev, nb]);
      setNewNbInput(""); setShowNewNb(false); setActiveSection(nb.id);
    } catch(e){ console.error(e); }
  }, [newNbInput]);

  const renderMd = useCallback((text) => {
    if (typeof marked !== "undefined") return { __html: marked.parse(text || "") };
    return { __html: "<pre style=\"white-space:pre-wrap\">" + (text||"").replace(/</g,"&lt;") + "</pre>" };
  }, []);

  function SbSection({ id, icon, name, count }) {
    const on = activeSection === id;
    return (
      <div onClick={()=>setActiveSection(id)} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".58rem .65rem",borderRadius:7,cursor:"pointer",background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",marginBottom:2,transition:"all .15s"}}>
        <span style={{fontSize:".88rem"}}>{icon}</span>
        <span style={{flex:1,fontSize:".85rem",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",background:"var(--b1)",color:"var(--t3)",padding:"1px 6px",borderRadius:10}}>{count}</span>
      </div>
    );
  }

  if (loading) return <div style={{padding:"3rem",textAlign:"center",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".8rem"}}>載入中…</div>;
  if (dbErr)   return <div style={{padding:"3rem",textAlign:"center",color:"var(--t2)",fontFamily:"'DM Mono',monospace",fontSize:".78rem",lineHeight:1.8}}><div style={{fontSize:"2rem",marginBottom:"1rem",opacity:.4}}>⚠</div><div>{dbErr}</div></div>;

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>

      {/* ── Notebook sidebar ── */}
      <div style={{width:210,flexShrink:0,background:"var(--sf2)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",padding:".7rem .5rem",overflowY:"auto"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginBottom:".15rem"}}>筆記</div>
        <SbSection id="quick" icon="🗒" name="隨手記" count={notes.filter(n=>n.is_quick_note).length}/>

        {notebooks.length>0&&(
          <>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginTop:".5rem",marginBottom:".15rem"}}>筆記本</div>
            {notebooks.map(nb=>(
              <SbSection key={nb.id} id={nb.id} icon={nb.icon||"📓"} name={nb.name} count={notes.filter(n=>n.notebook_id===nb.id).length}/>
            ))}
          </>
        )}

        <div style={{marginTop:"auto",paddingTop:".65rem"}}>
          {showNewNb ? (
            <div style={{display:"flex",gap:".3rem",padding:"0 .3rem"}}>
              <input autoFocus value={newNbInput} onChange={e=>setNewNbInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")createNotebook();if(e.key==="Escape")setShowNewNb(false);}}
                placeholder="筆記本名稱"
                style={{flex:1,padding:".38rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf)",outline:"none",color:"var(--t1)"}}
              />
              <button onClick={createNotebook} style={{padding:".38rem .6rem",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={()=>setShowNewNb(true)} style={{width:"100%",padding:".5rem",borderRadius:7,border:"1.5px dashed var(--b2)",color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent"}}>
              + 新增筆記本
            </button>
          )}
        </div>
      </div>

      {/* ── Note list ── */}
      <div style={{width:235,flexShrink:0,background:"var(--sf)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:".85rem 1rem .7rem",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.05rem",color:"var(--t1)"}}>
            {activeSection==="quick" ? "隨手記" : notebooks.find(nb=>nb.id===activeSection)?.name||""}
          </span>
          <button onClick={()=>createNote(activeSection==="quick"?null:activeSection, activeSection==="quick")}
            style={{width:26,height:26,borderRadius:6,border:"1px solid var(--b2)",background:"transparent",color:"var(--acc)",fontSize:.95+"rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:300}}
          >+</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {visibleNotes.length===0 ? (
            <div style={{padding:"2rem 1rem",textAlign:"center",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".73rem"}}>
              <div style={{marginBottom:".5rem",opacity:.35,fontSize:"1.4rem"}}>📝</div>
              點擊 + 建立筆記
            </div>
          ) : visibleNotes.map(note=>(
            <div key={note.id} onClick={()=>setActiveNoteId(note.id)}
              style={{padding:".72rem 1rem",borderBottom:"1px solid var(--b1)",cursor:"pointer",background:activeNoteId===note.id?"rgba(201,146,79,.06)":"transparent",borderLeft:activeNoteId===note.id?"2px solid var(--acc)":"2px solid transparent",transition:"all .1s"}}
            >
              <div style={{fontSize:".84rem",fontWeight:500,color:"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:".18rem"}}>
                {note.title||"未命名筆記"}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)"}}>
                  {note.updated_at ? new Date(note.updated_at).toLocaleDateString("zh-TW",{month:"2-digit",day:"2-digit"}) : ""}
                </span>
                {note.created_by&&note.created_by!=="human"&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",color:"var(--acc)",opacity:.7}}>🤖</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--sf)"}}>
        {!activeNote ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".78rem"}}>
            選擇或建立一篇筆記
          </div>
        ) : (<>
          <div style={{padding:"1rem 1.7rem .8rem",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",gap:".75rem",flexShrink:0}}>
            <input value={activeNote.title}
              onChange={e=>updateContent(activeNote.id,{title:e.target.value})}
              style={{flex:1,border:"none",outline:"none",fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:"var(--t1)",background:"transparent"}}
              placeholder="筆記標題"
            />
            <button onClick={()=>setPreview(v=>!v)}
              style={{padding:".28rem .7rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".75rem",color:preview?"var(--acc)":"var(--t3)",background:preview?"rgba(201,146,79,.08)":"transparent",cursor:"pointer",flexShrink:0}}
            >{preview?"✎ 編輯":"◎ 預覽"}</button>
            <button onClick={()=>deleteNote(activeNote.id)}
              style={{padding:".28rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".75rem",color:"var(--t3)",background:"transparent",cursor:"pointer",flexShrink:0}}
            >✕</button>
          </div>

          {preview ? (
            <div dangerouslySetInnerHTML={renderMd(activeNote.content)}
              style={{flex:1,padding:"1.2rem 1.8rem",overflowY:"auto",lineHeight:1.8,color:"var(--t1)",fontSize:".92rem"}}
            />
          ) : (
            <textarea value={activeNote.content}
              onChange={e=>updateContent(activeNote.id,{content:e.target.value,word_count:e.target.value.length})}
              placeholder={"開始輸入… (支援 Markdown)\n\n# 標題\n**粗體** *斜體*\n- 清單項目"}
              style={{flex:1,padding:"1.2rem 1.8rem",border:"none",outline:"none",resize:"none",fontSize:".91rem",lineHeight:1.8,fontFamily:"'DM Mono',monospace",color:"var(--t1)",background:"transparent"}}
            />
          )}

          <div style={{padding:".45rem 1.8rem",borderTop:"1px solid var(--b1)",fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t4)",flexShrink:0}}>
            {activeNote.word_count||0} 字 · {activeNote.updated_at?new Date(activeNote.updated_at).toLocaleString("zh-TW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):""}
          </div>
        </>)}
      </div>
    </div>
  );
}

window.NotesView = NotesView;
})();
