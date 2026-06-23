export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  // Stooq symbol → display meta mapping (symbol keys are uppercase as Stooq returns them)
  const META = {
    '^TW20': { sym: '^TWII',    zh: '台股加權',       cat: 'tw',        dec: 2 },
    '^DJI':  { sym: '^DJI',     zh: '道瓊工業',       cat: 'us',        dec: 2 },
    '^SPX':  { sym: '^GSPC',    zh: 'S&P 500',        cat: 'us',        dec: 2 },
    '^NDQ':  { sym: '^IXIC',    zh: 'NASDAQ',         cat: 'us',        dec: 2 },
    '^SOX':  { sym: '^SOX',     zh: '費城半導體',     cat: 'semi',      dec: 2 },
    '^VIX':  { sym: '^VIX',     zh: 'VIX 恐慌指數',   cat: 'risk',      dec: 2 },
    'TSM.US':{ sym: 'TSM',      zh: '台積電 ADR',     cat: 'semi',      dec: 2 },
    '^TNX':  { sym: '^TNX',     zh: '10Y 美債殖利率', cat: 'rates',     dec: 3 },
    'GC.F':  { sym: 'GC=F',     zh: '黃金',           cat: 'commodity', dec: 2 },
  };

  // Stooq batch quote — one request for all symbols
  async function fetchStooq() {
    const syms = '^tw20,^dji,^spx,^ndq,^sox,^vix,tsm.us,^tnx,gc.f';
    const url  = `https://stooq.com/q/l/?s=${syms}&f=sd2t2ohlcv&h&e=json`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://stooq.com/', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Stooq HTTP ${r.status}`);
    const j = await r.json();
    return j?.symbols || [];
  }

  // ExchangeRate-API for USD/TWD — free, no auth, daily rate
  async function fetchUSDTWD() {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.rates?.TWD ?? null;
  }

  try {
    const [quotes, twd] = await Promise.all([fetchStooq(), fetchUSDTWD()]);

    const data = quotes
      .map(q => {
        const m = META[q.symbol?.toUpperCase()];
        if (!m || q.close == null || q.close <= 0) return null;
        const price  = q.close;
        const open   = q.open;
        // Change vs. today's open (intraday); prev-close not available in Stooq's /l endpoint
        const change = (open != null && open > 0) ? price - open : null;
        const pct    = (change != null && open > 0) ? (change / open) * 100 : null;
        return { symbol: m.sym, zh: m.zh, cat: m.cat, price, change, pct, currency: 'USD', state: 'REGULAR', time: Date.now() };
      })
      .filter(Boolean);

    // Append USD/TWD from ExchangeRate-API
    if (twd) {
      data.push({ symbol: 'USDTWD=X', zh: '美元/台幣', cat: 'fx', price: twd, change: null, pct: null, currency: 'TWD', state: 'REGULAR', time: Date.now() });
    }

    if (!data.length) {
      return res.status(503).json({ ok: false, error: 'Stooq 暫時無法連線，請稍後重試', ts: Date.now() });
    }

    res.status(200).json({ ok: true, data, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, ts: Date.now() });
  }
}
