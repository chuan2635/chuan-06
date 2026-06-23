export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  async function fetchTWSE(daysBack = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const dateStr = d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const url = `https://www.twse.com.tw/rwd/zh/fund/T86?response=json&date=${dateStr}&selectType=ALLBUT0999`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.twse.com.tw/' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.stat !== 'OK' || !j.data?.length) return null;
    return j;
  }

  try {
    // Try today, then go back up to 4 days (weekends/holidays)
    let j = null;
    for (let i = 0; i <= 4; i++) {
      j = await fetchTWSE(i);
      if (j) break;
    }
    if (!j) return res.status(503).json({ ok: false, error: '無法取得近期法人資料', ts: Date.now() });

    const clean = n => {
      if (!n || n === '--' || n === ' ') return 0;
      return parseInt(String(n).replace(/,/g, '')) || 0;
    };

    const rows = j.data.map(row => ({
      code:        row[0]?.trim(),
      name:        row[1]?.trim(),
      foreign_net: clean(row[10]),  // 外資及陸資買賣超
      trust_net:   clean(row[13]),  // 投信買賣超
      dealer_net:  clean(row[22]),  // 自營商買賣超
      total_net:   clean(row[23]),  // 三大法人買賣超
    })).filter(r => r.code && r.code !== '合計');

    // Sort by absolute total net buy/sell
    rows.sort((a, b) => Math.abs(b.total_net) - Math.abs(a.total_net));

    // Also compute market totals
    const totals = rows.reduce((acc, r) => ({
      foreign: acc.foreign + r.foreign_net,
      trust:   acc.trust   + r.trust_net,
      dealer:  acc.dealer  + r.dealer_net,
      total:   acc.total   + r.total_net,
    }), { foreign: 0, trust: 0, dealer: 0, total: 0 });

    return res.status(200).json({
      ok: true,
      date: j.date,
      totals,
      top_buy:  rows.filter(r => r.total_net > 0).slice(0, 20),
      top_sell: rows.filter(r => r.total_net < 0).slice(0, 20),
      ts: Date.now(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, ts: Date.now() });
  }
}
