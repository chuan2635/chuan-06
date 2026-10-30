// YC Studio 資料層（LINE Bot 用）— 與網頁 index.html 的「一案件一列」格式相容
// 列：NS+"meta"、NS+"proj:<id>"，data={_rev, ord, deleted?, v}；寫入以 _rev 條件更新（比對版本才寫）
// 草稿（待確認記錄）獨立存成 NS+"pend:<id>" 列，不再塞進案件資料
// 自動判斷：有 NS+"meta" 列 → 新格式；沒有 → 舊格式（單列 main），所以可先部署、遷移後自動切換
export const PEND_TTL_MS = 30 * 60 * 1000;

export function uid() { return Math.random().toString(36).slice(2, 10); }

export function createStore({ SURL, SKEY, NS = '', LEGACY_ID = 'main' }) {
  const enc = encodeURIComponent;
  async function sb(q, opt = {}) {
    const r = await fetch(`${SURL}/rest/v1/studio_data${q}`, {
      ...opt,
      headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, 'Content-Type': 'application/json', ...(opt.headers || {}) }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text().catch(() => '')).slice(0, 120)}`);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  }
  const now = () => new Date().toISOString();
  let modeP = null;
  const mode = () => (modeP ||= sb(`?id=eq.${enc(NS + 'meta')}&select=id`).then(r => (r && r.length ? 'v2' : 'legacy')));

  // ── 案件 ──
  async function listProjects() {
    if (await mode() === 'v2') {
      const rows = await sb(`?id=like.${enc(NS + 'proj:')}*&select=id,data`);
      return (rows || []).filter(r => !r.data.deleted && r.data.v).sort((a, b) => a.data.ord - b.data.ord).map(r => r.data.v);
    }
    const r = await sb(`?id=eq.${enc(LEGACY_ID)}&select=data`);
    return (r && r[0] && r[0].data && r[0].data.projects) || [];
  }
  // fn(project) 直接修改案件並可回傳額外結果；回傳 null = 找不到案件
  async function mutateProject(projectId, fn) {
    if (await mode() === 'v2') {
      const id = NS + 'proj:' + projectId;
      for (let i = 0; i < 6; i++) {
        const r = await sb(`?id=eq.${enc(id)}&select=data`);
        const d = r && r[0] && r[0].data;
        if (!d || d.deleted || !d.v) return null;
        const out = fn(d.v);
        const ok = await sb(`?id=eq.${enc(id)}&data->>_rev=eq.${d._rev}&select=id`, {
          method: 'PATCH', headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ data: { _rev: d._rev + 1, ord: d.ord, v: d.v }, updated_at: now() })
        });
        if (ok && ok.length) return { project: d.v, out };
      }
      throw new Error('資料同時被修改，請再傳一次');
    }
    const r = await sb(`?id=eq.${enc(LEGACY_ID)}&select=data`);
    const data = r && r[0] && r[0].data;
    const proj = data && (data.projects || []).find(p => p.id === projectId);
    if (!proj) return null;
    const out = fn(proj);
    await sb('', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id: LEGACY_ID, data, updated_at: now() }) });
    return { project: proj, out };
  }

  // ── 草稿（兩種格式都用獨立列）──
  const pid = id => NS + 'pend:' + id;
  const alive = d => d && !d.deleted && Date.now() - new Date(d.createdAt) < PEND_TTL_MS;
  async function pendPut(rec) {
    await sb('?select=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify([{ id: pid(rec.id), data: rec, updated_at: now() }]) });
  }
  async function pendGet(id) {
    const r = await sb(`?id=eq.${enc(pid(id))}&select=data`);
    const d = r && r[0] && r[0].data;
    return alive(d) ? d : null;
  }
  async function pendUpdate(id, patch) {
    const cur = await pendGet(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    await sb(`?id=eq.${enc(pid(id))}`, { method: 'PATCH', body: JSON.stringify({ data: next, updated_at: now() }) });
    return next;
  }
  // 取走草稿（只有一個呼叫會成功，避免連按確認而重複寫入）
  async function pendClaim(id) {
    const cur = await pendGet(id);
    if (!cur) return null;
    const r = await sb(`?id=eq.${enc(pid(id))}&data->>deleted=is.null&select=id`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ data: { deleted: true }, updated_at: now() })
    });
    return r && r.length ? cur : null;
  }
  async function pendEditing(userId) {
    const rows = await sb(`?id=like.${enc(NS + 'pend:')}*&data->>userId=eq.${enc(userId)}&data->>editing=eq.true&data->>deleted=is.null&select=data`);
    return ((rows || []).map(r => r.data).filter(alive).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))[0] || null;
  }

  return { mode, listProjects, mutateProject, pendPut, pendGet, pendUpdate, pendClaim, pendEditing };
}

// ── 把確認的草稿寫進案件 ──
export function applyConfirm(proj, pending, { fmtDate, today }) {
  const fi = [];
  const pi = p => (p === 'high' ? '🔴' : p === 'mid' ? '🟡' : '⚪');
  for (const a of pending.actions) {
    if (a.type === 'comm' && a.note) {
      proj.comms = proj.comms || [];
      proj.comms.push({ id: uid(), who: a.who || '業主', note: a.note, ch: a.ch || 'Line', date: a.date || today });
      fi.push({ icon: '📝', text: (a.who || '業主') + '：' + a.note });
    }
    if (a.type === 'todo' && a.text) {
      proj.todos = proj.todos || [];
      proj.todos.push({ id: uid(), text: a.text, done: false, due: a.due || '', prio: a.prio || 'mid', note: '' });
      fi.push({ icon: pi(a.prio), text: a.text + (a.due ? '（' + fmtDate(a.due) + '）' : '') });
    }
  }
  return fi;
}

// ── 套用對既有記錄的修改 ──
export function applyMods(proj, mods, { fmtDate }) {
  const applied = [];
  for (const m of mods) {
    const idx = m.recordIndex;
    if (m.recordType === 'todo') {
      const todos = proj.todos || [];
      if (m.action === 'done' && todos[idx]) { todos[idx].done = true; applied.push({ ...m, newText: todos[idx].text + ' ✅' }); }
      else if (m.action === 'delete' && todos[idx]) { applied.push({ ...m, newText: '已刪除：' + todos[idx].text }); todos.splice(idx, 1); }
      else if (m.action === 'edit' && todos[idx]) {
        if (m.changes?.text) todos[idx].text = m.changes.text;
        if (m.changes?.due) todos[idx].due = m.changes.due;
        if (m.changes?.done !== undefined) todos[idx].done = m.changes.done;
        applied.push({ ...m, newText: todos[idx].text + (todos[idx].due ? '（截止 ' + fmtDate(todos[idx].due) + '）' : '') });
      }
    }
    if (m.recordType === 'comm') {
      const comms = proj.comms || [];
      if (m.action === 'delete' && comms[idx]) { applied.push({ ...m, newText: '已刪除：' + comms[idx].note }); comms.splice(idx, 1); }
      else if (m.action === 'edit' && comms[idx]) {
        if (m.changes?.note) comms[idx].note = m.changes.note;
        if (m.changes?.who) comms[idx].who = m.changes.who;
        applied.push({ ...m, newText: comms[idx].note });
      }
    }
  }
  return applied;
}
