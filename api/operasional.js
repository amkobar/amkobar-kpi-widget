const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECT = process.env.NOTION_DB_PROJECT || '310efe1d-1acf-80ad-861f-ecc7567b10c9';
const STATUS_AKTIF = ['Menunggu Review','Antrian','Diproses','Menunggu Pelunasan','Pendampingan'];
const STATUS_COLORS = {'Menunggu Review':'br','Antrian':'ba','Diproses':'bd','Menunggu Pelunasan':'bt','Pendampingan':'bp'};

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
  if (p.type==='date') return p.date?.start||null;
  if (p.type==='formula') { const f=p.formula; if (f?.type==='number') return f.number??0; if (f?.type==='boolean') return f.boolean??false; }
  if (p.type==='rollup') {
    const r=p.rollup;
    if (r?.type==='number') return r.number??0;
    if (r?.type==='array' && r.array?.length>0) {
      const first=r.array[0];
      if (first?.type==='select') return first.select?.name||'—';
      if (first?.type==='number') return first.number??0;
      if (first?.type==='rich_text') return first.rich_text?.map(t=>t.plain_text).join('')||'—';
    }
  }
  return null;
}

module.exports = async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  try {
    const pages=await queryNotion(DB_PROJECT);
    const now=new Date();
    const aktif=[], deadlineDekat=[], terlambat=[];
    const statusCount={'Menunggu Review':0,'Antrian':0,'Diproses':0,'Menunggu Pelunasan':0,'Pendampingan':0};

    for (const p of pages) {
      const nama=getProp(p,'Nama Client')||'—';
      const status=getProp(p,'Status Project')||'';
      const layanan=getProp(p,'Jenis Layanan')||'—';
      const aplikasi=getProp(p,'Aplikasi')||'—';
      const deadline=getProp(p,'Deadline');
      const nim=getProp(p,'NIM/NPM')||'';
      if (!STATUS_AKTIF.includes(status)) continue;
      if (statusCount[status]!==undefined) statusCount[status]++;
      const isLate=deadline&&new Date(deadline)<now;
      const diff=deadline?Math.round((new Date(deadline)-now)/86400000):null;
      aktif.push({nama,nim,status,layanan,aplikasi,deadline,isLate,diff});
      if (isLate) terlambat.push({nama,layanan,deadline,diff});
      else if (deadline&&diff<=7) deadlineDekat.push({nama,layanan,deadline,diff});
    }

    aktif.sort((a,b)=>{if(a.isLate&&!b.isLate)return -1;if(!a.isLate&&b.isLate)return 1;if(a.diff!==null&&b.diff!==null)return a.diff-b.diff;return 0;});

    function fmtDate(d){return d?new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';}
    function statusBadge(status,isLate){if(isLate)return`<span class="badge bl">Terlambat</span>`;return`<span class="badge ${STATUS_COLORS[status]||'br'}">${status}</span>`;}

    const alertBanner=terlambat.length>0?`<div class="alert"><div class="adot"></div><span>${terlambat.length} project melewati deadline — segera tindak lanjut</span></div>`:'';

    const aktifRows=aktif.length===0
      ?`<tr><td colspan="5" class="empty">Tidak ada project aktif</td></tr>`
      :aktif.map(o=>`<tr><td><div style="font-weight:600">${o.nama}</div><div style="font-size:10px;color:#475569">${o.nim}</div></td><td>${o.layanan}</td><td class="m">${o.aplikasi}</td><td>${statusBadge(o.status,o.isLate)}</td><td class="${o.isLate?'red':o.diff!==null&&o.diff<=3?'amber':'m'}">${fmtDate(o.deadline)}</td></tr>`).join('');

    const urgentList=[...terlambat,...deadlineDekat];
    const urgentRows=urgentList.length===0
      ?`<tr><td colspan="4" class="empty">Tidak ada deadline mendesak</td></tr>`
      :urgentList.map(o=>{const label=o.diff<0?`Terlambat ${Math.abs(o.diff)} hari`:o.diff===0?'Hari ini':`${o.diff} hari lagi`;return`<tr><td>${o.nama}</td><td>${o.layanan}</td><td class="${o.diff<0?'red':'amber'}">${fmtDate(o.deadline)}</td><td class="${o.diff<0?'red b':'amber b'}">${label}</td></tr>`;}).join('');

    const sLabels=JSON.stringify(Object.keys(statusCount));
    const sData=JSON.stringify(Object.values(statusCount));

    const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Operasional</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;padding:20px 10px 40px}
.alert{background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:16px}
.adot{width:7px;height:7px;border-radius:50%;background:#f87171;flex-shrink:0}
.alert span{font-size:12px;color:#fca5a5;font-weight:500}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
.kpi{min-height:100px;padding:20px;border-radius:18px;background:#0f1b2d;border:1px solid rgba(255,255,255,.06);border-left:3px solid #1D9E75;display:flex;flex-direction:column;justify-content:center}
.kpi.warn{border-left-color:#EF9F27}
.kpi.danger{border-left-color:#E24B4A}
.kpi-lbl{font-size:13px;font-weight:600;color:#cbd5e1;margin-bottom:10px}
.kpi-val{font-size:26px;font-weight:700;color:#5DCAA5}
.kpi-val.amber{color:#EF9F27}
.kpi-val.red{color:#E24B4A}
.kpi-sub{font-size:11px;color:#475569;margin-top:6px}
.layer2{background:#0f1b2d;border-radius:18px;border:1px solid rgba(255,255,255,.06);padding:18px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)}
.tab{font-size:13px;padding:7px 16px;cursor:pointer;border:none;background:none;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-1px}
.tab.active{color:#e2e8f0;border-bottom-color:#1D9E75;font-weight:600}
.layer3{background:#0f1b2d;border-radius:18px;border:1px solid rgba(255,255,255,.06);padding:18px}
.shdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.stitle{font-size:14px;font-weight:600;color:#e2e8f0}
.smeta{font-size:11px;color:#475569}
.cw{position:relative;width:100%;height:180px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;color:#475569;font-weight:600;text-align:left;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-transform:uppercase;letter-spacing:.04em}
td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,.04);color:#cbd5e1}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:500}
.br{background:rgba(148,163,184,.15);color:#94a3b8}
.ba{background:rgba(59,130,246,.2);color:#93c5fd}
.bd{background:rgba(29,158,117,.2);color:#5DCAA5}
.bt{background:rgba(239,159,39,.2);color:#fcd34d}
.bp{background:rgba(127,119,221,.2);color:#c4b5fd}
.bl{background:rgba(226,75,74,.2);color:#fca5a5}
.red{color:#E24B4A}.amber{color:#EF9F27}.m{color:#475569}.b{font-weight:600}
.empty{text-align:center;color:#475569;padding:16px}
.hidden{display:none}
@media(max-width:600px){.kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px}.kpi-grid .kpi:nth-child(3){grid-column:span 2}.kpi-val{font-size:22px}}
@media(max-width:380px){.kpi-grid{grid-template-columns:1fr}.kpi-grid .kpi:nth-child(3){grid-column:span 1}}
</style></head><body>
${alertBanner}
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-lbl">Project Aktif</div><div class="kpi-val">${aktif.length}</div><div class="kpi-sub">Sedang berjalan</div></div>
  <div class="kpi warn"><div class="kpi-lbl">Deadline Minggu Ini</div><div class="kpi-val amber">${deadlineDekat.length}</div><div class="kpi-sub">Perlu perhatian</div></div>
  <div class="kpi danger"><div class="kpi-lbl">Project Terlambat</div><div class="kpi-val red">${terlambat.length}</div><div class="kpi-sub">Segera tindak lanjut</div></div>
</div>

<div class="layer2">
  <div class="tab-bar">
    <button class="tab active" onclick="showTab('aktif',this)">Semua Project Aktif</button>
    <button class="tab" onclick="showTab('deadline',this)">Deadline Mendesak</button>
  </div>
  <div id="tab-aktif"><div style="overflow-x:auto">
    <table><thead><tr><th>Nama client</th><th>Layanan</th><th>Aplikasi</th><th>Status</th><th>Deadline</th></tr></thead>
    <tbody>${aktifRows}</tbody></table>
  </div></div>
  <div id="tab-deadline" class="hidden">
    <table><thead><tr><th>Nama client</th><th>Layanan</th><th>Deadline</th><th>Keterangan</th></tr></thead>
    <tbody>${urgentRows}</tbody></table>
  </div>
</div>

<div class="layer3">
  <div class="shdr"><div class="stitle">Distribusi status project</div><div class="smeta">Aktif saja</div></div>
  <div class="cw"><canvas id="cS"></canvas></div>
</div>

<script>
function showTab(name,el){
  ['aktif','deadline'].forEach(t=>document.getElementById('tab-'+t).classList.add('hidden'));
  document.getElementById('tab-'+name).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
new Chart(document.getElementById('cS'),{
  type:'bar',
  data:{labels:${sLabels},datasets:[{data:${sData},backgroundColor:['#64748b','#378ADD','#1D9E75','#EF9F27','#7F77DD'],borderRadius:6,borderSkipped:false}]},
  options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#475569',font:{size:11},stepSize:1}},y:{grid:{display:false},ticks:{color:'#94a3b8',font:{size:11}}}}}
});
<\/script></body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(html);
  } catch(e) { res.status(500).send('Error: '+e.message); }
};
