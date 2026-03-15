const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECT = process.env.NOTION_DB_PROJECT || '310efe1d-1acf-80ad-861f-ecc7567b10c9';

const STATUS_AKTIF = ['Menunggu Review','Antrian','Diproses','Menunggu Pelunasan','Pendampingan'];

async function queryNotion(dbId, filter, sorts) {
  const body = {};
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;
  body.page_size = 100;
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data.results || [];
}

function getProp(page, key) {
  const p = page.properties?.[key];
  if (!p) return null;
  if (p.type === 'title') return p.title?.map(t => t.plain_text).join('') || '';
  if (p.type === 'rich_text') return p.rich_text?.map(t => t.plain_text).join('') || '';
  if (p.type === 'select') return p.select?.name || '';
  if (p.type === 'number') return p.number ?? 0;
  if (p.type === 'checkbox') return p.checkbox ?? false;
  if (p.type === 'date') return p.date?.start || null;
  if (p.type === 'formula') {
    const f = p.formula;
    if (f?.type === 'number') return f.number ?? 0;
    if (f?.type === 'boolean') return f.boolean ?? false;
    if (f?.type === 'string') return f.string || '';
  }
  if (p.type === 'rollup') {
    const r = p.rollup;
    if (r?.type === 'number') return r.number ?? 0;
    if (r?.type === 'array') return r.array?.[0]?.number ?? 0;
  }
  return null;
}

