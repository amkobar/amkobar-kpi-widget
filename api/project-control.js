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
      if (p.type === "title") return (p.title || []).map(t => t.plain_text).join("") || "";
      if (p.type === "rich_text") return (p.rich_text || []).map(t => t.plain_text).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
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
        var body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;
        var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
          method: "POST", headers: headers, body: JSON.stringify(body)
        });
        var data = await resp.json();
        all = all.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
      }

      var clients = all.map(p => ({
        nama: getProp(p, "Nama Client"),
        nim: getProp(p, "NIM/NPM"),
        jenis: getProp(p, "Jenis Layanan"),
        aplikasi: getProp(p, "Aplikasi"),
        kodeAkses: getProp(p, "Kode Akses"),
        sisa: getProp(p, "Sisa Pembayaran"),
        status: getProp(p, "Status Project"),
      })).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);
    } catch (e) {
      res.status(200).json([]);
    }
    return;
  }

  var html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    background: #191919;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #eee;
  }
  body {
    padding: 1.25rem;
  }
  .tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .tab {
    font-size: 12px;
    padding: 5px 14px;
    border-radius: 6px;
    border: 0.5px solid #333;
    color: #888;
    cursor: pointer;
    background: transparent;
    user-select: none;
    transition: color 0.2s, background 0.2s;
  }
  .tab.active {
    background: #0f1b2d;
    color: #fff;
    border-color: #1a6bbd;
    font-weight: 500;
  }
  .tab:hover:not(.active) {
    color: #bbb;
  }
  .guide {
    border-left: 3px solid;
    border-radius: 0 8px 8px 0;
    padding: 16px 18px;
    display: none;
    background: #222;
  }
  .guide.active {
    display: block;
  }
  .todo {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 6px;
    color: #ccc;
  }
  .box {
    width: 15px;
    height: 15px;
    border-radius: 3px;
    border: 1.5px solid currentColor;
    flex-shrink: 0;
    margin-top: 3px;
    opacity: 0.5;
  }
  .gen {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 0.5px solid currentColor;
  }
  .lbl {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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
    opacity: 0.8;
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
    opacity: 0.6;
    color: #aaa;
  }
  .prev.on {
    font-style: normal;
    opacity: 1;
    color: #eee;
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
    transition: background-color 0.2s, border-color 0.2s;
  }
  .btn.ok {
    background: #0f3d1f !important;
    border-color: #27500a !important;
    color: #cfffcf;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="sw('review', this)">Menunggu Review</div>
  <div class="tab" onclick="sw('antrian', this)">Antrian</div>
  <div class="tab" onclick="sw('overdue', this)">Overdue</div>
  <div class="tab" onclick="sw('diproses', this)">Diproses</div>
  <div class="tab" onclick="sw('pelunasan', this)">Menunggu Pelunasan</div>
  <div class="tab" onclick="sw('pendampingan', this)">Pendampingan</div>
  <div class="tab" onclick="sw('selesai', this)">Selesai</div>
  <div class="tab" onclick="sw('refund', this)">Refund & Dibatalkan</div>
</div>

<!-- Tab content containers (gunakan id 'g-' + tab name) -->
<div id="g-review" class="guide active">
  <!-- Isi konten tab review di sini, sesuai kebutuhan -->
</div>
<!-- Tambahkan juga div dengan id g-antrian, g-overdue, g-diproses, dst -->

<script>
  // Template pesan WA (gunakan backticks untuk multiline)
  var M = {
    review_kerjasama: `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/jaBkzY?kh=khk

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,
    review_umum: `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/MeOabY?kh=khu

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,
    antrian: `Halo {nama} 👋

Terima kasih sudah melakukan Registrasi

Berikut informasi project :
📝 Layanan: {jenis}
💻 Aplikasi: {aplikasi}
🔑 Kode Akses Portal: {kodeAkses}

Pantau progress Olahdatamu di portal berikut:
https://amkobar-portal.vercel.app
Masukkan Kode Akses untuk login ya! 😊

Salam,
Tim AMKOBAR 🎓`,
    pelunasan: `Halo {nama} 👋

1️⃣Pengerjaan project sudah selesai 🎉
2️⃣File hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.
3️⃣Untuk Membuka akses download silahkan lakukan pelunasan
💰 Rp {sisa}

Setelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp
Setelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.

Terima kasih! 🙏

Salam,
Tim AMKOBAR 🎓`,
    pendampingan: `Halo {nama} 👋

👉 Sesi pendampingan & pembelajaran akan kami informasikan melalui group
👉 Sesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan — kami akan konfirmasi ketersediaan jadwal kami.

Link meeting akan dikirimkan menjelang sesi berlangsung.
Mohon pastikan sudah siap pada waktu yang sudah disepakati 🙏

Salam,
Tim AMKOBAR 🎓`,
    selesai: `Halo {nama} 👋

Sesi pendampingan sudah selesai, terima kasih! 🙏

Jika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja 😊

Kami sangat menghargai jika berkenan memberikan testimoni atas layanan kami:
⭐ [LINK RATING]

Sukses selalu untuk skripsinya! 💪🎓

Salam,
Tim AMKOBAR 🎓`
  };

  var C = [];
  var R = {};

  function sw(k, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide').forEach(g => g.classList.remove('active'));
    el.classList.add('active');
    var content = document.getElementById('g-' + k);
    if (content) content.classList.add('active');
  }

  fetch('/api/project-control?action=clients')
    .then(r => r.json())
    .then(d => {
      C = d;
      function mapTabToStatus(tab) {
        const map = {
          review: "Menunggu Review",
          antrian: "Antrian",
          overdue: "Diproses",
          diproses: "Diproses",
          pelunasan: "Menunggu Pelunasan",
          pendampingan: "Pendampingan",
          selesai: "Selesai",
          refund: "Refund"
        };
        return map[tab] || "";
      }
      ['antrian', 'pelunasan', 'pendampingan', 'selesai'].forEach(tab => {
        var sel = document.getElementById('sel-' + tab);
        if (!sel) return;
        sel.innerHTML = '<option value="">Pilih client...</option>';
        C.filter(c => c.status === mapTabToStatus(tab)).forEach(c => {
          var o = document.createElement('option');
          o.value = c.nama;
          o.textContent = c.nama + ' - ' + c.nim;
          sel.appendChild(o);
        });
      });
    }).catch(() => { });

  function gR() {
    var n = document.getElementById('inp-nama').value.trim();
    var k = document.getElementById('inp-kat').value;
    var p = document.getElementById('prev-review');
    var b = document.getElementById('btn-review');
    if (!n) {
      p.className = 'prev';
      p.textContent = 'Ketik nama client untuk generate pesan...';
      R.review = '';
      if (b) b.disabled = true;
      return;
    }
    var msg = (M['review_' + k] || '').replace('{nama}', n);
    R.review = msg;
    p.className = 'prev on';
    p.textContent = msg;
    if (b) b.disabled = false;
  }

  function gM(tab, nama) {
    var p = document.getElementById('prev-' + tab);
    var conf = document.getElementById('confirm-' + tab);
    var b = document.getElementById('btn-' + tab);
    if (!nama) {
      p.className = 'prev';
      p.textContent = 'Pilih client untuk generate pesan...';
      if (conf) conf.textContent = '';
      R[tab] = '';
      if (b) b.disabled = true;
      return;
    }
    var c = C.find(x => x.nama === nama);
    if (!c) return;
    if (conf) conf.textContent = '✓ ' + c.nama + ' | NIM: ' + c.nim + ' | ' + c.jenis + ' | ' + c.aplikasi;
    var sisa = (typeof c.sisa === 'number') ? Math.round(c.sisa).toLocaleString('id-ID') : (c.sisa || '0');
    var msg = (M[tab] || '').replace('{nama}', c.nama)
      .replace('{jenis}', c.jenis)
      .replace('{aplikasi}', c.aplikasi)
      .replace('{kodeAkses}', c.kodeAkses)
      .replace('{sisa}', sisa);
    R[tab] = msg;
    p.className = 'prev on';
    p.textContent = msg;
    if (b) b.disabled = false;
  }

  function cp(tab) {
    var msg = R[tab];
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      var b = document.getElementById('btn-' + tab);
      if (!b) return;
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
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html);
};
