module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN
  const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9"
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  }

  const STATUS_AKTIF = ["Menunggu Review", "Antrian", "Diproses", "Menunggu Pelunasan", "Pendampingan"]
  const STATUS_SELESAI = ["Selesai"]
  const TAHUN_INI = new Date().getFullYear()
  const SEKARANG = new Date()

  function getFormula(prop) {
    if (!prop) return 0
    if (prop.type === "formula") {
      if (prop.formula?.number !== undefined && prop.formula.number !== null) return prop.formula.number
    }
    if (prop.type === "number") {
      if (prop.number !== undefined && prop.number !== null) return prop.number
    }
    return 0
  }

  function getStatus(prop) {
    if (!prop) return ""
    return prop.select?.name || ""
  }

  function getDate(prop) {
    if (!prop) return null
    return prop.date?.start || null
  }

  async function fetchAllPages() {
    let allResults = []
    let hasMore = true
    let startCursor = undefined

    while (hasMore) {
      const body = { page_size: 100 }
      if (startCursor) body.start_cursor = startCursor

      const response = await fetch(
        `https://api.notion.com/v1/databases/${projectDbId}/query`,
        { method: "POST", headers, body: JSON.stringify(body) }
      )
      const data = await response.json()

      if (data.results) allResults = allResults.concat(data.results)
      hasMore = data.has_more
      startCursor = data.next_cursor
    }

    return allResults
  }

  let totalRevenue = 0
  let totalSelesai = 0
  let revenueTahunIni = 0
  let outstanding = 0
  let antrian = 0
  let terlambat = 0

  try {
    const pages = await fetchAllPages()

    for (const page of pages) {
      const props = page.properties
      const status = getStatus(props["Status Project"])
      const totalDibayar = getFormula(props["Total Dibayar"])
      const sisaPembayaran = getFormula(props["Sisa Pembayaran"])
      const isAntrian = getFormula(props["Is Antrian"])
      const deadlineStr = getDate(props["Deadline"])
      const tanggalSelesai = getDate(props["Tanggal Selesai"])

      totalRevenue += totalDibayar

      if (STATUS_SELESAI.includes(status)) {
        totalSelesai += 1
        if (tanggalSelesai) {
          const tahun = new Date(tanggalSelesai).getFullYear()
          if (tahun === TAHUN_INI) {
            revenueTahunIni += totalDibayar
          }
        }
      }

      if (STATUS_AKTIF.includes(status)) {
        outstanding += sisaPembayaran
      }

      antrian += isAntrian

      if (deadlineStr && new Date(deadlineStr) < SEKARANG && STATUS_AKTIF.includes(status)) {
        terlambat += 1
      }
    }

  } catch (err) {
    console.error(err)
    return res.status(500).send("Server Error")
  }

  const updatedAt = new Date().toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Executive Dashboard — AMKOBAR</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;min-height:100vh;}
.header{background:#0d2144;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.header-left{display:flex;align-items:center;gap:12px;}
.logo{width:38px;height:38px;background:#1a6bbd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;}
.header-title{color:#fff;font-size:15px;font-weight:600;}
.header-sub{color:#85B7EB;font-size:11px;margin-top:2px;}
.header-right{font-size:11px;color:#85B7EB;text-align:right;}
.nav{background:#0a1a36;padding:0 20px;display:flex;gap:4px;overflow-x:auto;}
.nav a{display:inline-block;padding:10px 16px;font-size:13px;color:#85B7EB;text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap;}
.nav a.active{color:#fff;border-bottom-color:#1a6bbd;}
.container{max-width:900px;margin:0 auto;padding:24px 16px 48px;}
.section-title{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6b7280;margin:32px 0 14px;font-weight:600;}
.section-title:first-of-type{margin-top:0;}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.card{padding:20px;border-radius:10px;background:#fff;border-left:3px solid #1a6bbd;display:flex;flex-direction:column;justify-content:center;min-height:110px;}
.card.yellow{border-left-color:#d97706;}
.card.red{border-left-color:#dc2626;}
.label{font-size:12px;font-weight:500;color:#6b7280;margin-bottom:10px;}
.value{font-size:26px;font-weight:700;color:#1a1a2e;}
.value.blue{color:#1a6bbd;}
.value.yellow{color:#d97706;}
.value.red{color:#dc2626;}
@media(max-width:600px){
  .grid{grid-template-columns:repeat(2,1fr);gap:10px;}
  .grid .card:nth-child(3){grid-column:span 2;}
  .card{min-height:90px;padding:16px;}
  .label{font-size:11px;}
  .value{font-size:22px;}
  .header-right{display:none;}
}
@media(max-width:380px){
  .grid{grid-template-columns:1fr;}
  .grid .card:nth-child(3){grid-column:span 1;}
}
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <div class="logo">AM</div>
    <div>
      <div class="header-title">AMKOBAR Statistical Consulting</div>
      <div class="header-sub">Internal Management Dashboard</div>
    </div>
  </div>
  <div class="header-right">
    <div>Diperbarui: ${updatedAt}</div>
    <div style="margin-top:2px">Data real-time dari Notion</div>
  </div>
</div>
<nav class="nav">
  <a href="/api/kpi" class="active">Executive</a>
  <a href="/api/keuangan">Keuangan</a>
  <a href="/api/operasional">Operasional</a>
</nav>
<div class="container">
  <div class="section-title">PENCAPAIAN</div>
  <div class="grid">
    <div class="card"><div class="label">Total Pendapatan</div><div class="value blue">Rp ${totalRevenue.toLocaleString("id-ID")}</div></div>
    <div class="card"><div class="label">Total Project Selesai</div><div class="value">${totalSelesai}</div></div>
    <div class="card"><div class="label">Pendapatan Tahun Ini</div><div class="value">Rp ${revenueTahunIni.toLocaleString("id-ID")}</div></div>
  </div>
  <div class="section-title">KONTROL SAAT INI</div>
  <div class="grid">
    <div class="card yellow"><div class="label">Tagihan Tertunda</div><div class="value yellow">Rp ${outstanding.toLocaleString("id-ID")}</div></div>
    <div class="card"><div class="label">Project Dalam Antrian</div><div class="value">${antrian}</div></div>
    <div class="card red"><div class="label">Project Terlambat</div><div class="value red">${terlambat}</div></div>
  </div>
</div>
</body>
</html>
`
  res.setHeader("Content-Type", "text/html")
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
  res.status(200).send(html)
}
