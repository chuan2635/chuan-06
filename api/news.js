function extractTag(xml, name) {
  const cd = new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>`, 'i').exec(xml);
  if (cd) return cd[1].trim();
  const pl = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i').exec(xml);
  return pl ? pl[1].replace(/<[^>]+>/g, '').trim() : '';
}

function parseItems(xml, limit = 10) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const raw = m[1];
    const title = extractTag(raw, 'title');
    if (!title) continue;
    items.push({
      title,
      link:    extractTag(raw, 'link'),
      pubDate: extractTag(raw, 'pubDate'),
      source:  extractTag(raw, 'source'),
    });
  }
  return items;
}

async function fetchFeed(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    return parseItems(await r.text());
  } catch {
    return [];
  }
}

const CATEGORIES = {
  geopolitical: {
    label: '兩岸地緣政治',
    feeds: [
      'https://news.google.com/rss/search?q=Taiwan+China+military+strait+PLA&hl=en&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=US+Taiwan+China+geopolitics+relations&hl=en&gl=US&ceid=US:en',
    ],
  },
  economic: {
    label: '總體經濟指標',
    feeds: [
      'https://news.google.com/rss/search?q=Federal+Reserve+interest+rate+inflation+economy&hl=en&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=US+China+trade+tariff+export+controls+2025&hl=en&gl=US&ceid=US:en',
    ],
  },
  semiconductor: {
    label: '半導體/科技產業',
    feeds: [
      'https://news.google.com/rss/search?q=TSMC+Taiwan+Semiconductor+Manufacturing&hl=en&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=AI+chip+Nvidia+semiconductor+supply+chain+Taiwan&hl=en&gl=US&ceid=US:en',
    ],
  },
  domestic: {
    label: '台灣國內政經',
    feeds: [
      'https://news.google.com/rss/search?q=台股+外資+三大法人+買賣超&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
      'https://news.google.com/rss/search?q=台灣+財政+政策+經濟+產業&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    ],
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const result = {};

  await Promise.all(
    Object.entries(CATEGORIES).map(async ([key, { label, feeds }]) => {
      const batches = await Promise.all(feeds.map(fetchFeed));
      const seen = new Set();
      const items = batches
        .flat()
        .filter(it => {
          if (!it.title || seen.has(it.title)) return false;
          seen.add(it.title);
          return true;
        })
        .slice(0, 10);
      result[key] = { label, items };
    })
  );

  res.status(200).json({ ok: true, data: result, ts: Date.now() });
}
