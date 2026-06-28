/* ── Cards View ───────────────────────────────────────────────
   卡片集合：自訂欄位、看板式管理
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useMemo } = React;

const SB_LABEL = {
  fontFamily:"var(--font-mono)",fontSize:".56rem",letterSpacing:".16em",
  textTransform:"uppercase",color:"var(--t3)",padding:"16px 14px 6px",
};

function ColItem({ col, active, count, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:9, padding:"8px 12px",
      borderRadius:7, cursor:"pointer", marginBottom:1, transition:"all .12s",
      background:active?"rgba(184,128,74,.1)":"transparent",
      color:active?"var(--acc)":"var(--t2)",
      borderLeft:active?"2px solid var(--acc)":"2px solid transparent",
      paddingLeft:active?"10px":"12px",
    }}>
      <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",opacity:.65,flexShrink:0}}>⊞</span>
      <span style={{flex:1,fontSize:".85rem",fontWeight:500,letterSpacing:"-.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{col.name}</span>
      <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",minWidth:18,textAlign:"center",
        background:active?"rgba(184,128,74,.2)":"var(--b1)",color:active?"var(--acc)":"var(--t3)",
        padding:"1px 6px",borderRadius:10}}>
        {count}
      </span>
    </div>
  );
}

function CardsView() {
  const [collections, setCollections] = useState([]);
  const [cards,       setCards]       = useState([]);
  const [activeCol,   setActiveCol]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [dbErr,       setDbErr]       = useState(null);
  const [showNewCol,  setShowNewCol]  = useState(false);
  const [newColName,  setNewColName]  = useState("");
  const [editCard,    setEditCard]    = useState(null);

  const load = useCallback(async () => {
    try {
      const cols = await wsDB.list("card_collections", {}, { order: "sort_order.asc" });
      setCollections(cols);
      if (cols.length > 0 && !activeCol) setActiveCol(cols[0].id);
      const cs = await wsDB.list("cards", {}, { order: "sort_order.asc" });
      setCards(cs);
    } catch(e) {
      setDbErr("卡片資料表尚未建立，請先在 Supabase 執行 schema.sql");
    } finally { setLoading(false); }
  }, [activeCol]);

  useEffect(() => { load(); }, []);

  const col      = useMemo(() => collections.find(c => c.id === activeCol), [collections, activeCol]);
  const colCards = useMemo(() => cards.filter(c => c.collection_id === activeCol), [cards, activeCol]);
  const schema   = col?.fields_schema || [];

  const createCollection = useCallback(async () => {
    if (!newColName.trim()) return;
    try {
      const c = await wsDB.insert("card_collections", {
        name: newColName.trim(), icon: "⊞",
        fields_schema: [
          { key: "name",   label: "名稱", type: "text" },
          { key: "status", label: "狀態", type: "text" },
          { key: "notes",  label: "備註", type: "text" },
        ],
        sort_order: Date.now(),
      });
      setCollections(prev => [...prev, c]);
      setActiveCol(c.id);
      setNewColName(""); setShowNewCol(false);
    } catch(e) { console.error(e); }
  }, [newColName]);

  const createCard = useCallback(async () => {
    if (!activeCol) return;
    try {
      const fields = {};
      schema.forEach(f => { fields[f.key] = ""; });
      fields.name = "新卡片";
      const c = await wsDB.insert("cards", { collection_id: activeCol, fields, sort_order: Date.now() });
      setCards(prev => [...prev, c]);
      setEditCard(c);
    } catch(e) { console.error(e); }
  }, [activeCol, schema]);

  const saveCard = useCallback(async (id, fields) => {
    try {
      await wsDB.update("cards", id, { fields });
      setCards(prev => prev.map(c => c.id === id ? { ...c, fields } : c));
      setEditCard(null);
    } catch(e) { console.error(e); }
  }, []);

  const deleteCard = useCallback(async (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (editCard?.id === id) setEditCard(null);
    try { await wsDB.remove("cards", id); } catch(e) { console.error(e); }
  }, [editCard]);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",
      color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".78rem"}}>載入中…</div>
  );
  if (dbErr) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - var(--hh))",
      flexDirection:"column",gap:12,color:"var(--t3)",fontFamily:"var(--font-mono)",fontSize:".75rem",textAlign:"center",padding:"2rem"}}>
      <span style={{fontSize:"1.5rem",opacity:.3}}>⚠</span>{dbErr}
    </div>
  );

  return (
    <div style={{display:"flex",height:"calc(100vh - var(--hh))",overflow:"hidden"}}>

      {/* ── Collection sidebar ── */}
      <div style={{
        width:200, flexShrink:0, background:"var(--sf)",
        borderRight:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflowY:"auto",
      }}>
        <div style={SB_LABEL}>卡片集合</div>
        <div style={{padding:"0 8px", flex:1}}>
          {collections.map(c => (
            <ColItem key={c.id} col={c} active={activeCol===c.id}
              count={cards.filter(cd => cd.collection_id===c.id).length}
              onClick={() => setActiveCol(c.id)}
            />
          ))}
          {collections.length === 0 && (
            <div style={{padding:"1rem .8rem",fontFamily:"var(--font-mono)",fontSize:".68rem",color:"var(--t4)",textAlign:"center"}}>
              尚無集合
            </div>
          )}
        </div>

        <div style={{padding:"12px 10px"}}>
          {showNewCol ? (
            <div style={{display:"flex",gap:4}}>
              <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") createCollection(); if(e.key==="Escape") setShowNewCol(false); }}
                placeholder="集合名稱"
                style={{flex:1,padding:"7px 10px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf2)",outline:"none",color:"var(--t1)",fontFamily:"var(--font-ui)"}}
              />
              <button onClick={createCollection}
                style={{padding:"7px 10px",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={() => setShowNewCol(true)}
              style={{
                width:"100%",padding:9,borderRadius:7,border:"1.5px dashed var(--b2)",
                color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent",
                letterSpacing:"-.01em",fontFamily:"var(--font-ui)",transition:"border-color .15s,color .15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
            >+ 新增集合</button>
          )}
        </div>
      </div>

      {/* ── Card grid ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--sf2)"}}>
        <div style={{
          padding:"14px 20px 12px", borderBottom:"1px solid var(--b1)",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
          background:"var(--sf)",
        }}>
          <span style={{fontFamily:"var(--font-serif)",fontSize:"1rem",color:"var(--t1)",letterSpacing:"-.01em"}}>
            {col?.name || "選擇集合"}
          </span>
          {col && (
            <button onClick={createCard}
              style={{
                padding:"5px 14px",borderRadius:6,border:"1px solid var(--acc)",
                background:"var(--acc)",color:"#fff",fontSize:".78rem",cursor:"pointer",
                fontFamily:"var(--font-ui)",fontWeight:500,letterSpacing:"-.01em",transition:"all .15s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--acc2)";e.currentTarget.style.borderColor="var(--acc2)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--acc)";e.currentTarget.style.borderColor="var(--acc)";}}
            >+ 新增卡片</button>
          )}
        </div>

        {!col ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:8,color:"var(--t3)"}}>
            <span style={{fontSize:"1.8rem",opacity:.2}}>⊞</span>
            <span style={{fontFamily:"var(--font-mono)",fontSize:".75rem"}}>建立或選擇一個卡片集合</span>
          </div>
        ) : colCards.length === 0 ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:8,color:"var(--t3)"}}>
            <span style={{fontSize:"1.8rem",opacity:.2}}>◻</span>
            <span style={{fontFamily:"var(--font-mono)",fontSize:".75rem"}}>點擊「新增卡片」開始建立</span>
          </div>
        ) : (
          <div style={{
            flex:1, overflowY:"auto", padding:"1.4rem 1.6rem",
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:"1rem", alignContent:"start",
          }}>
            {colCards.map(card => (
              <CardTile key={card.id} card={card} schema={schema}
                active={editCard?.id===card.id} onClick={() => setEditCard(card)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit panel ── */}
      {editCard && (
        <div style={{
          width:300, flexShrink:0, background:"var(--sf)",
          borderLeft:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflow:"hidden",
        }}>
          <div style={{
            padding:"14px 16px 12px", borderBottom:"1px solid var(--b1)",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
          }}>
            <span style={{fontFamily:"var(--font-serif)",fontSize:".95rem",color:"var(--t1)"}}>編輯卡片</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={() => deleteCard(editCard.id)}
                style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".7rem",color:"var(--t3)",background:"transparent",cursor:"pointer",fontFamily:"var(--font-ui)",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(135,32,32,.3)";e.currentTarget.style.color="var(--red)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
              >刪除</button>
              <button onClick={() => setEditCard(null)}
                style={{padding:"4px 8px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".78rem",color:"var(--t3)",background:"transparent",cursor:"pointer",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--b1)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
              >✕</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
            <CardEditForm card={editCard} schema={schema} onSave={saveCard} />
          </div>
        </div>
      )}
    </div>
  );
}

function CardTile({ card, schema, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:"var(--sf)", border:"1px solid var(--b1)",
        borderRadius:10, padding:"14px 16px", cursor:"pointer",
        transition:"box-shadow .15s, border-color .15s",
        boxShadow:hover||active?"var(--shm)":"var(--sh)",
        borderColor:active?"var(--acc)":hover?"var(--b2)":"var(--b1)",
      }}
    >
      <div style={{fontWeight:600,fontSize:".88rem",color:"var(--t1)",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"var(--font-ui)",letterSpacing:"-.01em"}}>
        {card.fields?.name || "未命名"}
      </div>
      {schema.filter(f => f.key !== "name").slice(0, 3).map(f => (
        <div key={f.key} style={{display:"flex",gap:8,marginBottom:4,alignItems:"baseline"}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t4)",minWidth:36,flexShrink:0}}>{f.label}</span>
          <span style={{fontSize:".75rem",color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.fields?.[f.key]||"—"}</span>
        </div>
      ))}
    </div>
  );
}

function CardEditForm({ card, schema, onSave }) {
  const [fields, setFields] = useState({ ...card.fields });
  const set = (k, v) => setFields(prev => ({ ...prev, [k]: v }));

  const LBL = {display:"block",fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)",marginBottom:5,textTransform:"uppercase",letterSpacing:".1em"};
  const INP = {width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid var(--b2)",fontSize:".84rem",background:"var(--sf2)",outline:"none",color:"var(--t1)",fontFamily:"var(--font-ui)",boxSizing:"border-box",transition:"border-color .15s"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {schema.map(f => (
        <div key={f.key}>
          <label style={LBL}>{f.label}</label>
          <input value={fields[f.key]||""} onChange={e => set(f.key, e.target.value)}
            style={INP}
            onFocus={e=>{e.target.style.borderColor="var(--acc)";}}
            onBlur={e=>{e.target.style.borderColor="var(--b2)";}}
          />
        </div>
      ))}
      <button onClick={() => onSave(card.id, fields)}
        style={{
          marginTop:4, padding:"9px", borderRadius:7,
          background:"var(--acc)", color:"#fff", fontSize:".84rem",
          border:"none", cursor:"pointer", fontWeight:500,
          fontFamily:"var(--font-ui)", letterSpacing:"-.01em", transition:"background .15s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="var(--acc2)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="var(--acc)";}}
      >儲存變更</button>
    </div>
  );
}

window.CardsView = CardsView;
})();
