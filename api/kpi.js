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

  function getCheckbox(prop) {
    if (!prop) return false
    return prop.checkbox === true
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
      const sisaPembayaran = getFormula(props["Sisa Pembayaran"])
      const isAntrian = getFormula(props["Is Antrian"])
      const deadlineStr = getDate(props["Deadline"])
      const tanggalSelesai = getDate(props["Tanggal Selesai"])

      // Total Revenue = semua entry yang Selesai
      if (STATUS_SELESAI.includes(status)) {
        totalRevenue += totalDibayar
        totalSelesai += 1

        // Revenue Tahun Ini
        if (tanggalSelesai) {
          const tahun = new Date(tanggalSelesai).getFullYear()
          if (tahun === TAHUN_INI) {
            revenueTahunIni += totalDibayar
          }
        }
      }

      // Tagihan Aktif
      if (STATUS_AKTIF.includes(status)) {
        outstanding += sisaPembayaran
      }

      // Antrian
      antrian += isAntrian

      // Terlambat = deadline sudah lewat + status masih aktif
      if (deadlineStr && new Date(deadlineStr) < SEKARANG && STATUS_AKTIF.includes(status)) {
        terlambat += 1
      }
    }

  } catch (err) {
    console.error(err)
    return res.status(500).send("Server Error")
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
body{margin:0;background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;color:#ffffff;}
.wrapper{padding:30px 10px 50px 10px;width:100%;box-sizing:border-box;}
.section-title{font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#cbd5e1;margin:40px 0 18px 0;font-weight:600;}
.section-title:first-of-type{margin-top:0;}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.card{min-height:140px;padding:28px;border-radius:18px;background:#0f1b2d;border:1px solid rgba(255,255,255,0.06);box-shadow:0 6px 18px rgba(0,0,0,0.35);display:flex;flex-direction:column;justify-content:center;}
.label{font-size:16px;font-weight:600;color:#cbd5e1;margin-bottom:14px;}
.value{font-size:34px;font-weight:700;}
.blue{color:#60a5fa;}.yellow{color:#fbbf24;}.red{color:#f87171;}
@media(max-width:600px){
.wrapper{padding:24px 18px 80px 18px;}
.grid{grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:50px;}
.grid .card:nth-child(3){grid-column:span 2;}
.card{min-height:110px;padding:20px;border-radius:16px;}
.label{font-size:13px;margin-bottom:12px;}
.value{font-size:26px;}
.section-title{font-size:12px;margin:30px 0 14px 0;}
}
</style>
</head>
<body>
<div class="wrapper">
<div class="section-title">PENCAPAIAN</div>
<div class="grid">
<div class="card"><div class="label">Total Pendapatan</div><div class="value blue">Rp ${totalRevenue.toLocaleString("id-ID")}</div></div>
<div class="card"><div class="label">Total Project Selesai</div><div class="value">${totalSelesai}</div></div>
<div class="card"><div class="label">Pendapatan Tahun Ini</div><div class="value">Rp ${revenueTahunIni.toLocaleString("id-ID")}</div></div>
</div>
<div class="section-title">KONTROL SAAT INI</div>
<div class="grid">
<div class="card"><div class="label">Tagihan Tertunda</div><div class="value yellow">Rp ${outstanding.toLocaleString("id-ID")}</div></div>
<div class="card"><div class="label">Project Dalam Antrian</div><div class="value">${antrian}</div></div>
<div class="card"><div class="label">Project Terlambat</div><div class="value red">${terlambat}</div></div>
</div>
</div>
</body>
</html>
`
  res.setHeader("Content-Type", "text/html")
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
  res.status(200).send(html)
}
