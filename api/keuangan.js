const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECT = process.env.NOTION_DB_PROJECT || '310efe1d-1acf-80ad-861f-ecc7567b10c9';
const STATUS_AKTIF = ['Menunggu Review','Antrian','Diproses','Menunggu Pelunasan','Pendampingan'];

async function queryNotion(dbId) {
  let allResults=[], hasMore=true, startCursor;
  while (hasMore) {
    const body={page_size:100};
    if (startCursor) body.start_cursor=startCursor;
    const res=await fetch(`https://api.notion.com/v1/databases/${dbId}/query`,{
      method:'POST',
      headers:{'Authorization':`Bearer ${NOTION_TOKEN}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const data=await res.json();
    if (data.results) allResults=allResults.concat(data.results);
    hasMore=data.has_more; startCursor=data.next_cursor;
  }
  return allResults;
}

function getProp(page,key) {
  const p=page.properties?.[key];
  if (!p) return null;
  if (p.type==='title') return p.title?.map(t=>t.plain_text).join('')||'';
  if (p.type==='select') return p.select?.name||'';
  if (p.type==='number') return p.number??0;
  if (p.type==='checkbox') return p.checkbox??false;
  if (p.type==='date') return p.date?.start||null;
  if (p.type==='formula') { const f=p.formula; if (f?.type==='number') return f.number??0; if (f?.type==='boolean') return f.boolean??false; }
  if (p.type==='rollup') { const r=p.rollup; if (r?.type==='number') return r.number??0; if (r?.type==='array') return r.array?.[0]?.number??0; }
  return null;
}

function fmt(n) { return 'Rp '+Math.round(n||0).toLocaleString('id-ID'); }
function getMonthKey(d) { if (!d) return null; const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }
function getMonthLabel(key) { const [y,m]=key.split('-'); return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][parseInt(m)-1]+' '+y.slice(2); }

module.exports = async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  try {
    const pages=await queryNotion(DB_PROJECT);
    const now=new Date();
    const bulanSekarang=now.getMonth()+1;
    const tahunSekarang=now.getFullYear();
    const semesterStart=bulanSekarang<=6?1:7;

    let totalPendapatan=0, pendapatanSemester=0, tagihanTertunda=0, projectTerlambat=0;
    const outstanding=[], riwayat=[], perLayanan={}, rekapBulanan={};

    for (const p of pages) {
      const nama=getProp(p,'Nama Client')||'—';
      const status=getProp(p,'Status Project')||'';
      const layanan=getProp(p,'Jenis Layanan')||'—';
      const totalDibayar=getProp(p,'Total Dibayar')||0;
      const sisaPembayaran=getProp(p,'Sisa Pembayaran')||0;
      const deadline=getProp(p,'Deadline');
      const dpMasuk=getProp(p,'DP Masuk');
      const tahap2Masuk=getProp(p,'Tahap 2 Masuk');
      const pelunasanMasuk=getProp(p,'Pelunasan Masuk');
      const hargaNetto=getProp(p,'Harga Netto')||0;
      const dpVal=getProp(p,'Done Payment')||0;
      const tanggalSelesai=getProp(p,'Tanggal Selesai');

      totalPendapatan+=totalDibayar;

      if (tanggalSelesai) {
        const tgl=new Date(tanggalSelesai);
        const bln=tgl.getMonth()+1;
        const thn=tgl.getFullYear();
        if (thn===tahunSekarang&&bln>=semesterStart&&bln<=bulanSekarang) pendapatanSemester+=totalDibayar;
        const mk=getMonthKey(tanggalSelesai);
        if (mk) rekapBulanan[mk]=(rekapBulanan[mk]||0)+totalDibayar;
      }

      if (STATUS_AKTIF.includes(status)&&sisaPembayaran>0) {
        tagihanTertunda+=sisaPembayaran;
        const isLate=deadline&&new Date(deadline)<now;
        if (isLate) projectTerlambat++;
        outstanding.push({nama,layanan,status,sisaBayar:fmt(sisaPembayaran),deadline:deadline?new Date(deadline).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—',terlambat:isLate});
      }

      if (dpMasuk) riwayat.push({nama,layanan,tahap:'DP',jumlah:fmt(dpVal)});
      if (tahap2Masuk) riwayat.push({nama,layanan,tahap:'Tahap 2',jumlah:'—'});
      if (pelunasanMasuk) riwayat.push({nama,layanan,tahap:'Pelunasan',jumlah:fmt(hargaNetto-dpVal)});

      if (!perLayanan[layanan]) perLayanan[layanan]={count:0,total:0};
      perLayanan[layanan].count++; perLayanan[layanan].total+=totalDibayar;
    }

    const last6=[];
    for (let i=5;i>=0;i--) {
      const d=new Date(tahunSekarang,now.getMonth()-i,1);
      const key=getMonthKey(d.toISOString());
      last6.push({label:getMonthLabel(key),value:rekapBulanan[key]||0});
    }

    const layananList=Object.entries(perLayanan).map(([n,v])=>({nama:n,count:v.count,total:fmt(v.total)})).sort((a,b)=>b.count-a.count);
    const bulanNames=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const semesterLabel=`${bulanNames[semesterStart-1]}–${bulanNames[bulanSekarang-1]} ${tahunSekarang}`;

    const alertBanner=projectTerlambat>0?`<div class="alert"><div class="adot"></div><span>${projectTerlambat} project melewati deadline — segera tindak lanjut</span></div>`:'';

    const outRows=outstanding.length===0
      ?`<tr><td colspan="5" class="empty">Tidak ada tagihan tertunda</td></tr>`
      :outstanding.map(o=>`<tr><td>${o.nama}</td><td>${o.layanan}</td><td><span class="badge ${o.terlambat?'bl':o.status==='Antrian'?'ba':o.status==='Diproses'?'bd':o.status==='Menunggu Pelunasan'?'bt':'bp'}">${o.status}</span></td><td class="red b">${o.sisaBayar}</td><td class="${o.terlambat?'red':'m'}">${o.deadline}</td></tr>`).join('');

    const rivRows=riwayat.length===0
      ?`<tr><td colspan="4" class="empty">Belum ada riwayat</td></tr>`
      :riwayat.slice(0,8).map(r=>`<tr><td>${r.nama}</td><td>${r.layanan}</td><td class="m">${r.tahap}</td><td class="${r.jumlah==='—'?'m':'grn b'}">${r.jumlah}</td></tr>`).join('');

    const rekapRows=last6.map(b=>`<tr><td class="m">${b.label}</td><td class="${b.value>0?'grn b':''}">${b.value>0?fmt(b.value):'—'}</td></tr>`).join('');
    const layRows=layananList.map(l=>`<tr><td>${l.nama}</td><td style="text-align:center">${l.count}</td><td class="grn">${l.total}</td></tr>`).join('');

    const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Keuangan</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;padding:20px 10px 40px}
.alert{background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:16px}
.adot{width:7px;height:7px;border-radius:50%;background:#f87171;flex-shrink:0}
.alert span{font-size:12px;color:#fca5a5;font-weight:500}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
.kpi{min-height:100px;padding:20px;border-radius:18px;background:#0f1b2d;border:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;justify-content:center}
.kpi-lbl{font-size:13px;font-weight:600;color:#cbd5e1;margin-bottom:10px}
.kpi-val{font-size:26px;font-weight:700}
.kpi-val.blue{color:#60a5fa}.kpi-val.yellow{color:#fbbf24}.kpi-val.red{color:#f87171}
.kpi-sub{font-size:11px;color:#475569;margin-top:6px}
.layer2{background:#0f1b2d;border-radius:18px;border:1px solid rgba(255,255,255,.06);padding:18px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)}
.tab{font-size:13px;padding:7px 16px;cursor:pointer;border:none;background:none;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-1px}
.tab.active{color:#e2e8f0;border-bottom-color:#1a6bbd;font-weight:600}
.layer3{background:#0f1b2d;border-radius:18px;border:1px solid rgba(255,255,255,.06);padding:18px}
.shdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.stitle{font-size:14px;font-weight:600;color:#e2e8f0}
.smeta{font-size:11px;color:#475569}
.l3-inner{display:grid;grid-template-columns:180px 1fr;gap:16px;align-items:center}
.cw{position:relative;width:100%;height:160px}
.legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#94a3b8}
.ldot{width:10px;height:10px;border-radius:2px;flex-shrink:0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;color:#475569;font-weight:600;text-align:left;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-transform:uppercase;letter-spacing:.04em}
td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,.04);color:#cbd5e1}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:500}
.ba{background:rgba(59,130,246,.2);color:#93c5fd}
.bd{background:rgba(16,185,129,.2);color:#6ee7b7}
.bt{background:rgba(245,158,11,.2);color:#fcd34d}
.bp{background:rgba(167,139,250,.2);color:#c4b5fd}
.bl{background:rgba(239,68,68,.2);color:#fca5a5}
.red{color:#f87171}.grn{color:#34d399}.m{color:#475569}.b{font-weight:600}
.empty{text-align:center;color:#475569;padding:16px}
.hidden{display:none}
@media(max-width:600px){
  .kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px}
  .kpi-grid .kpi:nth-child(3){grid-column:span 2}
  .kpi-val{font-size:22px}
  .l3-inner{grid-template-columns:1fr}
}
@media(max-width:380px){
  .kpi-grid{grid-template-columns:1fr}
  .kpi-grid .kpi:nth-child(3){grid-column:span 1}
}
</style></head><body>
${alertBanner}
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-lbl">Total Pendapatan</div><div class="kpi-val blue">${fmt(totalPendapatan)}</div><div class="kpi-sub">Semua waktu</div></div>
  <div class="kpi"><div class="kpi-lbl">Semester Ini</div><div class="kpi-val yellow">${fmt(pendapatanSemester)}</div><div class="kpi-sub">${semesterLabel}</div></div>
  <div class="kpi"><div class="kpi-lbl">Tagihan Tertunda</div><div class="kpi-val red">${fmt(tagihanTertunda)}</div><div class="kpi-sub">${outstanding.length} client belum lunas</div></div>
</div>

<div class="layer2">
  <div class="tab-bar">
    <button class="tab active" onclick="showTab('outstanding',this)">Outstanding</button>
    <button class="tab" onclick="showTab('riwayat',this)">Riwayat</button>
    <button class="tab" onclick="showTab('rekap',this)">Rekap Bulanan</button>
  </div>
  <div id="tab-outstanding"><div style="overflow-x:auto">
    <table><thead><tr><th>Nama client</th><th>Layanan</th><th>Status</th><th>Sisa bayar</th><th>Deadline</th></tr></thead>
    <tbody>${outRows}</tbody></table>
  </div></div>
  <div id="tab-riwayat" class="hidden">
    <table><thead><tr><th>Nama client</th><th>Layanan</th><th>Tahap</th><th>Jumlah</th></tr></thead>
    <tbody>${rivRows}</tbody></table>
  </div>
  <div id="tab-rekap" class="hidden">
    <table><thead><tr><th>Bulan</th><th>Pendapatan</th></tr></thead>
    <tbody>${rekapRows}</tbody></table>
  </div>
</div>

<div class="layer3">
  <div class="shdr"><div class="stitle">Rekap per jenis layanan</div><div class="smeta">Semua waktu</div></div>
  <div class="l3-inner">
    <div>
      <div class="cw"><canvas id="cD"></canvas></div>
      <div class="legend">
        <div class="legend-item"><span class="ldot" style="background:#378ADD"></span>BAB IV</div>
        <div class="legend-item"><span class="ldot" style="background:#185FA5"></span>BAB IV–V</div>
        <div class="legend-item"><span class="ldot" style="background:#0C447C"></span>Full BAB I–V</div>
        <div class="legend-item"><span class="ldot" style="background:#85B7EB"></span>Olahdata</div>
      </div>
    </div>
    <table><thead><tr><th>Layanan</th><th style="text-align:center">Project</th><th>Pendapatan</th></tr></thead>
    <tbody>${layRows}</tbody></table>
  </div>
</div>

<script>
function showTab(name,el){
  ['outstanding','riwayat','rekap'].forEach(t=>document.getElementById('tab-'+t).classList.add('hidden'));
  document.getElementById('tab-'+name).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
new Chart(document.getElementById('cD'),{
  type:'doughnut',
  data:{labels:${JSON.stringify(layananList.map(l=>l.nama))},datasets:[{data:${JSON.stringify(layananList.map(l=>l.count))},backgroundColor:['#378ADD','#185FA5','#0C447C','#85B7EB'],borderWidth:0,hoverOffset:4}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.parsed+' project'}}},cutout:'65%'}
});
<\/script></body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(html);
  } catch(e) { res.status(500).send('Error: '+e.message); }
};
