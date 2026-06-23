export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const META = {
    '^TW20': { sym: '^TWII', zh: '台股加權',       cat: 'tw',        dec: 2 },
    '^DJI':  { sym: '^DJI',  zh: '道瓊工業',       cat: 'us',        dec: 2 },
    '^SPX':  { sym: '^GSPC', zh: 'S&P 500',        cat: 'us',        dec: 2 },
    '^NDQ':  { sym: '^IXIC', zh: 'NASDAQ',         cat: 'us',        dec: 2 },
    '^SOX':  { sym: '^SOX',  zh: '費城半導體',     cat: 'semi',      dec: 2 },
    '^VIX':  { sym: '^VIX',  zh: 'VIX 恐慌指數',   cat: 'risk',      dec: 2 },
    'TSM.US':{ sym: 'TSM',   zh: '台積電 ADR',     cat: 'semi',      dec: 2 },
    '^TNX':  { sym: '^TNX',  zh: '10Y 美債殖利率', cat: 'rates',     dec: 3 },
    'GC.F':  { sym: 'GC=F',  zh: '黃金',           cat: 'commodity', dec: 2 },
  };

  function makeItem(m, price, open) {
    const change = (open > 0) ? price - open : null;
    const pct    = (change != null && open > 0) ? (change / open) * 100 : null;
    return { symbol: m.sym, zh: m.zh, cat: m.cat, price, change, pct, state: 'REGULAR', time: Date.now() };
  }

  // Stooq batch — ^ must be URL-encoded; &h is CSV-only and causes 404 for JSON
  async function fetchStooq() {
    const syms = '%5Etw20,%5Edji,%5Espx,%5Endq,%5Esox,%5Evix,tsm.us,%5Etnx,gc.f';
    const url  = `https://stooq.com/q/l/?s=${syms}&f=sd2t2ohlcv&e=json`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://stooq.com/', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Stooq HTTP ${r.status}`);
    const j = await r.json();
    const raw = j?.symbols || [];
    if (!raw.length) throw new Error('Stooq empty response');
    return raw.map(q => {
      const m = META[q.symbol?.toUpperCase()];
      if (!m || !(q.close > 0)) return null;
      return makeItem(m, q.close, q.open ?? 0);
    }).filter(Boolean);
  }

  // Yahoo Finance v8 chart — fallback, per-symbol parallel
  async function fetchYahoo() {
    const pairs = [
      ['%5ETWII', '^TW20'], ['%5EDJI',  '^DJI'],  ['%5EGSPC', '^SPX'],
      ['%5EIXIC', '^NDQ'],  ['%5ESOX',  '^SOX'],  ['%5EVIX',  '^VIX'],
      ['TSM',     'TSM.US'],['%5ETNX',  '^TNX'],  ['GC%3DF',  'GC.F'],
    ];
    const results = await Promise.allSettled(pairs.map(async ([enc, metaKey]) => {
      const r = await fetch(
        `https://query2.finance.yahoo.com/v8/finance/chart/${enc}?interval=1d&range=2d`,
        { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(7000) }
      );
      if (!r.ok) return null;
      const j  = await r.json();
      const mt = j?.chart?.result?.[0]?.meta;
      if (!mt?.regularMarketPrice) return null;
      const m   = META[metaKey];
      if (!m) return null;
      const open = mt.regularMarketOpen ?? mt.previousClose ?? 0;
      return makeItem(m, mt.regularMarketPrice, open);
    }));
    return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  }

  // ExchangeRate-API for USD/TWD
  async function fetchUSDTWD() {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.rates?.TWD ?? null;
  }

  try {
    let [data, twd] = await Promise.all([
      fetchStooq().catch(() => fetchYahoo()),
      fetchUSDTWD(),
    ]);

    if (twd) {
      data.push({ symbol: 'USDTWD=X', zh: '美元/台幣', cat: 'fx', price: twd, change: null, pct: null, state: 'REGULAR', time: Date.now() });
    }

    if (!data.length) {
      return res.status(503).json({ ok: false, error: '市場資料暫時無法取得，請稍後重試', ts: Date.now() });
    }

    res.status(200).json({ ok: true, data, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, ts: Date.now() });
  }
}
