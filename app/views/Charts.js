/* ── Charts View ──────────────────────────────────────────────
   圖表：市場數據視覺化、自訂圖表
──────────────────────────────────────────────────────────── */
(function () {
const { useState, useEffect, useRef, useCallback } = React;

const PRESETS = [
  { id: "market",      icon: "📈", label: "台股大盤",    desc: "加權指數走勢" },
  { id: "sectors",     icon: "🏭", label: "類股強弱",    desc: "各類股漲跌比較" },
  { id: "institutional", icon: "🏦", label: "三大法人",  desc: "外資投信自營商" },
  { id: "portfolio",   icon: "💼", label: "個股追蹤",    desc: "自選股表現" },
];

function ChartsView() {
  const [activePreset, setActivePreset] = useState("market");
  const [marketData,   setMarketData]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const chartRef = useRef(null);
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
    const labels = items.map(d => d.name || d.symbol);
    const changes = items.map(d => parseFloat(d.change_pct) || 0);
    const colors = changes.map(v => v >= 0 ? "rgba(77,122,90,.75)" : "rgba(139,37,37,.75)");
    const borders = changes.map(v => v >= 0 ? "#4D7A5A" : "#8B2525");

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
            callbacks: {
              label: ctx => `${ctx.parsed.y >= 0 ? "+" : ""}${ctx.parsed.y.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "'DM Mono',monospace", size: 11 }, color: "#A09890" } },
          y: {
            grid: { color: "rgba(0,0,0,.05)" },
            ticks: {
              font: { family: "'DM Mono',monospace", size: 10 },
              color: "#A09890",
              callback: v => (v >= 0 ? "+" : "") + v.toFixed(1) + "%",
            },
          },
        },
      },
    });

    return () => { if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; } };
  }, [marketData]);

  const noChart = typeof Chart === "undefined";

  return (
    <div style={{display:"flex",height:"calc(100vh - 56px)",overflow:"hidden"}}>

      {/* ── Left sidebar ── */}
      <div style={{width:210,flexShrink:0,background:"var(--sf2)",borderRight:"1px solid var(--b1)",display:"flex",flexDirection:"column",padding:".7rem .5rem",overflowY:"auto"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",color:"var(--t3)",padding:".4rem .65rem .3rem",marginBottom:".15rem"}}>圖表類型</div>
        {PRESETS.map(p => {
          const on = activePreset === p.id;
          return (
            <div key={p.id} onClick={() => setActivePreset(p.id)} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".58rem .65rem",borderRadius:7,cursor:"pointer",background:on?"rgba(201,146,79,.1)":"transparent",color:on?"var(--acc)":"var(--t2)",marginBottom:2,transition:"all .15s"}}>
              <span style={{fontSize:".88rem"}}>{p.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:".85rem",fontWeight:500}}>{p.label}</div>
                <div style={{fontSize:".62rem",color:"var(--t3)"}}>{p.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chart area ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--sf)"}}>
        <div style={{padding:".85rem 1.4rem .7rem",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.05rem",color:"var(--t1)"}}>
            {PRESETS.find(p => p.id === activePreset)?.label}
          </span>
          <button onClick={fetchMarket} disabled={loading}
            style={{padding:".28rem .7rem",borderRadius:6,border:"1px solid var(--b2)",fontSize:".73rem",color:"var(--t3)",background:"transparent",cursor:"pointer",opacity:loading?.5:1}}>
            {loading ? "更新中…" : "↻ 更新"}
          </button>
        </div>

        <div style={{flex:1,padding:"1.4rem 1.8rem",overflowY:"auto"}}>
          {noChart && (
            <div style={{background:"var(--sf2)",border:"1px solid var(--b1)",borderRadius:10,padding:"1.2rem 1.4rem",marginBottom:"1.2rem",fontFamily:"'DM Mono',monospace",fontSize:".73rem",color:"var(--t3)"}}>
              ⚠ 需要 Chart.js CDN。請在 index.html 的 head 加入：<br/>
              <code style={{color:"var(--acc)",fontSize:".7rem"}}>&lt;script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"&gt;&lt;/script&gt;</code>
            </div>
          )}

          {error && (
            <div style={{background:"rgba(139,37,37,.07)",border:"1px solid rgba(139,37,37,.15)",borderRadius:8,padding:"1rem 1.2rem",marginBottom:"1rem",fontFamily:"'DM Mono',monospace",fontSize:".75rem",color:"#8B2525"}}>
              {error}
            </div>
          )}

          {marketData && !loading && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:".8rem",marginBottom:"1.6rem"}}>
              {marketData.slice(0, 8).map(d => {
                const chg = parseFloat(d.change_pct) || 0;
                const pos = chg >= 0;
                return (
                  <div key={d.symbol} style={{background:"var(--sf2)",border:"1px solid var(--b1)",borderRadius:9,padding:".85rem 1rem"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:".6rem",color:"var(--t3)",marginBottom:".2rem"}}>{d.symbol}</div>
                    <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1rem",color:"var(--t1)"}}>{d.name||d.symbol}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:".82rem",color:pos?"#4D7A5A":"#8B2525",marginTop:".25rem",fontWeight:500}}>
                      {pos?"▲":"▼"} {Math.abs(chg).toFixed(2)}%
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:".72rem",color:"var(--t2)"}}>{d.price}</div>
                  </div>
                );
              })}
            </div>
          )}

          {!noChart && (
            <div style={{background:"var(--sf2)",border:"1px solid var(--b1)",borderRadius:10,padding:"1.2rem 1.4rem"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:".62rem",color:"var(--t3)",marginBottom:".8rem",textTransform:"uppercase",letterSpacing:".12em"}}>漲跌幅比較</div>
              <div style={{height:280}}>
                <canvas ref={chartRef}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ChartsView = ChartsView;
})();
