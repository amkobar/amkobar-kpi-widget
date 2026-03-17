module.exports = async function handler(req, res) {

  // If request is for client data, return JSON
  if (req.query && req.query.action === 'clients') {
    const notionToken = process.env.NOTION_TOKEN;
    const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
    const headers = {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    function getProp(page, key) {
      const p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return p.title?.map(t => t.plain_text).join("") || "";
      if (p.type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") || "";
      if (p.type === "select") return p.select?.name || "";
      if (p.type === "number") return p.number ?? 0;
      if (p.type === "checkbox") return p.checkbox || false;
      if (p.type === "date") return p.date?.start || "";
      if (p.type === "formula") {
        const f = p.formula;
        if (f.type === "number") return f.number ?? 0;
        if (f.type === "string") return f.string || "";
      }
      if (p.type === "rollup") {
        const r = p.rollup;
        if (r.type === "number") return r.number ?? 0;
        if (r.type === "array") {
          const first = r.array?.[0];
          if (!first) return "";
          if (first.type === "select") return first.select?.name || "";
          if (first.type === "number") return first.number ?? 0;
          if (first.type === "rich_text") return first.rich_text?.map(t => t.plain_text).join("") || "";
        }
      }
      return "";
    }

    try {
      let all = [], cursor = undefined;
      while (true) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;
        const r = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: "POST", headers, body: JSON.stringify(body)
        });
        const data = await r.json();
        all = all.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
      }
      const clients = all.map(p => ({
        nama: getProp(p, "Nama Client"),
        nim: getProp(p, "NIM/NPM"),
        jenis: getProp(p, "Jenis Layanan"),
        aplikasi: getProp(p, "Aplikasi"),
        kodeAkses: getProp(p, "Kode Akses"),
        sisa: getProp(p, "Sisa Pembayaran"),
      })).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);
    } catch(e) {
      res.status(200).json([]);
    }
    return;
  }

  // Main HTML page
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
body{padding:1.25rem}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;transition:all .15s;background:transparent}
.tab:hover{background:#222;color:#ccc}
.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
.guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}
.guide.active{display:block}
.todo{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.6;margin-bottom:6px}
.todo-box{width:15px;height:15px;border-radius:3px;border:1.5px solid currentColor;flex-shrink:0;margin-top:3px;opacity:.5}
.gen-section{margin-top:14px;padding-top:14px}
.gen-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.gen-input{width:100%;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;padding:7px 10px;outline:none;margin-bottom:8px;color:inherit}
.gen-row{display:flex;gap:8px;margin-bottom:8px}
.gen-row .gen-input{margin-bottom:0}
.confirm-box{font-size:11px;margin-bottom:8px;min-height:16px;opacity:.8}
.preview-box{background:#00000033;border:0.5px solid currentColor;border-radius:8px;padding:12px;margin-bottom:8px;min-height:60px;font-size:12px;line-height:1.7;white-space:pre-wrap}
.preview-placeholder{font-style:italic;opacity:.5}
.copy-btn{width:100%;padding:8px;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;color:inherit;transition:all .15s}
.copy-btn:hover{opacity:.8}
.copy-btn.copied{background:#0f3d1f!important;border-color:#27500A!important}
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

<!-- MENUNGGU REVIEW -->
<div id="g-review" class="guide active" style="background:#E6F1FB;border-color:#378ADD;color:#0C447C">
  <div style="font-size:11px;font-weight:600;color:#378ADD;margin-bottom:4px;letter-spacing:.05em">TAHAP 2</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Pastikan Data Benar</div>
  <div class="todo"><div class="todo-box"></div><span>Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi</span></div>
  <div class="todo"><div class="todo-box"></div><span>Jika sudah benar ganti Status Project ke Antrian dan isi Tanggal DP</span></div>
  <div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>
  <div class="gen-section" style="border-top:0.5px solid #378ADD">
    <div class="gen-label" style="color:#378ADD">Generator Pesan WA &mdash; Sebelum Registrasi</div>
    <div class="gen-row">
      <input id="inp-nama" class="gen-input" type="text" placeholder="Ketik nama client..." oninput="genReview()" style="color:#0C447C">
      <select id="inp-kat" class="gen-input" onchange="genReview()" style="color:#0C447C;flex:0 0 140px">
        <option value="kerjasama">Kerjasama</option>
        <option value="umum">Umum</option>
      </select>
    </div>
    <div id="prev-review" class="preview-box preview-placeholder" style="border-color:#378ADD;color:#0C447C">Ketik nama client untuk generate pesan...</div>
    <button class="copy-btn" id="btn-review" onclick="copyMsg('review')" style="border-color:#378ADD;color:#0C447C">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- ANTRIAN -->
<div id="g-antrian" class="guide" style="background:#EAF3DE;border-color:#639922;color:#27500A">
  <div style="font-size:11px;font-weight:600;color:#639922;margin-bottom:4px;letter-spacing:.05em">TAHAP 3</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">DP masuk</div>
  <div class="todo"><div class="todo-box"></div><span>Isi Deadline jika sudah ditentukan</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Diproses jika akan dikerjakan</span></div>
  <div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>
  <div class="gen-section" style="border-top:0.5px solid #639922">
    <div class="gen-label" style="color:#639922">Generator Pesan WA</div>
    <select id="sel-antrian" class="gen-input" onchange="genMsg('antrian',this.value)" style="color:#27500A">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirm-antrian" class="confirm-box" style="color:#639922"></div>
    <div id="prev-antrian" class="preview-box preview-placeholder" style="border-color:#639922;color:#27500A">Pilih client untuk generate pesan...</div>
    <button class="copy-btn" id="btn-antrian" onclick="copyMsg('antrian')" style="border-color:#639922;color:#27500A">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- OVERDUE -->
<div id="g-overdue" class="guide" style="background:#F1EFE8;border-color:#888780;color:#444441">
  <div style="font-size:11px;font-weight:600;color:#888780;margin-bottom:4px;letter-spacing:.05em">PERHATIAN</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Project Melewati Deadline</div>
  <div class="todo"><div class="todo-box"></div><span>Cek client mana yang deadlinenya sudah lewat</span></div>
  <div class="todo"><div class="todo-box"></div><span>Segera selesaikan atau hubungi client untuk update progress</span></div>
  <div class="todo"><div class="todo-box"></div><span>Pertimbangkan ubah Deadline jika ada kendala</span></div>
</div>

<!-- DIPROSES -->
<div id="g-diproses" class="guide" style="background:#FAEEDA;border-color:#BA7517;color:#633806">
  <div style="font-size:11px;font-weight:600;color:#BA7517;margin-bottom:4px;letter-spacing:.05em">TAHAP 4</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Mulai pengerjaan</div>
  <div class="todo"><div class="todo-box"></div><span>Centang Tahap 2 Masuk jika skema 3 tahap dan pembayaran sudah masuk</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ubah dahulu Tanggal Selesai lalu Status Project</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Menunggu Pelunasan jika sudah selesai diproses</span></div>
</div>

<!-- MENUNGGU PELUNASAN -->
<div id="g-pelunasan" class="guide" style="background:#FAECE7;border-color:#D85A30;color:#993C1D">
  <div style="font-size:11px;font-weight:600;color:#D85A30;margin-bottom:4px;letter-spacing:.05em">TAHAP 5</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Hasil selesai</div>
  <div class="todo"><div class="todo-box"></div><span>Upload file ke folder Hasil Final di Google Drive client</span></div>
  <div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Pendampingan, ceklis Pelunasan Masuk jika sudah diterima dan buka akses Google Drive Hasil Final</span></div>
  <div class="gen-section" style="border-top:0.5px solid #D85A30">
    <div class="gen-label" style="color:#D85A30">Generator Pesan WA</div>
    <select id="sel-pelunasan" class="gen-input" onchange="genMsg('pelunasan',this.value)" style="color:#993C1D">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirm-pelunasan" class="confirm-box" style="color:#D85A30"></div>
    <div id="prev-pelunasan" class="preview-box preview-placeholder" style="border-color:#D85A30;color:#993C1D">Pilih client untuk generate pesan...</div>
    <button class="copy-btn" id="btn-pelunasan" onclick="copyMsg('pelunasan')" style="border-color:#D85A30;color:#993C1D">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- PENDAMPINGAN -->
<div id="g-pendampingan" class="guide" style="background:#EEEDFE;border-color:#7F77DD;color:#3C3489">
  <div style="font-size:11px;font-weight:600;color:#7F77DD;margin-bottom:4px;letter-spacing:.05em">TAHAP 6</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Pendampingan</div>
  <div class="todo"><div class="todo-box"></div><span>Jadwalkan sesi GMeet/Zoom dengan client dan isi Tanggal Sesi</span></div>
  <div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Selesai setelah sesi belajar selesai</span></div>
  <div class="gen-section" style="border-top:0.5px solid #7F77DD">
    <div class="gen-label" style="color:#7F77DD">Generator Pesan WA</div>
    <select id="sel-pendampingan" class="gen-input" onchange="genMsg('pendampingan',this.value)" style="color:#3C3489">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirm-pendampingan" class="confirm-box" style="color:#7F77DD"></div>
    <div id="prev-pendampingan" class="preview-box preview-placeholder" style="border-color:#7F77DD;color:#3C3489">Pilih client untuk generate pesan...</div>
    <button class="copy-btn" id="btn-pendampingan" onclick="copyMsg('pendampingan')" style="border-color:#7F77DD;color:#3C3489">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- SELESAI -->
<div id="g-selesai" class="guide" style="background:#E1F5EE;border-color:#1D9E75;color:#085041">
  <div style="font-size:11px;font-weight:600;color:#1D9E75;margin-bottom:4px;letter-spacing:.05em">TAHAP 7</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Selesai</div>
  <div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>
  <div class="todo"><div class="todo-box"></div><span>Pastikan semua data sudah lengkap di DATABASE PROJECT</span></div>
  <div class="gen-section" style="border-top:0.5px solid #1D9E75">
    <div class="gen-label" style="color:#1D9E75">Generator Pesan WA</div>
    <select id="sel-selesai" class="gen-input" onchange="genMsg('selesai',this.value)" style="color:#085041">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirm-selesai" class="confirm-box" style="color:#1D9E75"></div>
    <div id="prev-selesai" class="preview-box preview-placeholder" style="border-color:#1D9E75;color:#085041">Pilih client untuk generate pesan...</div>
    <button class="copy-btn" id="btn-selesai" onclick="copyMsg('selesai')" style="border-color:#1D9E75;color:#085041">&#128203; Copy Pesan</button>
  </div>
</div>

<!-- REFUND -->
<div id="g-refund" class="guide" style="background:#FCEBEB;border-color:#E24B4A;color:#A32D2D">
  <div style="font-size:11px;font-weight:600;color:#E24B4A;margin-bottom:4px;letter-spacing:.05em">PERHATIAN</div>
  <div style="font-size:15px;font-weight:500;margin-bottom:12px">Refund &amp; Dibatalkan</div>
  <div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Refund atau Dibatalkan</span></div>
  <div class="todo"><div class="todo-box"></div><span>Hapus atau ganti Kode Akses portal client di DATABASE PROJECT</span></div>
  <div class="todo"><div class="todo-box"></div><span>Ganti akses Google Drive client menjadi terbatas</span></div>
</div>

<script>
var CLIENTS = [];
var MSG = {};
var LINKS = {
  kerjasama: 'https://tally.so/r/jaBkzY?kh=khk',
  umum: 'https://tally.so/r/MeOabY?kh=khu'
};
var PORTAL = 'https://amkobar-portal.vercel.app';
var RATING = '[LINK RATING - SEGERA DIBUAT]';

// Fetch clients from Notion via API
fetch('/api/project-control?action=clients')
  .then(function(r){ return r.json(); })
  .then(function(data){
    CLIENTS = data;
    var sels = ['antrian','pelunasan','pendampingan','selesai'];
    sels.forEach(function(tab){
      var sel = document.getElementById('sel-'+tab);
      if(!sel) return;
      CLIENTS.forEach(function(c){
        var opt = document.createElement('option');
        opt.value = c.nama;
        opt.textContent = c.nama + ' - ' + c.nim;
        sel.appendChild(opt);
      });
    });
  })
  .catch(function(){});

function sw(key, el) {
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.guide').forEach(function(g){ g.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('g-'+key).classList.add('active');
}

function getClient(nama){
  return CLIENTS.find(function(c){ return c.nama === nama; });
}

function genReview() {
  var nama = document.getElementById('inp-nama').value.trim();
  var kat = document.getElementById('inp-kat').value;
  var link = LINKS[kat];
  var prev = document.getElementById('prev-review');
  if(!nama){
    prev.className = 'preview-box preview-placeholder';
    prev.textContent = 'Ketik nama client untuk generate pesan...';
    MSG['review'] = ''; return;
  }
  var msg = 'Halo ' + nama + ' \uD83D\uDC4B\n\nTerima kasih sudah menggunakan jasa kami \uD83D\uDE0A\nPembayaran DP sudah kami terima dengan baik \u2705\n\nUntuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n\uD83D\uDD17 ' + link + '\n\nIsi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan.\n\nJika ada pertanyaan, silakan menghubungi kami \uD83D\uDE0A\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  MSG['review'] = msg;
  prev.className = 'preview-box';
  prev.textContent = msg;
}

function genMsg(tab, nama) {
  var prev = document.getElementById('prev-'+tab);
  var confirm = document.getElementById('confirm-'+tab);
  if(!nama){
    prev.className = 'preview-box preview-placeholder';
    prev.textContent = 'Pilih client untuk generate pesan...';
    confirm.textContent = '';
    MSG[tab] = ''; return;
  }
  var c = getClient(nama);
  if(!c) return;
  confirm.textContent = '\u2713 ' + c.nama + ' | NIM: ' + c.nim + ' | ' + c.jenis + ' | ' + c.aplikasi;
  var msg = '';
  var sisa = typeof c.sisa === 'number' ? Math.round(c.sisa).toLocaleString('id-ID') : (c.sisa || '0');

  if(tab === 'antrian'){
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nTerima kasih sudah melakukan Registrasi \uD83C\uDF93\n\nBerikut informasi project kamu:\n\uD83D\uDCCB Layanan: ' + c.jenis + '\n\uD83D\uDCBB Aplikasi: ' + c.aplikasi + '\n\uD83D\uDD11 Kode Akses Portal: ' + c.kodeAkses + '\n\nPantau progress Olahdatamu di portal berikut:\n' + PORTAL + '\nMasukkan Kode Akses untuk login ya! \uD83D\uDE0A\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if(tab === 'pelunasan'){
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nPengerjaan project sudah selesai \uD83C\uDF89\n\nFile hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.\nUntuk membuka akses download silahkan lakukan pelunasan:\n\uD83D\uDCB0 Rp ' + sisa + '\n\nSetelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp.\nSetelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.\n\nTerima kasih! \uD83D\uDE4F\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if(tab === 'pendampingan'){
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nSesi pendampingan & pembelajaran akan kami informasikan melalui group ya \uD83D\uDE0A\n\nSesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan - kami akan konfirmasi ketersediaan jadwal kami.\n\nLink meeting akan dikirimkan menjelang sesi berlangsung.\nMohon pastikan sudah siap pada waktu yang sudah disepakati \uD83D\uDE4F\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if(tab === 'selesai'){
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nSesi pendampingan sudah selesai, terima kasih sudah bersama kami! \uD83D\uDE4F\n\nJika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja \uD83D\uDE0A\n\nKami sangat menghargai jika berkenan memberikan rating atas layanan kami:\n\u2B50 ' + RATING + '\n\nSukses selalu untuk skripsinya! \uD83D\uDCAA\uD83C\uDF93\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  }
  MSG[tab] = msg;
  prev.className = 'preview-box';
  prev.textContent = msg;
}

function copyMsg(tab) {
  var msg = MSG[tab];
  if(!msg) return;
  navigator.clipboard.writeText(msg).then(function(){
    var btn = document.getElementById('btn-'+tab);
    var orig = btn.textContent;
    btn.textContent = '\u2705 Pesan Tersalin!';
    btn.classList.add('copied');
    setTimeout(function(){ btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
  });
}
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html);
};
