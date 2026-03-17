module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  };

  function getProp(page, key) {
    const p = page.properties[key];
    if (!p) return "";
    if (p.type === "title") return p.title?.map(t => t.plain_text).join("") || "";
    if (p.type === "rich_text") return p.rich_text?.map(t => t.plain_text).join("") || "";
    if (p.type === "select") return p.select?.name || "";
    if (p.type === "number") return p.number ?? 0;
    if (p.type === "checkbox") return p.checkbox || false;
    if (p.type === "date") return p.date?.start || "";
    if (p.type === "formula") {
      const f = p.formula;
      if (f.type === "number") return f.number ?? 0;
      if (f.type === "string") return f.string || "";
    }
    if (p.type === "rollup") {
      const r = p.rollup;
      if (r.type === "number") return r.number ?? 0;
      if (r.type === "array") {
        const first = r.array?.[0];
        if (!first) return "";
        if (first.type === "select") return first.select?.name || "";
        if (first.type === "number") return first.number ?? 0;
        if (first.type === "rich_text") return first.rich_text?.map(t => t.plain_text).join("") || "";
      }
    }
    return "";
  }

  async function fetchClients() {
    let all = [], cursor = undefined;
    while (true) {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
        method: "POST", headers, body: JSON.stringify(body)
      });
      const data = await r.json();
      all = all.concat(data.results || []);
      if (!data.has_more) break;
      cursor = data.next_cursor;
    }
    return all.map(p => ({
      nama: getProp(p, "Nama Client"),
      nim: getProp(p, "NIM/NPM"),
      jenis: getProp(p, "Jenis Layanan"),
      aplikasi: getProp(p, "Aplikasi"),
      kodeAkses: getProp(p, "Kode Akses"),
      status: getProp(p, "Status Project"),
      kategori: getProp(p, "Kategori Harga"),
      sisa: getProp(p, "Sisa Pembayaran"),
      metode: getProp(p, "Metode Pembayaran"),
    })).filter(c => c.nama);
  }

  let clients = [];
  try { clients = await fetchClients(); } catch(e) {}

  const clientsJson = JSON.stringify(clients);

  const guides = {
    Overdue: {
      num: "PERHATIAN", title: "Project Melewati Deadline",
      bg: "#F1EFE8", border: "#888780", color: "#444441",
      items: [
        "Cek client mana yang deadlinenya sudah lewat",
        "Segera selesaikan atau hubungi client untuk update progress",
        "Pertimbangkan ubah Deadline jika ada kendala"
      ]
    },
    review: {
      num: "TAHAP 2", title: "Pastikan Data Benar",
      bg: "#E6F1FB", border: "#378ADD", color: "#0C447C",
      items: [
        "Pastikan kolom \u2192 Paket \u2192 Jenis Layanan \u2192 Aplikasi sudah terisi",
        "Jika sudah benar ganti Status Project \u2192 Antrian \u2192 Isi Tanggal DP",
        "Kirim WA \u2192 gunakan Generator di bawah"
      ]
    },
    antrian: {
      num: "TAHAP 3", title: "DP masuk",
      bg: "#EAF3DE", border: "#639922", color: "#27500A",
      items: [
        "Isi Deadline \u2192 jika sudah ditentukan",
        "Ubah Status Project \u2192 Diproses jika akan dikerjakan",
        "Kirim WA \u2192 gunakan Generator di bawah"
      ]
    },
    diproses: {
      num: "TAHAP 4", title: "Mulai pengerjaan",
      bg: "#FAEEDA", border: "#BA7517", color: "#633806",
      items: [
        "Centang \u2192 Tahap 2 Masuk jika (skema 3 tahap) dan pembayaran sudah masuk",
        "Ubah dahulu \u2192 Tanggal Selesai \u2192 lalu Status Project",
        "Ubah Status Project \u2192 Menunggu Pelunasan jika sudah selesai diproses"
      ]
    },
    pelunasan: {
      num: "TAHAP 5", title: "Hasil selesai",
      bg: "#FAECE7", border: "#D85A30", color: "#993C1D",
      items: [
        "Upload file ke folder Hasil Final di Google Drive client",
        "Kirim WA \u2192 gunakan Generator di bawah",
        "Ubah Status Project \u2192 Pendampingan, ceklis \u2192 Pelunasan Masuk jika sudah diterima dan buka akses Google Drive Hasil Final"
      ]
    },
    pendampingan: {
      num: "TAHAP 6", title: "Pendampingan",
      bg: "#EEEDFE", border: "#7F77DD", color: "#3C3489",
      items: [
        "Jadwalkan sesi GMeet/Zoom dengan client dan isi \u2192 Tanggal Sesi",
        "Kirim WA \u2192 gunakan Generator di bawah",
        "Ubah Status Project \u2192 Selesai setelah sesi belajar selesai"
      ]
    },
    selesai: {
      num: "TAHAP 7", title: "Selesai",
      bg: "#E1F5EE", border: "#1D9E75", color: "#085041",
      items: [
        "Kirim WA \u2192 gunakan Generator di bawah",
        "Pastikan semua data sudah lengkap di DATABASE PROJECT"
      ]
    },
    refund: {
      num: "PERHATIAN", title: "Refund & Dibatalkan",
      bg: "#FCEBEB", border: "#E24B4A", color: "#A32D2D",
      items: [
        "Ubah Status Project \u2192 Refund atau Dibatalkan",
        "Hapus atau ganti Kode Akses portal client di DATABASE PROJECT",
        "Ganti akses Google Drive client menjadi terbatas"
      ]
    }
  };

  const tabs = [
    { key: "review", label: "Menunggu Review" },
    { key: "antrian", label: "Antrian" },
    { key: "Overdue", label: "Overdue" },
    { key: "diproses", label: "Diproses" },
    { key: "pelunasan", label: "Menunggu Pelunasan" },
    { key: "pendampingan", label: "Pendampingan" },
    { key: "selesai", label: "Selesai" },
    { key: "refund", label: "Refund & Dibatalkan" },
  ];

  const generatorTabs = ["review", "antrian", "pelunasan", "pendampingan", "selesai"];

  function generatorSection(key, g) {
    if (key === "review") {
      return `
      <div style="margin-top:14px;border-top:0.5px solid ${g.border};padding-top:14px">
        <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${g.border};margin-bottom:10px">Generator Pesan WA — Sebelum Registrasi</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <input id="gen-review-nama" type="text" placeholder="Ketik nama client..."
            style="flex:1;min-width:140px;background:#00000022;border:0.5px solid ${g.border};border-radius:6px;color:${g.color};font-size:12px;padding:7px 10px;outline:none"
            oninput="genReview()">
          <select id="gen-review-kat" onchange="genReview()"
            style="flex:1;min-width:140px;background:#00000022;border:0.5px solid ${g.border};border-radius:6px;color:${g.color};font-size:12px;padding:7px 10px;outline:none">
            <option value="kerjasama">Kerjasama</option>
            <option value="umum">Umum</option>
          </select>
        </div>
        <div id="prev-review" style="background:#00000022;border:0.5px solid ${g.border};border-radius:8px;padding:12px;margin-bottom:8px;min-height:60px;font-size:12px;color:${g.color};line-height:1.7;white-space:pre-wrap;font-style:italic;opacity:.6">Ketik nama client untuk generate pesan...</div>
        <button onclick="copyMsg('review')" id="btn-review"
          style="width:100%;padding:8px;background:#00000033;border:0.5px solid ${g.border};border-radius:6px;color:${g.color};font-size:12px;font-weight:500;cursor:pointer">
          📋 Copy Pesan
        </button>
      </div>`;
    }
    return `
    <div style="margin-top:14px;border-top:0.5px solid ${g.border};padding-top:14px">
      <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${g.border};margin-bottom:10px">Generator Pesan WA</div>
      <select id="gen-${key}" onchange="genMsg('${key}', this.value)"
        style="width:100%;background:#00000022;border:0.5px solid ${g.border};border-radius:6px;color:${g.color};font-size:12px;padding:7px 10px;outline:none;margin-bottom:8px">
        <option value="">Pilih client...</option>
      </select>
      <div id="confirm-${key}" style="font-size:11px;color:${g.border};margin-bottom:8px;min-height:16px;opacity:.8"></div>
      <div id="prev-${key}" style="background:#00000022;border:0.5px solid ${g.border};border-radius:8px;padding:12px;margin-bottom:8px;min-height:60px;font-size:12px;color:${g.color};line-height:1.7;white-space:pre-wrap;font-style:italic;opacity:.6">Pilih client untuk generate pesan...</div>
      <button onclick="copyMsg('${key}')" id="btn-${key}"
        style="width:100%;padding:8px;background:#00000033;border:0.5px solid ${g.border};border-radius:6px;color:${g.color};font-size:12px;font-weight:500;cursor:pointer">
        📋 Copy Pesan
      </button>
    </div>`;
  }

  function guideHtml(key) {
    const g = guides[key];
    const items = g.items.map(i =>
      `<div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:${g.color};line-height:1.6;margin-bottom:6px">
        <div style="width:15px;height:15px;border-radius:3px;border:1.5px solid ${g.border};flex-shrink:0;margin-top:3px;opacity:.5"></div>
        <span>${i}</span>
      </div>`
    ).join("");
    const genHtml = generatorTabs.includes(key) ? generatorSection(key, g) : "";
    return `<div id="g-${key}" style="display:none;background:${g.bg};border-left:3px solid ${g.border};border-radius:0 8px 8px 0;padding:16px 18px">
      <div style="font-size:11px;font-weight:600;color:${g.border};margin-bottom:4px;letter-spacing:.05em">${g.num}</div>
      <div style="font-size:15px;font-weight:500;color:${g.color};margin-bottom:12px">${g.title}</div>
      ${items}
      ${genHtml}
    </div>`;
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
const CLIENTS = ${clientsJson};
const LINKS = {
  kerjasama: 'https://tally.so/r/jaBkzY?kh=khk',
  umum: 'https://tally.so/r/MeOabY?kh=khu'
};
const PORTAL = 'https://amkobar-portal.vercel.app';
const RATING_LINK = '[LINK RATING - SEGERA DIBUAT]';
let currentMsg = {};

const genTabs = ['antrian','pelunasan','pendampingan','selesai'];
genTabs.forEach(tab => {
  const sel = document.getElementById('gen-'+tab);
  if (!sel) return;
  CLIENTS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.nama;
    opt.textContent = c.nama + ' \u2014 ' + c.nim;
    sel.appendChild(opt);
  });
});

