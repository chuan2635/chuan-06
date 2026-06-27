/* ── Cards View ───────────────────────────────────────────────
   卡片集合：自訂欄位、看板式管理
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useCallback, useMemo } = React;

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

  const col = useMemo(() => collections.find(c => c.id === activeCol), [collections, activeCol]);
  const colCards = useMemo(() => cards.filter(c => c.collection_id === activeCol), [cards, activeCol]);

  const createCollection = useCallback(async () => {
    if (!newColName.trim()) return;
    try {
      const c = await wsDB.insert("card_collections", {
        name: newColName.trim(), icon: "◫",
        fields_schema: [
          { key: "name",   label: "名稱",   type: "text" },
          { key: "status", label: "狀態",   type: "text" },
          { key: "notes",  label: "備註",   type: "text" },
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
      const schema = col?.fields_schema || [];
      const fields = {};
      schema.forEach(f => { fields[f.key] = ""; });
      fields.name = "新卡片";
      const c = await wsDB.insert("cards", {
        collection_id: activeCol, fields, sort_order: Date.now(),
      });
      setCards(prev => [...prev, c]);
      setEditCard(c);
    } catch(e) { console.error(e); }
  }, [activeCol, col]);

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

  if (loading) return <div style={{padding:"3rem",textAlign:"center",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".8rem"}}>載入中…</div>;
  if (dbErr)   return <div style={{padding:"3rem",textAlign:"center",color:"var(--t2)",fontFamily:"'DM Mono',monospace",fontSize:".78rem",lineHeight:1.8}}><div style={{fontSize:"2rem",marginBottom:"1rem",opacity:.4}}>⚠</div><div>{dbErr}</div></div>;

  const schema = col?.fields_schema || [];

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>

      {/* ── Collection sidebar ── */}
      <div style={{width:210,flexShrink:0,background:"var(--sf2)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",padding:".7rem .5rem",overflowY:"auto"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginBottom:".15rem"}}>卡片集合</div>

        {collections.map(c => {
          const on = activeCol === c.id;
          const cnt = cards.filter(cd => cd.collection_id === c.id).length;
          return (
            <div key={c.id} onClick={() => setActiveCol(c.id)} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".58rem .65rem",borderRadius:7,cursor:"pointer",background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",marginBottom:2,transition:"all .15s"}}>
              <span style={{fontSize:".88rem"}}>{c.icon||"◫"}</span>
              <span style={{flex:1,fontSize:".85rem",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",background:"var(--b1)",color:"var(--t3)",padding:"1px 6px",borderRadius:10}}>{cnt}</span>
            </div>
          );
        })}

        <div style={{marginTop:"auto",paddingTop:".65rem"}}>
          {showNewCol ? (
            <div style={{display:"flex",gap:".3rem",padding:"0 .3rem"}}>
              <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") createCollection(); if(e.key==="Escape") setShowNewCol(false); }}
                placeholder="集合名稱"
                style={{flex:1,padding:".38rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".8rem",background:"var(--sf)",outline:"none",color:"var(--t1)"}}
              />
              <button onClick={createCollection} style={{padding:".38rem .6rem",borderRadius:6,background:"var(--acc)",color:"#fff",fontSize:".78rem",border:"none",cursor:"pointer"}}>+</button>
            </div>
          ) : (
            <button onClick={() => setShowNewCol(true)} style={{width:"100%",padding:".5rem",borderRadius:7,border:"1.5px dashed var(--b2)",color:"var(--t3)",fontSize:".78rem",cursor:"pointer",background:"transparent"}}>
              + 新增集合
            </button>
          )}
        </div>
      </div>

      {/* ── Card grid ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:".85rem 1.2rem .7rem",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.05rem",color:"var(--t1)"}}>{col?.name||"選擇集合"}</span>
          {col && <button onClick={createCard} style={{padding:".3rem .8rem",borderRadius:6,border:"1px solid var(--b2)",background:"var(--acc)",color:"#fff",fontSize:".78rem",cursor:"pointer"}}>+ 新增卡片</button>}
        </div>

        {!col ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".78rem"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"2rem",opacity:.3,marginBottom:".8rem"}}>◫</div>建立或選擇一個卡片集合</div>
          </div>
        ) : colCards.length === 0 ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--t3)",fontFamily:"'DM Mono',monospace",fontSize:".78rem"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:"2rem",opacity:.3,marginBottom:".8rem"}}>＋</div>點擊「新增卡片」開始建立</div>
          </div>
        ) : (
          <div style={{flex:1,overflowY:"auto",padding:"1.2rem 1.4rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1rem",alignContent:"start"}}>
            {colCards.map(card => (
              <div key={card.id} onClick={() => setEditCard(card)}
                style={{background:"var(--sf2)",border:"1px solid var(--b1)",borderRadius:10,padding:"1rem 1.1rem",cursor:"pointer",transition:"box-shadow .15s",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                <div style={{fontWeight:600,fontSize:".88rem",color:"var(--t1)",marginBottom:".5rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {card.fields?.name || "未命名"}
                </div>
                {schema.filter(f => f.key !== "name").slice(0,3).map(f => (
                  <div key={f.key} style={{display:"flex",gap:".4rem",marginBottom:".2rem"}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)",minWidth:40}}>{f.label}</span>
                    <span style={{fontSize:".72rem",color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.fields?.[f.key]||"—"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit card panel ── */}
      {editCard && (
        <div style={{width:320,flexShrink:0,background:"var(--sf)",borderLeft:"1px solid var(--b1)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:".85rem 1rem .7rem",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",color:"var(--t1)"}}>編輯卡片</span>
            <div style={{display:"flex",gap:".4rem"}}>
              <button onClick={() => deleteCard(editCard.id)} style={{padding:".25rem .6rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".72rem",color:"var(--t3)",background:"transparent",cursor:"pointer"}}>刪除</button>
              <button onClick={() => setEditCard(null)} style={{padding:".25rem .5rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".75rem",color:"var(--t3)",background:"transparent",cursor:"pointer"}}>✕</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"1rem"}}>
            <CardEditForm card={editCard} schema={schema} onSave={saveCard} />
          </div>
        </div>
      )}
    </div>
  );
}

function CardEditForm({ card, schema, onSave }) {
  const [fields, setFields] = React.useState({ ...card.fields });
  const set = (k, v) => setFields(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
      {schema.map(f => (
        <div key={f.key}>
          <label style={{display:"block",fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".1em"}}>{f.label}</label>
          <input value={fields[f.key]||""} onChange={e => set(f.key, e.target.value)}
            style={{width:"100%",padding:".42rem .7rem",borderRadius:7,border:"1px solid var(--b2)",fontSize:".84rem",background:"var(--sf2)",outline:"none",color:"var(--t1)"}}
          />
        </div>
      ))}
      <button onClick={() => onSave(card.id, fields)}
        style={{marginTop:".5rem",padding:".5rem",borderRadius:7,background:"var(--acc)",color:"#fff",fontSize:".82rem",border:"none",cursor:"pointer",fontWeight:500}}>
        儲存
      </button>
    </div>
  );
}

window.CardsView = CardsView;
})();
