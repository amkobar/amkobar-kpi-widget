<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * {
      box-sizing: border-box;
      margin: 0; padding: 0;
    }
    html, body {
      background: #191919;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      padding: 1.25rem;
      color: #eee;
    }
    .tabs {
      display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem;
    }
    .tab {
      font-size: 12px;
      padding: 5px 14px;
      border-radius: 6px;
      border: 0.5px solid #333;
      color: #888;
      cursor: pointer;
      background: transparent;
    }
    .tab.active {
      background: #0f1b2d;
      color: #fff;
      border-color: #1a6bbd;
      font-weight: 500;
    }
    .guide {
      border-left: 3px solid;
      border-radius: 0 8px 8px 0;
      padding: 16px 18px;
      display: none;
    }
    .guide.active {
      display: block;
    }
    .todo {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 13px; line-height: 1.6; margin-bottom: 6px;
    }
    .box {
      width: 15px; height: 15px; border-radius: 3px;
      border: 1.5px solid currentColor;
      flex-shrink: 0; margin-top: 3px; opacity: .5;
    }
    .gen {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 0.5px solid currentColor;
    }
    .lbl {
      font-size: 10px; font-weight: 600;
      letter-spacing: .08em; text-transform: uppercase;
      margin-bottom: 10px;
    }
    .inp {
      width: 100%;
      background: #00000033;
      border: 0.5px solid currentColor;
      border-radius: 6px;
      font-size: 12px;
      padding: 7px 10px;
      outline: none;
      margin-bottom: 8px;
      color: inherit;
    }
    .row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .row .inp {
      margin-bottom: 0;
    }
    .conf {
      font-size: 11px;
      margin-bottom: 8px;
      min-height: 16px;
      opacity: .8;
    }
    .prev {
      background: #00000033;
      border: 0.5px solid currentColor;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      min-height: 60px;
      font-size: 12px;
      line-height: 1.7;
      white-space: pre-wrap;
      font-style: italic;
      opacity: .6;
    }
    .prev.on {
      font-style: normal;
      opacity: 1;
    }
    .btn {
      width: 100%;
      padding: 8px;
      background: #00000033;
      border: 0.5px solid currentColor;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: inherit;
    }
    .btn.ok {
      background: #0f3d1f !important;
      border-color: #27500A !important;
    }
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
  <div class="tab" onclick="sw('refund',this)">Refund &amp; Dibatalkan</div>
</div>

<div id="g-review" class="guide active" style="background:#E6F1FB;border-color:#378ADD;color:#0C447C">
  <div class="gen">
    <div class="lbl" style="color:#378ADD">Generator Pesan WA — Sebelum Registrasi</div>
    <div class="row">
      <input id="inp-nama" class="inp" type="text" placeholder="Ketik nama client..." oninput="gR()" style="color:#0C447C">
      <select id="inp-kat" class="inp" onchange="gR()" style="color:#0C447C;flex:0 0 140px">
        <option value="kerjasama">Kerjasama</option>
        <option value="umum">Umum</option>
      </select>
    </div>
    <div id="prev-review" class="prev" style="border-color:#378ADD;color:#0C447C">Ketik nama client untuk generate pesan...</div>
    <button class="btn" id="btn-review" onclick="cp('review')" style="border-color:#378ADD;color:#0C447C">&#128203; Copy Pesan</button>
  </div>
</div>

<div id="g-antrian" class="guide" style="background:#EAF3DE;border-color:#639922;color:#27500A">
  <div class="gen">
    <div class="lbl" style="color:#639922">Generator Pesan WA</div>
    <select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)" style="color:#27500A">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirm-antrian" class="conf" style="color:#639922"></div>
    <div id="prev-antrian" class="prev" style="border-color:#639922;color:#27500A">Pilih client untuk generate pesan...</div>
    <button class="btn" id="btn-antrian" onclick="cp('antrian')" style="border-color:#639922;color:#27500A">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- The other tabs guide elements omitted for brevity, use your existing code -->

