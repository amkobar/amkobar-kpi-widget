module.exports = async function handler(req, res) {
  try {
    const notionToken = process.env.NOTION_TOKEN;
    const projectDbId = process.env.DATABASE_ID;

    if (!notionToken || !projectDbId) {
      res.status(500).json({ error: "NOTION_TOKEN or DATABASE_ID environment variables are missing." });
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
        if (p.type === "date") return p.date && p.date.start ? p.date.start : "";
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

      let allResults = [];
      let cursor;

      do {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;

        const response = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Error fetching Notion database: ${response.status} - ${err}`);
        }

        const data = await response.json();
        allResults = allResults.concat(data.results);
        cursor = data.has_more ? data.next_cursor : null;

      } while(cursor);

      const clients = allResults.map(p => ({
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
      res.status(200).json(clients);
      return;
    }

    // Simple frontend minimal untuk test halaman, bisa dikembangkan
    const html = `
      <!DOCTYPE html><html>
      <head><title>AMKOBAR Project Control</title></head>
      <body>
        <h1>AMKOBAR Project Control</h1>
        <p>API berjalan dengan baik.</p>
      </body></html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);

  } catch (error) {
    console.error("Error in project-control handler:", error);
    // Kirim detail error buat debugging di Vercel logs
    res.status(500).json({ error: "Internal Server Error", detail: error.message });
  }
};
