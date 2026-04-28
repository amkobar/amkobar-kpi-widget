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

  var html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3;padding:12px;min-height:300px}

.collapse-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:#141414;border:1px solid #2a2a2a;border-radius:8px;margin-bottom:6px;transition:background .15s;user-select:none}
.collapse-hdr:hover{background:#1a1a1a}
.collapse-hdr.open{border-radius:8px 8px 0 0;margin-bottom:0}
.collapse-left{display:flex;align-items:center;gap:8px}
.c-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.c-lbl{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em}
.c-hint{font-size:10px;color:#555;margin-left:2px}
.c-arrow{font-size:11px;color:#555;transition:transform .2s}
.c-arrow.open{transform:rotate(180deg)}
.collapse-body{display:none;background:#191919;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 8px 8px;padding:14px;margin-bottom:10px}
.collapse-body.open{display:block}

.g2{display:grid;grid-template-columns:1.1fr 1fr;gap:14px}
.col-steps{}
.col-gen{border-left:1px solid #2a2a2a;padding-left:14px}
.slbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-bottom:9px}
.step-r{display:flex;align-items:flex-start;gap:8px;margin-bottom:7px}
.snum{width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.stxt{font-size:12px;color:#aaa;line-height:1.45}

.inp{width:100%;background:#252525;border:1px solid #444;border-radius:5px;font-size:12px;padding:7px 10px;color:#eee;outline:none;margin-bottom:7px;font-family:inherit}
.inp:focus{border-color:#378ADD}
.row{display:flex;gap:6px}
.sel{background:#252525;border:1px solid #444;border-radius:5px;font-size:11px;padding:7px 8px;color:#eee;outline:none;font-family:inherit}
.prev{background:#151515;border:1px solid #2a2a2a;border-radius:6px;padding:10px 12px;min-height:90px;font-size:12px;line-height:1.6;color:#555;white-space:pre-wrap;margin-bottom:8px}
.prev.on{color:#ddd;border-color:#333}
.btn{width:100%;padding:8px;background:#252525;border:1px solid #444;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;color:#eee;transition:.2s;font-family:inherit}
.btn:hover{background:#333}
.btn.ok{background:#0f3d1f!important;border-color:#27500A!important;color:#4ade80!important}

.t2-hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.t2-badge{display:inline-flex;align-items:center;gap:5px;background:#1a3d1f;border-radius:100px;padding:3px 10px;font-size:10px;font-weight:700;color:#639922;text-transform:uppercase;letter-spacing:.04em}

.tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.tab{font-size:11px;padding:5px 11px;border-radius:5px;border:1px solid #333;color:#888;cursor:pointer;background:transparent;transition:.15s;font-family:inherit}
.tab:hover{background:#252525}
.tab.active{background:#232323;color:#fff;border-color:#378ADD;font-weight:500}
.tab.ov{border-color:#5a3d00;color:#BA7517}
.tab.ov.active{background:#1f1800;color:#f0a500;border-color:#BA7517}

.guide{background:#1f1800;border-left:3px solid #BA7517;border-radius:0 5px 5px 0;padding:8px 12px;font-size:11.5px;color:#BA7517;line-height:1.5;margin-bottom:10px}

.chklist{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.chk{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #2a2a2a;border-radius:5px;background:#1e1e1e;cursor:pointer;transition:background .12s}
.chk:hover{background:#232323}
.chkb{width:14px;height:14px;border-radius:3px;border:1.5px solid #444;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:.15s}
.chkb.done{background:#0f3d1f;border-color:#27500A}
.chktxt{font-size:12px;color:#aaa;flex:1;line-height:1.4;transition:color .15s}
.chktxt.done{color:#555;text-decoration:line-through}

.gen-wrap{background:#141414;border:1px solid #2a2a2a;border-radius:6px;padding:12px;margin-top:2px}
.genlbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-bottom:9px}
.warn{color:#f08c00;font-size:11px;margin-bottom:6px;display:none}

.hint{display:flex;align-items:center;gap:6px;font-size:11px;color:#444;padding-top:8px;border-top:1px solid #2a2a2a}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#333;border-radius:10px}
</style>
</head>
<body>

<!-- TAHAP 1: COLLAPSIBLE -->
<div class="collapse-hdr" id="t1-hdr" onclick="toggleT1()">
  <div class="collapse-left">
    <div class="c-dot" style="background:#378ADD"></div>
    <span class="c-lbl">Tahap 1 — Sebelum Registrasi</span>
    <span class="c-hint">(klik untuk buka)</span>
  </div>
  <span class="c-arrow" id="t1-arrow">&#9660;</span>
</div>
<div class="collapse-body" id="t1-body">
  <div class="g2">
    <div class="col-steps">
      <div class="slbl">Langkah konfirmasi</div>
      <div class="step-r"><div class="snum">1</div><div class="stxt">Verifikasi DP sudah masuk dari bukti transfer client</div></div>
      <div class="step-r"><div class="snum">2</div><div class="stxt">Generate pesan WA di kanan, copy & kirim ke client</div></div>
      <div class="step-r"><div class="snum">3</div><div class="stxt">Tunggu client isi form — data akan muncul otomatis di tab Menunggu Review di bawah</div></div>
    </div>
    <div class="col-gen">
      <div class="slbl">Generator Pesan WA</div>
      <div class="row">
        <input id="inp-nama" class="inp" placeholder="Ketik nama client..." oninput="gR()" style="margin-bottom:0;flex:1">
        <select id="inp-kat" class="sel" onchange="gR()">
          <option value="kerjasama">Kerjasama</option>
          <option value="umum">Umum</option>
        </select>
      </div>
      <div id="prev-t1" class="prev" style="margin-top:7px">Ketik nama client untuk generate pesan...</div>
      <button class="btn" id="btn-t1" onclick="cp('t1')">&#128203; Salin Pesan</button>
    </div>
  </div>
</div>

<!-- TAHAP 2 -->
<div class="t2-hdr">
  <div class="t2-badge">&#9654; Tahap 2 — Setelah Registrasi</div>
</div>

<div class="tabs">
  <div class="tab active" onclick="sw('review',this)">Menunggu Review</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab ov" onclick="sw('overdue',this)">Overdue</div>
  <div class="tab" onclick="sw('diproses',this)">Diproses</div>
  <div class="tab" onclick="sw('pelunasan',this)">Menunggu Pelunasan</div>
  <div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div class="guide" id="guide-box"></div>
<div class="chklist" id="chklist"></div>
<div id="gen-area"></div>

<div class="hint">
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v7M2.5 5.5L5.5 9l3-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
  Scroll ke bawah lalu klik tab yang sama di database Notion
</div>

<script>
var M={
  "review_kerjasama":"Halo {nama} 👋\n\n🙏 Terima kasih sudah menggunakan jasa kami\n✅ Pembayaran DP sudah kami terima\n🔗 Silakan registrasi di: https://tally.so/r/jaBkzY?kh=khk",
  "review_umum":"Halo {nama} 👋\n\n🙏 Terima kasih sudah menggunakan jasa kami\n✅ Pembayaran DP sudah kami terima\n🔗 Silakan registrasi di: https://tally.so/r/MeOabY?kh=khu",
  "antrian":"Halo {nama} 👋\n\nBerikut info portal AMKOBAR kamu:\n🔑 Kode Akses: {kodeAkses}\n🔗 https://amkobar-portal.vercel.app\n\nLogin untuk pantau progress project kamu ya!",
  "pelunasan":"Halo {nama} 👋\n\nProject kamu sudah selesai dikerjakan! 🎉\n\n📦 {jenis} - {aplikasi}\n💳 DP sudah diterima: Rp {dp}\n💰 Sisa pembayaran: Rp {sisa}\n\nSilakan lakukan pelunasan. Setelah lunas, akses file hasil tersedia di portal:\n🔑 Kode Akses: {kodeAkses}\n🔗 https://amkobar-portal.vercel.app\n\nTerima kasih!",
  "pendampingan":"Halo {nama} 👋\n\nProject kamu sudah masuk tahap *Pendampingan* 🎓\n\nKamu akan mendapat jadwal sesi belajar via grup WA AMKOBAR. Pastikan kamu sudah tergabung di grup ya.\n\nPantau status di portal:\n🔑 Kode Akses: {kodeAkses}\n🔗 https://amkobar-portal.vercel.app",
  "selesai":"Halo {nama} 👋\n\nTerima kasih! Sesi pendampingan kita sudah selesai 🙏\n\nUntuk mengaktifkan *Akses Permanen* ke file project kamu, mohon berikan rating singkat melalui portal:\n\n🔑 Kode Akses: {kodeAkses}\n🔗 https://amkobar-portal.vercel.app\n\nSetelah rating diisi, akses file kamu otomatis jadi permanen. Sukses untuk sidangnya! 💪🎓"
};
var MSG = M;

var TABS = {
  review: {
    guide: "Verifikasi data client yang baru registrasi. Pastikan semua kolom sudah benar sebelum mengubah status.",
    checks: [
      "Pastikan Nama, NIM, dan Judul Penelitian sudah benar",
      "Pastikan Aplikasi, Jenis Layanan & Jumlah Variabel sudah terisi",
      "Pastikan DP Masuk sudah tercentang di Notion",
      "Ubah Status Project ke Antrian & isi Tanggal DP"
    ],
    gen: null
  },
  antrian: {
    guide: "Client sudah terkonfirmasi. Kirim kode akses portal & siapkan pengerjaan sesuai urutan antrian.",
    checks: [
      "Kirim kode akses portal ke client via WA menggunakan Generator di bawah",
      "Pastikan file & data dari client sudah masuk ke Google Drive",
      "Isi kolom Deadline estimasi selesai di Notion"
    ],
    gen: "antrian"
  },
  overdue: {
    guide: "Project sudah melewati deadline. Segera tindak lanjuti dan informasikan ke client.",
    checks: [
      "Cek penyebab keterlambatan",
      "Hubungi client via WA — informasikan kondisi terkini",
      "Update Deadline baru di Notion jika perlu"
    ],
    gen: null
  },
  diproses: {
    guide: "Project sedang dikerjakan. Selesaikan sesuai paket yang dipilih client.",
    checks: [
      "Kerjakan sesuai paket yang dipilih client",
      "Upload hasil ke folder Hasil Final di Google Drive setelah selesai",
      "Ubah Status ke Menunggu Pelunasan setelah hasil siap dikirim"
    ],
    gen: null
  },
  pelunasan: {
    guide: "Hasil sudah selesai dikerjakan. Kirim tagihan ke client & tunggu pelunasan.",
    checks: [
      "Kirim tagihan ke client via Generator WA di bawah",
      "Setelah pelunasan masuk, centang Pelunasan Masuk di Notion",
      "Ubah Status ke Pendampingan"
    ],
    gen: "pelunasan"
  },
  pendampingan: {
    guide: "Lakukan sesi pendampingan & pastikan client memahami hasil pengerjaan.",
    checks: [
      "Jadwalkan & lakukan sesi pembelajaran (Gmeet/Zoom) dengan client",
      "Berikan arahan hasil kepada client",
      "Ubah Status ke Selesai setelah semua sesi selesai"
    ],
    gen: "pendampingan"
  },
  selesai: {
    guide: "Project selesai. Pastikan client mengisi rating untuk mengaktifkan Akses Permanen.",
    checks: [
      "Pastikan semua file sudah diupload ke folder Hasil Final di Google Drive",
      "Kirim WA ke client via Generator di bawah",
      "Minta client isi rating di portal untuk aktifkan Akses Permanen"
    ],
    gen: "selesai"
  }
};

var GEN_LABELS = {
  antrian: "Generator Pesan — Akses Portal",
  pelunasan: "Generator Pesan — Tagihan",
  pendampingan: "Generator Pesan — Info Pendampingan",
  selesai: "Generator Pesan — Project Selesai"
};

var C = [], R = {};

fetch('?action=clients').then(function(r){return r.json();}).then(function(d){
  C = d;
});

function sw(k, el) {
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  el.classList.add('active');

  var t = TABS[k];
  document.getElementById('guide-box').textContent = t.guide;

  document.getElementById('chklist').innerHTML = t.checks.map(function(c){
    return '<div class="chk" onclick="tc(this)">'
      + '<div class="chkb"></div>'
      + '<div class="chktxt">' + c + '</div>'
      + '</div>';
  }).join('');

  var genArea = document.getElementById('gen-area');
  if (t.gen) {
    var statusMap = {
      antrian: "Antrian",
      pelunasan: "Menunggu Pelunasan",
      pendampingan: "Pendampingan",
      selesai: "Selesai"
    };
    var opts = C.filter(function(c){
      return (c.status||'').toLowerCase().includes(statusMap[t.gen].toLowerCase());
    }).map(function(c){
      return '<option value="' + c.nama + '">' + c.nama + '</option>';
    }).join('');

    var warnHtml = t.gen === 'pelunasan'
      ? '<div class="warn" id="warn-lunas">\u26A0\uFE0F Client sudah lunas! Tidak perlu kirim tagihan.</div>'
      : '';

    genArea.innerHTML = '<div class="gen-wrap">'
      + '<div class="genlbl">' + GEN_LABELS[t.gen] + '</div>'
      + warnHtml
      + '<select class="inp" id="sel-' + t.gen + '" onchange="gM(\'' + t.gen + '\',this.value)">'
      + '<option value="">Pilih client...</option>'
      + opts
      + '</select>'
      + '<div id="prev-' + t.gen + '" class="prev">Pilih client untuk generate pesan...</div>'
      + '<button class="btn" id="btn-' + t.gen + '" onclick="cp(\'' + t.gen + '\')">&#128203; Salin Pesan</button>'
      + '</div>';
  } else {
    genArea.innerHTML = '';
  }
}

function tc(row) {
  var b = row.querySelector('.chkb');
  var t = row.querySelector('.chktxt');
  var done = b.classList.toggle('done');
  t.classList.toggle('done', done);
  b.innerHTML = done
    ? '<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline points="1,4.5 3.5,7 8,2" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '';
}

function toggleT1() {
  var body = document.getElementById('t1-body');
  var hdr = document.getElementById('t1-hdr');
  var arrow = document.getElementById('t1-arrow');
  var hint = hdr.querySelector('.c-hint');
  var open = body.classList.toggle('open');
  hdr.classList.toggle('open', open);
  arrow.classList.toggle('open', open);
  if (hint) hint.textContent = open ? '(klik untuk tutup)' : '(klik untuk buka)';
}

function gR() {
  var n = document.getElementById('inp-nama').value;
  var k = document.getElementById('inp-kat').value;
  var msg = MSG['review_' + k].replace('{nama}', n || '...');
  R.t1 = msg;
  var p = document.getElementById('prev-t1');
  p.textContent = msg; p.classList.add('on');
}

function gM(tab, nama) {
  var warn = document.getElementById('warn-lunas');
  if (warn) warn.style.display = 'none';
  var c = C.find(function(x){return x.nama === nama;}); if (!c) return;
  var p = document.getElementById('prev-' + tab);
  if (tab === 'pelunasan' && c.sisa <= 0) {
    p.textContent = "\u274C Client sudah LUNAS.\nTidak perlu kirim tagihan.";
    p.classList.remove('on');
    if (warn) warn.style.display = 'block';
    R[tab] = ""; return;
  }
  var sisa = typeof c.sisa === 'number' ? c.sisa.toLocaleString('id-ID') : c.sisa;
  var dp = typeof c.dp === 'number' ? c.dp.toLocaleString('id-ID') : c.dp;
  var msg = (MSG[tab] || "")
    .replace('{nama}', c.nama)
    .replace('{kodeAkses}', c.kodeAkses || '-')
    .replace('{sisa}', sisa || '0')
    .replace('{dp}', dp || '0')
    .replace('{jenis}', c.jenis || '-')
    .replace('{aplikasi}', c.aplikasi || '-');
  R[tab] = msg; p.textContent = msg; p.classList.add('on');
}

function fallbackCopy(text) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function cp(tab) {
  var msg = R[tab]; if (!msg) return;
  var btn = document.getElementById('btn-' + tab); if (!btn) return;
  var old = btn.textContent;
  function onDone(){btn.textContent = '\u2713 Tersalin!'; btn.classList.add('ok'); setTimeout(function(){btn.textContent = old; btn.classList.remove('ok');}, 1500);}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(onDone).catch(function(){fallbackCopy(msg); onDone();});
  } else { fallbackCopy(msg); onDone(); }
}

window.onload = function(){ sw('review', document.querySelector('.tab.active')); };
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
