const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECT = process.env.NOTION_DB_PROJECT || '310efe1d-1acf-80ad-861f-ecc7567b10c9';

const STATUS_AKTIF = ['Menunggu Review','Antrian','Diproses','Menunggu Pelunasan','Pendampingan'];
const STATUS_COLORS = {
  'Menunggu Review': 'b-review',
  'Antrian': 'b-antrian',
  'Diproses': 'b-diproses',
  'Menunggu Pelunasan': 'b-tunggu',
  'Pendampingan': 'b-pendampingan'
};

async function queryNotion(dbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: 100 })
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
  }
  if (p.type === 'rollup') {
    const r = p.rollup;
    if (r?.type === 'number') return r.number ?? 0;
    if (r?.type === 'array') return r.array?.[0]?.number ?? 0;
  }
  return null;
}

function diffDays(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d - now) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const pages = await queryNotion(DB_PROJECT);
    const now = new Date();

    const aktif = [];
    const deadlineDekat = [];
    const terlambat = [];
    const statusCount = { 'Menunggu Review':0, 'Antrian':0, 'Diproses':0, 'Menunggu Pelunasan':0, 'Pendampingan':0 };

    for (const p of pages) {
      const nama = getProp(p, 'Nama Client') || getProp(p, 'Name') || '—';
      const status = getProp(p, 'Status Project') || '';
      const layanan = getProp(p, 'Jenis Layanan') || '—';
      const aplikasi = getProp(p, 'Aplikasi') || '—';
      const deadline = getProp(p, 'Deadline') || getProp(p, 'Tanggal Selesai') || null;
      const nim = getProp(p, 'NIM/NPM') || '';

      if (!STATUS_AKTIF.includes(status)) continue;

      if (statusCount[status] !== undefined) statusCount[status]++;

      const isLate = deadline && new Date(deadline) < now;
      const diff = deadline ? diffDays(deadline) : null;

      aktif.push({ nama, nim, status, layanan, aplikasi, deadline, isLate, diff });

      if (isLate) {
        terlambat.push({ nama, layanan, deadline, diff });
      } else if (deadline && diff <= 7) {
        deadlineDekat.push({ nama, layanan, deadline, diff });
      }
    }

    aktif.sort((a,b) => {
      if (a.isLate && !b.isLate) return -1;
      if (!a.isLate && b.isLate) return 1;
      if (a.diff !== null && b.diff !== null) return a.diff - b.diff;
      return 0;
    });

    const statusLabels = Object.keys(statusCount);
    const statusData = Object.values(statusCount);

    const html = buildHTML({
      aktif,
      deadlineDekat,
      terlambat,
      statusLabels,
      statusData,
      totalAktif: aktif.length,
      totalTerlambat: terlambat.length,
      totalDeadlineDekat: deadlineDekat.length,
      updatedAt: now.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch(e) {
    res.status(500).send('Error: ' + e.message);
  }
};

function buildHTML(d) {
  function statusBadge(status, isLate) {
    if (isLate) return `<span class="badge b-lambat">Terlambat</span>`;
    const cls = STATUS_COLORS[status] || 'b-review';
    return `<span class="badge ${cls}">${status}</span>`;
  }

  const aktifRows = d.aktif.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:20px">Tidak ada project aktif</td></tr>`
    : d.aktif.map(o => `
      <tr>
        <td><div style="font-weight:500">${o.nama}</div><div style="font-size:10px;color:#9ca3af">${o.nim}</div></td>
        <td>${o.layanan}</td>
        <td style="color:#6b7280">${o.aplikasi}</td>
        <td>${statusBadge(o.status, o.isLate)}</td>
        <td class="${o.isLate ? 'red' : o.diff !== null && o.diff <= 3 ? 'amber' : 'muted'}">${o.deadline ? new Date(o.deadline).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
      </tr>`).join('');

  const deadlineRows = d.deadlineDekat.length === 0 && d.terlambat.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:20px">Tidak ada deadline dekat</td></tr>`
    : [...d.terlambat, ...d.deadlineDekat].map(o => {
        const label = o.diff < 0
          ? `Terlambat ${Math.abs(o.diff)} hari`
          : o.diff === 0 ? 'Hari ini' : `${o.diff} hari lagi`;
        return `<tr>
          <td>${o.nama}</td>
          <td>${o.layanan}</td>
          <td class="${o.diff < 0 ? 'red' : 'amber'}">${new Date(o.deadline).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}</td>
          <td class="${o.diff < 0 ? 'red bold' : 'amber bold'}">${label}</td>
        </tr>`;
      }).join('');

  const alertBanner = d.totalTerlambat > 0
    ? `<div class="alert"><div class="alert-dot"></div><span>${d.totalTerlambat} project melewati deadline — segera tindak lanjut</span></div>`
    : '';

  const statusLabels = JSON.stringify(d.statusLabels);
  const statusData = JSON.stringify(d.statusData);
  const statusColors = JSON.stringify(['#9ca3af','#1a6bbd','#16a34a','#d97706','#7c3aed']);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Operasional Harian — AMKOBAR</title>
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
.kpi.warn{border-left-color:#d97706}
.kpi-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.kpi-val{font-size:18px;font-weight:600;color:#1a1a2e}
.kpi-val.red{color:#dc2626}
.kpi-val.amber{color:#d97706}
.kpi-sub{font-size:10px;color:#9ca3af;margin-top:4px}
.card{background:#fff;border-radius:8px;padding:16px;margin-bottom:16px}
.card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f0f0f0}
.card-title{font-size:13px;font-weight:600;color:#1a1a2e}
.card-meta{font-size:11px;color:#9ca3af}
.chart-wrap{position:relative;width:100%;height:180px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;color:#6b7280;font-weight:600;text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;text-transform:uppercase;letter-spacing:.04em}
td{padding:9px 8px;border-bottom:1px solid #f9f9f9;color:#1a1a2e}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:500}
.b-review{background:#f3f4f6;color:#374151}
.b-antrian{background:#dbeafe;color:#1e40af}
.b-diproses{background:#d1fae5;color:#065f46}
.b-tunggu{background:#fef3c7;color:#92400e}
.b-pendampingan{background:#ede9fe;color:#5b21b6}
.b-lambat{background:#fee2e2;color:#7f1d1d}
.red{color:#dc2626}.amber{color:#d97706}.muted{color:#9ca3af}.bold{font-weight:600}
@media(max-width:600px){
  .kpi-grid{grid-template-columns:1fr 1fr}
  .kpi-val{font-size:15px}
  .header-right{display:none}
  table{font-size:11px}
  td,th{padding:7px 6px}
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
  <a href="/api/keuangan">Keuangan</a>
  <a href="/api/operasional" class="active">Operasional</a>
</nav>
<div class="container">
  ${alertBanner}
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Project Aktif</div>
      <div class="kpi-val">${d.totalAktif}</div>
      <div class="kpi-sub">Sedang berjalan</div>
    </div>
    <div class="kpi warn">
      <div class="kpi-label">Deadline minggu ini</div>
      <div class="kpi-val amber">${d.totalDeadlineDekat}</div>
      <div class="kpi-sub">Perlu perhatian</div>
    </div>
    <div class="kpi danger">
      <div class="kpi-label">Project terlambat</div>
      <div class="kpi-val red">${d.totalTerlambat}</div>
      <div class="kpi-sub">Segera tindak lanjut</div>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Semua project aktif</div>
      <div class="card-meta">${d.totalAktif} project</div>
    </div>
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Nama client</th><th>Layanan</th><th>Aplikasi</th><th>Status</th><th>Deadline</th></tr></thead>
        <tbody>${aktifRows}</tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Deadline mendesak</div>
      <div class="card-meta">Terlambat & 7 hari ke depan</div>
    </div>
    <table>
      <thead><tr><th>Nama client</th><th>Layanan</th><th>Deadline</th><th>Keterangan</th></tr></thead>
      <tbody>${deadlineRows}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-hdr">
      <div class="card-title">Distribusi status project</div>
      <div class="card-meta">Aktif saja</div>
    </div>
    <div class="chart-wrap"><canvas id="chartStatus"></canvas></div>
  </div>
</div>

<script>
new Chart(document.getElementById('chartStatus'),{
  type:'bar',
  data:{labels:${statusLabels},datasets:[{data:${statusData},backgroundColor:${statusColors},borderRadius:4,borderSkipped:false}]},
  options:{
    indexAxis:'y',
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false}},
    scales:{
      x:{grid:{display:false},ticks:{color:'#9ca3af',font:{size:11},stepSize:1}},
      y:{grid:{display:false},ticks:{color:'#9ca3af',font:{size:11}}}
    }
  }
});
</script>
</body>
</html>`;
}
