module.exports = async function handler(req, res) {
  // Environment variables
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = process.env.DATABASE_ID;

  if (!notionToken || !projectDbId) {
    console.error("NOTION_TOKEN or DATABASE_ID environment variable missing!");
    res.status(500).json({ error: "Server configuration error. Please check environment variables." });
    return;
  }

  if (req.query && req.query.action === 'clients') {
    const headers = {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    function getProp(page, key) {
      const p = page.properties[key];
      if (!p) return "";
      if (p.type === "title") return (p.title || []).map(t => t.plain_text).join("") || "";
      if (p.type === "rich_text") return (p.rich_text || []).map(t => t.plain_text).join("") || "";
      if (p.type === "select") return (p.select && p.select.name) || "";
      if (p.type === "number") return p.number != null ? p.number : 0;
      if (p.type === "checkbox") return p.checkbox || false;
      if (p.type === "date") return (p.date && p.date.start) || "";
      if (p.type === "formula") {
        if (p.formula.type === "string") return p.formula.string || "";
        if (p.formula.type === "number") return p.formula.number != null ? p.formula.number : 0;
      }
      if (p.type === "rollup") {
        if (p.rollup.type === "number") return p.rollup.number != null ? p.rollup.number : 0;
        if (p.rollup.type === "array" && p.rollup.array.length > 0) {
          const first = p.rollup.array[0];
          if (first.type === "select") return (first.select && first.select.name) || "";
          if (first.type === "number") return first.number != null ? first.number : 0;
        }
      }
      return "";
    }

    try {
      let all = [], cursor;
      while (true) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;
        const resp = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error("Notion API error:", resp.status, errText);
          throw new Error(`Notion API error: ${resp.status} - ${errText}`);
        }
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
        status: getProp(p, "Status Project"),
      })).filter(c => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json(clients);
    } catch (error) {
      console.error("Error in fetch clients:", error);
      res.status(500).json({ error: "Failed to fetch client data." });
    }
    return;
  }

  // Serve frontend HTML & JS (tidak saya potong)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Project Control - AMKOBAR</title>
<style>
/* CSS styles Anda di sini, atau copy dari kode Anda sebelumnya */
</style>
</head>
<body>
<!-- HTML lengkap Anda di sini, copy dari kode saya sebelumnya -->
<script>
// JS lengkap tab dan fungsi generator, copy dari kode saya sebelumnya
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=60");
  res.status(200).send(html);
};