function getClient(nama){ return CLIENTS.find(c => c.nama === nama); }

function genReview() {
  const nama = document.getElementById('gen-review-nama').value.trim();
  const kat = document.getElementById('gen-review-kat').value;
  const link = LINKS[kat];
  const prev = document.getElementById('prev-review');
  if (!nama) {
    prev.style.fontStyle='italic'; prev.style.opacity='.6';
    prev.textContent='Ketik nama client untuk generate pesan...';
    currentMsg['review']=''; return;
  }
  const msg = 'Halo ' + nama + ' \uD83D\uDC4B\n\nTerima kasih sudah menggunakan jasa kami \uD83D\uDE0A\nPembayaran DP sudah kami terima dengan baik \u2705\n\nUntuk melanjutkan, silakan lakukan registrasi melalui link berikut:\n\uD83D\uDD17 ' + link + '\n\nIsi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan.\n\nJika ada pertanyaan, silakan menghubungi kami \uD83D\uDE0A\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  currentMsg['review']=msg;
  prev.style.fontStyle='normal'; prev.style.opacity='1';
  prev.textContent=msg;
}

function genMsg(tab, nama) {
  const prev = document.getElementById('prev-'+tab);
  const confirm = document.getElementById('confirm-'+tab);
  if (!nama) {
    prev.style.fontStyle='italic'; prev.style.opacity='.6';
    prev.textContent='Pilih client untuk generate pesan...';
    confirm.textContent=''; currentMsg[tab]=''; return;
  }
  const c = getClient(nama);
  if (!c) return;
  confirm.textContent = '\u2713 ' + c.nama + ' | NIM: ' + c.nim + ' | ' + c.jenis + ' | ' + c.aplikasi;
  let msg = '';
  if (tab==='antrian') {
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nTerima kasih sudah melakukan Registrasi \uD83C\uDF93\n\nBerikut informasi project kamu:\n\uD83D\uDCCB Layanan: ' + c.jenis + '\n\uD83D\uDCBB Aplikasi: ' + c.aplikasi + '\n\uD83D\uDD11 Kode Akses Portal: ' + c.kodeAkses + '\n\nPantau progress Olahdatamu di portal berikut:\n' + PORTAL + '\nMasukkan Kode Akses untuk login ya! \uD83D\uDE0A\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if (tab==='pelunasan') {
    const sisa = typeof c.sisa === 'number' ? Math.round(c.sisa).toLocaleString('id-ID') : c.sisa;
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nPengerjaan project sudah selesai \uD83C\uDF89\n\nFile hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.\nUntuk membuka akses download silahkan lakukan pelunasan:\n\uD83D\uDCB0 Rp ' + sisa + '\n\nSetelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp.\nSetelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.\n\nTerima kasih! \uD83D\uDE4F\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if (tab==='pendampingan') {
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nSesi pendampingan & pembelajaran akan kami informasikan melalui group ya \uD83D\uDE0A\n\nSesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan \u2014 kami akan konfirmasi ketersediaan jadwal kami.\n\nLink meeting akan dikirimkan menjelang sesi berlangsung.\nMohon pastikan sudah siap pada waktu yang sudah disepakati \uD83D\uDE4F\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  } else if (tab==='selesai') {
    msg = 'Halo ' + c.nama + ' \uD83D\uDC4B\n\nSesi pendampingan sudah selesai, terima kasih sudah bersama kami! \uD83D\uDE4F\n\nJika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja \uD83D\uDE0A\n\nKami sangat menghargai jika berkenan memberikan rating atas layanan kami:\n\u2B50 ' + RATING_LINK + '\n\nSukses selalu untuk skripsinya! \uD83D\uDCAA\uD83C\uDF93\n\nSalam,\nTim AMKOBAR \uD83C\uDF93';
  }
  currentMsg[tab]=msg;
  prev.style.fontStyle='normal'; prev.style.opacity='1';
  prev.textContent=msg;
}

function copyMsg(tab) {
  const msg = currentMsg[tab];
  if (!msg) return;
  navigator.clipboard.writeText(msg).then(() => {
    const btn = document.getElementById('btn-'+tab);
    const orig = btn.textContent;
    btn.textContent = '\u2705 Pesan Tersalin!';
    btn.style.background = '#0f3d1f';
    setTimeout(() => { btn.textContent=orig; btn.style.background='#00000033'; }, 2000);
  });
}

function sw(key,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('[id^="g-"]').forEach(g=>g.style.display='none');
  el.classList.add('active');
  document.getElementById('g-'+key).style.display='block';
}
sw('review',document.querySelector('.tab.active'));
</script>
</body>
</html>`;

  res.setHeader("Content-Type","text/html");
  res.setHeader("Cache-Control","s-maxage=60");
  res.status(200).send(html);
};
