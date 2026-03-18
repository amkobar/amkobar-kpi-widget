module.exports = async function handler(req, res) {

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

      if (p.type === "title") return (p.title || []).map(t => t.plain_text).join("");
      if (p.type === "rich_text") return (p.rich_text || []).map(t => t.plain_text).join("");
      if (p.type === "select") return p.select ? p.select.name : "";
      if (p.type === "status") return p.status ? p.status.name : "";
      if (p.type === "number") return p.number ?? 0;
      if (p.type === "checkbox") return p.checkbox ?? false;

      if (p.type === "date") return p.date ? p.date.start : "";

      if (p.type === "formula") {
        const f = p.formula;
        if (f.type === "number") return f.number ?? 0;
        if (f.type === "string") return f.string ?? "";
      }

      if (p.type === "rollup") {
        const r = p.rollup;
        if (r.type === "number") return r.number ?? 0;

        if (r.type === "array" && r.array && r.array[0]) {
          const first = r.array[0];
          if (first.type === "select") return first.select?.name ?? "";
          if (first.type === "number") return first.number ?? 0;
        }
      }

      return "";
    }

    try {

      let all = [];
      let cursor;

      while (true) {

        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;

        const resp = await fetch(
          "https://api.notion.com/v1/databases/" + projectDbId + "/query",
          {
            method: "POST",
            headers,
            body: JSON.stringify(body)
          }
        );

        const data = await resp.json();

        all = all.concat(data.results || []);

        if (!data.has_more) break;

        cursor = data.next_cursor;
      }

      const clients = all.map(p => ({
        nama: getProp(p, "Nama Client"),
        nim: getProp(p, "NIM/NPM"),
        jenis: getProp(p, "Jenis Layanan"),
        aplikasi: getProp(p, "Aplikasi"),
        kodeAkses: getProp(p, "Kode Akses"),
        sisa: getProp(p, "Sisa Pembayaran"),
        status: getProp(p, "Status Project")
      }))
      .filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");

      res.status(200).json(clients);

    } catch (e) {
      res.status(200).json([]);
    }

    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="background:#191919;color:white;font-family:sans-serif">

<script>

var C = [];

fetch('/api/project-control?action=clients')
.then(r => r.json())
.then(d => {

  C = d;

  ['antrian','pelunasan','pendampingan','selesai'].forEach(function(t){

    const s = document.getElementById('sel-'+t);
    if(!s) return;

    C.filter(function(c){

      if(t === 'antrian') return c.status === 'Antrian';

      if(t === 'pelunasan') return c.status === 'Menunggu Pelunasan';

      if(t === 'pendampingan') return c.status === 'Pendampingan';

      if(t === 'selesai') return c.status === 'Selesai';

      return false;

    }).forEach(function(c){

      const o = document.createElement('option');
      o.value = c.nama;
      o.textContent = c.nama + ' - ' + c.nim;

      s.appendChild(o);

    });

  });

})
.catch(()=>{});

</script>

</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");

  res.status(200).send(html);

};
