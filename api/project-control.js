module.exports = async function handler(req, res) {

  // Client data endpoint
  if (req.query && req.query.action === 'clients') {
    const notionToken = process.env.NOTION_TOKEN;
    const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
    const headers = {
      Authorization: "Bearer " + notionToken,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };
    function getProp(page, key) {
      const p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return (p.title || []).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "rich_text") return (p.rich_text || []).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "number") return p.number != null ? p.number : 0;
      if (p.type === "checkbox") return p.checkbox || false;
      if (p.type === "date") return (p.date && p.date.start) || "";
      if (p.type === "formula") {
        var f = p.formula;
        if (f.type === "number") return f.number != null ? f.number : 0;
        if (f.type === "string") return f.string || "";
      }
      if (p.type === "rollup") {
        var r = p.rollup;
        if (r.type === "number") return r.number != null ? r.number : 0;
        if (r.type === "array" && r.array && r.array[0]) {
          var first = r.array[0];
          if (first.type === "select") return (first.select && first.select.name) || "";
          if (first.type === "number") return first.number != null ? first.number : 0;
        }
      }
      return "";
    }
    try {
      var all = [], cursor;
      while (true) {
        var body = {page_size: 100};
        if (cursor) body.start_cursor = cursor;
        var r = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
          method: "POST", headers: headers, body: JSON.stringify(body)
        });
        var data = await r.json();
        all = all.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
      }
      var clients = all.map(function(p) {
        return {
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
        };
      }).filter(function(c){ return c.nama; });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);
    } catch(e) {
      res.status(200).json([]);
    }
    return;
  }

  // Messages data - safely JSON encoded
  var MSGS = {"review_kerjasama": "Halo {nama} \ud83d\udc4b\n\nTerima kasih sudah menggunakan jasa kami \ud83d\ude0a\nPembayaran DP sudah kami terima dengan baik \u2705\n\nUntuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n\ud83d\udd17 https://tally.so/r/jaBkzY?kh=khk\n\nIsi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan.\n\nJika ada pertanyaan, silakan menghubungi kami \ud83d\ude0a\n\nSalam,\nTim AMKOBAR \ud83c\udf93", "review_umum": "Halo {nama} \ud83d\udc4b\n\nTerima kasih sudah menggunakan jasa kami \ud83d\ude0a\nPembayaran DP sudah kami terima dengan baik \u2705\n\nUntuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n\ud83d\udd17 https://tally.so/r/MeOabY?kh=khu\n\nIsi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan.\n\nJika ada pertanyaan, silakan menghubungi kami \ud83d\ude0a\n\nSalam,\nTim AMKOBAR \ud83c\udf93", "antrian": "Halo {nama} \ud83d\udc4b\n\nTerima kasih sudah melakukan Registrasi \ud83c\udf93\n\nBerikut informasi project kamu:\n\ud83d\udccb Layanan: {jenis}\n\ud83d\udcbb Aplikasi: {aplikasi}\n\ud83d\udd11 Kode Akses Portal: {kodeAkses}\n\nPantau progress Olahdatamu di portal berikut:\nhttps://amkobar-portal.vercel.app\nMasukkan Kode Akses untuk login ya! \ud83d\ude0a\n\nSalam,\nTim AMKOBAR \ud83c\udf93", "pelunasan": "Halo {nama} \ud83d\udc4b\n\nPengerjaan project sudah selesai \ud83c\udf89\n\nFile hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.\nUntuk membuka akses download silahkan lakukan pelunasan:\n\ud83d\udcb0 Rp {sisa}\n\nSetelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp.\nSetelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.\n\nTerima kasih! \ud83d\ude4f\n\nSalam,\nTim AMKOBAR \ud83c\udf93", "pendampingan": "Halo {nama} \ud83d\udc4b\n\nSesi pendampingan & pembelajaran akan kami informasikan melalui group ya \ud83d\ude0a\n\nSesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan - kami akan konfirmasi ketersediaan jadwal kami.\n\nLink meeting akan dikirimkan menjelang sesi berlangsung.\nMohon pastikan sudah siap pada waktu yang sudah disepakati \ud83d\ude4f\n\nSalam,\nTim AMKOBAR \ud83c\udf93", "selesai": "Halo {nama} \ud83d\udc4b\n\nSesi pendampingan sudah selesai, terima kasih sudah bersama kami! \ud83d\ude4f\n\nJika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja \ud83d\ude0a\n\nKami sangat menghargai jika berkenan memberikan rating atas layanan kami:\n\u2b50 [LINK RATING - SEGERA DIBUAT]\n\nSukses selalu untuk skripsinya! \ud83d\udcaa\ud83c\udf93\n\nSalam,\nTim AMKOBAR \ud83c\udf93"};

  // Build HTML
  var html = [];
  html.push('<!DOCTYPE html>');
  html.push('<html><head>');
  html.push('<meta charset="utf-8">');
  html.push('<meta name="viewport" content="width=device-width,initial-scale=1">');
  html.push('<style>');
  html.push('*{box-sizing:border-box;margin:0;padding:0}');
  html.push('html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}');
  html.push('body{padding:1.25rem}');
  html.push('.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}');
  html.push('.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;transition:all .15s;background:transparent}');
  html.push('.tab:hover{background:#222;color:#ccc}');
  html.push('.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}');
  html.push('.guide{border-left:3px solid;border-radius:0 8px 8px 0;padding:16px 18px;display:none}');
  html.push('.guide.active{display:block}');
  html.push('.todo{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.6;margin-bottom:6px}');
  html.push('.todo-box{width:15px;height:15px;border-radius:3px;border:1.5px solid currentColor;flex-shrink:0;margin-top:3px;opacity:.5}');
  html.push('.gen{margin-top:14px;padding-top:14px;border-top:0.5px solid currentColor}');
  html.push('.gen-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}');
  html.push('.gen-inp{width:100%;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;padding:7px 10px;outline:none;margin-bottom:8px;color:inherit}');
  html.push('.gen-row{display:flex;gap:8px;margin-bottom:8px}');
  html.push('.gen-row .gen-inp{margin-bottom:0}');
  html.push('.confirm{font-size:11px;margin-bottom:8px;min-height:16px;opacity:.8}');
  html.push('.preview{background:#00000033;border:0.5px solid currentColor;border-radius:8px;padding:12px;margin-bottom:8px;min-height:60px;font-size:12px;line-height:1.7;white-space:pre-wrap;font-style:italic;opacity:.6}');
  html.push('.preview.filled{font-style:normal;opacity:1}');
  html.push('.copy-btn{width:100%;padding:8px;background:#00000033;border:0.5px solid currentColor;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;color:inherit}');
  html.push('.copy-btn.ok{background:#0f3d1f!important;border-color:#27500A!important}');
  html.push('</style></head><body>');

  // Tabs
  html.push('<div class="tabs">');
  html.push('<div class="tab active" onclick="sw(\"review\",this)">Menunggu Review</div>');
  html.push('<div class="tab" onclick="sw(\"antrian\",this)">Antrian</div>');
  html.push('<div class="tab" onclick="sw(\"overdue\",this)">Overdue</div>');
  html.push('<div class="tab" onclick="sw(\"diproses\",this)">Diproses</div>');
  html.push('<div class="tab" onclick="sw(\"pelunasan\",this)">Menunggu Pelunasan</div>');
  html.push('<div class="tab" onclick="sw(\"pendampingan\",this)">Pendampingan</div>');
  html.push('<div class="tab" onclick="sw(\"selesai\",this)">Selesai</div>');
  html.push('<div class="tab" onclick="sw(\"refund\",this)">Refund &amp; Dibatalkan</div>');
  html.push('</div>');

  // Guide: Menunggu Review
  html.push('<div id="g-review" class="guide active" style="background:#E6F1FB;border-color:#378ADD;color:#0C447C">');
  html.push('<div style="font-size:11px;font-weight:600;color:#378ADD;margin-bottom:4px;letter-spacing:.05em">TAHAP 2</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Pastikan Data Benar</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Jika sudah benar ganti Status Project ke Antrian dan isi Tanggal DP</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>');
  html.push('<div class="gen">');
  html.push('<div class="gen-label" style="color:#378ADD">Generator Pesan WA &#8212; Sebelum Registrasi</div>');
  html.push('<div class="gen-row">');
  html.push('<input id="inp-nama" class="gen-inp" type="text" placeholder="Ketik nama client..." oninput="genReview()" style="color:#0C447C">');
  html.push('<select id="inp-kat" class="gen-inp" onchange="genReview()" style="color:#0C447C;flex:0 0 140px"><option value="kerjasama">Kerjasama</option><option value="umum">Umum</option></select>');
  html.push('</div>');
  html.push('<div id="prev-review" class="preview" style="border-color:#378ADD;color:#0C447C">Ketik nama client untuk generate pesan...</div>');
  html.push('<button class="copy-btn" id="btn-review" onclick="copyMsg(\"review\")" style="border-color:#378ADD;color:#0C447C">&#128203; Copy Pesan</button>');
  html.push('</div></div>');

  // Guide: Antrian
  html.push('<div id="g-antrian" class="guide" style="background:#EAF3DE;border-color:#639922;color:#27500A">');
  html.push('<div style="font-size:11px;font-weight:600;color:#639922;margin-bottom:4px;letter-spacing:.05em">TAHAP 3</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">DP masuk</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Isi Deadline jika sudah ditentukan</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Diproses jika akan dikerjakan</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>');
  html.push('<div class="gen">');
  html.push('<div class="gen-label" style="color:#639922">Generator Pesan WA</div>');
  html.push('<select id="sel-antrian" class="gen-inp" onchange="genMsg(\"antrian\",this.value)" style="color:#27500A"><option value="">Pilih client...</option></select>');
  html.push('<div id="confirm-antrian" class="confirm" style="color:#639922"></div>');
  html.push('<div id="prev-antrian" class="preview" style="border-color:#639922;color:#27500A">Pilih client untuk generate pesan...</div>');
  html.push('<button class="copy-btn" id="btn-antrian" onclick="copyMsg(\"antrian\")" style="border-color:#639922;color:#27500A">&#128203; Copy Pesan</button>');
  html.push('</div></div>');

  // Guide: Overdue
  html.push('<div id="g-overdue" class="guide" style="background:#F1EFE8;border-color:#888780;color:#444441">');
  html.push('<div style="font-size:11px;font-weight:600;color:#888780;margin-bottom:4px;letter-spacing:.05em">PERHATIAN</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Project Melewati Deadline</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Cek client mana yang deadlinenya sudah lewat</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Segera selesaikan atau hubungi client untuk update progress</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Pertimbangkan ubah Deadline jika ada kendala</span></div>');
  html.push('</div>');

  // Guide: Diproses
  html.push('<div id="g-diproses" class="guide" style="background:#FAEEDA;border-color:#BA7517;color:#633806">');
  html.push('<div style="font-size:11px;font-weight:600;color:#BA7517;margin-bottom:4px;letter-spacing:.05em">TAHAP 4</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Mulai pengerjaan</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Centang Tahap 2 Masuk jika skema 3 tahap dan pembayaran sudah masuk</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah dahulu Tanggal Selesai lalu Status Project</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Menunggu Pelunasan jika sudah selesai diproses</span></div>');
  html.push('</div>');

  // Guide: Menunggu Pelunasan
  html.push('<div id="g-pelunasan" class="guide" style="background:#FAECE7;border-color:#D85A30;color:#993C1D">');
  html.push('<div style="font-size:11px;font-weight:600;color:#D85A30;margin-bottom:4px;letter-spacing:.05em">TAHAP 5</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Hasil selesai</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Upload file ke folder Hasil Final di Google Drive client</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Pendampingan, ceklis Pelunasan Masuk jika sudah diterima dan buka akses Google Drive Hasil Final</span></div>');
  html.push('<div class="gen">');
  html.push('<div class="gen-label" style="color:#D85A30">Generator Pesan WA</div>');
  html.push('<select id="sel-pelunasan" class="gen-inp" onchange="genMsg(\"pelunasan\",this.value)" style="color:#993C1D"><option value="">Pilih client...</option></select>');
  html.push('<div id="confirm-pelunasan" class="confirm" style="color:#D85A30"></div>');
  html.push('<div id="prev-pelunasan" class="preview" style="border-color:#D85A30;color:#993C1D">Pilih client untuk generate pesan...</div>');
  html.push('<button class="copy-btn" id="btn-pelunasan" onclick="copyMsg(\"pelunasan\")" style="border-color:#D85A30;color:#993C1D">&#128203; Copy Pesan</button>');
  html.push('</div></div>');

  // Guide: Pendampingan
  html.push('<div id="g-pendampingan" class="guide" style="background:#EEEDFE;border-color:#7F77DD;color:#3C3489">');
  html.push('<div style="font-size:11px;font-weight:600;color:#7F77DD;margin-bottom:4px;letter-spacing:.05em">TAHAP 6</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Pendampingan</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Jadwalkan sesi GMeet/Zoom dengan client dan isi Tanggal Sesi</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Selesai setelah sesi belajar selesai</span></div>');
  html.push('<div class="gen">');
  html.push('<div class="gen-label" style="color:#7F77DD">Generator Pesan WA</div>');
  html.push('<select id="sel-pendampingan" class="gen-inp" onchange="genMsg(\"pendampingan\",this.value)" style="color:#3C3489"><option value="">Pilih client...</option></select>');
  html.push('<div id="confirm-pendampingan" class="confirm" style="color:#7F77DD"></div>');
  html.push('<div id="prev-pendampingan" class="preview" style="border-color:#7F77DD;color:#3C3489">Pilih client untuk generate pesan...</div>');
  html.push('<button class="copy-btn" id="btn-pendampingan" onclick="copyMsg(\"pendampingan\")" style="border-color:#7F77DD;color:#3C3489">&#128203; Copy Pesan</button>');
  html.push('</div></div>');

  // Guide: Selesai
  html.push('<div id="g-selesai" class="guide" style="background:#E1F5EE;border-color:#1D9E75;color:#085041">');
  html.push('<div style="font-size:11px;font-weight:600;color:#1D9E75;margin-bottom:4px;letter-spacing:.05em">TAHAP 7</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Selesai</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Kirim WA menggunakan Generator di bawah</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Pastikan semua data sudah lengkap di DATABASE PROJECT</span></div>');
  html.push('<div class="gen">');
  html.push('<div class="gen-label" style="color:#1D9E75">Generator Pesan WA</div>');
  html.push('<select id="sel-selesai" class="gen-inp" onchange="genMsg(\"selesai\",this.value)" style="color:#085041"><option value="">Pilih client...</option></select>');
  html.push('<div id="confirm-selesai" class="confirm" style="color:#1D9E75"></div>');
  html.push('<div id="prev-selesai" class="preview" style="border-color:#1D9E75;color:#085041">Pilih client untuk generate pesan...</div>');
  html.push('<button class="copy-btn" id="btn-selesai" onclick="copyMsg(\"selesai\")" style="border-color:#1D9E75;color:#085041">&#128203; Copy Pesan</button>');
  html.push('</div></div>');

  // Guide: Refund
  html.push('<div id="g-refund" class="guide" style="background:#FCEBEB;border-color:#E24B4A;color:#A32D2D">');
  html.push('<div style="font-size:11px;font-weight:600;color:#E24B4A;margin-bottom:4px;letter-spacing:.05em">PERHATIAN</div>');
  html.push('<div style="font-size:15px;font-weight:500;margin-bottom:12px">Refund &amp; Dibatalkan</div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ubah Status Project ke Refund atau Dibatalkan</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Hapus atau ganti Kode Akses portal client di DATABASE PROJECT</span></div>');
  html.push('<div class="todo"><div class="todo-box"></div><span>Ganti akses Google Drive client menjadi terbatas</span></div>');
  html.push('</div>');

  // Script
  html.push('<script>');
  html.push('var MSGS = ' + JSON.stringify(MSGS) + ';');
  html.push('var CLIENTS = [];');
  html.push('var CUR = {};');
  html.push('fetch("/api/project-control?action=clients").then(function(r){return r.json();}).then(function(d){');
  html.push('  CLIENTS = d;');
  html.push('  ["antrian","pelunasan","pendampingan","selesai"].forEach(function(tab){');
  html.push('    var sel = document.getElementById("sel-"+tab);');
  html.push('    if(!sel) return;');
  html.push('    CLIENTS.forEach(function(c){');
  html.push('      var o = document.createElement("option");');
  html.push('      o.value = c.nama;');
  html.push('      o.textContent = c.nama + " - " + c.nim;');
  html.push('      sel.appendChild(o);');
  html.push('    });');
  html.push('  });');
  html.push('}).catch(function(){});');
  html.push('function sw(key,el){');
  html.push('  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active");});');
  html.push('  document.querySelectorAll(".guide").forEach(function(g){g.classList.remove("active");});');
  html.push('  el.classList.add("active");');
  html.push('  document.getElementById("g-"+key).classList.add("active");');
  html.push('}');
  html.push('function getClient(nama){return CLIENTS.find(function(c){return c.nama===nama;});}');
  html.push('function genReview(){');
  html.push('  var nama = document.getElementById("inp-nama").value.trim();');
  html.push('  var kat = document.getElementById("inp-kat").value;');
  html.push('  var prev = document.getElementById("prev-review");');
  html.push('  if(!nama){prev.className="preview";prev.textContent="Ketik nama client untuk generate pesan...";CUR.review="";return;}');
  html.push('  var tpl = MSGS["review_"+kat] || "";');
  html.push('  var msg = tpl.replace("{nama}", nama);');
  html.push('  CUR.review = msg;');
  html.push('  prev.className="preview filled";');
  html.push('  prev.textContent = msg;');
  html.push('}');
  html.push('function genMsg(tab, nama){');
  html.push('  var prev = document.getElementById("prev-"+tab);');
  html.push('  var conf = document.getElementById("confirm-"+tab);');
  html.push('  if(!nama){prev.className="preview";prev.textContent="Pilih client untuk generate pesan...";conf.textContent="";CUR[tab]="";return;}');
  html.push('  var c = getClient(nama);');
  html.push('  if(!c) return;');
  html.push('  conf.textContent = "\u2713 " + c.nama + " | NIM: " + c.nim + " | " + c.jenis + " | " + c.aplikasi;');
  html.push('  var sisa = typeof c.sisa === "number" ? Math.round(c.sisa).toLocaleString("id-ID") : (c.sisa || "0");');
  html.push('  var tpl = MSGS[tab] || "";');
  html.push('  var msg = tpl.replace("{nama}", c.nama).replace("{jenis}", c.jenis).replace("{aplikasi}", c.aplikasi).replace("{kodeAkses}", c.kodeAkses).replace("{sisa}", sisa);');
  html.push('  CUR[tab] = msg;');
  html.push('  prev.className = "preview filled";');
  html.push('  prev.textContent = msg;');
  html.push('}');
  html.push('function copyMsg(tab){');
  html.push('  var msg = CUR[tab];');
  html.push('  if(!msg) return;');
  html.push('  navigator.clipboard.writeText(msg).then(function(){');
  html.push('    var btn = document.getElementById("btn-"+tab);');
  html.push('    var orig = btn.textContent;');
  html.push('    btn.textContent = "\u2705 Pesan Tersalin!";');
  html.push('    btn.classList.add("ok");');
  html.push('    setTimeout(function(){btn.textContent=orig;btn.classList.remove("ok");}, 2000);');
  html.push('  });');
  html.push('}');
  html.push('</script></body></html>');

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html.join("\n"));
};
