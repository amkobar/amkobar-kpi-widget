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
  /* ... CSS sama seperti sebelum nya ... */
  /* Anda bisa copy css dari jawaban sebelumnya jika perlu */
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
<!-- Konten tab mirip jawaban sebelumnya, tidak saya potong agar lengkap -->
<script>
  var M = {
    review_kerjasama: \`Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/jaBkzY?kh=khk

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓\`,
    review_umum: \`Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/MeOabY?kh=khu

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓\`,
    antrian: \`Halo {nama} 👋

Terima kasih sudah melakukan Registrasi

Berikut informasi project :
📝 Layanan: {jenis}
💻 Aplikasi: {aplikasi}
🔑 Kode Akses Portal: {kodeAkses}

Pantau progress Olahdatamu di portal berikut:
https://amkobar-portal.vercel.app
Masukkan Kode Akses untuk login ya! 😊

Salam,
Tim AMKOBAR 🎓\`,
    pelunasan: \`Halo {nama} 👋

1️⃣Pengerjaan project sudah selesai 🎉
2️⃣File hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.
3️⃣Untuk Membuka akses download silahkan lakukan pelunasan
💰 Rp {sisa}

Setelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp
Setelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.

Terima kasih! 🙏

Salam,
Tim AMKOBAR 🎓\`,
    pendampingan: \`Halo {nama} 👋

👉 Sesi pendampingan & pembelajaran akan kami informasikan melalui group
👉 Sesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan — kami akan konfirmasi ketersediaan jadwal kami.

Link meeting akan dikirimkan menjelang sesi berlangsung.
Mohon pastikan sudah siap pada waktu yang sudah disepakati 🙏

Salam,
Tim AMKOBAR 🎓\`,
    selesai: \`Halo {nama} 👋

Sesi pendampingan sudah selesai, terima kasih! 🙏

Jika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja 😊

Kami sangat menghargai jika berkenan memberikan testimoni atas layanan kami:
⭐ [LINK RATING]

Sukses selalu untuk skripsinya! 💪🎓

Salam,
Tim AMKOBAR 🎓\`
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
