module.exports = async function handler(req, res) {

const notionToken = process.env.NOTION_TOKEN
const projectDbId = "310efe1d1acf80ad861fecc7567b10c9"

const headers = {
Authorization: `Bearer ${notionToken}`,
"Notion-Version": "2022-06-28",
"Content-Type": "application/json"
}

let totalRevenue = 0
let totalSelesai = 0
let revenueTahunIni = 0
let outstanding = 0
let antrian = 0
let terlambat = 0

try {

let hasMore = true
let cursor = undefined

while (hasMore) {

const body = cursor ? { start_cursor: cursor } : {}

const response = await fetch(
`https://api.notion.com/v1/databases/${projectDbId}/query`,
{ method: "POST", headers, body: JSON.stringify(body) }
)

const data = await response.json()

data.results.forEach(page => {

const props = page.properties

const status = props["Status Project"]?.select?.name || ""

const riskLevel = props["Risk Level"]?.formula?.string || ""
if (riskLevel === "🔴 Overdue") {
terlambat += 1
}

const hargaNetto =
props["Harga Paket Bersih"]?.formula?.number || 0

const diskon =
props["Diskon Referral"]?.formula?.number || 0

const hargaFinal = hargaNetto - diskon

let skema = ""
const roll = props["Skema Pembayaran"]?.rollup?.array

if (roll && roll.length > 0) {
skema = roll[0]?.select?.name || ""
}

const dpMasuk = props["DP Masuk"]?.checkbox || false
const tahap2Masuk = props["Tahap 2 Masuk"]?.checkbox || false
const pelunasanMasuk = props["Pelunasan Masuk"]?.checkbox || false

let totalDibayar = 0

if (skema === "2 Tahap") {
if (dpMasuk) totalDibayar += hargaFinal / 2
if (pelunasanMasuk) totalDibayar += hargaFinal / 2
}

if (skema === "3 Tahap") {
if (dpMasuk) totalDibayar += hargaFinal / 3
if (tahap2Masuk) totalDibayar += hargaFinal / 3
if (pelunasanMasuk) totalDibayar += hargaFinal / 3
}

const sisaPembayaran = Math.max(0, hargaFinal - totalDibayar)

if (status === "Selesai") {

totalRevenue += hargaFinal
totalSelesai += 1

const tanggalSelesai =
props["Tanggal Selesai"]?.date?.start

if (tanggalSelesai) {

const tahunSelesai = tanggalSelesai.slice(0,4)
const tahunSekarang = new Date().getFullYear().toString()

if (tahunSelesai === tahunSekarang) {
revenueTahunIni += hargaFinal
}

}
}

if (status === "Antrian") {
antrian += 1
}

outstanding += sisaPembayaran

})

hasMore = data.has_more
cursor = data.next_cursor

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

body{
margin:0;
background:#191919;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;
color:#ffffff;
}

.wrapper{
padding:30px 10px 50px 10px;
width:100%;
box-sizing:border-box;
}

.section-title{
font-size:13px;
letter-spacing:1.4px;
text-transform:uppercase;
color:#cbd5e1;
margin:40px 0 18px 0;
font-weight:600;
}

.section-title:first-of-type{
margin-top:0;
}

.grid{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:22px;
}

.card{
min-height:140px;
padding:28px;
border-radius:18px;
background:#0f1b2d;
border:1px solid rgba(255,255,255,0.06);
box-shadow:0 6px 18px rgba(0,0,0,0.35);
display:flex;
flex-direction:column;
justify-content:center;
}

.label{
font-size:16px;
font-weight:600;
color:#cbd5e1;
margin-bottom:14px;
}

.value{
font-size:34px;
font-weight:700;
}

.blue{color:#60a5fa;}
.yellow{color:#fbbf24;}
.red{color:#f87171;}

@media(max-width:600px){

.wrapper{
padding:24px 18px 80px 18px;
}

.grid{
grid-template-columns:repeat(2,1fr);
gap:16px;
margin-bottom:50px;
}

.grid .card:nth-child(3){
grid-column:span 2;
}

.card{
min-height:110px;
padding:20px;
border-radius:16px;
}

.label{
font-size:13px;
margin-bottom:12px;
}

.value{
font-size:26px;
}

.section-title{
font-size:12px;
margin:30px 0 14px 0;
}

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
<div class="value red">${terlambat}</div>
</div>

</div>

</div>

</body>
</html>
`

res.setHeader("Content-Type", "text/html")
res.status(200).send(html)

}