function fmt(n) {
  if (!n || n === 0) return 'Rp 0';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getMonthLabel(key) {
  const [y, m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return months[parseInt(m)-1] + ' ' + y.slice(2);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const pages = await queryNotion(DB_PROJECT, null, [{ property: 'Nama Client', direction: 'ascending' }]);

    let totalPendapatan = 0;
    let pendapatanBulanIni = 0;
    let tagihanTertunda = 0;
    const outstanding = [];
    const riwayat = [];
    const perLayanan = {};
    const perBulan = {};

    const now = new Date();
    const bulanIni = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    for (const p of pages) {
      const nama = getProp(p, 'Nama Client') || getProp(p, 'Name') || '—';
      const status = getProp(p, 'Status Project') || '';
      const layanan = getProp(p, 'Jenis Layanan') || '—';
      const totalDibayar = getProp(p, 'Total Dibayar') || 0;
      const sisaPembayaran = getProp(p, 'Sisa Pembayaran') || 0;
      const deadline = getProp(p, 'Deadline') || getProp(p, 'Tanggal Selesai') || null;
      const dpMasuk = getProp(p, 'DP Masuk');
      const tahap2Masuk = getProp(p, 'Tahap 2 Masuk');
      const pelunasanMasuk = getProp(p, 'Pelunasan Masuk');
      const tanggalDP = getProp(p, 'Tanggal DP') || null;
      const is2Tahap = getProp(p, 'Is 2 Tahap');
      const hargaNetto = getProp(p, 'Harga Netto') || 0;
      const dpVal = getProp(p, 'Done Payment') || getProp(p, 'DP Kerjasama') || getProp(p, 'DP Umum') || 0;

      totalPendapatan += totalDibayar;

      const monthKey = getMonthKey(tanggalDP);
      if (monthKey) {
        perBulan[monthKey] = (perBulan[monthKey] || 0) + totalDibayar;
      }

      if (status === 'Selesai') {
        const tglSelesai = getProp(p, 'Tanggal Selesai') || null;
        const mk = getMonthKey(tglSelesai);
        if (mk === bulanIni) pendapatanBulanIni += totalDibayar;
      }

      if (STATUS_AKTIF.includes(status) && sisaPembayaran > 0) {
        tagihanTertunda += sisaPembayaran;
        const isLate = deadline && new Date(deadline) < now;
        outstanding.push({
          nama, layanan, status,
          sisaBayar: fmt(sisaPembayaran),
          deadline: deadline ? new Date(deadline).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—',
          terlambat: isLate
        });
      }

      if (dpMasuk) {
        riwayat.push({ nama, layanan, tahap: 'DP', jumlah: fmt(dpVal), tanggal: tanggalDP ? new Date(tanggalDP).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—' });
      }
      if (tahap2Masuk && !is2Tahap) {
        riwayat.push({ nama, layanan, tahap: 'Tahap 2', jumlah: '—', tanggal: '—' });
      }
      if (pelunasanMasuk) {
        riwayat.push({ nama, layanan, tahap: 'Pelunasan', jumlah: fmt(hargaNetto - dpVal), tanggal: '—' });
      }

      if (!perLayanan[layanan]) perLayanan[layanan] = { count: 0, total: 0 };
      perLayanan[layanan].count++;
      perLayanan[layanan].total += totalDibayar;
    }

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      last6Months.push({ key, label: getMonthLabel(key), value: perBulan[key] || 0 });
    }

    const layananList = Object.entries(perLayanan).map(([nama, v]) => ({
      nama, count: v.count, total: fmt(v.total)
    })).sort((a,b) => b.count - a.count);

    const html = buildHTML({
      totalPendapatan: fmt(totalPendapatan),
      pendapatanBulanIni: fmt(pendapatanBulanIni),
      tagihanTertunda: fmt(tagihanTertunda),
      outstanding,
      riwayat: riwayat.slice(0,10),
      last6Months,
      layananList,
      updatedAt: now.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch(e) {
    res.status(500).send('Error: ' + e.message);
  }
};

function buildHTML(d) {
  const bulanLabels = JSON.stringify(d.last6Months.map(b => b.label));
  const bulanData = JSON.stringify(d.last6Months.map(b => b.value));
  const layananLabels = JSON.stringify(d.layananList.map(l => l.nama));
  const layananCounts = JSON.stringify(d.layananList.map(l => l.count));

  const outstandingRows = d.outstanding.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:20px">Tidak ada tagihan tertunda</td></tr>`
    : d.outstanding.map(o => `
      <tr>
        <td>${o.nama}</td>
        <td>${o.layanan}</td>
        <td><span class="badge ${o.status === 'Antrian' ? 'b-antrian' : o.status === 'Diproses' ? 'b-diproses' : o.terlambat ? 'b-lambat' : 'b-tunggu'}">${o.status}</span></td>
        <td class="red bold">${o.sisaBayar}</td>
        <td class="${o.terlambat ? 'red' : 'muted'}">${o.deadline}</td>
      </tr>`).join('');

  const riwayatRows = d.riwayat.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:20px">Belum ada riwayat</td></tr>`
    : d.riwayat.map(r => `
      <tr>
        <td>${r.nama}</td>
        <td>${r.layanan}</td>
        <td class="muted">${r.tahap}</td>
        <td class="green bold">${r.jumlah}</td>
      </tr>`).join('');

  const layananRows = d.layananList.map(l => `
    <tr>
      <td>${l.nama}</td>
      <td style="text-align:center">${l.count}</td>
      <td class="green">${l.total}</td>
    </tr>`).join('');

  const alertBanner = d.outstanding.some(o => o.terlambat)
    ? `<div class="alert"><div class="alert-dot"></div><span>${d.outstanding.filter(o=>o.terlambat).length} project melewati deadline — segera tindak lanjut</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard Keuangan — AMKOBAR</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1a2e;min-height:100vh}
.header{background:#0d2144;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.header-left{display:flex;align-items:center;gap:12px}
.logo{width:38px;height:38px;background:#1a6bbd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff}
.header-title{color:#fff;font-size:15px;font-weight:600}
.header-sub{color:#85B7EB;font-size:11px;margin-top:2px}
.header-right{font-size:11px;color:#85B7EB;text-align:right}
.nav{background:#0a1a36;padding:0 20px;display:flex;gap:4px;overflow-x:auto}
.nav a{display:inline-block;padding:10px 16px;font-size:13px;color:#85B7EB;text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap}
.nav a.active{color:#fff;border-bottom-color:#1a6bbd}
.container{max-width:900px;margin:0 auto;padding:16px}
.alert{background:#fee2e2;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:16px}
.alert-dot{width:8px;height:8px;border-radius:50%;background:#dc2626;flex-shrink:0}
.alert span{font-size:12px;color:#7f1d1d;font-weight:500}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.kpi{background:#fff;border-radius:8px;padding:14px 16px;border-left:3px solid #1a6bbd}
.kpi.danger{border-left-color:#dc2626}
.kpi.success{border-left-color:#16a34a}
.kpi-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.kpi-val{font-size:18px;font-weight:600;color:#1a1a2e}
.kpi-val.red{color:#dc2626}
.kpi-val.green{color:#16a34a}
.kpi-sub{font-size:10px;color:#9ca3af;margin-top:4px}
.card{background:#fff;border-radius:8px;padding:16px;margin-bottom:16px}
.card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0f0f0}
.card-title{font-size:13px;font-weight:600;color:#1a1a2e}
.card-meta{font-size:11px;color:#9ca3af}
.chart-wrap{position:relative;width:100%;height:200px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;color:#6b7280;font-weight:600;text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;text-transform:uppercase;letter-spacing:.04em}
td{padding:9px 8px;border-bottom:1px solid #f9f9f9;color:#1a1a2e}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:500}
.b-antrian{background:#dbeafe;color:#1e40af}
.b-diproses{background:#d1fae5;color:#065f46}
.b-tunggu{background:#fef3c7;color:#92400e}
.b-lambat{background:#fee2e2;color:#7f1d1d}
.red{color:#dc2626}.green{color:#16a34a}.muted{color:#9ca3af}.bold{font-weight:600}
@media(max-width:600px){
  .kpi-grid{grid-template-columns:1fr 1fr}
  .grid2{grid-template-columns:1fr}
  .kpi-val{font-size:15px}
  .header-right{display:none}
}
@media(max-width:380px){.kpi-grid{grid-template-columns:1fr}}
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
    <div>Diperbarui: ${d.updatedAt}</div>
    <div style="margin-top:2px">Data real-time dari Notion</div>
  </div>
</div>
<nav class="nav">
  <a href="/api/kpi">Executive</a>
  <a href="/api/keuangan" class="active">Keuangan</a>
  <a href="/api/operasional">Operasional</a>
</nav>
<div class="container">
  ${alertBanner}
  <div class="kpi-grid">
    <div class="kpi success">
      <div class="kpi-label">Total Pendapatan</div>
      <div class="kpi-val green">${d.totalPendapatan}</div>
      <div class="kpi-sub">Semua waktu</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Pendapatan Bulan Ini</div>
      <div class="kpi-val">${d.pendapatanBulanIni}</div>
      <div class="kpi-sub">Bulan berjalan</div>
    </div>
    <div class="kpi danger">
      <div class="kpi-label">Tagihan Tertunda</div>
      <div class="kpi-val red">${d.tagihanTertunda}</div>
      <div class="kpi-sub">${d.outstanding.length} client belum lunas</div>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Pendapatan per bulan</div>
      <div class="card-meta">6 bulan terakhir</div>
    </div>
    <div class="chart-wrap"><canvas id="chartBulan"></canvas></div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Outstanding payment</div>
      <div class="card-meta">Belum lunas</div>
    </div>
    <table>
      <thead><tr><th>Nama client</th><th>Layanan</th><th>Status</th><th>Sisa bayar</th><th>Deadline</th></tr></thead>
      <tbody>${outstandingRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Riwayat pembayaran masuk</div>
      <div class="card-meta">Terbaru</div>
    </div>
    <table>
      <thead><tr><th>Nama client</th><th>Layanan</th><th>Tahap</th><th>Jumlah</th></tr></thead>
      <tbody>${riwayatRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Rekap per jenis layanan</div>
      <div class="card-meta">Semua waktu</div>
    </div>
    <div class="grid2">
      <div class="chart-wrap" style="height:160px"><canvas id="chartLayanan"></canvas></div>
      <table style="align-self:start">
        <thead><tr><th>Layanan</th><th style="text-align:center">Project</th><th>Pendapatan</th></tr></thead>
        <tbody>${layananRows}</tbody>
      </table>
    </div>
  </div>
</div>

<script>
new Chart(document.getElementById('chartBulan'),{
  type:'bar',
  data:{labels:${bulanLabels},datasets:[{label:'Pendapatan',data:${bulanData},backgroundColor:'#1a6bbd',borderRadius:4,borderSkipped:false}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'Rp '+ctx.parsed.y.toLocaleString('id-ID')}}},scales:{x:{grid:{display:false},ticks:{color:'#9ca3af',font:{size:11}}},y:{grid:{color:'#f0f0f0'},ticks:{color:'#9ca3af',font:{size:11},callback:v=>v===0?'0':'Rp '+(v/1000000).toFixed(1)+'jt'}}}}
});
new Chart(document.getElementById('chartLayanan'),{
  type:'doughnut',
  data:{labels:${layananLabels},datasets:[{data:${layananCounts},backgroundColor:['#1a6bbd','#0d2144','#378ADD','#85B7EB'],borderWidth:0,hoverOffset:4}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:8}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed+' project'}}},cutout:'60%'}
});
</script>
</body>
</html>`;
}
