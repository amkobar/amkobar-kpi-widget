// api/project-control.js

// Import node-fetch karena kemungkinan runtime Vercel masih Node versi lama
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // Jika query action=clients, ambil data client dari Notion dengan filter status
  if (req.query && req.query.action === 'clients') {
    const notionToken = process.env.NOTION_TOKEN;
    const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
    const statusFilter = req.query.status || "";

    const headers = {
      Authorization: "Bearer " + notionToken,
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
      if (p.type === "date") return (p.date && p.date.start) || "";
      if (p.type === "formula") {
        const f = p.formula;
        if (f.type === "number") return f.number != null ? f.number : 0;
        if (f.type === "string") return f.string || "";
      }
      if (p.type === "rollup") {
        const r = p.rollup;
        if (r.type === "number") return r.number != null ? r.number : 0;
        if (r.type === "array" && r.array && r.array[0]) {
          const first = r.array[0];
          if (first.type === "select") return (first.select && first.select.name) || "";
          if (first.type === "number") return first.number != null ? first.number : 0;
        }
      }
      return "";
    }

    try {
      let all = [], cursor;
      while (true) {
        const body = { page_size: 100 };
        if (statusFilter) {
          body.filter = {
            property: "Status Project",
            select: {
              equals: statusFilter
            }
          };
        }
        if (cursor) body.start_cursor = cursor;

        const resp = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });

        if (!resp.ok) {
          const errData = await resp.text();
          console.error('Notion API error response:', errData);
          return res.status(500).json({ error: 'Notion API error', details: errData });
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
      })).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      return res.status(200).json(clients);

    } catch (e) {
      console.error("Error in project-control API handler:", e);
      return res.status(500).json({ error: "Internal Server Error", message: e.message });
    }
  }

  // Bagian HTML dan JavaScript frontend yang akan disajikan
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    /* Gaya CSS disini */
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;padding:1.25rem}
    .tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
    .tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;background:transparent}
    .tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
    .guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}
    .guide.active{display:block}
    .gen{margin-top:14px;padding-top:14px;border-top:0.5px solid currentColor}
    .lbl{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
    .inp{width:100%;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;padding:7px 10px;outline:none;margin-bottom:8px;color:inherit}
    .conf{font-size:11px;margin-bottom:8px;min-height:16px;opacity:.8}
    .prev{background:#00000033;border:0.5px solid currentColor;border-radius:8px;padding:12px;margin-bottom:8px;min-height:60px;font-size:12px;line-height:1.7;white-space:pre-wrap;font-style:italic;opacity:.6}
    .prev.on{font-style:normal;opacity:1}
    .btn{width:100%;padding:8px;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;color:inherit}
    .btn.ok{background:#0f3d1f!important;border-color:#27500A!important}
  </style>
  <title>Project Control</title>
</head>
<body>

  <div class="tabs">
    <div class="tab active" onclick="sw('Menunggu Review', this)">Menunggu Review</div>
    <div class="tab" onclick="sw('Antrian', this)">Antrian</div>
    <div class="tab" onclick="sw('Overdue', this)">Overdue</div>
    <div class="tab" onclick="sw('Diproses', this)">Diproses</div>
    <div class="tab" onclick="sw('Menunggu Pelunasan', this)">Menunggu Pelunasan</div>
    <div class="tab" onclick="sw('Pendampingan', this)">Pendampingan</div>
    <div class="tab" onclick="sw('Selesai', this)">Selesai</div>
    <div class="tab" onclick="sw('Refund & Dibatalkan', this)">Refund & Dibatalkan</div>
  </div>

  <div id="g-container">
    <div id="g-Menunggu Pelunasan" class="guide" style="background:#FAECE7;border-color:#D85A30;color:#993C1D;display:none">
      <div class="lbl" style="color:#D85A30">Generator Pesan WA - Menunggu Pelunasan</div>
      <select id="sel-Menunggu Pelunasan" class="inp" onchange="gM('Menunggu Pelunasan', this.value)">
        <option value="">Pilih client...</option>
      </select>
      <div id="confirm-Menunggu Pelunasan" class="conf" style="color:#D85A30"></div>
      <div id="prev-Menunggu Pelunasan" class="prev" style="border-color:#D85A30;color:#993C1D">Pilih client untuk generate pesan...</div>
      <button class="btn" id="btn-Menunggu Pelunasan" onclick="cp('Menunggu Pelunasan')" style="border-color:#D85A30;color:#993C1D">&#128203; Copy Pesan</button>
    </div>
  </div>

<script>
  const M = {
    "Menunggu Pelunasan": "Halo {nama} 👋\\n\\nProject anda sudah selesai, mohon segera lakukan pelunasan Rp {sisa}. Terima kasih!\\n\\nSalam, Tim AMKOBAR 📣"
  };

  let ClientsPerStatus = {};
  let SelectedMessages = {};

  async function loadClientsForStatus(status) {
    try {
      const res = await fetch('/api/project-control?action=clients&status=' + encodeURIComponent(status));
      const data = await res.json();
      ClientsPerStatus[status] = data;
      const sel = document.getElementById('sel-' + status);
      if (!sel) return;
      sel.innerHTML = '<option value="">Pilih client...</option>';
      data.forEach(c => {
        const o = document.createElement('option');
        o.value = c.nama;
        o.textContent = c.nama + ' - ' + c.nim;
        sel.appendChild(o);
      });
      clearMessage(status);
    } catch (e) {
      console.error("Gagal load client:", e);
    }
  }

  function clearMessage(status) {
    const prev = document.getElementById('prev-' + status);
    const conf = document.getElementById('confirm-' + status);
    if (prev) {
      prev.className = 'prev';
      prev.textContent = 'Pilih client untuk generate pesan...';
    }
    if (conf) conf.textContent = '';
    SelectedMessages[status] = '';
  }

  function gM(status, clientName) {
    const prev = document.getElementById('prev-' + status);
    const conf = document.getElementById('confirm-' + status);
    if (!clientName) {
      clearMessage(status);
      return;
    }
    const client = (ClientsPerStatus[status] || []).find(c => c.nama === clientName);
    if (!client) {
      clearMessage(status);
      return;
    }
    if (conf) conf.textContent = \`✓ \${client.nama} | NIM: \${client.nim} | \${client.jenis} | \${client.aplikasi}\`;

    let sisaFormatted = typeof client.sisa === "number" ? Math.round(client.sisa).toLocaleString('id-ID') : client.sisa || "0";

    const msgTemplate = M[status] || \`Halo \${client.nama}, ini pesan default.\`;
    const msg = msgTemplate.replace('{nama}', client.nama).replace('{sisa}', sisaFormatted);
    SelectedMessages[status] = msg;

    if (prev) {
      prev.className = 'prev on';
      prev.textContent = msg;
    }
  }

  function cp(status) {
    const msg = SelectedMessages[status];
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      const btn = document.getElementById('btn-' + status);
      const oldText = btn.textContent;
      btn.textContent = '✅ Pesan Tersalin!';
      btn.classList.add('ok');
      setTimeout(() => {
        btn.textContent = oldText;
        btn.classList.remove('ok');
      }, 2000);
    });
  }

  function sw(status, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide').forEach(g => g.style.display = 'none');
    el.classList.add('active');
    const guideEl = document.getElementById('g-' + status);
    if (guideEl) guideEl.style.display = 'block';
    loadClientsForStatus(status);
  }

  window.onload = () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) sw(activeTab.textContent.trim(), activeTab);
  };
</script>

</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html);
}
