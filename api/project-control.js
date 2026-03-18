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
        if (r.type === "array" && r.array && r.array[0]) {
          var first = r.array[0];
          if (first.type === "select") return (first.select && first.select.name) || "";
          if (first.type === "number") return first.number != null ? first.number : 0;
        }
      }
      return "";
    }
    try {
      var all = [], cursor;
      while (true) {
        var body = {page_size: 100};
        if (cursor) body.start_cursor = cursor;
        var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
          method: "POST", headers: headers, body: JSON.stringify(body)
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

  // --- HTML UI DENGAN DARK MODE ---
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3; overflow:hidden} /* Hidden overflow prevent scroll */
  body{padding:0.75rem}
  
  .tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:0.75rem}
  .tab{font-size:11px;padding:4px 10px;border-radius:5px;border:1px solid #333;color:#888;cursor:pointer;background:transparent;transition: 0.2s}
  .tab.active{background:#232323;color:#fff;border-color:#378ADD;font-weight:500}
  
  .guide{border-left:4px solid;border-radius:0 8px 8px 0;padding:12px 15px;display:none;background:#202020}
  .guide.active{display:flex; gap:20px; align-items: flex-start} /* Flex row layout */
  
  /* Kolom Kiri: Instruksi */
  .col-info{flex: 1; min-width: 250px}
  .todo{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.4;margin-bottom:6px;color:#aaa}
  .box{width:13px;height:13px;border-radius:3px;border:1.5px solid currentColor;flex-shrink:0;margin-top:2px;opacity:.5}
  
  /* Kolom Kanan: Generator */
  .col-gen{flex: 1.2; border-left: 1px solid #333; padding-left: 20px}
  .lbl{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;color:#666}
  
  .inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:7px 10px;outline:none;margin-bottom:8px;color:#eee}
  .row{display:flex;gap:6px;margin-bottom:8px}
  .row .inp{margin-bottom:0}
  
  .prev{background:#151515;border:1px solid #333;border-radius:6px;padding:10px;margin-bottom:8px;max-height:80px;overflow-y:auto;font-size:12px;line-height:1.5;color:#888;font-style:italic}
  .prev.on{font-style:normal;color:#ddd;border-color:#444}
  
  .btn{width:100%;padding:8px;background:#252525;border:1px solid #444;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;color:#eee;transition:0.2s}
  .btn.ok{background:#0f3d1f!important;border-color:#27500A!important}
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .prev::-webkit-scrollbar { display: none; }
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="sw('review',this)">Review</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab" onclick="sw('overdue',this)">Overdue</div>
  <div class="tab" onclick="sw('diproses',this)">Diproses</div>
  <div class="tab" onclick="sw('pelunasan',this)">Pelunasan</div>
  <div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="g-review" class="guide active" style="border-color:#378ADD">
  <div class="col-info">
    <div style="font-size:10px;font-weight:700;color:#378ADD;margin-bottom:2px">TAHAP 2</div>
    <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#eee">Pastikan Data Benar</div>
    <div class="todo"><div class="box"></div><span>Cek Paket, Layanan, & Aplikasi</span></div>
    <div class="todo"><div class="box"></div><span>Set Antrian & isi Tanggal DP</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <div class="row">
      <input id="inp-nama" class="inp" type="text" placeholder="Nama..." oninput="gR()">
      <select id="inp-kat" class="inp" onchange="gR()" style="flex:0 0 100px">
        <option value="kerjasama">Kerjasama</option>
        <option value="umum">Umum</option>
      </select>
    </div>
    <div id="prev-review" class="prev">Ketik nama...</div>
    <button class="btn" id="btn-review" onclick="cp('review')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922">
  <div class="col-info">
    <div style="font-size:14px;font-weight:600;margin-bottom:10px">DP Masuk</div>
    <div class="todo"><div class="box"></div><span>Konfirmasi registrasi client</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-antrian" class="prev">Pilih client...</div>
    <button class="btn" id="btn-antrian" onclick="cp('antrian')">📋 Copy Pesan</button>
  </div>
</div>
</script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
