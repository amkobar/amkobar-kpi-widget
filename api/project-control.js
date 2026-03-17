<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dashboard Generator Pesan WA AMKOBAR</title>
  <style>
    * {box-sizing: border-box; margin: 0; padding: 0;}
    html, body {
      background: #191919;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 20px;
      color: #ddd;
    }
    .tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .tab {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 8px;
      border: 1px solid #555;
      background: transparent;
      color: #888;
      user-select: none;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    .tab.active {
      color: white;
      border-color: #1D9E75;
      background-color: #0f1b2d;
      font-weight: 700;
    }
    .guide {
      background-color: #0f1b2d;
      border-radius: 8px;
      padding: 16px;
      max-width: 480px;
    }
    h1 {
      margin-bottom: 20px;
      color: #1D9E75;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #1D9E75;
    }
    select, input[type="text"], textarea {
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 15px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      background-color: #191919;
      color: white;
      border: 1px solid #444;
    }
    select:focus, input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #1D9E75;
      background-color: #0f1b2d;
    }
    button {
      background-color: #1D9E75;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 0;
      width: 100%;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
      transition: background-color 0.3s ease;
    }
    button:active {
      background-color: #14785b;
    }
    .message-preview {
      background-color: #0f1b2d;
      border-radius: 8px;
      padding: 14px;
      min-height: 100px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 15px;
    }
    .message-preview.active {
      opacity: 1;
    }
    .confirmation {
      margin-bottom: 12px;
      font-size: 13px;
      opacity: 0.7;
      color: #1d9e75;
    }
  </style>
