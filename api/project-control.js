================================================================
PATCH project-control.js — MINIMAL CHANGES
Hanya 3 perubahan dari kode lama. Jangan ubah yang lain.
================================================================

================================================================
PERUBAHAN 1 — Ganti seluruh blok HTML dari <div class="tabs">
sampai </body></html>
================================================================

CARI (di dalam var html = `...`):
---
<div class="tabs"><div class="tab active" onclick="sw('review',this)">Menunggu Review</div>
---

GANTI SELURUH BAGIAN dari baris itu sampai </body></html> dengan:

---
<div id="t1-wrap" style="border:1px solid #2a2a2a;border-radius:8px;margin-bottom:10px">
<div onclick="toggleT1()" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:#141414;border-radius:8px" id="t1-hdr">
<div style="display:flex;align-items:center;gap:8px"><div style="width:6px;height:6px;border-radius:50%;background:#378ADD"></div><span style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Tahap 1 -- Sebelum Registrasi</span><span style="font-size:10px;color:#555" id="t1-hint">(klik untuk buka)</span></div>
<span id="t1-arrow" style="color:#555;font-size:11px;transition:transform .2s">&#9660;</span>
</div>
<div id="t1-body" style="display:none;padding:14px;border-top:1px solid #2a2a2a">
<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px">
<div>
<div class="lbl">Langkah Konfirmasi</div>
<div style="display:flex;gap:8px;margin-bottom:7px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">1</div><div style="font-size:12px;color:#aaa;line-height:1.45">Verifikasi DP sudah masuk dari bukti transfer client</div></div>
<div style="display:flex;gap:8px;margin-bottom:7px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">2</div><div style="font-size:12px;color:#aaa;line-height:1.45">Generate pesan WA di kanan, copy dan kirim ke client</div></div>
<div style="display:flex;gap:8px"><div style="width:17px;height:17px;border-radius:50%;background:#1a3a5c;color:#378ADD;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">3</div><div style="font-size:12px;color:#aaa;line-height:1.45">Tunggu client isi form -- data muncul otomatis di tab Menunggu Review</div></div>
</div>
<div class="col-gen" style="border-left:1px solid #2a2a2a;padding-left:14px">
<div class="lbl">Generator Pesan - Sebelum Registrasi</div>
<div class="row"><input id="inp-nama" class="inp" placeholder="Ketik nama client..." oninput="gR()"><select id="inp-kat" class="inp" onchange="gR()" style="width:110px"><option value="kerjasama">Kerjasama</option><option value="umum">Umum</option></select></div>
<div id="prev-review" class="prev">Ketik nama client untuk generate pesan...</div>
<button class="btn" id="btn-review" onclick="cp('review')">&#128203; Copy Pesan</button>
</div>
</div>
</div>
</div>

<div style="display:inline-flex;align-items:center;gap:6px;background:#1a3d1f;border-radius:100px;padding:4px 12px;font-size:10px;font-weight:700;color:#639922;margin-bottom:10px">&#9654; TAHAP 2 -- SETELAH REGISTRASI</div>

<div class="tabs"><div class="tab active" onclick="sw('review',this)">Menunggu Review</div><div class="tab" onclick="sw('antrian',this)">Antrian</div><div class="tab" onclick="sw('overdue',this)">Overdue</div><div class="tab" onclick="sw('diproses',this)">Diproses</div><div class="tab" onclick="sw('pelunasan',this)">Menunggu Pelunasan</div><div class="tab" onclick="sw('pendampingan',this)">Pendampingan</div><div class="tab" onclick="sw('selesai',this)">Selesai</div></div>

<div id="g-review" class="guide active" style="border-color:#378ADD">
<div class="col-info">
<div style="font-size:10px;font-weight:700;color:#378ADD;margin-bottom:4px">MENUNGGU REVIEW</div>
<div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Verifikasi Data Client</div>
<div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan Nama, NIM, dan Judul Penelitian sudah benar</span></div>
<div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan Aplikasi, Jenis Layanan dan Jumlah Variabel sudah terisi</span></div>
<div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan DP Masuk sudah tercentang di Notion</span></div>
<div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Ubah Status Project ke Antrian dan isi Tanggal DP</span></div>
</div>
</div>

<div id="g-antrian" class="guide" style="border-color:#639922"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#639922;margin-bottom:4px">TAHAP 3</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">DP Masuk / Registrasi</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Kirim akses portal ke client</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan client bisa login ke portal</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Akses Portal</div><select id="sel-antrian" class="inp" onchange="gM('antrian',this.value)"><option value="">Pilih client...</option></select><div id="prev-antrian" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-antrian" onclick="cp('antrian')">&#128203; Copy Pesan</button></div></div>

