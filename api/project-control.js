module.exports = async function handler(req, res) {

  if (req.query && req.query.action === 'clients') {
    var notionToken = process.env.NOTION_TOKEN;
    var projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";

    var headers = {
      Authorization: "Bearer " + notionToken,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    function getProp(page, key) {
      var p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return (p.title||[]).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "rich_text") return (p.rich_text||[]).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "status") return (p.status && p.status.name) || "";
      if (p.type === "number") return p.number != null ? p.number : 0;
      if (p.type === "checkbox") return p.checkbox || false;
      if (p.type === "date") return (p.date && p.date.start) || "";
      if (p.type === "formula") {
        var f = p.formula;
        if (f.type === "number") return f.number != null ? f.number : 0;
        if (f.type === "string") return f.string || "";
      }
      if (p.type === "rollup") {
        var r = p.rollup;
        if (r.type === "number") return r.number != null ? r.number : 0;
      }
      return "";
    }

    try {
      var all = [], cursor;

      while (true) {
        var body = {page_size: 100};
        if (cursor) body.start_cursor = cursor;

        var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body)
        });

        var data = await resp.json();
        all = all.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
      }

      var clients = all.map(function(p) {
        return {
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
          status: getProp(p, "Status Project"),
        };
      }).filter(function(c){ return c.nama; });

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);

    } catch(e) {
      res.status(200).json([]);
    }

    return;
  }

  var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}body{padding:1.25rem}.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;background:transparent}.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}.guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}.guide.active{display:block}.prev{white-space:pre-wrap}.btn.ok{background:#0f3d1f!important;border-color:#27500A!important}</style></head><body>"

  + "<script>"

/* ================= TAMBAHAN (HANYA INI) ================= */
  + "function decodeText(str){try{return JSON.parse('\"'+str.replace(/\"/g,'\\\\\"')+'\"')}catch(e){return str}}"

/* ================= KODE ASLI ANDA ================= */
  + "var M={};var C=[],R={};"

  + "function gR(){var n=document.getElementById('inp-nama').value.trim();var k=document.getElementById('inp-kat').value;var p=document.getElementById('prev-review');if(!n){p.className='prev';p.textContent='Ketik nama client untuk generate pesan...';R.review='';return;}var msg=(M['review_'+k]||'').replace('{nama}',n);R.review=msg;p.className='prev on';p.textContent=decodeText(msg);}"

  + "function gM(tab,nama){var p=document.getElementById('prev-'+tab);if(!nama){p.className='prev';p.textContent='Pilih client untuk generate pesan...';R[tab]='';return;}var c=C.find(function(x){return x.nama===nama;});if(!c)return;var msg=(M[tab]||'').replace('{nama}',c.nama);R[tab]=msg;p.className='prev on';p.textContent=decodeText(msg);}"

  + "function cp(tab){var msg=R[tab];if(!msg)return;navigator.clipboard.writeText(decodeText(msg));}"

  + "</script></body></html>";

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