</head>
<body>

  <h1>Generator Pesan WA AMKOBAR</h1>

  <div class="tabs" role="tablist" aria-label="Navigasi status project">
    <div class="tab active" data-tab="review" role="tab" aria-selected="true" tabindex="0">Menunggu Review</div>
    <div class="tab" data-tab="antrian" role="tab" tabindex="-1">Antrian</div>
    <div class="tab" data-tab="pelunasan" role="tab" tabindex="-1">Menunggu Pelunasan</div>
    <div class="tab" data-tab="pendampingan" role="tab" tabindex="-1">Pendampingan</div>
    <div class="tab" data-tab="selesai" role="tab" tabindex="-1">Selesai</div>
  </div>

  <div class="guide" id="generator-area">

    <label for="clientSelect">Pilih Client</label>
    <select id="clientSelect" aria-describedby="confirmClient">
      <option value="">Pilih client...</option>
    </select>
    <div id="confirmClient" class="confirmation" aria-live="polite" aria-atomic="true"></div>

    <label for="messagePreview">Preview Pesan WA</label>
    <div id="messagePreview" class="message-preview" aria-live="polite" aria-atomic="true">
      Silakan pilih client untuk generate pesan...
    </div>

    <button id="copyBtn" aria-label="Copy pesan WA">📋 Copy Pesan WA</button>

  </div>

  <script>
    // Data Template Pesan WA (sudah pakai unicode emoji)
    const templates = {
      "review_kerjasama": `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/jaBkzY?kh=khk

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,

      "review_umum": `Halo {nama} 👋

🙏🏻Terima kasih sudah menggunakan jasa kami
✅Pembayaran DP sudah kami terima dengan baik
✅ Untuk melanjutkan, silakan lakukan registrasi melalui link berikut:
🔗 https://tally.so/r/MeOabY?kh=khu

Isi data dengan lengkap dan benar , karena informasi tersebut akan langsung masuk ke sistem kami untuk memulai proses pengerjaan. Jika ada pertanyaan, Silahkan menghubungi kami 😊

Salam,
Tim AMKOBAR 🎓`,

      "antrian": `Halo {nama} 👋

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

      "pelunasan": `Halo {nama} 👋

1️⃣ Pengerjaan project sudah selesai 🎉
2️⃣ File hasil sudah kami upload ke folder Google Drive dengan nama Hasil Final.
3️⃣ Untuk Membuka akses download silahkan lakukan pelunasan
💰 Rp {sisa}

Setelah melakukan pelunasan wajib mengirimkan bukti pembayaran di WhatsApp
Setelah pelunasan diterima dan terkonfirmasi, folder Hasil Final akan segera kami buka aksesnya.

Terima kasih! 🙏

Salam,
Tim AMKOBAR 🎓`,

      "pendampingan": `Halo {nama} 👋

👉 Sesi pendampingan & pembelajaran akan kami informasikan melalui group
👉 Sesi pertama akan dijadwalkan oleh kami. Untuk sesi berikutnya, bisa request waktu yang diinginkan — kami akan konfirmasi ketersediaan jadwal kami.

Link meeting akan dikirimkan menjelang sesi berlangsung.
Mohon pastikan sudah siap pada waktu yang sudah disepakati 🙏

Salam,
Tim AMKOBAR 🎓`,

      "selesai": `Halo {nama} 👋

Sesi pendampingan sudah selesai, terima kasih! 🙏

Jika ingin melakukan sesi belajar tambahan atau masih ada yang ingin ditanyakan, jangan ragu untuk menghubungi kami kapan saja 😊

Kami sangat menghargai jika berkenan memberikan testimoni atas layanan kami:
⭐ [LINK RATING]

Sukses selalu untuk skripsinya! 💪🎓

Salam,
Tim AMKOBAR 🎓`
    };

    // Mapping tab ke status project Notion
    const statusByTab = {
      "review": "Menunggu Review",
      "antrian": "Antrian",
      "pelunasan": "Menunggu Pelunasan",
      "pendampingan": "Pendampingan",
      "selesai": "Selesai"
    };

    // Array client data, akan di-fetch dari API
    let clientData = [];

    // Simulasi fetch data client, ganti URL jika perlu
    // Data client diharapkan memiliki property:
    // nama, nim, jenis, aplikasi, kodeAkses, sisa, statusProject
    async function fetchClients() {
      // Ganti URL sesuai endpoint API Anda di Vercel
      try {
        const response = await fetch('/api/project-control?action=clients');
        if (!response.ok) throw new Error('API fetch gagal');
        const data = await response.json();
        clientData = data;
        updateDropdown(currentTab);
      } catch (e) {
        console.error('Gagal fetch client:', e);
        clientData = [];
        updateDropdown(currentTab);
      }
    }

    // DOM element refs
    const tabs = document.querySelectorAll('.tab');
    const clientSelect = document.getElementById('clientSelect');
    const messagePreview = document.getElementById('messagePreview');
    const confirmClient = document.getElementById('confirmClient');
    const copyBtn = document.getElementById('copyBtn');

    // Track current active tab (id)
    let currentTab = "review";

    // Fungsi switch tab dan update UI
    function switchTab(tabId) {
      currentTab = tabId;
      // active class tab
      tabs.forEach(t => {
        if (t.dataset.tab === tabId) {
          t.classList.add('active');
          t.setAttribute('aria-selected', 'true');
          t.setAttribute('tabindex', '0');
        } else {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        }
      });

      // bersihkan dropdown dan preview jika perlu
      updateDropdown(tabId);
      resetPreview();
    }

    // Update dropdown client sesuai filter status project per tab
    function updateDropdown(tabId) {
      clientSelect.innerHTML = '<option value="">Pilih client...</option>';
      confirmClient.textContent = '';
      messagePreview.textContent = 'Silakan pilih client untuk generate pesan...';
      messagePreview.classList.remove('active');

      const statusFilter = statusByTab[tabId];
      if (!statusFilter) return; // Tab tanpa generator (tidak pakai dropdown)

      // Filter client yang statusProject-nya cocok dengan tab yang dipilih
      const filteredClients = clientData.filter(client => {
        // Periksa properti statusProject case sensitive sesuai Notion
        return client.statusProject === statusFilter;
      });

      if (filteredClients.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Tidak ada client dengan status "' + statusFilter + '"';
        option.value = '';
        clientSelect.appendChild(option);
        return;
      }

      filteredClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.nama; // identifier client pakai nama (bisa diganti NIM jika mau)
        option.textContent = `${client.nama} - ${client.nim}`;
        clientSelect.appendChild(option);
      });
    }

    // Reset preview pesan WA
    function resetPreview() {
      messagePreview.classList.remove('active');
      messagePreview.textContent = 'Silakan pilih client untuk generate pesan...';
      confirmClient.textContent = '';
    }

    // Generate pesan WA berdasarkan tab, client terpilih
    function generateMessage() {
      const selectedClientName = clientSelect.value;
      if (!selectedClientName) {
        resetPreview();
        return;
      }
      // Temukan data client dari nama
      const client = clientData.find(c => c.nama === selectedClientName);
      if (!client) {
        resetPreview();
        return;
      }

      // Mapping kode template WA
      // Khusus tab 'review' ada 2 tipe template: kerjasama / umum: 
      // asumsi kategori ini ditandai di properti "Jenis Layanan" client
      let keyTemplate = currentTab;
      if (currentTab === 'review') {
        if (client.jenis && client.jenis.toLowerCase().includes('kerjasama')) {
          keyTemplate = 'review_kerjasama';
        } else {
          keyTemplate = 'review_umum';
        }
      }

      let template = templates[keyTemplate];
      if (!template) {
        messagePreview.textContent = 'Template pesan untuk tab ini belum tersedia.';
        return;
      }

      // Replace placeholder
      const message = template
        .replace('{nama}', client.nama)
        .replace('{jenis}', client.jenis || '')
        .replace('{aplikasi}', client.aplikasi || '')
        .replace('{kodeAkses}', client.kodeAkses || '')
        .replace('{sisa}', typeof client.sisa === 'number' ? client.sisa.toLocaleString('id-ID') : client.sisa || '0');

      // Tampilkan pesan di preview
      messagePreview.textContent = message;
      messagePreview.classList.add('active');

      // Konfirmasi info client di bawah dropdown
      confirmClient.textContent = `✓ ${client.nama} | NIM: ${client.nim} | ${client.jenis} | ${client.aplikasi}`;
    }

    // Copy pesan WA ke clipboard
    function copyMessage() {
      if (!messagePreview.classList.contains('active')) {
        alert('Silakan pilih client terlebih dahulu untuk generate pesan.');
        return;
      }
      const msg = messagePreview.textContent;
      navigator.clipboard.writeText(msg).then(() => {
        copyBtn.textContent = '✅ Pesan Tersalin!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Pesan WA'; }, 2000);
      }).catch(() => {
        alert('Gagal menyalin pesan ke clipboard.');
      });
    }

    // Event Listener
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
      tab.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchTab(tab.dataset.tab);
          tab.focus();
        }
      });
    });

    clientSelect.addEventListener('change', generateMessage);
    copyBtn.addEventListener('click', copyMessage);

    // Inisialisasi halaman
    switchTab(currentTab);
    fetchClients();

  </script>
</body>
</html>
