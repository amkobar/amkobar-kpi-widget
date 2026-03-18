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
      if (p.type === "title") return (p.title||[]).map(t=>t.plain_text).join("");
      if (p.type === "rich_text") return (p.rich_text||[]).map(t=>t.plain_text).join("");
      if (p.type === "select") return p.select?.name || "";
      if (p.type === "status") return p.status?.name || "";
      if (p.type === "number") return p.number ?? 0;
      return "";
    }

    try {
      var all = [], cursor;

      while (true) {
        var body = {page_size: 100};
        if (cursor) body.start_cursor = cursor;

        var resp = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
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
          status: getProp(p, "Status Project")
        };
      }).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json(clients);

    } catch (e) {
      console.log(e);
      res.status(200).json([]);
    }

    return;
  }

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{padding:1.25rem}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;background:transparent}
.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
.guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}
.guide.active{display:block}
.inp{width:100%;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;padding:7px 10px;margin-bottom:8px;color:inherit}
.prev{background:#00000033;border-radius:8px;padding:12px;margin-bottom:8px;white-space:pre-wrap}
</style></head><body>

<div class="tabs">
<div class="tab active" onclick="sw('antrian',this)">Antrian</div>
<div class="tab" onclick="sw('pelunasan',this)">Menunggu Pelunasan</div>
<div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div>
<div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="g-antrian" class="guide active">
<select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"></select>
<div id="prev-antrian" class="prev"></div>
</div>

<div id="g-pelunasan" class="guide">
<select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"></select>
<div id="prev-pelunasan" class="prev"></div>
</div>

<div id="g-pendampingan" class="guide">
<select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"></select>
<div id="prev-pendampingan" class="prev"></div>
</div>

<div id="g-selesai" class="guide">
<select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"></select>
<div id="prev-selesai" class="prev"></div>
</div>

<script>

var C=[];

fetch('/api/project-control?action=clients')
.then(r=>r.json())
.then(d=>{
  C=d;

  const mapStatus = {
    antrian: "Antrian",
    pelunasan: "Menunggu Pelunasan",
    pendampingan: "Pendampingan",
    selesai: "Selesai"
  };

  ['antrian','pelunasan','pendampingan','selesai'].forEach(function(t){

    var s=document.getElementById('sel-'+t);
    if(!s)return;

    s.innerHTML='<option value="">Pilih client...</option>';

    var filtered=C.filter(function(c){
      return (c.status||'') === mapStatus[t];
    });

    filtered.forEach(function(c){
      var o=document.createElement('option');
      o.value=c.nama;
      o.textContent=c.nama+' - '+c.nim;
      s.appendChild(o);
    });

  });
});

function sw(k,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.guide').forEach(g=>g.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('g-'+k).classList.add('active');
}

function gM(tab,nama){
  var c=C.find(x=>x.nama===nama);
  if(!c)return;

  document.getElementById('prev-'+tab).textContent =
  "Nama: "+c.nama+"\\nJenis: "+c.jenis+"\\nAplikasi: "+c.aplikasi;
}

</script>

</body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
