/* ── YC Workspace DB helpers ─────────────────────────────────
   Plain JS (no Babel needed). Loaded before view scripts.
   Exposes window.wsDB with CRUD helpers for all workspace tables.
──────────────────────────────────────────────────────────── */
(function () {
  var SURL = "https://hrxyylqngkubruivwsdm.supabase.co";
  var SKEY = "sb_publishable_-ShQ0-R3viUcSxjy0o-oeA_GnPuB8_O";
  var WS   = "main";

  function hdr(extra) {
    return Object.assign({
      apikey: SKEY,
      Authorization: "Bearer " + SKEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }, extra || {});
  }

  function buildQuery(filters, opts) {
    var parts = ["workspace=eq." + WS];
    if (filters) {
      Object.keys(filters).forEach(function (k) {
        var v = filters[k];
        if (v === null)           parts.push(k + "=is.null");
        else if (v === "__notnull__") parts.push(k + "=not.is.null");
        else if (Array.isArray(v))  parts.push(k + "=in.(" + v.join(",") + ")");
        else                        parts.push(k + "=eq." + encodeURIComponent(v));
      });
    }
    if (opts && opts.order)  parts.push("order="  + opts.order);
    if (opts && opts.limit)  parts.push("limit="  + opts.limit);
    if (opts && opts.select) parts.push("select=" + opts.select);
    return parts.join("&");
  }

  window.wsDB = {
    WS: WS,

    list: async function (table, filters, opts) {
      var url = SURL + "/rest/v1/" + table + "?" + buildQuery(filters, opts);
      var r = await fetch(url, { headers: hdr() });
      if (!r.ok) {
        var t = await r.text();
        throw new Error("[wsDB.list:" + table + "] " + r.status + " " + t);
      }
      return r.json();
    },

    get: async function (table, id) {
      var url = SURL + "/rest/v1/" + table + "?id=eq." + id + "&workspace=eq." + WS;
      var r = await fetch(url, { headers: hdr() });
      if (!r.ok) { var t = await r.text(); throw new Error("[wsDB.get:" + table + "] " + r.status + " " + t); }
      var rows = await r.json();
      return rows[0] || null;
    },

    insert: async function (table, data) {
      var body = Object.assign({ workspace: WS }, data);
      var r = await fetch(SURL + "/rest/v1/" + table, {
        method: "POST",
        headers: hdr(),
        body: JSON.stringify(body),
      });
      if (!r.ok) { var t = await r.text(); throw new Error("[wsDB.insert:" + table + "] " + r.status + " " + t); }
      var rows = await r.json();
      return rows[0];
    },

    update: async function (table, id, data) {
      var r = await fetch(
        SURL + "/rest/v1/" + table + "?id=eq." + id + "&workspace=eq." + WS,
        { method: "PATCH", headers: hdr(), body: JSON.stringify(data) }
      );
      if (!r.ok) { var t = await r.text(); throw new Error("[wsDB.update:" + table + "] " + r.status + " " + t); }
      var rows = await r.json();
      return rows[0];
    },

    remove: async function (table, id) {
      var r = await fetch(
        SURL + "/rest/v1/" + table + "?id=eq." + id + "&workspace=eq." + WS,
        { method: "DELETE", headers: hdr({ Prefer: "return=minimal" }) }
      );
      if (!r.ok) { var t = await r.text(); throw new Error("[wsDB.remove:" + table + "] " + r.status + " " + t); }
      return true;
    },

    uid: function () {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    },
  };
})();
