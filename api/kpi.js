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
  let aktif = 0;

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
      aktif = props["Total Project Aktif"]?.rollup?.number || aktif;
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
      .kpi-row {
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:24px;
      }
      .card {
        padding:32px;
        border-radius:18px;
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
        margin-bottom:16px;
      }
      .value {
        font-size:34px;
        font-weight:600;
        color:#ffffff;
      }
      @media (max-width: 1024px) {
        .kpi-row { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 600px) {
        .wrapper { padding:16px 14px 10px 14px; }
        .kpi-row { grid-template-columns: repeat(2, 1fr); gap:16px; }
        .card { padding:18px; border-radius:16px; }
        .label { font-size:10px; margin-bottom:10px; }
        .value { font-size:22px; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="kpi-row">
        ${card("Total Revenue", "Rp " + totalRevenue.toLocaleString("id-ID"))}
        ${card("Revenue Tahun Ini", "Rp " + revenueTahunIni.toLocaleString("id-ID"))}
        ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${card("Total Selesai", totalSelesai)}
        ${card("Selesai Tahun Ini", selesaiTahunIni)}
        ${card("Project Aktif", aktif)}
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
