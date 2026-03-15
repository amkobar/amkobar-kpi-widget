const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECT = process.env.NOTION_DB_PROJECT || '310efe1d-1acf-80ad-861f-ecc7567b10c9';
const STATUS_AKTIF = ['Menunggu Review','Antrian','Diproses','Menunggu Pelunasan','Pendampingan'];

async function queryNotion(dbId) {
  let allResults=[], hasMore=true, startCursor;
  while (hasMore) {
    const body={page_size:100};
    if (startCursor) body.start_cursor=startCursor;
    const res=await fetch(`https://api.notion.com/v1/databases/${dbId}/query`,{method:'POST',headers:{'Authorization':`Bearer ${NOTION_TOKEN}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'},body:JSON.stringify(body)});
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
  if (p.type==='formula') { const f=p.formula; if (f?.type==='number') return f.number??0; }
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
    const bulanIni=getMonthKey(now.toISOString());
    let totalPendapatan=0, pendapatanBulanIni=0, tagihanTertunda=0;
    const outstanding=[], riwayat=[], perBulan={};

    for (const p of pages) {
      const nama=getProp(p,'Nama Client')||'—';
      const status=getProp(p,'Status Project')||'';
      const layanan=getProp(p,'Jenis Layanan')||'—';
      const totalDibayar=getProp(p,'Total Dibayar')||0;
      const sisaPembayaran=getProp(p,'Sisa Pembayaran')||0;
      const deadline=getProp(p,'Deadline');
      const dpMasuk=getProp(p,'DP Masuk');
      const pelunasanMasuk=getProp(p,'Pelunasan Masuk');
      const tanggalDP=getProp(p,'Tanggal DP');
      const hargaNetto=getProp(p,'Harga Netto')||0;
      const dpVal=getProp(p,'Done Payment')||0;

      totalPendapatan+=totalDibayar;
      const mk=getMonthKey(tanggalDP);
      if (mk) perBulan[mk]=(perBulan[mk]||0)+totalDibayar;
      if (status==='Selesai'&&getMonthKey(getProp(p,'Tanggal Selesai'))===bulanIni) pendapatanBulanIni+=totalDibayar;
      if (STATUS_AKTIF.includes(status)&&sisaPembayaran>0) {
        tagihanTertunda+=sisaPembayaran;
        const isLate=deadline&&new Date(deadline)<now;
        outstanding.push({nama,layanan,status,sisaBayar:fmt(sisaPembayaran),deadline:deadline?new Date(deadline).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—',terlambat:isLate});
      }
      if (dpMasuk) riwayat.push({nama,layanan,tahap:'DP',jumlah:fmt(dpVal)});
      if (pelunasanMasuk) riwayat.push({nama,layanan,tahap:'Pelunasan',jumlah:fmt(hargaNetto-dpVal)});
    }

    const last6=[];
    for (let i=5;i>=0;i--) { const d=new Date(now.getFullYear(),now.getMonth()-i,1); const key=getMonthKey(d.toISOString()); last6.push({label:getMonthLabel(key),value:perBulan[key]||0}); }

    const alertBanner=outstanding.some(o=>o.terlambat)?`<div class="alert"><div class="adot"></div><span>${outstanding.filter(o=>o.terlambat).length} project melewati deadline — segera tindak lanjut</span></div>`:'';

    const outRows=outstanding.length===0?`<tr><td colspan="5" class="empty">Tidak ada tagihan tertunda</td></tr>`:outstanding.map(o=>`<tr><td>${o.nama}</td><td>${o.layanan}</td><td><span class="badge ${o.terlambat?'bl':o.status==='Antrian'?'ba':o.status==='Diproses'?'bd':o.status==='Menunggu Pelunasan'?'bt':'bp'}">${o.status}</span></td><td class="red b">${o.sisaBayar}</td><td class="${o.terlambat?'red':'m'}">${o.deadline}</td></tr>`).join('');

    const rivRows=riwayat.length===0?`<tr><td colspan="4" class="empty">Belum ada riwayat</td></tr>`:riwayat.slice(0,5).map(r=>`<tr><td>${r.nama}</td><td>${r.layanan}</td><td class="m">${r.tahap}</td><td class="grn b">${r.jumlah}</td></tr>`).join('');

    const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Keuangan</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;overflow-x:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;padding:16px 12px 24px}
.alert{background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;margin-bottom:14px}
.adot{width:7px;height:7px;border-radius:50%;background:#f87171;flex-shrink:0}
.alert span{font-size:12px;color:#fca5a5;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
.card{padding:16px;border-radius:14px;background:#0f1b2d;border:1px solid rgba(255,255,255,.06)}
.lbl{font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px}
.val{font-size:22px;font-weight:700}
.val.blue{color:#60a5fa}.val.yellow{color:#fbbf24}.val.red{color:#f87171}
.sub{font-size:10px;color:#475569;margin-top:4px}
.sec{background:#0f1b2d;border-radius:14px;border:1px solid rgba(255,255,255,.06);padding:14px;margin-bottom:12px}
.shdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
.stitle{font-size:13px;font-weight:600;color:#e2e8f0}
.smeta{font-size:11px;color:#475569}
.cw{position:relative;width:100%;height:140px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{font-size:10px;color:#475569;font-weight:600;text-align:left;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.06);text-transform:uppercase;letter-spacing:.04em}
td{padding:8px 8px;border-bottom:1px solid rgba(255,255,255,.04);color:#cbd5e1}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:4px;font-weight:500}
.ba{background:rgba(59,130,246,.2);color:#93c5fd}
.bd{background:rgba(16,185,129,.2);color:#6ee7b7}
.bt{background:rgba(245,158,11,.2);color:#fcd34d}
.bp{background:rgba(167,139,250,.2);color:#c4b5fd}
.bl{background:rgba(239,68,68,.2);color:#fca5a5}
.red{color:#f87171}.grn{color:#34d399}.m{color:#475569}.b{font-weight:600}
.empty{text-align:center;color:#475569;padding:16px}
@media(max-width:600px){.grid{grid-template-columns:repeat(2,1fr)}.grid .card:nth-child(3){grid-column:span 2}.val{font-size:18px}}
@media(max-width:380px){.grid{grid-template-columns:1fr}.grid .card:nth-child(3){grid-column:span 1}}
</style></head><body>
${alertBanner}
<div class="grid">
  <div class="card"><div class="lbl">Total Pendapatan</div><div class="val blue">${fmt(totalPendapatan)}</div><div class="sub">Semua waktu</div></div>
  <div class="card"><div class="lbl">Pendapatan Bulan Ini</div><div class="val">${fmt(pendapatanBulanIni)}</div><div class="sub">Bulan berjalan</div></div>
  <div class="card"><div class="lbl">Tagihan Tertunda</div><div class="val yellow">${fmt(tagihanTertunda)}</div><div class="sub">${outstanding.length} client belum lunas</div></div>
</div>
<div class="sec"><div class="shdr"><div class="stitle">Pendapatan per bulan</div><div class="smeta">6 bulan terakhir</div></div><div class="cw"><canvas id="cB"></canvas></div></div>
<div class="sec"><div class="shdr"><div class="stitle">Outstanding payment</div><div class="smeta">Belum lunas</div></div><div style="overflow-x:auto"><table><thead><tr><th>Nama client</th><th>Layanan</th><th>Status</th><th>Sisa bayar</th><th>Deadline</th></tr></thead><tbody>${outRows}</tbody></table></div></div>
<div class="sec"><div class="shdr"><div class="stitle">Riwayat pembayaran masuk</div><div class="smeta">Terbaru</div></div><table><thead><tr><th>Nama client</th><th>Layanan</th><th>Tahap</th><th>Jumlah</th></tr></thead><tbody>${rivRows}</tbody></table></div>
<script>
new Chart(document.getElementById('cB'),{type:'bar',data:{labels:${JSON.stringify(last6.map(b=>b.label))},datasets:[{data:${JSON.stringify(last6.map(b=>b.value))},backgroundColor:'#1a6bbd',borderRadius:5,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'Rp '+ctx.parsed.y.toLocaleString('id-ID')}}},scales:{x:{grid:{display:false},ticks:{color:'#475569',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#475569',font:{size:10},callback:v=>v===0?'0':'Rp '+(v/1000000).toFixed(1)+'jt'}}}}});
<\/script></body></html>`;

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(html);
  } catch(e) { res.status(500).send('Error: '+e.message); }
};
