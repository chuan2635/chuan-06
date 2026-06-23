export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=30');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ ok: false, error: '缺少 symbols 參數' });

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const symList = symbols.split(',').slice(0, 30).map(s => s.trim()).filter(Boolean);
  if (!symList.length) return res.status(400).json({ ok: false, error: '無效的 symbols' });

  try {
    const encoded = symList.map(s => encodeURIComponent(s)).join(',');
    const url = `https://stooq.com/q/l/?s=${encoded}&f=sd2t2ohlcv&e=json`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://stooq.com/', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Stooq HTTP ${r.status}`);
    const j = await r.json();

    const data = (j?.symbols || []).map(q => {
      const price  = q.close;
      const open   = q.open;
      const change = (open > 0) ? price - open : null;
      const pct    = (change != null && open > 0) ? (change / open) * 100 : null;
      return { symbol: q.symbol, price, change, pct, volume: q.volume, date: q.date };
    });

    return res.status(200).json({ ok: true, data, ts: Date.now() });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, ts: Date.now() });
  }
}
