/* ── Agent Execution Engine ──────────────────────────────────
   POST /api/agent-run
   Body: { agent_id, input, trigger_type? }
   Runs the agent with Gemini Function Calling, up to 4 tool rounds.
──────────────────────────────────────────────────────────── */
const SURL  = process.env.SUPABASE_URL  || "https://hrxyylqngkubruivwsdm.supabase.co";
const SKEY  = process.env.SUPABASE_KEY  || "sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O";
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const WS    = "main";

const UA    = "Mozilla/5.0 (compatible; AgentBot/1.0)";
const BASE  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/* ── Supabase helpers ──────────────────────────────────────── */
function dbHdr() {
  return { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
}
async function dbGet(table, id) {
  const r = await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}&workspace=eq.${WS}`, { headers: dbHdr() });
  const rows = await r.json(); return rows[0] || null;
}
async function dbInsert(table, data) {
  const r = await fetch(`${SURL}/rest/v1/${table}`, {
    method: "POST", headers: dbHdr(), body: JSON.stringify({ workspace: WS, ...data }),
  });
  const rows = await r.json(); return rows[0];
}
async function dbPatch(table, id, data) {
  await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}&workspace=eq.${WS}`, {
    method: "PATCH", headers: dbHdr(), body: JSON.stringify(data),
  });
}
async function dbList(table, filters, opts) {
  const q = Object.entries(filters||{}).map(([k,v])=>`${k}=eq.${v}`).join("&");
  const extra = opts?.order ? `&order=${opts.order}` : "";
  const url = `${SURL}/rest/v1/${table}?workspace=eq.${WS}${q?"&"+q:""}${extra}`;
  const r = await fetch(url, { headers: dbHdr() }); return r.json();
}

/* ── Tool definitions (Gemini Function Calling format) ─────── */
const TOOL_DEFS = {
  market_data: {
    name: "get_market_data",
    description: "取得即時台灣股市及國際市場數據，包括台加權、道瓊、S&P500、NASDAQ、費半、VIX、台積電ADR、10Y美債、黃金、美元台幣",
    parameters: { type: "object", properties: {}, required: [] },
  },
  news: {
    name: "get_news",
    description: "取得今日重要財經及國際新聞，涵蓋兩岸地緣政治、總體經濟、半導體科技產業、台灣國內政經四大類",
    parameters: { type: "object", properties: {}, required: [] },
  },
  institutional: {
    name: "get_institutional_data",
    description: "取得台股三大法人（外資、投信、自營商）今日買賣超資料",
    parameters: { type: "object", properties: {}, required: [] },
  },
  todos_write: {
    name: "create_todo",
    description: "建立一個待辦事項",
    parameters: {
      type: "object",
      properties: {
        title:    { type: "string",  description: "待辦事項標題" },
        notes:    { type: "string",  description: "備註說明" },
        due_date: { type: "string",  description: "截止日期 YYYY-MM-DD 格式" },
        priority: { type: "string",  description: "優先度：urgent / high / mid / low", enum: ["urgent","high","mid","low"] },
      },
      required: ["title"],
    },
  },
  notes_write: {
    name: "create_note",
    description: "建立一篇筆記",
    parameters: {
      type: "object",
      properties: {
        title:   { type: "string", description: "筆記標題" },
        content: { type: "string", description: "筆記內容（支援 Markdown）" },
      },
      required: ["title", "content"],
    },
  },
  notes_read: {
    name: "read_notes",
    description: "讀取工作空間中的筆記",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "最多讀取幾筆，預設10" },
      },
      required: [],
    },
  },
  cards_read: {
    name: "read_cards",
    description: "讀取卡片集合中的資料",
    parameters: {
      type: "object",
      properties: {
        collection_name: { type: "string", description: "卡片集合名稱" },
      },
      required: [],
    },
  },
};

/* ── Tool executor ─────────────────────────────────────────── */
async function executeTool(toolName, args, agentId) {
  const h = { "User-Agent": UA };
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  switch (toolName) {
    case "get_market_data": {
      const r = await fetch(`${origin}/api/market-data`, { headers: h });
      const j = await r.json();
      return JSON.stringify(j?.data || [], null, 2);
    }
    case "get_news": {
      const r = await fetch(`${origin}/api/news`, { headers: h });
      const j = await r.json();
      const lines = Object.entries(j||{}).map(([,cat])=>{
        const items = (cat.items||[]).slice(0,3).map(it=>`  • ${it.title}`).join("\n");
        return `【${cat.label}】\n${items}`;
      });
      return lines.join("\n\n");
    }
    case "get_institutional_data": {
      const r = await fetch(`${origin}/api/institutional`, { headers: h });
      const j = await r.json();
      return JSON.stringify(j?.data?.slice(0,15)||[], null, 2);
    }
    case "create_todo": {
      const inboxList = await dbList("todo_lists", { system_key: "inbox" });
      const listId = inboxList?.[0]?.id || null;
      const todo = await dbInsert("todos", {
        list_id: listId, title: args.title, notes: args.notes||null,
        due_date: args.due_date||null, priority: args.priority||"mid",
        status: "pending", created_by: agentId, sort_order: Date.now(),
      });
      return `已建立待辦事項：「${todo.title}」（id: ${todo.id}）`;
    }
    case "create_note": {
      const note = await dbInsert("notes", {
        title: args.title, content: args.content, is_quick_note: true,
        created_by: agentId, word_count: (args.content||"").length,
      });
      return `已建立筆記：「${note.title}」（id: ${note.id}）`;
    }
    case "read_notes": {
      const ns = await dbList("notes", {}, { order: "updated_at.desc" });
      const slice = (ns||[]).slice(0, args.limit||10);
      return slice.map(n=>`[${n.title}]\n${(n.content||"").slice(0,200)}`).join("\n\n---\n\n");
    }
    case "read_cards": {
      const colls = await dbList("card_collections", {});
      const target = args.collection_name
        ? colls.find(c=>c.name.includes(args.collection_name))
        : colls[0];
      if (!target) return "找不到符合的卡片集合";
      const cards = await dbList("cards", { collection_id: target.id }, { order: "sort_order.asc" });
      return `集合「${target.name}」共 ${cards.length} 筆：\n`+
        (cards||[]).slice(0,20).map(c=>JSON.stringify(c.fields)).join("\n");
    }
    default:
      return `未知工具：${toolName}`;
  }
}

