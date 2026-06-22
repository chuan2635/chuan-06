export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SYMBOLS = ['^TWII','^DJI','^GSPC','^IXIC','^SOX','^VIX','USDTWD=X','TSM','^TNX','GC=F'];
  const META = {
    '^TWII':    { zh: '台股加權',     cat: 'tw',        unit: 'pts' },
    '^DJI':     { zh: '道瓊工業',     cat: 'us',        unit: 'pts' },
    '^GSPC':    { zh: 'S&P 500',      cat: 'us',        unit: 'pts' },
    '^IXIC':    { zh: 'NASDAQ',       cat: 'us',        unit: 'pts' },
    '^SOX':     { zh: '費城半導體',   cat: 'semi',      unit: 'pts' },
    '^VIX':     { zh: 'VIX 恐慌指數', cat: 'risk',      unit: '' },
    'USDTWD=X': { zh: '美元/台幣',    cat: 'fx',        unit: 'TWD' },
    'TSM':      { zh: '台積電 ADR',   cat: 'semi',      unit: 'USD' },
    '^TNX':     { zh: '10Y 美債殖利率', cat: 'rates',   unit: '%' },
    'GC=F':     { zh: '黃金',         cat: 'commodity', unit: 'USD' },
  };

  try {
    const symbols = SYMBOLS.join(',');
    const r = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!r.ok) throw new Error(`Yahoo Finance HTTP ${r.status}`);

    const json = await r.json();
    const quotes = json?.quoteResponse?.result || [];

    const data = quotes.map(q => ({
      symbol: q.symbol,
      zh:     META[q.symbol]?.zh   || q.symbol,
      cat:    META[q.symbol]?.cat  || 'other',
      unit:   META[q.symbol]?.unit ?? '',
      price:  q.regularMarketPrice,
      change: q.regularMarketChange,
      pct:    q.regularMarketChangePercent,
      currency: q.currency,
      state:  q.marketState,
      time:   (q.regularMarketTime || 0) * 1000,
    }));

    res.status(200).json({ ok: true, data, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, ts: Date.now() });
  }
}
