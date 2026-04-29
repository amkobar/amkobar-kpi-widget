module.exports = async function handler(req, res) {
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d3d3d3}body{padding:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{background:#1c1c1c;border:1px solid #2c2c2c;border-radius:12px;overflow:hidden}.card-hdr{padding:14px 18px;border-bottom:1px solid #262626;display:flex;align-items:center;gap:8px}.card-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.card-ttl{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888}.row{display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #222}.row:last-child{border-bottom:none}.ri{flex:1;min-width:0}.badge{display:inline-flex;padding:4px 12px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:6px}.bk{background:#0C447C;color:#85B7EB}.bu{background:#633806;color:#FAC775}.val{font-size:17px;color:#e8e8e8;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lbl{font-size:13px;color:#666;margin-bottom:5px}.btn{padding:8px 18px;background:#262626;border:1px solid #3a3a3a;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:#aaa;flex-shrink:0;transition:.15s;min-width:76px;text-align:center}.btn:hover{background:#303030;color:#ddd;border-color:#555}.btn.ok{background:#0a2e15;border-color:#1a5c2a;color:#4ade80}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:10px}</style></head><body>
<div class="grid">

  <div class="card">
    <div class="card-hdr"><div class="card-dot" style="background:#378ADD"></div><span class="card-ttl">Form Registrasi</span></div>
    <div class="row"><div class="ri"><div><span class="badge bk">Kerjasama</span></div><div class="val">tally.so/r/jaBkzY?kh=khk</div></div><button class="btn" onclick="cp(this,'https://tally.so/r/jaBkzY?kh=khk')">Copy</button></div>
    <div class="row"><div class="ri"><div><span class="badge bu">Umum</span></div><div class="val">tally.so/r/MeOabY?kh=khu</div></div><button class="btn" onclick="cp(this,'https://tally.so/r/MeOabY?kh=khu')">Copy</button></div>
  </div>

  <div class="card">
    <div class="card-hdr"><div class="card-dot" style="background:#f0a500"></div><span class="card-ttl">Password Pricelist</span></div>
    <div class="row"><div class="ri"><div><span class="badge bk">Kerjasama</span></div><div class="val">4mkob4r</div></div><button class="btn" onclick="cp(this,'4mkob4r')">Copy</button></div>
    <div class="row"><div class="ri"><div><span class="badge bu">Umum</span></div><div class="val">4dmin</div></div><button class="btn" onclick="cp(this,'4dmin')">Copy</button></div>
  </div>

  <div class="card">
    <div class="card-hdr"><div class="card-dot" style="background:#639922"></div><span class="card-ttl">Link Portal & Pricelist</span></div>
    <div class="row"><div class="ri"><div class="lbl">Portal Client</div><div class="val">amkobar-portal.vercel.app</div></div><button class="btn" onclick="cp(this,'https://amkobar-portal.vercel.app')">Copy</button></div>
    <div class="row"><div class="ri"><div class="lbl">Pricelist</div><div class="val">amkobar-portal.vercel.app/pricelist.html</div></div><button class="btn" onclick="cp(this,'https://amkobar-portal.vercel.app/pricelist.html')">Copy</button></div>
  </div>

  <div class="card">
    <div class="card-hdr"><div class="card-dot" style="background:#7F77DD"></div><span class="card-ttl">WA Admin</span></div>
    <div class="row"><div class="ri"><div class="lbl">Nomor</div><div class="val">081267090606</div></div><button class="btn" onclick="cp(this,'081267090606')">Copy</button></div>
    <div class="row"><div class="ri"><div class="lbl">Link WA</div><div class="val">wa.me/6281267090606</div></div><button class="btn" onclick="cp(this,'https://wa.me/6281267090606')">Copy</button></div>
  </div>

</div>
<script>
function fallbackCopy(text){var ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.left="-9999px";ta.style.top="-9999px";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);}
function cp(btn,text){function onDone(){var old=btn.textContent;btn.textContent='Tersalin';btn.classList.add('ok');setTimeout(function(){btn.textContent=old;btn.classList.remove('ok');},1500);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(onDone).catch(function(){fallbackCopy(text);onDone();});}else{fallbackCopy(text);onDone();}}
</script></body></html>`;
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
