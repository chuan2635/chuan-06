export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY 未設定' });

  const { market = [], news = {} } = req.body || {};

  // Build market snapshot text
  const mktLines = market.map(d => {
    const chg = d.pct != null ? `${d.pct >= 0 ? '+' : ''}${d.pct.toFixed(2)}%` : '—';
    return `${d.zh}（${d.symbol}）：${d.price}  ${chg}`;
  }).join('\n');

  // Build top news headlines
  const newsLines = Object.entries(news).map(([, cat]) => {
    const titles = (cat.items || []).slice(0, 3).map(it => `  ・${it.title.replace(/ - [^-]+$/, '')}`).join('\n');
    return `【${cat.label}】\n${titles}`;
  }).join('\n');

  const prompt = `你是一位專業的台灣股市分析師。以下是今日即時市場數據與國際新聞摘要，請根據這些資訊進行分析。

=== 即時市場數據 ===
${mktLines || '（無資料）'}

=== 今日重要新聞 ===
${newsLines || '（無資料）'}

請以 JSON 格式回覆，欄位如下（用繁體中文，精簡扼要）：
{
  "bias": "偏多" | "中性" | "偏空",
  "summary": "一句話點出今日最關鍵的市場方向（20字以內）",
  "bull_reasons": ["多方理由1", "多方理由2"],
  "bear_reasons": ["空方理由1", "空方理由2"],
  "risks": ["需關注風險1", "需關注風險2"],
  "focus": "今日開盤前最需要關注的一件事（30字以內）"
}

只回傳 JSON，不要其他文字。`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ ok: false, error: `Gemini 錯誤: ${err.slice(0, 200)}` });
    }

    const j = await r.json();
    const raw = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ ok: false, error: 'Gemini 未回傳有效 JSON' });

    const analysis = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ok: true, data: analysis, ts: Date.now() });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
