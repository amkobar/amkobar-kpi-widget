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
      res.status(200).json(clients);
    } catch(e) {
      res.status(200).json([]);
    }
    return;
  }

  // --- HTML UI DENGAN INSTRUKSI ASLI ---
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3; overflow:hidden}
  body{padding:12px}
  
  .tabs{display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap}
  .tab{font-size:11px;padding:5px 12px;border-radius:5px;border:1px solid #333;color:#888;cursor:pointer;background:transparent;transition:0.2s}
  .tab:hover{background:#252525}
  .tab.active{background:#232323;color:#fff;border-color:#378ADD;font-weight:500}
  
  .guide{border-left:4px solid;border-radius:0 8px 8px 0;padding:15px 20px;display:none;background:#202020; gap:25px; align-items: flex-start}
  .guide.active{display:flex}
  
  .col-info{flex: 1.1; min-width: 280px}
  .col-gen{flex: 1; border-left: 1px solid #333; padding-left: 20px}
  
  .todo{display:flex;gap:10px;font-size:12.5px;margin-bottom:8px;color:#aaa;line-height:1.4}
  .box{width:14px;height:14px;border:1.5px solid currentColor;border-radius:3px;margin-top:2px;flex-shrink:0;opacity:.5}
  
  .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;color:#666}
  .inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:7px 10px;color:#eee;outline:none;margin-bottom:8px}
  .row{display:flex;gap:6px}
  
  .prev{background:#151515;border:1px solid #333;border-radius:6px;padding:12px;height:90px;overflow-y:auto;font-size:12px;line-height:1.5;color:#888;white-space:pre-wrap;margin-bottom:10px}
  .prev.on{color:#ddd; border-color:#444}
  
  .btn{width:100%;padding:9px;background:#252525;border:1px solid #444;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;color:#eee;transition:0.2s}
  .btn:hover{background:#333}
  .btn.ok{background:#0f3d1f!important;border-color:#27500A!important}
  
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="sw('review',this)">Menunggu Review</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab" onclick="sw('overdue',this)">Overdue</div>
  <div class="tab" onclick="sw('diproses',this)">Diproses</div>
  <div class="tab" onclick="sw('pelunasan',this)">Menunggu Pelunasan</div>
  <div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="g-review" class="guide active" style="border-color:#378ADD">
  <div class="col-info">
    <div style="font-size:10px;font-weight:700;color:#378ADD;margin-bottom:4px">TAHAP 2</div>
    <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Pastikan Data Benar</div>
    <div class="todo"><div class="box"></div><span>Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi</span></div>
    <div class="todo"><div class="box"></div><span>Jika sudah benar ganti Status Project ke Antrian dan isi Tanggal DP</span></div>
    <div class="todo"><div class="box"></div><span>Kirim WA menggunakan Generator di samping</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan - Sebelum Registrasi</div>
    <div class="row"><input id="inp-nama" class="inp" placeholder="Ketik nama client..." oninput="gR()"><select id="inp-kat" class="inp" onchange="gR()" style="width:110px"><option value="kerjasama">Kerjasama</option><option value="umum">Umum</option></select></div>
    <div id="prev-review" class="prev">Ketik nama client untuk generate pesan...</div>
    <button class="btn" id="btn-review" onclick="cp('review')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922">
  <div class="col-info">
    <div style="font-size:10px;font-weight:700;color:#639922;margin-bottom:4px">TAHAP 3</div>
    <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">DP Masuk / Registrasi</div>
    <div class="todo"><div class="box"></div><span>Kirim akses portal dan konfirmasi antrian</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan - Akses Portal</div>
    <select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-antrian" class="prev">Pilih client untuk generate pesan...</div>
    <button class="btn" id="btn-antrian" onclick="cp('antrian')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pelunasan" class="guide" style="border-color:#D85A30">
  <div class="col-info">
    <div style="font-size:10px;font-weight:700;color:#D85A30;margin-bottom:4px">TAHAP 5</div>
    <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Menunggu Pelunasan</div>
    <div class="todo"><div class="box"></div><span>Kirim informasi sisa pembayaran dan file hasil</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan - Tagihan</div>
    <select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-pelunasan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-overdue" class="guide" style="border-color:#888"><div class="col-info"><h3>Overdue</h3><p>Follow up project terlambat.</p></div></div>
<div id="g-diproses" class="guide" style="border-color:#BA7517"><div class="col-info"><h3>Diproses</h3><p>Update progress pengerjaan.</p></div></div>
<div id="g-pendampingan" class="guide" style="border-color:#7F77DD"><div class="col-info"><h3>Pendampingan</h3><p>Informasi jadwal belajar.</p></div></div>
<div id="g-selesai" class="guide" style="border-color:#1D9E75"><div class="col-info"><h3>Selesai</h3><p>Minta review bintang 5.</p></div></div>

<script>
var M={
  "review_kerjasama": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima\\n🔗 Silakan registrasi di: https://tally.so/r/jaBkzY?kh=khk",
  "review_umum": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima\\n🔗 Silakan registrasi di: https://tally.so/r/MeOabY?kh=khu",
  "antrian": "Halo {nama} 👋\\n\\nBerikut info portal:\\n🔑 Kode Akses: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app",
  "pelunasan": "Halo {nama} 👋\\n\\nProject selesai! 🎉\\n💰 Sisa: Rp {sisa}\\nSilakan pelunasan untuk akses download.",
  "selesai": "Halo {nama} 👋\\n\\nTerima kasih! Mohon testimoninya ya ⭐"
};
var C=[],R={};

fetch('?action=clients').then(r=>r.json()).then(d=>{
  C=d;
  ['antrian','pelunasan'].forEach(t=>{
    var s=document.getElementById('sel-'+t); if(!s)return;
    var map={antrian:"Antrian",pelunasan:"Menunggu Pelunasan"};
    C.forEach(c=>{
      if((c.status||'').toLowerCase().includes(map[t].toLowerCase())){
        var o=document.createElement('option'); o.value=c.nama; o.textContent=c.nama; s.appendChild(o);
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
  var sisa=typeof c.sisa==='number'?c.sisa.toLocaleString('id-ID'):c.sisa;
  var msg=(M[tab]||"").replace('{nama}',c.nama).replace('{kodeAkses}',c.kodeAkses).replace('{sisa}',sisa);
  R[tab]=msg; var p=document.getElementById('prev-'+tab); p.textContent=msg; p.classList.add('on');
}

function cp(tab){
  var msg=R[tab]; if(!msg) return;
  var btn=document.getElementById('btn-'+tab);
  navigator.clipboard.writeText(msg).then(()=>{
    var old=btn.textContent; btn.textContent='✓ Tersalin!'; btn.classList.add('ok');
    setTimeout(()=>{btn.textContent=old; btn.classList.remove('ok')},1500);
  });
}
</script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
