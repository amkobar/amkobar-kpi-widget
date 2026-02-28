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

    // =============================
    // QUERY DATABASE PAKET
    // =============================
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

    // =============================
    // QUERY DATABASE PROJECT
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

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
body{
  margin:0;
  background:#0f172a;
}
.wrapper{
  padding:40px 20px 60px 20px;
  width:100%;
  box-sizing:border-box;
}
.section-title{
  font-size:13px;
  letter-spacing:1.5px;
  text-transform:uppercase;
  color:#94a3b8;
  margin:50px 0 20px 0;
  font-weight:600;
}
.section-title:first-of-type{
  margin-top:0;
}
.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:28px;
}
.card{
  padding:28px;
  border-radius:18px;
  background:linear-gradient(145deg,#111827,#0f172a);
  border:1px solid rgba(148,163,184,0.08);
  box-shadow:
    0 8px 20px rgba(0,0,0,0.35);
  transition:all .25s ease;
}
.card:hover{
  transform:translateY(-4px);
  border:1px solid rgba(96,165,250,0.25);
}
.label{
  font-size:12px;
  letter-spacing:1.2px;
  color:#9ca3af;
  margin-bottom:16px;
}
.value{
  font-size:30px;
  font-weight:700;
}
.blue{color:#60a5fa;}
.yellow{color:#fbbf24;}
.red{color:#f87171;}

@media(max-width:1000px){
  .grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:650px){
  .grid{grid-template-columns:1fr;}
}
</style>
</head>
<body>
<div class="wrapper">

<div class="section-title">PENCAPAIAN</div>
<div class="grid">
  <div class="card">
    <div class="label">Total Pendapatan</div>
    <div class="value blue">Rp ${totalRevenue.toLocaleString("id-ID")}</div>
  </div>
  <div class="card">
    <div class="label">Total Project Selesai</div>
    <div class="value">${totalSelesai}</div>
  </div>
  <div class="card">
    <div class="label">Pendapatan Tahun Ini</div>
    <div class="value">Rp ${revenueTahunIni.toLocaleString("id-ID")}</div>
  </div>
</div>

<div class="section-title">KONTROL SAAT INI</div>
<div class="grid">
  <div class="card">
    <div class="label">Tagihan Tertunda</div>
    <div class="value yellow">Rp ${outstanding.toLocaleString("id-ID")}</div>
  </div>
  <div class="card">
    <div class="label">Project Dalam Antrian</div>
    <div class="value">${antrian}</div>
  </div>
  <div class="card">
    <div class="label">Project Terlambat</div>
    <div class="value red">0</div>
  </div>
</div>

</div>
</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
