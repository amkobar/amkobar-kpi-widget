module.exports = async function handler(req, res) {

  const guides = {
    all: {
      num: "TAHAP 1",
      title: "Client baru masuk",
      bg: "#E6F1FB", border: "#378ADD", color: "#0C447C",
      items: [
        "Cek entry baru sudah masuk otomatis di database PROJECT di bawah",
        "Pastikan kolom Paket, Jenis Layanan, Aplikasi sudah terisi",
        "Kirim WA \u2192 Template: Konfirmasi registrasi diterima"
      ]
    },
    antrian: {
      num: "TAHAP 2",
      title: "DP masuk",
      bg: "#EAF3DE", border: "#639922", color: "#27500A",
      items: [
        "Isi Tanggal DP di database di bawah",
        "Ubah Status Project \u2192 Antrian di database di bawah",
        "Kirim WA \u2192 Template: Konfirmasi DP diterima"
      ]
    },
    diproses: {
      num: "TAHAP 3",
      title: "Mulai pengerjaan",
      bg: "#FAEEDA", border: "#BA7517", color: "#633806",
      items: [
        "Ubah Status Project \u2192 Diproses di database di bawah",
        "Isi Deadline di database di bawah"
      ]
    },
    selesai: {
      num: "TAHAP 4 & 5",
      title: "Hasil selesai & Pelunasan",
      bg: "#FAECE7", border: "#D85A30", color: "#993C1D",
      items: [
        "Upload file ke folder Hasil Final di Google Drive client",
        "Ubah Status Project \u2192 Menunggu Pelunasan di database di bawah",
        "Kirim WA \u2192 Template: Notifikasi hasil selesai",
        "Centang Pelunasan Masuk (+ Tahap 2 jika skema 3 tahap)",
        "Isi Tanggal Selesai di database di bawah",
        "Buka akses folder Hasil Final di Google Drive client",
        "Ubah Status Project \u2192 Selesai",
        "Kirim WA \u2192 Template: Konfirmasi pelunasan & selesai"
      ]
    }
  };

  function guideHtml(key) {
    const g = guides[key];
    const items = g.items.map(i =>
      `<div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:${g.color};line-height:1.6;margin-bottom:6px"><div style="width:15px;height:15px;border-radius:3px;border:1.5px solid ${g.border};flex-shrink:0;margin-top:3px;opacity:.5"></div><span>${i}</span></div>`
    ).join("");
    return `<div id="g-${key}" style="display:none;background:${g.bg};border-left:3px solid ${g.border};border-radius:0 8px 8px 0;padding:16px 18px"><div style="font-size:11px;font-weight:600;color:${g.border};margin-bottom:4px;letter-spacing:.05em">${g.num}</div><div style="font-size:15px;font-weight:500;color:${g.color};margin-bottom:12px">${g.title}</div>${items}</div>`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#191919;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
body{padding:1.25rem}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tab{font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #333;color:#888;cursor:pointer;transition:all .15s;background:transparent}
.tab:hover{background:#222;color:#ccc}
.tab.active{background:#0f1b2d;color:#fff;border-color:#1a6bbd;font-weight:500}
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="sw('all',this)">All Client</div>
  <div class="tab" onclick="sw('antrian',this)">Antrian</div>
  <div class="tab" onclick="sw('diproses',this)">Diproses</div>
  <div class="tab" onclick="sw('selesai',this)">Selesai</div>
</div>
${guideHtml("all")}
${guideHtml("antrian")}
${guideHtml("diproses")}
${guideHtml("selesai")}
<script>
function sw(key,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('[id^="g-"]').forEach(g=>g.style.display='none');el.classList.add('active');document.getElementById('g-'+key).style.display='block';}
sw('all',document.querySelector('.tab.active'));
</script>
</body>
</html>`;

  res.setHeader("Content-Type","text/html");
  res.setHeader("Cache-Control","s-maxage=3600");
  res.status(200).send(html);
};
