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
  html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3}
  body{padding:1.25rem}
  
  /* Tabs UI */
  .tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
  .tab{font-size:12px;padding:6px 14px;border-radius:6px;border:1px solid #333;color:#888;cursor:pointer;background:transparent;transition: 0.2s}
  .tab:hover{background: #252525}
  .tab.active{background:#232323;color:#fff;border-color:#378ADD;font-weight:500;box-shadow: 0 0 10px rgba(55,138,221,0.2)}
  
  /* Guide Box - Versi Dark */
  .guide{border-left:4px solid;border-radius:0 8px 8px 0;padding:18px;display:none;background:#202020;margin-bottom:10px}
  .guide.active{display:block}
  
  .todo{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.6;margin-bottom:8px;color:#aaa}
  .box{width:15px;height:15px;border-radius:3px;border:1.5px solid currentColor;flex-shrink:0;margin-top:3px;opacity:.5}
  
  .gen{margin-top:16px;padding-top:16px;border-top:1px solid #333}
  .lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;color:#666}
  
  /* Input & Preview */
  .inp{width:100%;background:#252525;border:1px solid #444;border-radius:6px;font-size:13px;padding:9px 12px;outline:none;margin-bottom:10px;color:#eee; transition: 0.2s}
  .inp:focus{border-color: #555; background: #2a2a2a}
  .row{display:flex;gap:8px;margin-bottom:10px}
  .row .inp{margin-bottom:0}
  
  .conf{font-size:11px;margin-bottom:10px;min-height:16px;color:#888}
  .prev{background:#151515;border:1px solid #333;border-radius:8px;padding:14px;margin-bottom:12px;min-height:60px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#888;font-style:italic}
  .prev.on{font-style:normal;color:#ddd;border-color:#444}
  
  /* Buttons */
  .btn{width:100%;padding:10px;background:#252525;border:1px solid #444;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;color:#eee;transition:0.2s}
  .btn:hover{background:#333; border-color:#555}
  .btn.ok{background:#0f3d1f!important;border-color:#27500A!important;color:#fff}
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
  <div style="font-size:11px;font-weight:700;color:#378ADD;margin-bottom:4px">TAHAP 2</div>
  <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#eee">Pastikan Data Benar</div>
  <div class="todo"><div class="box"></div><span>Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi</span></div>
  <div class="todo"><div class="box"></div><span>Ganti Status ke Antrian dan isi Tanggal DP</span></div>
  <div class="gen">
    <div class="lbl">Generator Pesan - Registrasi</div>
    <div class="row">
      <input id="inp-nama" class="inp" type="text" placeholder="Nama client..." oninput="gR()">
      <select id="inp-kat" class="inp" onchange="gR()" style="flex:0 0 130px">
        <option value="kerjasama">Kerjasama</option>
        <option value="umum">Umum</option>
      </select>
    </div>
    <div id="prev-review" class="prev">Ketik nama client...</div>
    <button class="btn" id="btn-review" onclick="cp('review')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922">
  <div style="font-size:11px;font-weight:700;color:#639922;margin-bottom:4px">TAHAP 3</div>
  <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#eee">DP Masuk</div>
  <div class="gen">
    <div class="lbl">Generator Pesan WA</div>
    <select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select>
    <div id="confirm-antrian" class="conf"></div>
    <div id="prev-antrian" class="prev">Pilih client...</div>
    <button class="btn" id="btn-antrian" onclick="cp('antrian')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pelunasan" class="guide" style="border-color:#D85A30">
  <div style="font-size:11px;font-weight:700;color:#D85A30;margin-bottom:4px">TAHAP 5</div>
  <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#eee">Hasil Selesai</div>
  <div class="gen">
    <div class="lbl">Generator Pesan WA</div>
    <select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select>
    <div id="confirm-pelunasan" class="conf"></div>
    <div id="prev-pelunasan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-pendampingan" class="guide" style="border-color:#7F77DD">
  <div style="font-size:11px;font-weight:700;color:#7F77DD;margin-bottom:4px">TAHAP 6</div>
  <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#eee">Pendampingan</div>
  <div class="gen">
    <div class="lbl">Generator Pesan WA</div>
    <select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"><option value="">Pilih client...</option></select>
    <div id="confirm-pendampingan" class="conf"></div>
    <div id="prev-pendampingan" class="prev">Pilih client...</div>
    <button class="btn" id="btn-pendampingan" onclick="cp('pendampingan')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-selesai" class="guide" style="border-color:#1D9E75">
  <div style="font-size:11px;font-weight:700;color:#1D9E75;margin-bottom:4px">TAHAP 7</div>
  <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#eee">Selesai</div>
  <div class="gen">
    <div class="lbl">Generator Pesan WA</div>
    <select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"><option value="">Pilih client...</option></select>
    <div id="confirm-selesai" class="conf"></div>
    <div id="prev-selesai" class="prev">Pilih client...</div>
    <button class="btn" id="btn-selesai" onclick="cp('selesai')">📋 Copy Pesan</button>
  </div>
</div>

<div id="g-overdue" class="guide" style="border-color:#888"> <div style="font-size:16px;font-weight:600;color:#eee">Project Melewati Deadline</div> </div>
<div id="g-diproses" class="guide" style="border-color:#BA7517"> <div style="font-size:16px;font-weight:600;color:#eee">Mulai Pengerjaan</div> </div>

<script>
var M={"review_kerjasama": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima dengan baik\\n✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:\\n🔗 https://tally.so/r/jaBkzY?kh=khk\\n\\nIsi data dengan lengkap dan benar. Jika ada pertanyaan, Silahkan menghubungi kami 😊\\n\\nSalam,\\nTim AMKOBAR 🎓", "review_umum": "Halo {nama} 👋\\n\\n🙏Terima kasih sudah menggunakan jasa kami\\n✅Pembayaran DP sudah kami terima dengan baik\\n✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:\\n🔗 https://tally.so/r/MeOabY?kh=khu\\n\\nIsi data dengan lengkap dan benar. Jika ada pertanyaan, Silahkan menghubungi kami 😊\\n\\nSalam,\\nTim AMKOBAR 🎓", "antrian": "Halo {nama} 👋\\n\\nTerima kasih sudah melakukan Registrasi\\n\\nBerikut informasi project :\\n📋 Layanan: {jenis}\\n💻 Aplikasi: {aplikasi}\\n🔑 Kode Akses Portal: {kodeAkses}\\n\\nPantau progress Olahdatamu di portal berikut:\\nhttps://amkobar-portal.vercel.app\\nMasukkan Kode Akses untuk login ya! 😊\\n\\nSalam,\\nTim AMKOBAR 🎓", "pelunasan": "Halo {nama} 👋\\n\\n1️⃣Pengerjaan project sudah selesai 🎉\\n2️⃣File hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.\\n3️⃣Untuk Membuka akses download silahkan lakukan pelunasan\\n💰 Rp {sisa}\\n\\nSetelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp.\\n\\nTerima kasih! 🙏\\n\\nSalam,\\nTim AMKOBAR 🎓", "pendampingan": "Halo {nama} 👋\\n\\n👉 Sesi pendampingan & pembelajaran akan kami informasikan melalui group.\\n👉 Sesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan.\\n\\nSalam,\\nTim AMKOBAR 🎓", "selesai": "Halo {nama} 👋\\n\\nSesi pendampingan sudah selesai, terima kasih! 🙏\\n\\nKami sangat menghargai jika berkenan memberikan testimoni atas layanan kami:\\n⭐ [LINK RATING]\\n\\nSukses selalu untuk skripsinya! 💪🎓\\n\\nSalam,\\nTim AMKOBAR 🎓"};
var C=[],R={};

fetch('/api/project-control?action=clients').then(function(r){return r.json();}).then(function(d){
  C=d;
  ['antrian','pelunasan','pendampingan','selesai'].forEach(function(t){
    var s=document.getElementById('sel-'+t); if(!s)return;
    s.innerHTML='<option value="">Pilih client...</option>';
    var mapStatus={antrian:"Antrian",pelunasan:"Menunggu Pelunasan",pendampingan:"Pendampingan",selesai:"Selesai"};
    C.forEach(function(c){
      var sc=(c.status||'').toLowerCase();
      var st=mapStatus[t].toLowerCase();
      if(!sc.includes(st)) return;
      var o=document.createElement('option');
      o.value=c.nama; o.textContent=c.nama+' - '+c.nim; s.appendChild(o);
    });
  });
}).catch(function(){});

function sw(k,el){
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.guide').forEach(function(g){g.classList.remove('active');});
  el.classList.add('active'); document.getElementById('g-'+k).classList.add('active');
}

function gR(){
  var n=document.getElementById('inp-nama').value.trim();
  var k=document.getElementById('inp-kat').value;
  var p=document.getElementById('prev-review');
  if(!n){p.className='prev';p.textContent='Ketik nama client...';R.review='';return;}
  var msg=(M['review_'+k]||'').replace('{nama}',n);
  R.review=msg;p.className='prev on';p.textContent=msg;
}

function gM(tab,nama){
  var p=document.getElementById('prev-'+tab);
  var conf=document.getElementById('confirm-'+tab);
  if(!nama){p.className='prev';p.textContent='Pilih client...';conf.textContent='';R[tab]='';return;}
  var c=C.find(function(x){return x.nama===nama;});
  if(!c)return;
  conf.textContent='✓ '+c.nama+' | '+c.nim;
  var sisa=typeof c.sisa==='number'?Math.round(c.sisa).toLocaleString('id-ID'):(c.sisa||'0');
  var msg=(M[tab]||'').replace('{nama}',c.nama).replace('{jenis}',c.jenis).replace('{aplikasi}',c.aplikasi).replace('{kodeAkses}',c.kodeAkses).replace('{sisa}',sisa);
  R[tab]=msg;p.className='prev on';p.textContent=msg;
}

// FIX COPY FOR NOTION EMBED
function cp(tab){
  var msg = R[tab]; if(!msg) return;
  var btn = document.getElementById('btn-'+tab);
  var old = btn.textContent;

  function success(){
    btn.textContent = '✓ Tersalin!'; btn.classList.add('ok');
    setTimeout(function(){ btn.textContent = old; btn.classList.remove('ok'); }, 2000);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(msg).then(success).catch(function(){ fb(msg, success); });
  } else { fb(msg, success); }
}

function fb(txt, cb) {
  var ta = document.createElement("textarea"); ta.value = txt;
  ta.style.position="fixed"; ta.style.left="-9999px"; document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { if(document.execCommand('copy')) cb(); } catch (e) {}
  document.body.removeChild(ta);
}
</script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