<div id="g-overdue" class="guide" style="border-color:#888"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#888;margin-bottom:4px">PERHATIAN</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Project Terlambat</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Cek penyebab keterlambatan</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Update Tanggal Selesai jika perlu</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Hubungi client jika ada kendala dari mereka</span></div></div></div>

<div id="g-diproses" class="guide" style="border-color:#BA7517"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#BA7517;margin-bottom:4px">TAHAP 4</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Sedang Diproses</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Kerjakan sesuai paket yang dipilih client</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Setelah selesai, ganti status ke Menunggu Pelunasan</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Kirim WA tagihan menggunakan tab Menunggu Pelunasan</span></div></div></div>

<div id="g-pelunasan" class="guide" style="border-color:#D85A30"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#D85A30;margin-bottom:4px">TAHAP 5</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Menunggu Pelunasan</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Kirim informasi tagihan ke client via Generator</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Setelah lunas, buka akses folder Hasil Final di Drive</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Ganti status ke Pendampingan atau Selesai</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Tagihan</div><div id="warn-lunas" class="warning">&#9888;&#65039; Client sudah lunas!</div><select id="sel-pelunasan" class="inp" onchange="gM('pelunasan',this.value)"><option value="">Pilih client...</option></select><div id="prev-pelunasan" class="prev">Pilih client...</div><button class="btn" id="btn-pelunasan" onclick="cp('pelunasan')">&#128203; Copy Pesan</button></div></div>

<div id="g-pendampingan" class="guide" style="border-color:#7F77DD"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#7F77DD;margin-bottom:4px">TAHAP 6</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Sesi Pendampingan</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan client sudah bergabung di grup WA</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Posting jadwal sesi di grup WA</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Minta client konfirmasi kehadiran di grup</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Setelah sesi selesai, ganti status ke Selesai</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Info Pendampingan</div><select id="sel-pendampingan" class="inp" onchange="gM('pendampingan',this.value)"><option value="">Pilih client...</option></select><div id="prev-pendampingan" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-pendampingan" onclick="cp('pendampingan')">&#128203; Copy Pesan</button></div></div>

<div id="g-selesai" class="guide" style="border-color:#1D9E75"><div class="col-info"><div style="font-size:10px;font-weight:700;color:#1D9E75;margin-bottom:4px">TAHAP 7</div><div style="font-size:15px;font-weight:600;margin-bottom:12px;color:#eee">Project Selesai</div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Pastikan semua file sudah diupload ke folder Hasil Final</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Kirim WA ke client via Generator di samping</span></div><div class="todo"><div class="box" onclick="toggleBox(this)"></div><span>Minta client beri rating di portal untuk aktifkan Akses Permanen</span></div></div><div class="col-gen"><div class="lbl">Generator Pesan - Selesai</div><select id="sel-selesai" class="inp" onchange="gM('selesai',this.value)"><option value="">Pilih client...</option></select><div id="prev-selesai" class="prev">Pilih client untuk generate pesan...</div><button class="btn" id="btn-selesai" onclick="cp('selesai')">&#128203; Copy Pesan</button></div></div>

<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#444;padding-top:10px;border-top:1px solid #2a2a2a;margin-top:8px">
<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v7M2.5 5.5L5.5 9l3-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
Scroll ke bawah lalu klik tab yang sama di database Notion
</div>
---


================================================================
PERUBAHAN 2 — Tambah fungsi toggleT1 dan toggleBox di dalam <script>
================================================================

CARI (di dalam <script>):
---
function sw(k,el){
---

TAMBAHKAN SEBELUM baris itu:
---
function toggleT1(){
  var body=document.getElementById('t1-body');
  var hdr=document.getElementById('t1-hdr');
  var arrow=document.getElementById('t1-arrow');
  var hint=document.getElementById('t1-hint');
  var open=body.style.display==='none';
  body.style.display=open?'block':'none';
  arrow.style.transform=open?'rotate(180deg)':'rotate(0deg)';
  hdr.style.borderRadius=open?'8px 8px 0 0':'8px';
  if(hint)hint.textContent=open?'(klik untuk tutup)':'(klik untuk buka)';
}
function toggleBox(box){
  var done=box.dataset.done==='1';
  if(!done){
    box.dataset.done='1';
    box.style.background='#0f3d1f';
    box.style.borderColor='#27500A';
    box.innerHTML='<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline points="1,4.5 3.5,7 8,2" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    box.nextElementSibling.style.textDecoration='line-through';
    box.nextElementSibling.style.color='#555';
  } else {
    box.dataset.done='0';
    box.style.background='';
    box.style.borderColor='';
    box.innerHTML='';
    box.nextElementSibling.style.textDecoration='';
    box.nextElementSibling.style.color='';
  }
}
---

================================================================
SELESAI — hanya 2 perubahan di index.html
File lain tidak perlu diubah
================================================================
