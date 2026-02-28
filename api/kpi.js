module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "text/html");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
body{margin:0;background:#0b1220;font-family:Arial;color:#fff}
.wrapper{padding:60px 40px;max-width:1200px;margin:auto}
.section{margin-top:60px}
.section:first-child{margin-top:0}
.title{font-size:14px;letter-spacing:1.5px;color:#64748b;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{
  padding:32px;
  border-radius:18px;
  background:#0f1c33;
  border:1px solid rgba(255,255,255,0.05);
}
.label{font-size:12px;color:#94a3b8;margin-bottom:16px}
.value{font-size:26px;font-weight:bold}
.blue{color:#60a5fa}
.yellow{color:#fbbf24}
.red{color:#f87171}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrapper">

<div class="section">
<div class="title">PENCAPAIAN</div>
<div class="grid">
<div class="card"><div class="label">Total Pendapatan</div><div class="value blue">Rp 2.050.000</div></div>
<div class="card"><div class="label">Total Project Selesai</div><div class="value">3</div></div>
<div class="card"><div class="label">Pendapatan Tahun Ini</div><div class="value">Rp 2.050.000</div></div>
</div>
</div>

<div class="section">
<div class="title">KONTROL SAAT INI</div>
<div class="grid">
<div class="card"><div class="label">Tagihan Tertunda</div><div class="value yellow">Rp 450.000</div></div>
<div class="card"><div class="label">Project Dalam Antrian</div><div class="value">0</div></div>
<div class="card"><div class="label">Project Terlambat</div><div class="value red">0</div></div>
</div>
</div>

</div>
</body>
</html>
`;

  res.status(200).send(html);
};
