module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;

  const projectDbId = "310efe1d1acf80ad861fecc7567b10c9";
  const paketDbId = "310efe1d1acf8031b2c7f0e23435e7bb";

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
    // =============================
    // 1️⃣ QUERY MASTER PAKET
    // =============================
    const paketMap = {};

    const paketResponse = await fetch(
      `https://api.notion.com/v1/databases/${paketDbId}/query`,
      { method: "POST", headers }
    );

    const paketData = await paketResponse.json();

    paketData.results.forEach((page) => {
      const id = page.id;
      const harga = page.properties["Harga Paket"]?.number || 0;
      const skema =
        page.properties["Skema Pembayaran"]?.select?.name || "";

      paketMap[id] = {
        harga,
        skema,
      };
    });

    // =============================
    // 2️⃣ QUERY DATABASE PROJECT
    // =============================
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const body = cursor ? { start_cursor: cursor } : {};

      const response = await fetch(
        `https://api.notion.com/v1/databases/${projectDbId}/query`,
        { method: "POST", headers, body: JSON.stringify(body) }
      );

      const data = await response.json();

      data.results.forEach((page) => {
        const props = page.properties;
        const status = props["Status Project"]?.select?.name || "";

        // ===== AMBIL RELATION PAKET =====
        const paketRelation = props["Paket"]?.relation || [];
        const paketId = paketRelation[0]?.id;

        const paketData = paketMap[paketId] || { harga: 0, skema: "" };
        const hargaFinal = paketData.harga;
        const skema = paketData.skema;

        const diskon = props["Diskon Referral"]?.formula?.number || 0;
        const hargaNetto = hargaFinal - diskon;

        const dpMasuk = props["DP Masuk"]?.checkbox || false;
        const tahap2Masuk = props["Tahap 2 Masuk"]?.checkbox || false;
        const pelunasanMasuk = props["Pelunasan Masuk"]?.checkbox || false;

        let totalDibayar = 0;

        if (skema === "2 Tahap") {
          if (dpMasuk) totalDibayar += hargaNetto / 2;
          if (pelunasanMasuk) totalDibayar += hargaNetto / 2;
        }

        if (skema === "3 Tahap") {
          if (dpMasuk) totalDibayar += hargaNetto / 3;
          if (tahap2Masuk) totalDibayar += hargaNetto / 3;
          if (pelunasanMasuk) totalDibayar += hargaNetto / 3;
        }

        const sisaPembayaran = Math.max(0, hargaNetto - totalDibayar);

        // ===== KPI =====
        if (status === "Selesai") {
          totalRevenue += hargaNetto;
          totalSelesai += 1;

          const tanggalSelesai = props["Tanggal Selesai"]?.date?.start;
          if (tanggalSelesai) {
            const tahun = new Date(tanggalSelesai).getFullYear();
            const tahunSekarang = new Date().getFullYear();
            if (tahun === tahunSekarang) {
              revenueTahunIni += hargaNetto;
              selesaiTahunIni += 1;
            }
          }
        }

        if (status === "Antrian") {
          antrian += 1;
        }

        outstanding += sisaPembayaran;
      });

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
  html,body{margin:0;padding:0;background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial}
  .wrapper{padding:40px 20px}
  .section-label{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#4a5568;margin-bottom:14px;margin-top:28px}
  .section-label:first-child{margin-top:0}
  .kpi-row{display:grid;gap:20px}
  .row-2{grid-template-columns:repeat(2,1fr)}
  .row-4{grid-template-columns:repeat(4,1fr)}
  .card{padding:28px;border-radius:16px;background:#21252b;border:1px solid rgba(56,125,201,0.12);box-shadow:0 12px 22px rgba(0,0,0,0.35),0 3px 8px rgba(0,0,0,0.25)}
  .label{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#387dc9;margin-bottom:14px}
  .value{font-size:30px;font-weight:600;color:#fff}

  @media(max-width:768px){
    .row-2{grid-template-columns:repeat(2,1fr)}
    .row-4{grid-template-columns:repeat(2,1fr)}
    .wrapper{padding:20px 16px}
    .card{padding:20px}
    .value{font-size:22px}
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
    return `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`;
  }
};
