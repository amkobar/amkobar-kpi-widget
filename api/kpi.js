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
  let outstanding = 0;
  let antrian = 0;

  try {
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

      paketMap[id] = { harga, skema };
    });

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

        if (status === "Selesai") {
          totalRevenue += hargaNetto;
          totalSelesai += 1;

          const tanggalSelesai = props["Tanggal Selesai"]?.date?.start;
          if (tanggalSelesai) {
            const tahun = new Date(tanggalSelesai).getFullYear();
            const tahunSekarang = new Date().getFullYear();
            if (tahun === tahunSekarang) {
              revenueTahunIni += hargaNetto;
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
html,body{margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto}
.wrapper{padding:40px 24px}
.section-label{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#64748b;margin:30px 0 16px}
.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{
  padding:26px;
  border-radius:18px;
  background:#111c2e;
  border:1px solid rgba(255,255,255,0.04);
  transition:0.2s ease;
}
.card:hover{
  transform:translateY(-4px);
  border:1px solid rgba(96,165,250,0.4);
}
.label{
  font-size:12px;
  letter-spacing:1px;
  color:#94a3b8;
  margin-bottom:12px;
}
.value{
  font-size:24px;
  font-weight:600;
}
@media(max-width:900px){
  .kpi-row{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:600px){
  .kpi-row{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="wrapper">

<div class="section-label">PENCAPAIAN</div>
<div class="kpi-row">
  ${card("Total Pendapatan", "Rp " + totalRevenue.toLocaleString("id-ID"), "#60a5fa")}
  ${card("Total Project Selesai", totalSelesai, "#ffffff")}
  ${card("Pendapatan Tahun Ini", "Rp " + revenueTahunIni.toLocaleString("id-ID"), "#ffffff")}
</div>

<div class="section-label">KONTROL SAAT INI</div>
<div class="kpi-row">
  ${card("Tagihan Tertunda", "Rp " + outstanding.toLocaleString("id-ID"), "#fbbf24")}
  ${card("Project Dalam Antrian", antrian, "#ffffff")}
  ${card("Project Terlambat", 0, "#f87171")}
</div>

</div>
</body>
</html>
`);

function card(label, value, color){
  return `
  <div class="card">
    <div class="label">${label}</div>
    <div class="value" style="color:${color}">${value}</div>
  </div>
  `;
}
};
