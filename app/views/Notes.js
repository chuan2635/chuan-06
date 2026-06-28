/* ── Notes View ──────────────────────────────────────────────
   筆記：隨手記 / 筆記本 / Markdown 編輯 / 預覽
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useRef, useMemo } = React;

function NotesView() {
  const [notebooks,     setNotebooks]     = useState([]);
  const [notes,         setNotes]         = useState([]);
  const [activeSection, setActiveSection] = useState("quick");
  const [activeNoteId,  setActiveNoteId]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [preview,       setPreview]       = useState(false);
  const [newNbInput,    setNewNbInput]    = useState("");
  const [showNewNb,     setShowNewNb]     = useState(false);
  const [dbErr,         setDbErr]         = useState(null);
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const visibleNotes = useMemo(() => {
    if (activeSection==="quick") return notes.filter(n=>n.is_quick_note);
    return notes.filter(n=>n.notebook_id===activeSection&&!n.is_quick_note);
  }, [notes, activeSection]);

  const updateContent = useCallback((id, changes) => {
    const now = new Date().toISOString();
    setNotes(prev=>prev.map(n=>n.id===id?{...n,...changes,updated_at:now}:n));
    clearTimeout(save.current);
    save.current = setTimeout(async()=>{
      try { await wsDB.update("notes",id,{...changes,updated_at:now}); } catch(e){ console.error(e); }
    }, 1400);
  }, []);

  const createNote = useCallback(async (notebookId, isQuick) => {
    try {
      const n = await wsDB.insert("notes",{notebook_id:notebookId||null,title:"未命名筆記",content:"",is_quick_note:isQuick||false});
      setNotes(prev=>[n,...prev]); setActiveNoteId(n.id); setPreview(false);
    } catch(e){ console.error(e); }
  }, []);

  const deleteNote = useCallback(async (id) => {
    const remaining = visibleNotes.filter(n=>n.id!==id);
    setNotes(prev=>prev.filter(n=>n.id!==id));
    if (activeNoteId===id) setActiveNoteId(remaining.length>0?remaining[0].id:null);
    try { await wsDB.remove("notes",id); } catch(e){ console.error(e); }
  }, [activeNoteId, visibleNotes]);

  const createNotebook = useCallback(async () => {
    if (!newNbInput.trim()) return;
    try {
      const nb = await wsDB.insert("notebooks",{name:newNbInput.trim(),icon:"◈",sort_order:Date.now()});
      setNotebooks(prev=>[...prev,nb]); setNewNbInput(""); setShowNewNb(false); setActiveSection(nb.id);
    } catch(e){ console.error(e); }
  }, [newNbInput]);

  const renderMd = useCallback((text) => {
    if (typeof marked!=="undefined") return {__html:marked.parse(text||"")};
    return {__html:"<pre style=\"white-space:pre-wrap;font-family:inherit\">"+(text||"").replace(/</g,"&lt;")+"</pre>"};
  }, []);

  const fmtDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("zh-TW",{month:"2-digit",day:"2-digit"});
  };

  const excerpt = (text) => (text||"").replace(/[#*`\n]/g," ").trim().slice(0,60) || "無內容";

  const SB_SEC = {fontFamily:"var(--font-mono)",fontSize:".56rem",letterSpacing:".14em",textTransform:"uppercase",color:"var(--t3)",padding:"16px 14px 6px"};

  function SbSection({ id, icon, name, count }) {
    const on = activeSection===id;
    return (
      <div onClick={()=>setActiveSection(id)} style={{
        display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
        borderRadius:7, cursor:"pointer", marginBottom:1, transition:"all .12s",
        background:on?"rgba(184,128,74,.1)":"transparent",
        color:on?"var(--acc)":"var(--t2)",
        borderLeft:on?"2px solid var(--acc)":"2px solid transparent",
        paddingLeft:on?"10px":"12px",
      }}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",opacity:.65,flexShrink:0}}>{icon}</span>
        <span style={{flex:1,fontSize:".85rem",fontWeight:500,letterSpacing:"-.01em"}}>{name}</span>
        <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",minWidth:18,textAlign:"center",
          background:on?"rgba(184,128,74,.2)":"var(--b1)",color:on?"var(--acc)":"var(--t3)",
          padding:"1px 6px",borderRadius:10}}>
          {count}
        </span>
      </div>
    );
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".78rem"}}>載入中…</div>;
  if (dbErr)   return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",flexDirection:"column",gap:12,color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".75rem",textAlign:"center",padding:"2rem"}}><span style={{fontSize:"1.5rem",opacity:.3}}>⚠</span>{dbErr}</div>;

  return (
    <div style={{display:"flex",height:"calc(100vh - var(--hh))",overflow:"hidden"}}>

      {/* ── Notebook sidebar ── */}
      <div style={{
        width:200, flexShrink:0, background:"var(--sf)",
        borderRight:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflowY:"auto",
      }}>
        <div style={SB_SEC}>筆記</div>
        <div style={{padding:"0 8px"}}>
          <SbSection id="quick" icon="≡" name="隨手記" count={notes.filter(n=>n.is_quick_note).length}/>
        </div>

        {notebooks.length>0&&(
          <>
            <div style={SB_SEC}>筆記本</div>
            <div style={{padding:"0 8px"}}>
              {notebooks.map(nb=>(
                <SbSection key={nb.id} id={nb.id} icon={nb.icon||"◈"} name={nb.name} count={notes.filter(n=>n.notebook_id===nb.id).length}/>
              ))}
            </div>
          </>
        )}

        <div style={{marginTop:"auto",padding:"12px 10px"}}>
          {showNewNb ? (
            <div style={{display:"flex",gap:4}}>
              <input autoFocus value={newNbInput} onChange={e=>setNewNbInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")createNotebook();if(e.key==="Escape")setShowNewNb(false);}}
                placeholder="筆記本名稱"
                style={{flex:1,padding:"7px 10px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf2)",outline:"none",color:"var(--t1)"}}
              />
              <button onClick={createNotebook} style={{padding:"7px 10px",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={()=>setShowNewNb(true)} style={{
              width:"100%",padding:"9px",borderRadius:7,border:"1.5px dashed var(--b2)",
              color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent",letterSpacing:"-.01em",
              transition:"border-color .15s,color .15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
            >+ 新增筆記本</button>
          )}
        </div>
      </div>

      {/* ── Note list ── */}
      <div style={{
        width:224, flexShrink:0, background:"var(--sf2)",
        borderRight:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{
          padding:"14px 16px 12px", borderBottom:"1px solid var(--b1)",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
        }}>
          <span style={{fontFamily:"var(--font-serif)",fontSize:"1rem",color:"var(--t1)",letterSpacing:"-.01em"}}>
            {activeSection==="quick"?"隨手記":notebooks.find(nb=>nb.id===activeSection)?.name||""}
          </span>
          <button onClick={()=>createNote(activeSection==="quick"?null:activeSection,activeSection==="quick")}
            style={{
              width:26, height:26, borderRadius:6, border:"1px solid var(--b2)",
              background:"transparent", color:"var(--acc)", fontSize:"1.1rem",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:300, lineHeight:1, transition:"all .15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--acc-bg)";e.currentTarget.style.borderColor="var(--acc)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="var(--b2)";}}
          >+</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {visibleNotes.length===0 ? (
            <div style={{padding:"3rem 1rem",textAlign:"center",color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".72rem"}}>
              <div style={{marginBottom:8,opacity:.25,fontSize:"1.4rem"}}>≡</div>
              點擊 + 建立筆記
            </div>
          ) : visibleNotes.map(note=>(
            <div key={note.id} onClick={()=>setActiveNoteId(note.id)}
              style={{
                padding:"12px 16px", borderBottom:"1px solid var(--b1)", cursor:"pointer",
                background:activeNoteId===note.id?"rgba(184,128,74,.06)":"transparent",
                borderLeft:activeNoteId===note.id?"2px solid var(--acc)":"2px solid transparent",
                transition:"all .1s",
              }}
            >
              <div style={{fontSize:".86rem",fontWeight:600,color:"var(--t1)",marginBottom:3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",letterSpacing:"-.01em"}}>
                {note.title||"未命名筆記"}
              </div>
              <div style={{fontSize:".75rem",color:"var(--t3)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",marginBottom:4}}>
                {excerpt(note.content)}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t4)"}}>{fmtDate(note.updated_at)}</span>
                {note.created_by&&note.created_by!=="human"&&<span style={{fontFamily:"var(--font-mono)",fontSize:".55rem",color:"var(--acc)",opacity:.7}}>AI</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--sf)"}}>
        {!activeNote ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:8,color:"var(--t3)"}}>
            <span style={{fontSize:"1.8rem",opacity:.2}}>≡</span>
            <span style={{fontFamily:"var(--font-mono)",fontSize:".75rem"}}>選擇或建立一篇筆記</span>
          </div>
        ) : (<>
          <div style={{
            padding:"12px 28px 10px", borderBottom:"1px solid var(--b1)",
            display:"flex", alignItems:"center", gap:10, flexShrink:0,
          }}>
            <input value={activeNote.title}
              onChange={e=>updateContent(activeNote.id,{title:e.target.value})}
              style={{
                flex:1, border:"none", outline:"none",
                fontFamily:"var(--font-serif)", fontSize:"1.35rem", color:"var(--t1)",
                background:"transparent", letterSpacing:"-.01em",
              }}
              placeholder="筆記標題"
            />
            <button onClick={()=>setPreview(v=>!v)} style={{
              padding:"5px 12px", borderRadius:6, border:"1px solid var(--b2)",
              fontSize:".7rem", fontFamily:"var(--font-mono)", letterSpacing:".03em",
              color:preview?"var(--acc)":"var(--t3)",
              background:preview?"var(--acc-bg)":"transparent",
              cursor:"pointer", flexShrink:0, transition:"all .15s",
            }}>{preview?"✎ 編輯":"⊙ 預覽"}</button>
            <button onClick={()=>deleteNote(activeNote.id)} style={{
              padding:"5px 10px", borderRadius:6, border:"1px solid var(--b2)",
              fontSize:".7rem", color:"var(--t3)", background:"transparent",
              cursor:"pointer", flexShrink:0, transition:"all .15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(135,32,32,.3)";e.currentTarget.style.color="var(--red)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
            >✕</button>
          </div>

          {preview ? (
            <div dangerouslySetInnerHTML={renderMd(activeNote.content)}
              style={{flex:1,padding:"28px 40px",overflowY:"auto",lineHeight:1.85,color:"var(--t1)",fontSize:".92rem"}}
            />
          ) : (
            <textarea value={activeNote.content}
              onChange={e=>updateContent(activeNote.id,{content:e.target.value,word_count:e.target.value.length})}
              placeholder={"開始輸入… (支援 Markdown)\n\n# 標題\n**粗體** *斜體*\n- 清單"}
              style={{
                flex:1, padding:"28px 40px", border:"none", outline:"none",
                resize:"none", fontSize:".9rem", lineHeight:1.85,
                fontFamily:"var(--font-mono)", color:"var(--t1)", background:"transparent",
              }}
            />
          )}

          <div style={{
            padding:"7px 40px", borderTop:"1px solid var(--b1)",
            fontFamily:"var(--font-mono)", fontSize:".58rem", color:"var(--t4)",
            flexShrink:0, display:"flex", gap:14,
          }}>
            <span>{activeNote.word_count||0} 字</span>
            {activeNote.updated_at&&<span>{new Date(activeNote.updated_at).toLocaleString("zh-TW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>}
          </div>
        </>)}
      </div>
    </div>
  );
}

window.NotesView = NotesView;
})();
