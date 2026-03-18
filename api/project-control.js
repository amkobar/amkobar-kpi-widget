module.exports = async function handler(req, res) {

  if (req.query && req.query.action === 'clients') {
    var notionToken = process.env.NOTION_TOKEN;
    var projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";
    var headers = {
      Authorization: "Bearer " + notionToken,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    function getProp(page, key) {
      var p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return (p.title||[]).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "rich_text") return (p.rich_text||[]).map(function(t){return t.plain_text;}).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "status") return (p.status && p.status.name) || ""; // ✅ tambahan penting
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

        var resp = await fetch("https://api.notion.com/v1/databases/" + projectDbId + "/query", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body)
        });

        var data = await resp.json();
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
          status: getProp(p, "Status Project"),
        };
      }).filter(function(c){ return c.nama; });

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);

    } catch(e) {
      console.log(e);
      res.status(200).json([]);
    }

    return;
  }

  var html = "...SEMUA HTML ANDA TETAP SAMA...<script>var M=..."; // (tidak saya ubah)

  // 🔥 HANYA BAGIAN INI DIUBAH (FILTER DROPDOWN)

  var scriptFix = `
  var C=[],R={};
  fetch('/api/project-control?action=clients')
  .then(function(r){return r.json();})
  .then(function(d){

    C=d;

    ['antrian','pelunasan','pendampingan','selesai'].forEach(function(t){

      var s = document.getElementById('sel-' + t);
      if(!s) return;

      s.innerHTML = '<option value="">Pilih client...</option>';

      var mapStatus = {
        antrian: "Antrian",
        pelunasan: "Menunggu Pelunasan",
        pendampingan: "Pendampingan",
        selesai: "Selesai"
      };

      C.forEach(function(c){

        var statusClient = (c.status || '').toLowerCase();
        var statusTarget = mapStatus[t].toLowerCase();

        if (!statusClient.includes(statusTarget)) return;

        var o = document.createElement('option');
        o.value = c.nama;
        o.textContent = c.nama + ' - ' + c.nim;
        s.appendChild(o);

      });

    });

  })
  .catch(function(){});
  `;

  html = html.replace("var C=[],R={};", scriptFix);

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html);
};
