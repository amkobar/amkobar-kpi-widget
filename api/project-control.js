module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = process.env.DATABASE_ID;

  if (!notionToken || !projectDbId) {
    res.status(500).json({ error: "NOTION_TOKEN or DATABASE_ID is not set in environment variables." });
    return;
  }

  if (req.query && req.query.action === 'clients') {
    const headers = {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    function getProp(page, key) {
      const p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return (p.title || []).map(t => t.plain_text).join("") || "";
      if (p.type === "rich_text") return (p.rich_text || []).map(t => t.plain_text).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "number") return p.number != null ? p.number : 0;
      if (p.type === "checkbox") return p.checkbox || false;
      if (p.type === "date") return p.date && p.date.start ? p.date.start : "";
      if (p.type === "formula") {
        if (p.formula.type === "string") return p.formula.string || "";
        if (p.formula.type === "number") return p.formula.number != null ? p.formula.number : 0;
      }
      if (p.type === "rollup") {
        if (p.rollup.type === "number") return p.rollup.number != null ? p.rollup.number : 0;
        if (p.rollup.type === "array" && p.rollup.array.length > 0) {
          const first = p.rollup.array[0];
          if (first.type === "select") return (first.select && first.select.name) || "";
          if (first.type === "number") return first.number != null ? first.number : 0;
        }
      }
      return "";
    }

    try {
      let all = [];
      let cursor = undefined;
      while (true) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;

        const resp = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const err = await resp.text();
          throw new Error(`Notion API responded with status ${resp.status}: ${err}`);
        }

        const data = await resp.json();
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
        status: getProp(p, "Status Project"),
      })).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch data from Notion API.", detail: e.message });
    }

    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AMKOBAR Project Control</title>
