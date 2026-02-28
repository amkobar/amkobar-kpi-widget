export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = "30eefe1d1acf8067b17eca5c140af538";

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  let totalRevenue = 0;
  let totalSelesai = 0;
  let revenueTahunIni = 0;
  let selesaiTahunIni = 0;
  let outstanding = 0;
  let antrian = 0;

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      { method: "POST", headers }
    );
    const data = await response.json();

    data.results.forEach((page) => {
      const props = page.properties;
      totalRevenue = props["💵 Total Revenue (All Time)"]?.rollup?.number || totalRevenue;
      totalSelesai = props["Total Project Selesai (All Time)"]?.rollup?.number || totalSelesai;
      revenueTahunIni = props["Revenue Tahun Ini"]?.rollup?.number || revenueTahunIni;
      selesaiTahunIni = props["Project Selesai Tahun Ini"]?.rollup?.number || selesaiTahunIni;
      outstanding = props["Total Outstanding Aktif"]?.rollup?.number || outstanding;
      antrian = props["Jumlah Antrian"]?.rollup?.number || antrian;
    });
  } catch (err) {
    console.error(err);
  }

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      html, body {
        margin:0;
        padding:0;
        background:#191919;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      }
      .wrapper { padding:40px 20px; }
      .section-label {
        font-size:10px;
        letter-spacing:1.6px;
        text-transform:uppercase;
        color:#4a5568;
        margin-bottom:14px;
        margin-top:28px;
      }
      .section-label:first-child { margin-top:0; }
      .kpi-row {
        display:grid;
        gap:20px;
      }
      .row-2 { grid-template-columns: repeat(2, 1fr); }
      .row-4 { grid-template-columns: repeat(4, 1fr); }
      .card {
        padding:28px;
        border-radius:16px;
        background:#21252b;
        border:1px solid rgba(56,125,201,0.12);
        box-shadow:
          0 12px 22px rgba(0,0,0,0.35),
          0 3px 8px rgba(0,0,0,0.25),
          inset 0 1px 0 rgba(255,255,255,0.04);
      }
      .label {
        font-size:11px;
        letter-spacing:1.4px;
        text-transform:uppercase;
        color:#387dc9;
        margin-bottom:14px;
      }
      .value {
        font-size:30px;
        font-weight:600;
        color:#ffffff;
      }
      @media (max-width: 768px) {
        .row-2 { grid-template-columns: repeat(2, 1fr); }
        .row-4 { grid-template-columns: repeat(2, 1fr); }
        .wrapper { padding:16px 14px; }
        .card { padding:18px; }
        .value { font-size:22px; }
        .label { font-size:10px; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="section-label">🔵 Historical — All Time</div>
      <div class="kpi-row row-2">
        ${card("Total Revenue", "Rp " + totalRevenue.toLocaleString("id-ID"))}
        ${card("Total Project Selesai", totalSelesai)}
      </div>
      <div class="section-label">🟢 Monitoring Tahun Berjalan</div>
      <div class="kpi-row row-4">
        ${card("Revenue Tahun Ini", "Rp " + revenueTahunIni.toLocaleString("id-ID"))}
        ${card("Selesai Tahun Ini", selesaiTahunIni)}
        ${card("Tagihan Belum Masuk", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${card("Jumlah Antrian", antrian)}
      </div>
    </div>
  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div class="card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </div>
    `;
  }
}
