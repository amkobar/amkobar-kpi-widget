module.exports = async function handler(req, res) {

  // --- BAGIAN API NOTION (TETAP SAMA) ---
  if (req.query && req.query.action === 'clients') {
    var notionToken = process.env.NOTION_TOKEN;
    var projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
    var headers = { Authorization: "Bearer " + notionToken, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
    function getProp(page, key) {
      var p = page.properties[key]; if (!p) return "";
      if (p.type === "title") return (p.title||[]).map(t=>t.plain_text).join("");
      if (p.type === "rich_text") return (p.rich_text||[]).map(t=>t.plain_text).join("");
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "status") return (p.status && p.status.name) || ""; 
      if (p.type === "number") return p.number != null ? p.number : 0;
      return "";
    }
    try {
      var all = [], cursor;
      while (true) {
        var body = {page_size: 100}; if (cursor) body.start_cursor = cursor;
        var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", { method: "POST", headers: headers, body: JSON.stringify(body) });
        var data = await resp.json(); all = all.concat(data.results || []);
        if (!data.has_more) break; cursor = data.next_cursor;
      }
      var clients = all.map(p => ({
        nama: getProp(p, "Nama Client"), nim: getProp(p, "NIM/NPM"),
        jenis: getProp(p, "Jenis Layanan"), aplikasi: getProp(p, "Aplikasi"),
        kodeAkses: getProp(p, "Kode Akses"), sisa: getProp(p, "Sisa Pembayaran"),
        status: getProp(p, "Status Project")
      })).filter(c => c.nama);
      res.setHeader("Access-Control-Allow-Origin", "*"); res.status(200).json(clients);
    } catch(e) { res.status(200).json([]); }
    return;
  }

  // --- HTML UI DENGAN LOGIKA PROTEKSI (ANTI-ERROR) ---
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3; overflow:hidden}
  body{padding:10px}
  .tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap}
  .tab{font-size:11px;padding:4px 10px;border-radius:5px;border:1px solid #333;color:#888;cursor:pointer;background:transparent}
  .tab.active{background:#232323;color:#fff;border-color:#378ADD}
  .guide{border-left:4px solid;border-radius:0 8px 8px 0;padding:12px 15px;display:none;background:#202020; gap:20px; align-items: flex-start}
  .guide.active{display:flex}
  .col-info{flex: 1; min-width: 220px}
  .col-gen{flex: 1.2; border-left: 1px solid #333; padding-left: 20px}
  .todo{display:flex;gap:8px;font-size:12px;margin-bottom:5px;color:#aaa}
  .box{width:12px;height:12px;border:1.5px solid currentColor;border-radius:2px;margin-top:2px;opacity:.5}
  .lbl{font-size:9px;font-weight:700;text-transform:uppercase;margin-bottom:8px;color:#666}
  .inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:6px 10px;color:#eee;outline:none;margin-bottom:8px}
  .prev{background:#151515;border:1px solid #333;border-radius:6px;padding:10px;height:85px;overflow-y:auto;font-size:12px;line-height:1.4;color:#888;white-space:pre-wrap;margin-bottom:8px}
  .prev.on{color:#ddd; border-color:#444}
  .btn{width:100%;padding:8px;background:#252525;border:1px solid #444;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;color:#eee}
  .btn.ok{background:#0f3d1f!important;border-color:#27500A!important}
  .warning{color:#f08c00; font-size:11px; margin-bottom:5px; display:none}
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="sw('review',this)">Review</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab" onclick="sw('pelunasan',this)">Pelunasan</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="g-review" class="guide active" style="border-color:#378ADD">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">1. Review Data</div>
    <div class="todo"><div class="box"></div><span>Cek Paket & Layanan</span></div>
    <div class="todo"><div class="box"></div><span>Set Antrian & Isi DP</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Registrasi</div>
    <div style="display:flex;gap:5px"><input id="inp-nama" class="inp" placeholder="Nama..." oninput="gR()"><select id="inp-kat" class="inp" onchange="gR()" style="width:100px"><option value="kerjasama">Kerja</option><option value="umum">Umum</option></select></div>
    <div id="prev-review" class="prev">Ketik nama...</div>
    <button class="btn" id="btn-review" onclick="cp('review')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pelunasan" class="guide" style="border-color:#D85A30">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">2. Tagih Pelunasan</div>
    <div class="todo"><div class="box"></div><span>Hanya untuk sisa > 0</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Tagihan</div>
    <div id="warn-lunas" class="warning">⚠️ Client sudah lunas!</div>
    <select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-pelunasan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922"><div class="col-info"><h3>Antrian</h3></div><div class="col-gen"><select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih...</option></select><div id="prev-antrian" class="prev"></div><button class="btn" onclick="cp('antrian')">📋 Copy</button></div></div>
<div id="g-selesai" class="guide" style="border-color:#1D9E75"><div class="col-info"><h3>Selesai</h3></div><div class="col-gen"><select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"><option value="">Pilih...</option></select><div id="prev-selesai" class="prev"></div><button class="btn" onclick="cp('selesai')">📋 Copy</button></div></div>

<script>
var M={
  "review_kerjasama": "Halo {nama} 👋\\n\\nTerima kasih, DP sudah diterima. Silakan registrasi: https://tally.so/r/jaBkzY?kh=khk",
  "review_umum": "Halo {nama} 👋\\n\\nTerima kasih, DP sudah diterima. Silakan registrasi: https://tally.so/r/MeOabY?kh=khu",
  "antrian": "Halo {nama} 👋\\n\\nInfo portal: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app",
  "pelunasan": "Halo {nama} 👋\\n\\nProject selesai! 🎉\\n💰 Sisa: Rp {sisa}\\nSilakan pelunasan untuk download.",
  "selesai": "Halo {nama} 👋\\n\\nTerima kasih! Mohon testimoninya: ⭐ [LINK]"
};
var C=[],R={};

fetch('?action=clients').then(r=>r.json()).then(d=>{
  C=d;
  ['antrian','pelunasan','selesai'].forEach(t=>{
    var s=document.getElementById('sel-'+t); if(!s)return;
    var map={antrian:"Antrian",pelunasan:"Menunggu Pelunasan",selesai:"Selesai"};
    C.forEach(c=>{
      if((c.status||'').toLowerCase().includes(map[t].toLowerCase())){
        var o=document.createElement('option'); o.value=c.nama; o.textContent=c.nama + (t==='pelunasan'?' (Rp '+c.sisa.toLocaleString()+')':''); s.appendChild(o);
      }
    });
  });
});

function sw(k,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.guide').forEach(g=>g.classList.remove('active'));
  el.classList.add('active'); document.getElementById('g-'+k).classList.add('active');
}

function gR(){
  var n=document.getElementById('inp-nama').value;
  var k=document.getElementById('inp-kat').value;
  var p=document.getElementById('prev-review');
  var msg=M['review_'+k].replace('{nama}',n||'...');
  R.review=msg; p.textContent=msg; p.classList.add('on');
}

function gM(tab,nama){
  var c=C.find(x=>x.nama===nama); if(!c) return;
  var p=document.getElementById('prev-'+tab);
  var warn=document.getElementById('warn-lunas');
  
  if(tab==='pelunasan' && c.sisa <= 0){
    p.textContent="❌ Client sudah LUNAS.\\nTidak perlu kirim tagihan.";
    p.classList.remove('on'); if(warn) warn.style.display='block';
    R[tab]=""; return;
  }
  
  if(warn) warn.style.display='none';
  var sisa=typeof c.sisa==='number'?c.sisa.toLocaleString('id-ID'):c.sisa;
  var msg=M[tab].replace('{nama}',c.nama).replace('{kodeAkses}',c.kodeAkses).replace('{sisa}',sisa);
  R[tab]=msg; p.textContent=msg; p.classList.add('on');
}

function cp(tab){
  var msg=R[tab]; if(!msg) return;
  var btn=document.getElementById('btn-'+tab);
  var ta=document.createElement("textarea"); ta.value=msg; ta.style.position="fixed"; ta.style.left="-999px";
  document.body.appendChild(ta); ta.select();
  try {
    document.execCommand('copy');
    var old=btn.textContent; btn.textContent='✓ Tersalin!'; btn.classList.add('ok');
    setTimeout(()=>{btn.textContent=old; btn.classList.remove('ok')},1500);
  } catch(e){}
  document.body.removeChild(ta);
}
</script></body></html>`;

  res.setHeader("Content-Type", "text/html"); res.status(200).send(html);
};
