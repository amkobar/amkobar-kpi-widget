module.exports = async function handler(req, res) {
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3}body{padding:16px}.section{margin-bottom:24px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:10px}.card{background:#202020;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden}.row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #2a2a2a;gap:12px}.row:last-child{border-bottom:none}.row-info{flex:1;min-width:0}.row-label{font-size:11px;color:#666;margin-bottom:2px}.row-value{font-size:12.5px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-value.mono{font-family:monospace;font-size:12px;color:#7eb8f0}.btn{padding:5px 12px;background:#252525;border:1px solid #444;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;color:#aaa;white-space:nowrap;transition:0.15s;flex-shrink:0}.btn:hover{background:#333;color:#eee}.btn.ok{background:#0f3d1f!important;border-color:#27500A!important;color:#4ade80!important}.divider{height:1px;background:#2a2a2a;margin:4px 0}.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600}.kerjasama{background:#1a3560;color:#7eb8f0}.umum{background:#3d2a00;color:#f0a500}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:10px}</style></head><body>

<div class="section">
  <div class="section-title">Form Registrasi</div>
  <div class="card">
    <div class="row">
      <div class="row-info">
        <div class="row-label"><span class="badge kerjasama">Kerjasama</span></div>
        <div class="row-value mono">https://tally.so/r/jaBkzY?kh=khk</div>
      </div>
      <button class="btn" onclick="cp(this,'https://tally.so/r/jaBkzY?kh=khk')">Copy</button>
    </div>
    <div class="row">
      <div class="row-info">
        <div class="row-label"><span class="badge umum">Umum</span></div>
        <div class="row-value mono">https://tally.so/r/MeOabY?kh=khu</div>
      </div>
      <button class="btn" onclick="cp(this,'https://tally.so/r/MeOabY?kh=khu')">Copy</button>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Password Pricelist</div>
  <div class="card">
    <div class="row">
      <div class="row-info">
        <div class="row-label"><span class="badge kerjasama">Kerjasama</span></div>
        <div class="row-value mono">4mkob4r</div>
      </div>
      <button class="btn" onclick="cp(this,'4mkob4r')">Copy</button>
    </div>
    <div class="row">
      <div class="row-info">
        <div class="row-label"><span class="badge umum">Umum</span></div>
        <div class="row-value mono">4dmin</div>
      </div>
      <button class="btn" onclick="cp(this,'4dmin')">Copy</button>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Link Portal & Pricelist</div>
  <div class="card">
    <div class="row">
      <div class="row-info">
        <div class="row-label">Portal Client</div>
        <div class="row-value mono">https://amkobar-portal.vercel.app</div>
      </div>
      <button class="btn" onclick="cp(this,'https://amkobar-portal.vercel.app')">Copy</button>
    </div>
    <div class="row">
      <div class="row-info">
        <div class="row-label">Pricelist</div>
        <div class="row-value mono">https://amkobar-portal.vercel.app/pricelist.html</div>
      </div>
      <button class="btn" onclick="cp(this,'https://amkobar-portal.vercel.app/pricelist.html')">Copy</button>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Prosedur Handling Client</div>
  <div class="card">
    <div class="row" style="flex-direction:column;align-items:flex-start;gap:6px">
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#378ADD;font-weight:700">1</span> Registrasi masuk → cek data di PROJECT CONTROL tab Menunggu Review</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#639922;font-weight:700">2</span> DP diterima → ganti status ke Antrian → kirim WA via generator</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#BA7517;font-weight:700">3</span> Mulai kerjakan → ganti status ke Diproses</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#D85A30;font-weight:700">4</span> Hasil selesai → ganti status ke Menunggu Pelunasan → kirim WA tagihan</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#7F77DD;font-weight:700">5</span> Pelunasan masuk → buka akses Hasil Final di Drive → ganti status ke Pendampingan / Selesai</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#aaa"><span style="color:#1D9E75;font-weight:700">6</span> Selesai → kirim WA via generator → minta client beri rating di portal</div>
    </div>
  </div>
</div>

<script>
function fallbackCopy(text){
  var ta=document.createElement("textarea");
  ta.value=text; ta.style.position="fixed"; ta.style.left="-9999px"; ta.style.top="-9999px";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}
function cp(btn, text){
  function onDone(){
    var old=btn.textContent; btn.textContent='✓'; btn.classList.add('ok');
    setTimeout(function(){btn.textContent=old; btn.classList.remove('ok');}, 1500);
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(onDone).catch(function(){fallbackCopy(text);onDone();});
  } else { fallbackCopy(text); onDone(); }
}
</script></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