<style>
  * {
    box-sizing: border-box;
    margin: 0; padding: 0;
  }
  html, body {
    background-color: #191919;
    color: #eee;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 1rem;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 1rem;
  }
  .tab {
    cursor: pointer;
    background: transparent;
    border: 0.5px solid #333;
    color: #888;
    border-radius: 6px;
    padding: 5px 14px;
    font-size: 12px;
    user-select: none;
    transition: all 0.2s;
  }
  .tab.active {
    background: #0f1b2d;
    border-color: #1a6bbd;
    color: #fff;
    font-weight: 500;
  }
  .guide {
    border-left: 3px solid;
    border-radius: 0 8px 8px 0;
    padding: 1rem;
    display: none;
    background: #222;
    margin-bottom: 1rem;
  }
  .guide.active {
    display: block;
  }
  .gen {
    margin-top: 1rem;
    border-top: 0.5px solid currentColor;
    padding-top: 1rem;
  }
  .lbl {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }
  .inp {
    width: 100%;
    background: #00000033;
    border: 0.5px solid currentColor;
    border-radius: 6px;
    font-size: 12px;
    padding: 7px 10px;
    outline: none;
    margin-bottom: 0.5rem;
    color: inherit;
  }
  .btn {
    width: 100%;
    background: #00000033;
    border: 0.5px solid currentColor;
    border-radius: 6px;
    padding: 8px;
    font-size: 12px;
    cursor: pointer;
    color: inherit;
    font-weight: 500;
  }
  .btn.ok {
    background: #0f3d1f !important;
    border-color: #27500a !important;
  }
  .prev {
    background: #00000033;
    border: 0.5px solid currentColor;
    border-radius: 8px;
    padding: 12px;
    min-height: 60px;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    font-style: italic;
    opacity: 0.6;
    margin-bottom: 1rem;
  }
  .prev.on {
    opacity: 1;
    font-style: normal;
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

<div id="g-review" class="guide active">
  <div><strong>Gen Pesan WA - Review</strong></div>
  <input id="inp-nama" class="inp" placeholder="Nama Client" oninput="gR()" />
  <select id="inp-kat" class="inp" onchange="gR()">
    <option value="kerjasama">Kerjasama</option>
    <option value="umum">Umum</option>
  </select>
  <div id="prev-review" class="prev">Ketik nama client untuk generate pesan...</div>
  <button id="btn-review" class="btn" onclick="cp('review')" disabled>Copy Pesan</button>
</div>

<div id="g-antrian" class="guide">
  <div><strong>Gen Pesan WA - Antrian</strong></div>
  <select id="sel-antrian" class="inp" onchange="gM('antrian', this.value)">
    <option value="">Pilih client...</option>
  </select>
  <div id="prev-antrian" class="prev">Pilih client untuk generate pesan...</div>
  <button id="btn-antrian" class="btn" onclick="cp('antrian')" disabled>Copy Pesan</button>
</div>

<!-- Tambahkan div lain untuk tab overdue, diproses, pelunasan, pendampingan, selesai, refund sesuai kebutuhan -->

<script>
  var M = {
    review_kerjasama: `Halo {nama} 👋
🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/jaBkzY?kh=khk
Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami.
Salam, Tim AMKOBAR 🎓`,
    review_umum: `Halo {nama} 👋
🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/MeOabY?kh=khu
Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami.
Salam, Tim AMKOBAR 🎓`,
    antrian: `Halo {nama} 👋
Terima kasih sudah melakukan Registrasi
Layanan: {jenis}
Aplikasi: {aplikasi}
Kode Akses Portal: {kodeAkses}
Pantau progress di:
https://amkobar-portal.vercel.app
Salam, Tim AMKOBAR 🎓`
  };

  var C = [];
  var R = {};

  function sw(k, el) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".guide").forEach(g => g.classList.remove("active"));
    el.classList.add("active");
    const content = document.getElementById("g-" + k);
    if (content) content.classList.add("active");
  }

  fetch("/api/project-control?action=clients")
    .then(r => r.json())
    .then(d => {
      C = d;
      const selAntrian = document.getElementById("sel-antrian");
      if (!selAntrian) return;
      selAntrian.innerHTML = '<option value="">Pilih client...</option>';
      C.forEach(c => {
        if (c.status === "Antrian") {
          var o = document.createElement("option");
          o.value = c.nama;
          o.textContent = c.nama + " - " + c.nim;
          selAntrian.appendChild(o);
        }
      });
    });

  function gR() {
    const nama = document.getElementById("inp-nama").value.trim();
    const kat = document.getElementById("inp-kat").value;
    const prev = document.getElementById("prev-review");
    const btn = document.getElementById("btn-review");
    if (!nama) {
      prev.textContent = "Ketik nama client untuk generate pesan...";
      R.review = "";
      btn.disabled = true;
      return;
    }
    const msg = (M["review_" + kat] || "").replace("{nama}", nama);
    R.review = msg;
    prev.textContent = msg;
    btn.disabled = false;
  }

  function gM(tab, nama) {
    var prev = document.getElementById("prev-" + tab);
    var btn = document.getElementById("btn-" + tab);
    if (!nama) {
      prev.textContent = "Pilih client untuk generate pesan...";
      R[tab] = "";
      btn.disabled = true;
      return;
    }
    var c = C.find(x => x.nama === nama);
    if (!c) return;
    var msg = (M[tab] || "")
      .replace("{nama}", c.nama)
      .replace("{jenis}", c.jenis)
      .replace("{aplikasi}", c.aplikasi)
      .replace("{kodeAkses}", c.kodeAkses)
      .replace("{sisa}", c.sisa || "0");
    R[tab] = msg;
    prev.textContent = msg;
    btn.disabled = false;
  }

  function cp(tab) {
    var msg = R[tab];
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      var btn = document.getElementById("btn-" + tab);
      const old = btn.textContent;
      btn.textContent = "✅ Pesan Tersalin!";
      btn.classList.add("ok");
      setTimeout(() => {
        btn.textContent = old;
        btn.classList.remove("ok");
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