/* ── Main handler ──────────────────────────────────────────── */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ ok: false, error: "Method not allowed" });

  if (!GEMINI_KEY) return res.status(500).json({ ok: false, error: "GEMINI_API_KEY 未設定" });

  const { agent_id, input, trigger_type = "manual" } = req.body || {};
  if (!agent_id || !input) return res.status(400).json({ ok: false, error: "缺少 agent_id 或 input" });

  /* 讀取 Agent 設定 */
  const agent = await dbGet("ai_agents", agent_id);
  if (!agent) return res.status(404).json({ ok: false, error: "找不到 Agent" });

  /* 建立執行記錄 */
  const run = await dbInsert("agent_runs", {
    agent_id, trigger_type, status: "running",
    input: { text: input }, started_at: new Date().toISOString(),
  });

  /* 更新 agent 狀態 */
  await dbPatch("ai_agents", agent_id, { status: "running" });

  const toolCallLog = [];
  let totalTokens   = 0;
  let finalText     = "";

  try {
    /* 篩選允許的工具 */
    const allowedTools = (agent.tools_allowed || []);
    const declarations = allowedTools
      .map(t => TOOL_DEFS[t])
      .filter(Boolean)
      .map(td => ({ name: td.name, description: td.description, parameters: td.parameters }));

    /* Gemini 對話歷史 */
    const contents = [
      { role: "user", parts: [{ text: input }] }
    ];

    const MAX_ROUNDS = 4;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const body = {
        system_instruction: agent.system_prompt
          ? { parts: [{ text: agent.system_prompt }] }
          : undefined,
        contents,
        tools: declarations.length > 0 ? [{ functionDeclarations: declarations }] : undefined,
        generationConfig: { temperature: 0.5, maxOutputTokens: 1500 },
      };

      const gr = await fetch(`${BASE}?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(18000),
      });

      if (!gr.ok) {
        const errText = await gr.text();
        throw new Error(`Gemini HTTP ${gr.status}: ${errText.slice(0, 300)}`);
      }

      const gj   = await gr.json();
      const cand = gj?.candidates?.[0];
      totalTokens += gj?.usageMetadata?.totalTokenCount || 0;

      if (!cand?.content?.parts) {
        finalText = "(Gemini 未回傳內容)";
        break;
      }

      /* Check for function calls */
      const fnCalls = cand.content.parts.filter(p => p.functionCall);
      if (fnCalls.length === 0) {
        finalText = cand.content.parts.filter(p => p.text).map(p => p.text).join("").trim();
        break;
      }

      /* Execute tool calls */
      contents.push({ role: "model", parts: cand.content.parts });

      const toolResponses = await Promise.all(fnCalls.map(async (part) => {
        const { name, args } = part.functionCall;
        const ts = new Date().toISOString();
        let result;
        try {
          result = await executeTool(name, args || {}, agent_id);
        } catch(e) {
          result = `工具執行失敗：${e.message}`;
        }
        toolCallLog.push({ tool: name, args, result: result.slice(0, 500), ts });
        return { functionResponse: { name, response: { result } } };
      }));

      contents.push({ role: "user", parts: toolResponses });
    }

    /* 儲存成功結果 */
    await dbPatch("agent_runs", run.id, {
      status: "done",
      output: { text: finalText },
      tool_calls: toolCallLog,
      tokens_used: totalTokens,
      finished_at: new Date().toISOString(),
    });
    await dbPatch("ai_agents", agent_id, { status: "idle", last_run_at: new Date().toISOString() });

    return res.status(200).json({ ok: true, run_id: run.id, output: finalText, tool_calls: toolCallLog });

  } catch (e) {
    await dbPatch("agent_runs", run.id, {
      status: "error", output: { error: e.message }, finished_at: new Date().toISOString(),
    });
    await dbPatch("ai_agents", agent_id, { status: "error", last_error: e.message });
    return res.status(500).json({ ok: false, error: e.message });
  }
}
