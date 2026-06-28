/* ── Charts View ──────────────────────────────────────────────
   圖表：市場數據視覺化、自訂圖表
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useRef, useCallback } = React;

const PRESETS = [
  { id: "market",        icon: "∿",  label: "台股大盤",  desc: "加權指數走勢" },
  { id: "sectors",       icon: "◫",  label: "類股強弱",  desc: "各類股漲跌比較" },
  { id: "institutional", icon: "◈",  label: "三大法人",  desc: "外資投信自營商" },
  { id: "portfolio",     icon: "⊞",  label: "個股追蹤",  desc: "自選股表現" },
];

const SB_LABEL = {
  fontFamily:"var(--font-mono)",fontSize:".56rem",letterSpacing:".16em",
  textTransform:"uppercase",color:"var(--t3)",padding:"16px 14px 6px",
};

function PresetItem({ p, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:9, padding:"8px 12px",
      borderRadius:7, cursor:"pointer", marginBottom:1, transition:"all .12s",
      background:active?"rgba(184,128,74,.1)":"transparent",
      color:active?"var(--acc)":"var(--t2)",
      borderLeft:active?"2px solid var(--acc)":"2px solid transparent",
      paddingLeft:active?"10px":"12px",
    }}>
      <span style={{fontFamily:"var(--font-mono)",fontSize:".78rem",opacity:.65,flexShrink:0}}>{p.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:".85rem",fontWeight:500,letterSpacing:"-.01em",fontFamily:"var(--font-ui)"}}>{p.label}</div>
        <div style={{fontSize:".65rem",color:"var(--t3)",fontFamily:"var(--font-mono)",marginTop:1}}>{p.desc}</div>
      </div>
    </div>
  );
}

function MarketTile({ d }) {
  const chg = parseFloat(d.change_pct) || 0;
  const pos = chg >= 0;
  return (
    <div style={{
      background:"var(--sf)",border:"1px solid var(--b1)",borderRadius:9,
      padding:"14px 16px",transition:"box-shadow .15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--shm)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}
    >
      <div style={{fontFamily:"var(--font-mono)",fontSize:".58rem",color:"var(--t4)",marginBottom:3,letterSpacing:".04em"}}>{d.symbol}</div>
      <div style={{fontFamily:"var(--font-serif)",fontSize:".95rem",color:"var(--t1)",marginBottom:6,letterSpacing:"-.01em"}}>{d.name||d.symbol}</div>
      <div style={{fontFamily:"var(--font-mono)",fontSize:".82rem",color:pos?"var(--done)":"var(--red)",fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:".65rem"}}>{pos?"▲":"▼"}</span>
        {Math.abs(chg).toFixed(2)}%
      </div>
      <div style={{fontFamily:"var(--font-mono)",fontSize:".75rem",color:"var(--t2)",marginTop:2}}>{d.price}</div>
    </div>
  );
}

function ChartsView() {
  const [activePreset, setActivePreset] = useState("market");
  const [marketData,   setMarketData]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  const fetchMarket = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/market-data");
      if (!r.ok) throw new Error("無法取得市場數據");
      const j = await r.json();
      setMarketData(j?.data || []);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activePreset === "market" || activePreset === "institutional") {
      fetchMarket();
    }
  }, [activePreset]);

  useEffect(() => {
    if (!marketData || !chartRef.current) return;
    if (typeof Chart === "undefined") return;

    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }

    const items = marketData.filter(d =>
      ["^TWII","^DJI","^GSPC","^IXIC","^SOX"].includes(d.symbol)
    );
    const labels  = items.map(d => d.name || d.symbol);
    const changes = items.map(d => parseFloat(d.change_pct) || 0);
    const colors  = changes.map(v => v >= 0 ? "rgba(61,112,80,.72)" : "rgba(135,32,32,.72)");
    const borders = changes.map(v => v >= 0 ? "#3D7050" : "#872020");

    chartInst.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "漲跌幅 (%)",
          data: changes,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          borderRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor:"rgba(14,13,11,.88)",
            titleFont:{ family:"'DM Mono',monospace", size:11 },
            bodyFont:{ family:"'DM Mono',monospace", size:12 },
            padding:10,
            cornerRadius:7,
            callbacks: {
              label: ctx => `  ${ctx.parsed.y >= 0 ? "+" : ""}${ctx.parsed.y.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { display:false },
            ticks: { font:{ family:"'DM Mono',monospace", size:11 }, color:"var(--t3)" },
            border: { color:"var(--b2)" },
          },
          y: {
            grid: { color:"var(--b1)", drawBorder:false },
            ticks: {
              font: { family:"'DM Mono',monospace", size:10 },
              color: "var(--t3)",
              callback: v => (v >= 0 ? "+" : "") + v.toFixed(1) + "%",
            },
            border: { display:false },
          },
        },
      },
    });

    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, [marketData]);

  const noChart = typeof Chart === "undefined";
  const active  = PRESETS.find(p => p.id === activePreset);

  return (
    <div style={{display:"flex",height:"calc(100vh - var(--hh))",overflow:"hidden"}}>

      {/* ── Left sidebar ── */}
      <div style={{
        width:200, flexShrink:0, background:"var(--sf)",
        borderRight:"1px solid var(--b1)", display:"flex", flexDirection:"column", overflowY:"auto",
      }}>
        <div style={SB_LABEL}>圖表類型</div>
        <div style={{padding:"0 8px"}}>
          {PRESETS.map(p => (
            <PresetItem key={p.id} p={p} active={activePreset===p.id} onClick={() => setActivePreset(p.id)} />
          ))}
        </div>
      </div>

      {/* ── Chart area ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--sf2)"}}>

        {/* header */}
        <div style={{
          padding:"14px 20px 12px", borderBottom:"1px solid var(--b1)",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
          background:"var(--sf)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"var(--font-mono)",fontSize:".8rem",color:"var(--acc)",opacity:.8}}>{active?.icon}</span>
            <span style={{fontFamily:"var(--font-serif)",fontSize:"1rem",color:"var(--t1)",letterSpacing:"-.01em"}}>{active?.label}</span>
          </div>
          <button onClick={fetchMarket} disabled={loading}
            style={{
              padding:"5px 12px",borderRadius:6,border:"1px solid var(--b2)",
              fontSize:".72rem",color:"var(--t3)",background:"transparent",cursor:"pointer",
              fontFamily:"var(--font-mono)",opacity:loading?.5:1,transition:"all .15s",
            }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.borderColor="var(--acc)";e.currentTarget.style.color="var(--acc)";} }}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b2)";e.currentTarget.style.color="var(--t3)";}}
          >{loading ? "更新中…" : "↻ 更新"}</button>
        </div>

        <div style={{flex:1,padding:"1.4rem 1.6rem",overflowY:"auto"}}>

          {/* Chart.js missing warning */}
          {noChart && (
            <div style={{
              background:"rgba(135,96,32,.05)",border:"1px solid rgba(135,96,32,.15)",
              borderRadius:9,padding:"14px 16px",marginBottom:16,
              fontFamily:"var(--font-mono)",fontSize:".72rem",color:"var(--amber)",lineHeight:1.65,
            }}>
              ⚠ 需要 Chart.js CDN — 請在 index.html 的 head 加入：<br/>
              <code style={{color:"var(--acc)",display:"block",marginTop:6,fontSize:".68rem",letterSpacing:".01em"}}>
                &lt;script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"&gt;&lt;/script&gt;
              </code>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              background:"var(--red-bg)",border:"1px solid rgba(135,32,32,.15)",
              borderRadius:8,padding:"12px 16px",marginBottom:14,
              fontFamily:"var(--font-mono)",fontSize:".75rem",color:"var(--red)",
            }}>
              {error}
            </div>
          )}

          {/* Loading shimmer */}
          {loading && !marketData && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{background:"var(--sf)",border:"1px solid var(--b1)",borderRadius:9,padding:"14px 16px",height:82,opacity:.5}}/>
              ))}
            </div>
          )}

          {/* Market tiles */}
          {marketData && !loading && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
              {marketData.slice(0, 8).map(d => <MarketTile key={d.symbol} d={d} />)}
            </div>
          )}

          {/* Bar chart */}
          {!noChart && (
            <div style={{background:"var(--sf)",border:"1px solid var(--b1)",borderRadius:10,padding:"18px 20px"}}>
              <div style={{
                fontFamily:"var(--font-mono)",fontSize:".6rem",color:"var(--t3)",
                marginBottom:14,textTransform:"uppercase",letterSpacing:".14em",
              }}>漲跌幅比較</div>
              <div style={{height:260}}>
                <canvas ref={chartRef}/>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !marketData && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:240,flexDirection:"column",gap:8,color:"var(--t3)"}}>
              <span style={{fontFamily:"var(--font-mono)",fontSize:"1.6rem",opacity:.2}}>∿</span>
              <span style={{fontFamily:"var(--font-mono)",fontSize:".75rem"}}>點擊「更新」載入市場數據</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ChartsView = ChartsView;
})();
