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

  // --- HTML UI DUA KOLOM LENGKAP ---
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
  
  .col-info{flex: 1; min-width: 200px}
  .col-gen{flex: 1.2; border-left: 1px solid #333; padding-left: 20px}
  
  .todo{display:flex;gap:8px;font-size:12px;margin-bottom:5px;color:#aaa}
  .box{width:12px;height:12px;border:1.5px solid currentColor;margin-top:2px;opacity:.5}
  
  .lbl{font-size:9px;font-weight:700;text-transform:uppercase;margin-bottom:8px;color:#666}
  .inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:6px 10px;color:#eee;outline:none;margin-bottom:8px}
  .prev{background:#151515;border:1px solid #333;border-radius:6px;padding:10px;height:80px;overflow-y:auto;font-size:12px;line-height:1.4;color:#888;white-space:pre-wrap;margin-bottom:8px}
  .prev.on{color:#ddd}
  
  .btn{width:100%;padding:8px;background:#252525;border:1px solid #444;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;color:#eee}
  .btn.ok{background:#0f3d1f!important;border-color:#27500A!important}
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
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
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Tahap 2: Review</div>
    <div class="todo"><div class="box"></div><span>Cek Paket, Layanan, & Aplikasi</span></div>
    <div class="todo"><div class="box"></div><span>Set Antrian & isi Tanggal DP</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <div style="display:flex;gap:5px"><input id="inp-nama" class="inp" placeholder="Nama..." oninput="gR()"><select id="inp-kat" class="inp" onchange="gR()" style="width:100px"><option value="kerjasama">Kerja</option><option value="umum">Umum</option></select></div>
    <div id="prev-review" class="prev">Ketik nama...</div>
    <button class="btn" id="btn-review" onclick="cp('review')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Tahap 3: DP Masuk</div>
    <div class="todo"><div class="box"></div><span>Kirim akses portal</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-antrian" class="prev">Pilih client...</div>
    <button class="btn" id="btn-antrian" onclick="cp('antrian')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-overdue" class="guide" style="border-color:#e03131">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Overdue</div>
    <div class="todo"><div class="box"></div><span>Follow up keterlambatan</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-overdue" class="inp" onchange="gM('overdue',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-overdue" class="prev">Pilih client...</div>
    <button class="btn" id="btn-overdue" onclick="cp('overdue')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-diproses" class="guide" style="border-color:#f08c00">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Diproses</div>
    <div class="todo"><div class="box"></div><span>Proses pengerjaan</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-diproses" class="inp" onchange="gM('diproses',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-diproses" class="prev">Pilih client...</div>
    <button class="btn" id="btn-diproses" onclick="cp('diproses')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pelunasan" class="guide" style="border-color:#D85A30">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Tahap 5: Pelunasan</div>
    <div class="todo"><div class="box"></div><span>Minta Pelunasan</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-pelunasan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pendampingan" class="guide" style="border-color:#7f5af0">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Pendampingan</div>
    <div class="todo"><div class="box"></div><span>Informasi sesi grup</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-pendampingan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pendampingan" onclick="cp('pendampingan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-selesai" class="guide" style="border-color:#1D9E75">
  <div class="col-info">
    <div style="font-size:13px;font-weight:600;margin-bottom:8px">Selesai</div>
    <div class="todo"><div class="box"></div><span>Minta Testimoni</span></div>
  </div>
  <div class="col-gen">
    <div class="lbl">Generator Pesan</div>
    <select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"><option value="">Pilih client...</option></select>
    <div id="prev-selesai" class="prev">Pilih client...</div>
    <button class="btn" id="btn-selesai" onclick="cp('selesai')">📋 Copy Pesan</button>
  </div>
</div>

<script>
var M={
  "review_kerjasama": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima\\n🔗 Registrasi: https://tally.so/r/jaBkzY?kh=khk", 
  "review_umum": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima\\n🔗 Registrasi: https://tally.so/r/MeOabY?kh=khu", 
  "antrian": "Halo {nama} 👋\\n\\nBerikut info portal:\\n🔑 Kode: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app",
  "overdue": "Halo {nama} 👋\\n\\nKami informasikan project sudah melewati deadline. Mohon segera respon.",
  "diproses": "Halo {nama} 👋\\n\\nProject Anda saat ini sedang dalam proses pengerjaan oleh tim.",
  "pelunasan": "Halo {nama} 👋\\n\\nProject selesai! 🎉\\n💰 Sisa: Rp {sisa}\\nSilahkan pelunasan untuk buka akses download.", 
  "pendampingan": "Halo {nama} 👋\\n\\nInformasi sesi pendampingan akan diinfokan via grup WhatsApp.",
  "selesai": "Halo {nama} 👋\\n\\nTerima kasih! Sesi selesai. Mohon testimoninya: ⭐ [LINK]"
};
var C=[],R={};

fetch('?action=clients').then(r=>r.json()).then(d=>{
  C=d;
  ['antrian','overdue','diproses','pelunasan','pendampingan','selesai'].forEach(t=>{
    var s=document.getElementById('sel-'+t); if(!s)return;
    var map={antrian:"Antrian",overdue:"Overdue",diproses:"Diproses",pelunasan:"Menunggu Pelunasan",pendampingan:"Pendampingan",selesai:"Selesai"};
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
  var msg=M[tab].replace('{nama}',c.nama).replace('{kodeAkses}',c.kodeAkses).replace('{sisa}',sisa);
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