<script>
  var M = {
    "review_kerjasama": "Halo {nama} 👋\n\n🙏🏻Terima kasih sudah menggunakan jasa kami\n✅Pembayaran DP sudah kami terima dengan baik\n✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n🔗 https://tally.so/r/jaBkzY?kh=khk\n\nIsi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊\n\nSalam,\nTim AMKOBAR 🎓",
    "review_umum": "Halo {nama} 👋\n\n🙏🏻Terima kasih sudah menggunakan jasa kami\n✅Pembayaran DP sudah kami terima dengan baik\n✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n🔗 https://tally.so/r/MeOabY?kh=khu\n\nIsi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊\n\nSalam,\nTim AMKOBAR 🎓",
    "antrian": "Halo {nama} 👋\n\nTerima kasih sudah melakukan Registrasi\n\nBerikut informasi project :\n📋 Layanan: {jenis}\n💻 Aplikasi: {aplikasi}\n🔑 Kode Akses Portal: {kodeAkses}\n\nPantau progress Olahdatamu di portal berikut:\nhttps://amkobar-portal.vercel.app\nMasukkan Kode Akses untuk login ya! 😊\n\nSalam,\nTim AMKOBAR 🎓",
    // Other templates...
  };

  var C = [], R = {};
  
  const statusByTab = {
    "review": "Menunggu Review",
    "antrian": "Antrian",
    "overdue": "Overdue",
    "diproses": "Diproses",
    "pelunasan": "Menunggu Pelunasan",
    "pendampingan": "Pendampingan",
    "selesai": "Selesai"
  };

  fetch('/api/project-control?action=clients').then(r => r.json()).then(d => {
    C = d;

    // Isi dropdown per tab yang ada generator pesan
    ['antrian','pelunasan','pendampingan','selesai'].forEach(t => {
      let s = document.getElementById('sel-' + t);
      if(!s) return;
      s.innerHTML = '<option value="">Pilih client...</option>';
      let status = statusByTab[t];
      let filtered = C.filter(c => c.statusProject === status);
      if(filtered.length === 0) {
        let o = document.createElement('option');
        o.value = '';
        o.textContent = 'Tidak ada client dengan status "' + status + '"';
        s.appendChild(o);
        return;
      }
      filtered.forEach(c => {
        let o = document.createElement('option');
        o.value = c.nama;
        o.textContent = `${c.nama} - ${c.nim}`;
        s.appendChild(o);
      });
    });
  }).catch(() => {});

  function sw(k,el){
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide').forEach(g => g.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('g-' + k).classList.add('active');

    let sel = document.getElementById('sel-' + k);
    if(sel) {
      sel.innerHTML = '<option value="">Pilih client...</option>';
      let status = statusByTab[k];
      let filtered = C.filter(c => c.statusProject === status);
      if(filtered.length === 0) {
        let o = document.createElement('option');
        o.value = '';
        o.textContent = 'Tidak ada client dengan status "' + status + '"';
        sel.appendChild(o);
        return;
      }
      filtered.forEach(c => {
        let o = document.createElement('option');
        o.value = c.nama;
        o.textContent = `${c.nama} - ${c.nim}`;
        sel.appendChild(o);
      });
    }
  }

  function gR(){
    var n = document.getElementById('inp-nama').value.trim();
    var k = document.getElementById('inp-kat').value;
    var p = document.getElementById('prev-review');
    if(!n){
      p.className = 'prev';
      p.textContent = 'Ketik nama client untuk generate pesan...';
      R.review = '';
      return;
    }
    var msg = (M['review_'+k]||'').replace('{nama}', n);
    R.review = msg;
    p.className = 'prev on';
    p.textContent = msg;
  }

  function gM(tab,nama){
    var p = document.getElementById('prev-'+tab);
    var conf = document.getElementById('confirm-'+tab);
    if(!nama){
      p.className = 'prev';
      p.textContent = 'Pilih client untuk generate pesan...';
      conf.textContent = '';
      R[tab] = '';
      return;
    }
    var c = C.find(x => x.nama === nama);
    if(!c) return;
    conf.textContent = '✓ '+c.nama+' | NIM: '+c.nim+' | '+c.jenis+' | '+c.aplikasi;
    var sisa = typeof c.sisa === 'number' ? Math.round(c.sisa).toLocaleString('id-ID') : (c.sisa || '0');
    var msg = (M[tab] || '').replace('{nama}', c.nama).replace('{jenis}', c.jenis).replace('{aplikasi}', c.aplikasi).replace('{kodeAkses}', c.kodeAkses).replace('{sisa}', sisa);
    R[tab] = msg;
    p.className = 'prev on';
    p.textContent = msg;
  }

  function cp(tab){
    var msg = R[tab];
    if(!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      var b = document.getElementById('btn-'+tab);
      var o = b.textContent;
      b.textContent = '✅ Pesan Tersalin!';
      b.classList.add('ok');
      setTimeout(() => {
        b.textContent = o;
        b.classList.remove('ok');
      }, 2000);
    });
  }
</script>
</body>
</html>
