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
      if (p.type === "number") return p.number != null ? p.number : 0;
      if (p.type === "formula") {
        var f = p.formula;
        if (f.type === "number") return f.number != null ? f.number : 0;
        if (f.type === "string") return f.string || "";
      }
      return "";
    }

    try {
      var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({page_size: 100})
      });

      var data = await resp.json();

      var clients = (data.results || []).map(function(p) {
        return {
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
          status: getProp(p, "Status Project") // ✅ TAMBAHAN
        };
      }).filter(function(c){ return c.nama; });

      res.setHeader("Content-Type", "application/json");
      res.status(200).json(clients);

    } catch(e) {
      res.status(200).json([]);
    }

    return;
  }

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{padding:1.25rem}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;background:transparent}
.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
.guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}
.guide.active{display:block}
.inp{width:100%;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;padding:7px 10px;margin-bottom:8px;color:inherit}
</style></head><body>

<div class="tabs">
<div class="tab active">Antrian</div>
<div class="tab">Pelunasan</div>
<div class="tab">Pendampingan</div>
<div class="tab">Selesai</div>
</div>

<select id="sel-antrian" class="inp"></select>
<select id="sel-pelunasan" class="inp"></select>
<select id="sel-pendampingan" class="inp"></select>
<select id="sel-selesai" class="inp"></select>

<script>
var C=[];

fetch('/api/project-control?action=clients')
.then(function(r){ return r.json(); })
.then(function(d){

  C = d;

  var mapStatus = {
    antrian: "Antrian",
    pelunasan: "Menunggu Pelunasan",
    pendampingan: "Pendampingan",
    selesai: "Selesai"
  };

  ['antrian','pelunasan','pendampingan','selesai'].forEach(function(t){

    var s = document.getElementById('sel-' + t);
    if(!s) return;

    s.innerHTML = '<option value="">Pilih client...</option>';

    for (var i = 0; i < C.length; i++) {
      var c = C[i];

      if ((c.status || '') !== mapStatus[t]) continue;

      var o = document.createElement('option');
      o.value = c.nama;
      o.textContent = c.nama + ' - ' + c.nim;
      s.appendChild(o);
    }

  });

})
.catch(function(){});
</script>

</body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
