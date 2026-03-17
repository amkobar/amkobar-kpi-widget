<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Generator Pesan WA AMKOBAR</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #191919; font-family: Arial, sans-serif; color: #ddd; padding: 20px; }
  .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
  .tab {
    background: transparent; border: 1px solid #555;
    padding: 8px 16px; border-radius: 6px; cursor: pointer; user-select: none;
    color: #888; font-weight: 500; transition: all 0.3s ease;
  }
  .tab.active {
    background-color: #0f1b2d;
    border-color: #1D9E75;
    color: #fff;
    font-weight: 700;
  }
  .guide {
    background-color: #0f1b2d;
    padding: 20px;
    border-radius: 8px;
    max-width: 480px;
  }
  label {
    font-weight: 600;
    margin-bottom: 6px;
    display: block;
    color: #1D9E75;
  }
  select, textarea {
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    background-color: #191919;
    color: #ddd;
    border: 1px solid #444;
    margin-bottom: 15px;
  }
  select:focus, textarea:focus {
    outline: none;
    border-color: #1D9E75;
    background-color: #0f1b2d;
  }
  textarea {
    min-height: 140px;
    white-space: pre-wrap;
    font-family: monospace;
  }
  button {
    width: 100%;
    background-color: #1D9E75;
    border: none;
    padding: 12px;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
  }
  button:active {
    background-color: #14785b;
  }
  .confirmation {
    margin-bottom: 12px;
    font-size: 13px;
    color: #1D9E75;
  }
</style>
</head>
<body>

<h1>Generator Pesan WA AMKOBAR</h1>

<div class="tabs" role="tablist" aria-label="Navigasi status project">
  <div class="tab active" data-tab="Menunggu Review" role="tab" aria-selected="true" tabindex="0">Menunggu Review</div>
  <div class="tab" data-tab="Antrian" role="tab" tabindex="-1">Antrian</div>
  <div class="tab" data-tab="Diproses" role="tab" tabindex="-1">Diproses</div>
  <div class="tab" data-tab="Menunggu Pelunasan" role="tab" tabindex="-1">Menunggu Pelunasan</div>
  <div class="tab" data-tab="Pendampingan" role="tab" tabindex="-1">Pendampingan</div>
  <div class="tab" data-tab="Selesai" role="tab" tabindex="-1">Selesai</div>
</div>

<div class="guide" id="generator-area">
  <label for="clientSelect">Pilih Client</label>
  <select id="clientSelect" aria-describedby="clientConfirm">
    <option value="">Pilih client...</option>
  </select>
  <div id="clientConfirm" class="confirmation" aria-live="polite" aria-atomic="true"></div>

  <label for="messagePreview">Preview Pesan WA</label>
  <textarea id="messagePreview" readonly>Silakan pilih client untuk generate pesan...</textarea>

  <button id="copyBtn" aria-label="Copy pesan WA">📋 Copy Pesan WA</button>
</div>

