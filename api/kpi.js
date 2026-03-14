module.exports = async function handler(req, res) {

const notionToken = process.env.NOTION_TOKEN
const kpiDbId = "323efe1d1acf8086b106e632903c0b96"

const headers = {
  Authorization: `Bearer ${notionToken}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
}

function getNumber(prop) {
  if (!prop) return 0
  if (prop.number !== undefined) return prop.number
  if (prop.formula?.number !== undefined) return prop.formula.number
  if (prop.rollup?.number !== undefined && prop.rollup.number !== null) return prop.rollup.number
  if (prop.rollup?.array !== undefined) {
    return prop.rollup.array.reduce((sum, item) => sum + (item.number || 0), 0)
  }
  return 0
}

let totalRevenue = 0
let totalSelesai = 0
let revenueTahunIni = 0
let outstanding = 0
let antrian = 0
let terlambat = 0

try {

  const response = await fetch(
    `https://api.notion.com/v1/databases/${kpiDbId}/query`,
    { method: "POST", headers, body: JSON.stringify({}) }
  )

  const data = await response.json()

  if (data.results && data.results.length > 0) {
    const props = data.results[0].properties

    totalRevenue = getNumber(props["Total Closed"])
    totalSelesai = getNumber(props["Project Done"])
    revenueTahunIni = getNumber(props["Closed Tahun Ini"])
    outstanding = getNumber(props["Tagihan Aktif"])
    antrian = getNumber(props["Antrian"])
    terlambat = getNumber(props["Terlambat"])
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
