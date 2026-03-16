module.exports = async function handler(req, res) {

  const guides = {
    Client: {
      num: "TAHAP 1",
      title: "Hanya Tampilan Semua Client",
      bg: "#F1EFE8", border: "#888780", color: "#444441",
      items: [
        "Ini hanya tampilan untuk semua client",
        "Langsung Ke View \u2192 Menunggu Review"
      ]
    },
    review: {
      num: "TAHAP 2",
      title: "Pastikan Data Benar",
      bg: "#E6F1FB", border: "#378ADD", color: "#0C447C",
      items: [
        "Pastikan kolom \u2192 Paket \u2192 Jenis Layanan \u2192 Aplikasi sudah terisi",
        "Jika sudah benar ganti Status Project \u2192 Antrian \u2192 Tanggal DP",
        "Kirim WA \u2192 Template: Konfirmasi registrasi diterima copy dari email"
      ]
    },
    antrian: {
      num: "TAHAP 3",
      title: "DP masuk",
      bg: "#EAF3DE", border: "#639922", color: "#27500A",
      items: [
        "Isi Deadline \u2192 jika sudah ditentukan",
        "Ubah Status Project \u2192 Antrian jika akan di proses",
        "Kirim WA \u2192 Template: Konfirmasi DP diterima"
      ]
    },
    diproses: {
      num: "TAHAP 4",
      title: "Mulai pengerjaan",
      bg: "#FAEEDA", border: "#BA7517", color: "#633806",
      items: [
        "Ubah Status Project \u2192 Diproses",
        "Dari sini lanjutkan Pekerjaan"
      ]
    },
    pelunasan: {
      num: "TAHAP 5",
      title: "Hasil selesai",
      bg: "#FAECE7", border: "#D85A30", color: "#993C1D",
      items: [
        "Upload file ke folder Hasil Final di Google Drive client",
        "Ubah Status Project \u2192 Menunggu Pelunasan",
        "Kirim WA \u2192 Template: Notifikasi hasil selesai"
      ]
    },
    selesai: {
      num: "TAHAP 6",
      title: "Pelunasan masuk & Pendampingan",
      bg: "#E1F5EE", border: "#1D9E75", color: "#085041",
      items: [
        "Centang Pelunasan Masuk (+ Tahap 2 jika skema 3 tahap)",
        "Buka akses folder Hasil Final di Google Drive dan Isi Tanggal Selesai",
        "Ubah Status Project \u2192 Menunggu Pelunasan \u2192 Pendampingan",
        "Kirim WA \u2192 Template: Konfirmasi pelunasan"
      ]
    },
    pendampingan: {
      num: "TAHAP 7",
      title: "Pendampingan",
      bg: "#EEEDFE", border: "#7F77DD", color: "#3C3489",
      items: [
        "Jadwalkan sesi GMeet/Zoom dengan client",
        "Kirim link meeting ke client via WA",
        "Ubah Status Project \u2192 Selesai setelah sesi selesai"
      ]
    },
    refund: {
      num: "PERHATIAN",
      title: "Refund & Dibatalkan",
      bg: "#FCEBEB", border: "#E24B4A", color: "#A32D2D",
      items: [
        "Ubah Status Project \u2192 Refund atau Dibatalkan",
        "Proses pengembalian dana jika berlaku",
        "Pastikan akses Google Drive client sudah dicabut"
      ]
    }
  };

  const tabs = [
    { key: "Client", label: "All Client" },
    { key: "review", label: "Menunggu Review" },
    { key: "antrian", label: "Antrian" },
    { key: "diproses", label: "Diproses" },
    { key: "pelunasan", label: "Menunggu Pelunasan" },
    { key: "selesai", label: "Selesai" },
    { key: "pendampingan", label: "Pendampingan" },
    { key: "refund", label: "Refund & Dibatalkan" },
  ];

  function guideHtml(key) {
    const g = guides[key];
    const items = g.items.map(i =>
      `<div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:${g.color};line-height:1.6;margin-bottom:6px"><div style="width:15px;height:15px;border-radius:3px;border:1.5px solid ${g.border};flex-shrink:0;margin-top:3px;opacity:.5"></div><span>${i}</span></div>`
    ).join("");
    return `<div id="g-${key}" style="display:none;background:${g.bg};border-left:3px solid ${g.border};border-radius:0 8px 8px 0;padding:16px 18px"><div style="font-size:11px;font-weight:600;color:${g.border};margin-bottom:4px;letter-spacing:.05em">${g.num}</div><div style="font-size:15px;font-weight:500;color:${g.color};margin-bottom:12px">${g.title}</div>${items}</div>`;
  }

  const tabHtml = tabs.map((t, i) =>
    `<div class="tab${i===0?' active':''}" onclick="sw('${t.key}',this)">${t.label}</div>`
  ).join("");

  const guidesHtml = tabs.map(t => guideHtml(t.key)).join("");

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
<div class="tabs">${tabHtml}</div>
${guidesHtml}
<script>
function sw(key,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('[id^="g-"]').forEach(g=>g.style.display='none');el.classList.add('active');document.getElementById('g-'+key).style.display='block';}
sw('Client',document.querySelector('.tab.active'));
</script>
</body>
</html>`;

  res.setHeader("Content-Type","text/html");
  res.setHeader("Cache-Control","s-maxage=3600");
  res.status(200).send(html);
};