<script>
  // Template Pesan WA sesuai kebutuhan Anda (bisa disesuaikan)
  const templates = {
    "Menunggu Review_kerjasama": `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/jaBkzY?kh=khk

Isi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,

    "Menunggu Review_umum": `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/MeOabY?kh=khu

Isi data dengan lengkap dan benar, karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,

    "Antrian": `Halo {nama} 👋

Terima kasih sudah melakukan Registrasi

Berikut informasi project :
📋 Layanan: {jenis}
💻 Aplikasi: {aplikasi}
🔑 Kode Akses Portal: {kodeAkses}

Pantau progress Olahdatamu di portal berikut:
https://amkobar-portal.vercel.app
Masukkan Kode Akses untuk login ya! 😊

Salam,
Tim AMKOBAR 🎓`,

    "Diproses": `Halo {nama} 👋

Status project Anda sedang dalam tahap pengerjaan.

Salam,
Tim AMKOBAR 🎓`,

    "Menunggu Pelunasan": `Halo {nama} 👋

1️⃣ Pengerjaan project sudah selesai 🎉
2️⃣ File hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.
3️⃣ Untuk Membuka akses download silahkan lakukan pelunasan
💰 Rp {sisa}

Setelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp
Setelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.

Terima kasih! 🙏

Salam,
Tim AMKOBAR 🎓`,

    "Pendampingan": `Halo {nama} 👋

👉 Sesi pendampingan & pembelajaran akan kami informasikan melalui group
👉 Sesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan — kami akan konfirmasi ketersediaan jadwal kami.

Link meeting akan dikirimkan menjelang sesi berlangsung.
Mohon pastikan sudah siap pada waktu yang sudah disepakati 🙏

Salam,
Tim AMKOBAR 🎓`,

    "Selesai": `Halo {nama} 👋

Sesi pendampingan sudah selesai, terima kasih! 🙏

Jika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja 😊

Kami sangat menghargai jika berkenan memberikan testimoni atas layanan kami:
⭐ [LINK RATING]

Sukses selalu untuk skripsinya! 💪🎓

Salam,
Tim AMKOBAR 🎓`
  };

  // Simpan data client dari API
  let clients = [];

  // Elemen DOM
  const tabs = document.querySelectorAll('.tab');
  const clientSelect = document.getElementById('clientSelect');
  const messagePreview = document.getElementById('messagePreview');
  const clientConfirm = document.getElementById('clientConfirm');
  const copyBtn = document.getElementById('copyBtn');

  // Tab aktif default
  let currentTab = 'Menunggu Review';

  // Fungsi switch tab
  function switchTab(tabName, el) {
    currentTab = tabName;
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
      tab.setAttribute('aria-selected', tab.dataset.tab === tabName ? 'true' : 'false');
      tab.tabIndex = tab.dataset.tab === tabName ? 0 : -1;
    });
    // Setelah ganti tab, isi dropdown sesuai dengan status project (tabName)
    updateDropdownClients();
    resetMessage();
  }

  // Update dropdown client berdasarkan tab (status project)
  function updateDropdownClients() {
    clientSelect.innerHTML = '<option value="">Pilih client...</option>';
    clientConfirm.textContent = '';
    resetMessage();

    // Filter client yang statusProject-nya sama persis dengan currentTab
    const filtered = clients.filter(client => client.statusProject === currentTab);

    if (filtered.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = `Tidak ada client dengan status "${currentTab}"`;
      clientSelect.appendChild(emptyOption);
      return;
    }

    filtered.forEach(client => {
      const option = document.createElement('option');
      option.value = client.nama;
      option.textContent = `${client.nama} - ${client.nim || '-'}`;
      clientSelect.appendChild(option);
    });
  }

  // Reset area pesan WA
  function resetMessage() {
    messagePreview.value = 'Silakan pilih client untuk generate pesan...';
  }

  // Generate pesan WA berdasarkan tab dan client yang dipilih
  function generateMessage() {
    const selectedName = clientSelect.value;
    if (!selectedName) {
      resetMessage();
      clientConfirm.textContent = '';
      return;
    }
    const client = clients.find(c => c.nama === selectedName);
    if (!client) {
      resetMessage();
      clientConfirm.textContent = '';
      return;
    }
    clientConfirm.textContent = `✓ ${client.nama} | NIM: ${client.nim || '-'} | ${client.jenis || '-'} | ${client.aplikasi || '-'}`;

    // Khusus "Menunggu Review" tab pilih template kerjasama atau umum berdasar jenis layanan
    let templateKey = currentTab;
    if (currentTab === 'Menunggu Review') {
      if (client.jenis && client.jenis.toLowerCase().includes('kerjasama')) {
        templateKey += '_kerjasama';
      } else {
        templateKey += '_umum';
      }
    }

    let template = templates[templateKey];
    if (!template) {
      messagePreview.value = 'Template pesan tidak tersedia untuk status ini.';
      return;
    }

    let msg = template;
    msg = msg.replace(/\{nama\}/g, client.nama || '');
    msg = msg.replace(/\{nim\}/g, client.nim || '');
    msg = msg.replace(/\{jenis\}/g, client.jenis || '');
    msg = msg.replace(/\{aplikasi\}/g, client.aplikasi || '');
    msg = msg.replace(/\{kodeAkses\}/g, client.kodeAkses || '');
    msg = msg.replace(/\{sisa\}/g, client.sisa !== undefined && client.sisa !== null ? Number(client.sisa).toLocaleString('id-ID') : '0');
    messagePreview.value = msg;
  }

  // Copy pesan WA ke clipboard
  function copyMessage() {
    if (messagePreview.value.trim() === '' || messagePreview.value.includes('Silakan pilih client')) {
      alert('Silakan pilih client terlebih dahulu untuk generate pesan.');
      return;
    }
    navigator.clipboard.writeText(messagePreview.value).then(() => {
      copyBtn.textContent = '✅ Pesan Tersalin!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Pesan WA';
      }, 2000);
    }).catch(() => {
      alert('Gagal menyalin pesan ke clipboard.');
    });
  }

  // Fetch client data dari API (pastikan endpoint sesuai dengan backend Anda)
  async function fetchClients() {
    try {
      const res = await fetch('/api/project-control?action=clients');
      if (!res.ok) throw new Error('Gagal mengambil data client');
      const data = await res.json();
      clients = data;
      updateDropdownClients();
    } catch (error) {
      console.error(error);
      clients = [];
      updateDropdownClients();
    }
  }

  // Event Listener
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab, tab));
  });

  clientSelect.addEventListener('change', generateMessage);
  copyBtn.addEventListener('click', copyMessage);

  // Initial setup
  switchTab(currentTab);
  fetchClients();

</script>

</body>
</html>
