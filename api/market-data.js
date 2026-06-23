export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SYMBOLS = [
    { symbol: '^TWII',    zh: '台股加權',       cat: 'tw' },
    { symbol: '^DJI',     zh: '道瓊工業',       cat: 'us' },
    { symbol: '^GSPC',    zh: 'S&P 500',        cat: 'us' },
    { symbol: '^IXIC',    zh: 'NASDAQ',         cat: 'us' },
    { symbol: '^SOX',     zh: '費城半導體',     cat: 'semi' },
    { symbol: '^VIX',     zh: 'VIX 恐慌指數',   cat: 'risk' },
    { symbol: 'USDTWD=X', zh: '美元/台幣',      cat: 'fx' },
    { symbol: 'TSM',      zh: '台積電 ADR',     cat: 'semi' },
    { symbol: '^TNX',     zh: '10Y 美債殖利率', cat: 'rates' },
    { symbol: 'GC=F',     zh: '黃金',           cat: 'commodity' },
  ];

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  };

  // v8/finance/chart is more reliable than v7/quote — works without crumb cookie
  async function fetchOne({ symbol, zh, cat }) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d&includePrePost=true`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(7000) });
      if (!r.ok) return { symbol, zh, cat, price: null, _err: `HTTP ${r.status}` };

      const json = await r.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) return { symbol, zh, cat, price: null, _err: 'no meta' };

      const price = meta.regularMarketPrice ?? meta.price;
      const prev  = meta.previousClose ?? meta.chartPreviousClose;
      const change = (price != null && prev != null) ? price - prev : null;
      const pct    = (change != null && prev)        ? (change / prev) * 100 : null;

      return {
        symbol, zh, cat,
        price, change, pct,
        currency: meta.currency,
        state: meta.marketState,
        time: (meta.regularMarketTime || 0) * 1000,
      };
    } catch (e) {
      return { symbol, zh, cat, price: null, _err: e.message };
    }
  }

  const results = await Promise.all(SYMBOLS.map(fetchOne));
  const data = results.filter(r => r.price != null);

  if (!data.length) {
    return res.status(503).json({
      ok: false,
      error: 'Yahoo Finance 暫時無法取得資料，請稍後重試',
      debug: results.map(r => ({ symbol: r.symbol, err: r._err })),
      ts: Date.now(),
    });
  }

  res.status(200).json({ ok: true, data, partial: data.length < SYMBOLS.length, ts: Date.now() });
}
