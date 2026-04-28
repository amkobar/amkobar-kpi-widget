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
        var kat = getProp(p, "Kategori Harga").toLowerCase();
        var dp = kat === "kerjasama" ? getProp(p, "DP Kerjasama") : getProp(p, "DP Umum");
        return {
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
          dp: dp,
          status: getProp(p, "Status Project")
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

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3;overflow:hidden}body{padding:12px}.tabs{display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap}.tab{font-size:11px;padding:5px 12px;border-radius:5px;border:1px solid #333;color:#888;cursor:pointer;background:transparent;transition:0.2s}.tab:hover{background:#252525}.tab.active{background:#232323;color:#fff;border-color:#378ADD;font-weight:500}.guide{border-left:4px solid;border-radius:0 8px 8px 0;padding:15px 20px;display:none;background:#202020;gap:25px;align-items:flex-start}.guide.active{display:flex}.col-info{flex:1.1;min-width:240px}.col-gen{flex:1;border-left:1px solid #333;padding-left:20px}.todo{display:flex;gap:10px;font-size:12.5px;margin-bottom:8px;color:#aaa;line-height:1.4}.box{width:14px;height:14px;border:1.5px solid currentColor;border-radius:3px;margin-top:2px;flex-shrink:0;opacity:.5}.lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;color:#666}.inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:7px 10px;color:#eee;outline:none;margin-bottom:8px}.row{display:flex;gap:6px}.prev{background:#151515;border:1px solid #333;border-radius:6px;padding:12px;height:110px;overflow-y:auto;font-size:12px;line-height:1.5;color:#888;white-space:pre-wrap;margin-bottom:10px}.prev.on{color:#ddd;border-color:#444}.btn{width:100%;padding:9px;background:#252525;border:1px solid #444;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;color:#eee;transition:0.2s}.btn:hover{background:#333}.btn.ok{background:#0f3d1f!important;border-color:#27500A!important}.warning{color:#f08c00;font-size:11px;margin-bottom:6px;display:none}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:10px}</style></head><body>
<div id="t1-wrap" style="border:1px solid #2a2a2a;border-radius:8px;margin-bottom:10px"><div onclick="toggleT1()" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:#141414;border-radius:8px" id="t1-hdr"><div style="display:flex;align-items:center;gap:8px"><div style="width:6px;height:6px;border-radius:50%;background:#378ADD"></div><span style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Tahap 1 - Sebelum Registrasi</span><span style="font-size:10px;color:#555" id="t1-hint">(klik untuk buka)</span></div><span id="t1-arrow" style="color:#555;font-size:11px">&#9660;</span></div><div id="t1-body" style="display:none;padding:14px;border-top:1px solid #2a2a2a"><div style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px"><div><div class="lbl">Langkah Konfirmasi</div><div style="display:flex;gap:8px;margin-bottom:7px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">1</div><div style="font-size:12px;color:#aaa;line-height:1.45">Verifikasi DP sudah masuk dari bukti transfer client</div></div><div style="display:flex;gap:8px;margin-bottom:7px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">2</div><div style="font-size:12px;color:#aaa;line-height:1.45">Generate pesan WA di kanan, copy dan kirim ke client</div></div><div style="display:flex;gap:8px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">3</div><div style="font-size:12px;color:#aaa;line-height:1.45">Tunggu client isi form - data muncul otomatis di tab Menunggu Review</div></div></div><div style="border-left:1px solid #2a2a2a;padding-left:14px"><div class="lbl">Generator Pesan - Sebelum Registrasi</div><div class="row"><input id="inp-nama" class="inp" placeholder="Ketik nama client..." oninput="gR()"><select id="inp-kat" class="inp" onchange="gR()" style="width:110px"><option value="kerjasama">Kerjasama</option><option value="umum">Umum</option></select></div><div id="prev-review" class="prev">Ketik nama client untuk generate pesan...</div><button class="btn" id="btn-review" onclick="cp('review')">&#128203; Copy Pesan</button></div></div></div></div>

<div class="tabs"><div class="tab active" onclick="sw('review',this)">Menunggu Review</div><div class="tab" onclick="sw('antrian',this)">Antrian</div><div class="tab" onclick="sw('overdue',this)">Overdue</div><div class="tab" onclick="sw('diproses',this)">Diproses</div><div class="tab" onclick="sw('pelunasan',this)">Menunggu Pelunasan</div><div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div><div class="tab" onclick="sw('selesai',this)">Selesai</div></div>

<div id="g-review" class="guide active" style="border-color:#378ADD"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#378ADD;margin-bottom:4px">MENUNGGU REVIEW</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Verifikasi Data Client</div><div class="todo"><div class="box"></div><span>Pastikan Nama, NIM, dan Judul Penelitian sudah benar</span></div><div class="todo"><div class="box"></div><span>Pastikan Aplikasi, Jenis Layanan dan Jumlah Variabel sudah terisi</span></div><div class="todo"><div class="box"></div><span>Pastikan DP Masuk sudah tercentang di Notion</span></div><div class="todo"><div class="box"></div><span>Ubah Status Project ke Antrian dan isi Tanggal DP</span></div></div></div>



<div id="g-antrian" class="guide" style="border-color:#639922"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#639922;margin-bottom:4px">TAHAP 3</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">DP Masuk / Registrasi</div><div class="todo"><div class="box"></div><span>Kirim akses portal ke client</span></div><div class="todo"><div class="box"></div><span>Pastikan client bisa login ke portal</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Akses Portal</div><select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select><div id="prev-antrian" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-antrian" onclick="cp('antrian')">📋 Copy Pesan</button></div></div><div id="g-overdue" class="guide" style="border-color:#888"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#888;margin-bottom:4px">PERHATIAN</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Project Terlambat</div><div class="todo"><div class="box"></div><span>Cek penyebab keterlambatan</span></div><div class="todo"><div class="box"></div><span>Update Tanggal Selesai jika perlu</span></div><div class="todo"><div class="box"></div><span>Hubungi client jika ada kendala dari mereka</span></div></div></div><div id="g-diproses" class="guide" style="border-color:#BA7517"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#BA7517;margin-bottom:4px">TAHAP 4</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Sedang Diproses</div><div class="todo"><div class="box"></div><span>Kerjakan sesuai paket yang dipilih client</span></div><div class="todo"><div class="box"></div><span>Setelah selesai, ganti status ke Menunggu Pelunasan</span></div><div class="todo"><div class="box"></div><span>Kirim WA tagihan menggunakan tab Menunggu Pelunasan</span></div></div></div><div id="g-pelunasan" class="guide" style="border-color:#D85A30"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#D85A30;margin-bottom:4px">TAHAP 5</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Menunggu Pelunasan</div><div class="todo"><div class="box"></div><span>Kirim informasi tagihan ke client via Generator</span></div><div class="todo"><div class="box"></div><span>Setelah lunas, buka akses folder Hasil Final di Drive</span></div><div class="todo"><div class="box"></div><span>Ganti status ke Pendampingan atau Selesai</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Tagihan</div><div id="warn-lunas" class="warning">⚠️ Client sudah lunas!</div><select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select><div id="prev-pelunasan" class="prev">Pilih client...</div><button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">📋 Copy Pesan</button></div></div><div id="g-pendampingan" class="guide" style="border-color:#7F77DD"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#7F77DD;margin-bottom:4px">TAHAP 6</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Sesi Pendampingan</div><div class="todo"><div class="box"></div><span>Pastikan client sudah bergabung di grup WA</span></div><div class="todo"><div class="box"></div><span>Posting jadwal sesi di grup WA</span></div><div class="todo"><div class="box"></div><span>Minta client konfirmasi kehadiran di grup</span></div><div class="todo"><div class="box"></div><span>Setelah sesi selesai, ganti status ke Selesai</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Info Pendampingan</div><select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"><option value="">Pilih client...</option></select><div id="prev-pendampingan" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-pendampingan" onclick="cp('pendampingan')">📋 Copy Pesan</button></div></div><div id="g-selesai" class="guide" style="border-color:#1D9E75"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#1D9E75;margin-bottom:4px">TAHAP 7</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Project Selesai</div><div class="todo"><div class="box"></div><span>Pastikan semua file sudah diupload ke folder Hasil Final</span></div><div class="todo"><div class="box"></div><span>Kirim WA ke client via Generator di samping</span></div><div class="todo"><div class="box"></div><span>Minta client beri rating di portal untuk aktifkan Akses Permanen</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Selesai</div><select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"><option value="">Pilih client...</option></select><div id="prev-selesai" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-selesai" onclick="cp('selesai')">📋 Copy Pesan</button></div></div><script>
var M={
  "review_kerjasama":"Halo {nama} 👋\\n\\n🙏 Terima kasih sudah menggunakan jasa kami\\n✅ Pembayaran DP sudah kami terima\\n🔗 Silakan registrasi di: https://tally.so/r/jaBkzY?kh=khk",
  "review_umum":"Halo {nama} 👋\\n\\n🙏 Terima kasih sudah menggunakan jasa kami\\n✅ Pembayaran DP sudah kami terima\\n🔗 Silakan registrasi di: https://tally.so/r/MeOabY?kh=khu",
  "antrian":"Halo {nama} 👋\\n\\nBerikut info portal AMKOBAR kamu:\\n🔑 Kode Akses: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app\\n\\nLogin untuk pantau progress project kamu ya!",
  "pelunasan":"Halo {nama} 👋\\n\\nProject kamu sudah selesai dikerjakan! 🎉\\n\\n📦 {jenis} - {aplikasi}\\n💳 DP sudah diterima: Rp {dp}\\n💰 Sisa pembayaran: Rp {sisa}\\n\\nSilakan lakukan pelunasan. Setelah lunas, akses file hasil tersedia di portal:\\n🔑 Kode Akses: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app\\n\\nTerima kasih!",
  "pendampingan":"Halo {nama} 👋\\n\\nProject kamu sudah masuk tahap *Pendampingan* 🎓\\n\\nKamu akan mendapat jadwal sesi belajar via grup WA AMKOBAR. Pastikan kamu sudah tergabung di grup ya.\\n\\nPantau status di portal:\\n🔑 Kode Akses: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app",
  "selesai":"Halo {nama} 👋\\n\\nTerima kasih! Sesi pendampingan kita sudah selesai 🙏\\n\\nUntuk mengaktifkan *Akses Permanen* ke file project kamu, mohon berikan rating singkat melalui portal:\\n\\n🔑 Kode Akses: {kodeAkses}\\n🔗 https://amkobar-portal.vercel.app\\n\\nSetelah rating diisi, akses file kamu otomatis jadi permanen. Sukses untuk sidangnya! 💪🎓"
};
var C=[],R={};
fetch('?action=clients').then(function(r){return r.json();}).then(function(d){
  C=d;
  var map={antrian:"Antrian",pelunasan:"Menunggu Pelunasan",pendampingan:"Pendampingan",selesai:"Selesai"};
  Object.keys(map).forEach(function(t){
    var s=document.getElementById('sel-'+t); if(!s) return;
    C.forEach(function(c){
      if((c.status||'').toLowerCase().includes(map[t].toLowerCase())){
        var o=document.createElement('option'); o.value=c.nama; o.textContent=c.nama; s.appendChild(o);
      }
    });
  });
});
function toggleT1(){var body=document.getElementById('t1-body');var open=body.style.display==='none';body.style.display=open?'block':'none';document.getElementById('t1-hint').textContent=open?'(klik untuk tutup)':'(klik untuk buka)';}
function sw(k,el){
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.guide').forEach(function(g){g.classList.remove('active');});
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
  var warn=document.getElementById('warn-lunas');
  if(warn) warn.style.display='none';
  var c=C.find(function(x){return x.nama===nama;}); if(!c) return;
  var p=document.getElementById('prev-'+tab);
  if(tab==='pelunasan'&&c.sisa<=0){
    p.textContent="❌ Client sudah LUNAS.\\nTidak perlu kirim tagihan.";
    p.classList.remove('on');
    if(warn) warn.style.display='block';
    R[tab]=""; return;
  }
  var sisa=typeof c.sisa==='number'?c.sisa.toLocaleString('id-ID'):c.sisa;
  var dp=typeof c.dp==='number'?c.dp.toLocaleString('id-ID'):c.dp;
  var msg=(M[tab]||"")
    .replace('{nama}',c.nama)
    .replace('{kodeAkses}',c.kodeAkses||'-')
    .replace('{sisa}',sisa||'0')
    .replace('{dp}',dp||'0')
    .replace('{jenis}',c.jenis||'-')
    .replace('{aplikasi}',c.aplikasi||'-')
    .replace('{nim}',c.nim||'');
  R[tab]=msg; p.textContent=msg; p.classList.add('on');
}
function fallbackCopy(text){
  var ta=document.createElement("textarea");
  ta.value=text; ta.style.position="fixed"; ta.style.left="-9999px"; ta.style.top="-9999px";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}
function cp(tab){
  var msg=R[tab]; if(!msg) return;
  var btn=document.getElementById('btn-'+tab); if(!btn) return;
  var old=btn.textContent;
  function onDone(){btn.textContent='✓ Tersalin!'; btn.classList.add('ok'); setTimeout(function(){btn.textContent=old; btn.classList.remove('ok');},1500);}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(msg).then(onDone).catch(function(){fallbackCopy(msg);onDone();});
  } else {fallbackCopy(msg); onDone();}
}
</script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
