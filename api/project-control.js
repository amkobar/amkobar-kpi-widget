module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  };

  const STATUS_AKTIF = ["Menunggu Review", "Antrian", "Diproses", "Menunggu Pelunasan", "Pendampingan"];

  function getProp(page, key) {
    const p = page.properties[key];
    if (!p) return "";
    if (p.type === "title") return p.title?.map(t => t.plain_text).join("") || "";
    if (p.type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") || "";
    if (p.type === "select") return p.select?.name || "";
    if (p.type === "number") return p.number ?? 0;
    if (p.type === "checkbox") return p.checkbox || false;
    if (p.type === "date") return p.date?.start || "";
    if (p.type === "url") return p.url || "";
    if (p.type === "formula") {
      const f = p.formula;
      if (f.type === "number") return f.number ?? 0;
      if (f.type === "string") return f.string || "";
      if (f.type === "boolean") return f.boolean || false;
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

  function formatIDR(val) {
    const n = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]/g, "")) : val;
    if (!n || isNaN(n)) return "IDR 0";
    return "IDR " + Math.round(n).toLocaleString("id-ID");
  }

  async function fetchAll() {
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
    return all;
  }

  try {
    const pages = await fetchAll();
    const clients = pages.map(p => ({
      id: p.id,
      nama: getProp(p, "Nama Client"),
      nim: getProp(p, "NIM/NPM"),
      universitas: getProp(p, "Universitas"),
      jenis: getProp(p, "Jenis Layanan"),
      aplikasi: getProp(p, "Aplikasi"),
      paket: getProp(p, "Paket"),
      status: getProp(p, "Status Project"),
      deadline: getProp(p, "Deadline"),
      kategori: getProp(p, "Kategori Harga"),
      tanggalDp: getProp(p, "Tanggal DP"),
      tanggalSelesai: getProp(p, "Tanggal Selesai"),
      dpMasuk: getProp(p, "DP Masuk"),
      tahap2: getProp(p, "Tahap 2 Masuk"),
      pelunasan: getProp(p, "Pelunasan Masuk"),
      harga: getProp(p, "Harga Netto"),
      sisa: getProp(p, "Sisa Pembayaran"),
      total: getProp(p, "Total Dibayar"),
      linkDrive: getProp(p, "Link Drive"),
      riskLevel: getProp(p, "Risk Level"),
    }));

    const allClient = clients;
    const antrian = clients.filter(c => c.status === "Antrian");
    const diproses = clients.filter(c => c.status === "Diproses");
    const selesai = clients.filter(c => ["Menunggu Pelunasan", "Selesai"].includes(c.status));

    function badgeStatus(s) {
      const map = {
        "Menunggu Review": ["#FAEEDA","#633806"],
        "Antrian": ["#FAEEDA","#633806"],
        "Diproses": ["#E6F1FB","#0C447C"],
        "Menunggu Pelunasan": ["#FAECE7","#993C1D"],
        "Selesai": ["#EAF3DE","#27500A"],
        "Dibatalkan": ["#FCEBEB","#A32D2D"],
      };
      const [bg, color] = map[s] || ["#F1EFE8","#5F5E5A"];
      return `<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${bg};color:${color};font-weight:500">${s||"—"}</span>`;
    }

    function badgeApp(a) {
      const map = {
        "SPSS": ["#EAF3DE","#27500A"],
        "SmartPLS": ["#EEEDFE","#3C3489"],
        "Lisrel": ["#FAECE7","#993C1D"],
      };
      const [bg, color] = map[a] || ["#F1EFE8","#5F5E5A"];
      return a ? `<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${bg};color:${color};font-weight:500">${a}</span>` : "—";
    }

    function badgeUniv(u) {
      return u ? `<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#E6F1FB;color:#0C447C;font-weight:500">${u}</span>` : "—";
    }

    function tableRow(c, cols) {
      const cells = cols.map(col => {
        if (col === "nama") return `<td style="${tdStyle}">${c.nama||"—"}</td>`;
        if (col === "nim") return `<td style="${tdStyle};color:#888">${c.nim||"—"}</td>`;
        if (col === "univ") return `<td style="${tdStyle}">${badgeUniv(c.universitas)}</td>`;
        if (col === "jenis") return `<td style="${tdStyle};font-size:11px;color:#666">${c.jenis||"—"}</td>`;
        if (col === "app") return `<td style="${tdStyle}">${badgeApp(c.aplikasi)}</td>`;
        if (col === "paket") return `<td style="${tdStyle};font-size:11px;color:#666">${c.paket||"—"}</td>`;
        if (col === "status") return `<td style="${tdStyle}">${badgeStatus(c.status)}</td>`;
        if (col === "deadline") return `<td style="${tdStyle};font-size:11px;color:#888">${c.deadline||"—"}</td>`;
        if (col === "tanggalDp") return `<td style="${tdStyle};font-size:11px;color:#888">${c.tanggalDp||"—"}</td>`;
        if (col === "risk") return `<td style="${tdStyle};font-size:11px">${c.riskLevel||"—"}</td>`;
        if (col === "harga") return `<td style="${tdStyle};font-size:11px">${formatIDR(c.harga)}</td>`;
        if (col === "sisa") return `<td style="${tdStyle};font-size:11px;color:${c.sisa>0?'#993C1D':'#27500A'}">${formatIDR(c.sisa)}</td>`;
        if (col === "dp") return `<td style="${tdStyle};text-align:center">${c.dpMasuk?'✅':'—'}</td>`;
        if (col === "tahap2") return `<td style="${tdStyle};text-align:center">${c.tahap2?'✅':'—'}</td>`;
        if (col === "pelunasan") return `<td style="${tdStyle};text-align:center">${c.pelunasan?'✅':'—'}</td>`;
        if (col === "selesai") return `<td style="${tdStyle};font-size:11px;color:#888">${c.tanggalSelesai||"—"}</td>`;
        if (col === "drive") return c.linkDrive ? `<td style="${tdStyle}"><a href="${c.linkDrive}" target="_blank" style="font-size:11px;color:#185FA5">Buka</a></td>` : `<td style="${tdStyle};color:#ccc;font-size:11px">—</td>`;
        return `<td style="${tdStyle}">—</td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    }

    const thStyle = "font-size:11px;color:#888;padding:8px 10px;font-weight:500;text-align:left;border-bottom:0.5px solid #e0e0e0;white-space:nowrap";
    const tdStyle = "padding:7px 10px;vertical-align:middle;border-bottom:0.5px solid #f0f0f0";

    function buildTable(rows, headers, cols) {
      if (!rows.length) return `<p style="color:#aaa;font-size:13px;padding:1rem 0;font-style:italic">Tidak ada data.</p>`;
      const ths = headers.map(h => `<th style="${thStyle}">${h}</th>`).join("");
      const trs = rows.map(r => tableRow(r, cols)).join("");
      return `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:0.5px solid #e8e8e8;overflow:hidden">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table></div>`;
    }

    const guides = {
      all: {
        num: "TAHAP 1", title: "Client baru masuk",
        bg: "#E6F1FB", border: "#378ADD", color: "#0C447C",
        items: [
          "Cek entry baru sudah masuk otomatis di DATABASE PROJECT",
          "Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi",
          "Kirim WA → Template: Konfirmasi registrasi diterima"
        ]
      },
      antrian: {
        num: "TAHAP 2", title: "DP masuk",
        bg: "#EAF3DE", border: "#639922", color: "#27500A",
        items: [
          "Isi Tanggal DP di tabel bawah",
          "Ubah Status Project → Antrian di tabel bawah",
          "Kirim WA → Template: Konfirmasi DP diterima"
        ]
      },
      diproses: {
        num: "TAHAP 3", title: "Mulai pengerjaan",
        bg: "#FAEEDA", border: "#BA7517", color: "#633806",
        items: [
          "Ubah Status Project → Diproses di tabel bawah",
          "Isi Deadline di tabel bawah"
        ]
      },
      selesai: {
        num: "TAHAP 4 & 5", title: "Hasil selesai & Pelunasan",
        bg: "#FAECE7", border: "#D85A30", color: "#993C1D",
        items: [
          "Upload file ke folder Hasil Final di Google Drive client",
          "Ubah Status Project → Menunggu Pelunasan",
          "Kirim WA → Template: Notifikasi hasil selesai",
          "Centang Pelunasan Masuk (+ Tahap 2 jika skema 3 tahap)",
          "Isi Tanggal Selesai",
          "Buka akses folder Hasil Final di Google Drive",
          "Ubah Status Project → Selesai",
          "Kirim WA → Template: Konfirmasi pelunasan & selesai"
        ]
      }
    };

    const tables = {
      all: buildTable(allClient,
        ["Nama Client","NIM/NPM","Universitas","Jenis Layanan","Aplikasi","Paket","Status","Deadline"],
        ["nama","nim","univ","jenis","app","paket","status","deadline"]),
      antrian: buildTable(antrian,
        ["Nama Client","Universitas","Aplikasi","Paket","Status","Tanggal DP","Deadline"],
        ["nama","univ","app","paket","status","tanggalDp","deadline"]),
      diproses: buildTable(diproses,
        ["Nama Client","Universitas","Aplikasi","Paket","Status","Deadline","Drive"],
        ["nama","univ","app","paket","status","deadline","drive"]),
      selesai: buildTable(selesai,
        ["Nama Client","Aplikasi","Paket","Status","DP","Tahap 2","Lunas","Selesai"],
        ["nama","app","paket","status","dp","tahap2","pelunasan","selesai"]),
    };

    function guideHtml(key) {
      const g = guides[key];
      const items = g.items.map(i =>
        `<div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:${g.color};line-height:1.6;margin-bottom:4px">
          <div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ${g.border};flex-shrink:0;margin-top:3px;opacity:.5"></div>
          <span>${i}</span>
        </div>`
      ).join("");
      return `<div style="background:${g.bg};border-left:3px solid ${g.border};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:1rem">
        <div style="font-size:11px;font-weight:500;color:${g.border};margin-bottom:3px;opacity:.8">${g.num}</div>
        <div style="font-size:14px;font-weight:500;color:${g.color};margin-bottom:10px">${g.title}</div>
        ${items}
      </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:1.5rem;min-height:100vh}
.title{font-size:20px;font-weight:500;color:#fff;margin-bottom:2px}
.sub{font-size:11px;color:#666;margin-bottom:1.5rem}
.tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;transition:all .15s;background:transparent}
.tab:hover{background:#222;color:#ccc}
.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
.section{display:none}
.section.active{display:block}
.db-label{font-size:10px;font-weight:500;color:#555;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.5rem}
.edit-hint{font-size:11px;color:#555;margin-bottom:.75rem;font-style:italic}
.notion-link{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#1a6bbd;text-decoration:none;margin-bottom:1rem;padding:5px 10px;border:0.5px solid #1a3a5c;border-radius:5px;background:#0a1520}
.notion-link:hover{background:#0f1b2d}
</style>
</head>
<body>
<div class="title">PROJECT CONTROL</div>
<div class="sub">AMKOBAR — Alur kerja & monitoring client</div>

<div class="tabs">
  <div class="tab active" onclick="sw('all',this)">All Client</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab" onclick="sw('diproses',this)">Diproses</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>

<div id="s-all" class="section active">
  ${guideHtml("all")}
  <div class="db-label">Semua client (${allClient.length})</div>
  <div class="edit-hint">Untuk mengubah data, buka DATABASE PROJECT di Notion di bawah halaman ini</div>
  ${tables.all}
</div>

<div id="s-antrian" class="section">
  ${guideHtml("antrian")}
  <div class="db-label">Client menunggu pengerjaan (${antrian.length})</div>
  <div class="edit-hint">Untuk mengubah data, buka DATABASE PROJECT di Notion di bawah halaman ini</div>
  ${tables.antrian}
</div>

<div id="s-diproses" class="section">
  ${guideHtml("diproses")}
  <div class="db-label">Client sedang diproses (${diproses.length})</div>
  <div class="edit-hint">Untuk mengubah data, buka DATABASE PROJECT di Notion di bawah halaman ini</div>
  ${tables.diproses}
</div>

<div id="s-selesai" class="section">
  ${guideHtml("selesai")}
  <div class="db-label">Menunggu pelunasan & selesai (${selesai.length})</div>
  <div class="edit-hint">Untuk mengubah data, buka DATABASE PROJECT di Notion di bawah halaman ini</div>
  ${tables.selesai}
</div>

<script>
function sw(key, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('s-' + key).classList.add('active');
}
</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).send(html);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
