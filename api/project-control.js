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
      if (p.type === "title") return (p.title||[]).map(t=>t.plain_text).join("") || "";
      if (p.type === "rich_text") return (p.rich_text||[]).map(t=>t.plain_text).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "status") return (p.status && p.status.name) || "";
      if (p.type === "number") return p.number ?? 0;
      return "";
    }

    try {
      var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ page_size: 100 })
      });

      var data = await resp.json();

      var clients = (data.results || []).map(function(p){
        return {
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
          status: getProp(p, "Status Project")
        };
      }).filter(c=>c.nama);

      res.setHeader("Content-Type","application/json");
      res.setHeader("Access-Control-Allow-Origin","*");
      res.status(200).json(clients);

    } catch(e){
      res.status(200).json([]);
    }

    return;
  }

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:sans-serif}
body{padding:1.25rem;color:#fff}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:1px solid #333;color:#888;cursor:pointer}
.tab.active{background:#0f1b2d;color:#fff}
.guide{display:none}
.guide.active{display:block}
.inp{width:100%;padding:8px;margin-bottom:8px}
.prev{white-space:pre-wrap;margin-bottom:8px}
.btn{width:100%;padding:8px}
</style>
</head><body>

<div class="tabs">
<div class="tab active" onclick="sw('antrian',this)">Antrian</div>
<div class="tab" onclick="sw('pelunasan',this)">Pelunasan</div>
<div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div>
<div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="g-antrian" class="guide active">
<select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"></select>
<div id="prev-antrian" class="prev"></div>
<button class="btn" onclick="cp('antrian')">Copy</button>
</div>

<div id="g-pelunasan" class="guide">
<select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"></select>
<div id="prev-pelunasan" class="prev"></div>
<button class="btn" onclick="cp('pelunasan')">Copy</button>
</div>

<div id="g-pendampingan" class="guide">
<select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"></select>
<div id="prev-pendampingan" class="prev"></div>
<button class="btn" onclick="cp('pendampingan')">Copy</button>
</div>

<div id="g-selesai" class="guide">
<select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"></select>
<div id="prev-selesai" class="prev"></div>
<button class="btn" onclick="cp('selesai')">Copy</button>
</div>

<script>
var C=[],R={};

function decodeText(str){
  try{return JSON.parse('"' + str.replace(/"/g,'\\"') + '"');}
  catch(e){return str;}
}

fetch('/api/project-control?action=clients')
.then(r=>r.json())
.then(function(d){

  C=d;

  var mapStatus={
    antrian:"Antrian",
    pelunasan:"Menunggu Pelunasan",
    pendampingan:"Pendampingan",
    selesai:"Selesai"
  };

  Object.keys(mapStatus).forEach(function(t){

    var s=document.getElementById('sel-'+t);
    if(!s)return;

    s.innerHTML='<option value="">Pilih client...</option>';

    d.forEach(function(c){

      if((c.status||'').toLowerCase()!==mapStatus[t].toLowerCase()) return;

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
  var p=document.getElementById('prev-'+tab);
  var c=C.find(x=>x.nama===nama);
  if(!c)return;

  var msg="Halo "+c.nama+"\\nStatus: "+c.status;

  R[tab]=msg;
  p.textContent=decodeText(msg);
}

function cp(tab){
  var msg=R[tab];
  if(!msg)return;
  navigator.clipboard.writeText(decodeText(msg));
}
</script>

</body></html>`;

  res.setHeader("Content-Type","text/html");
  res.status(200).send(html);
};
