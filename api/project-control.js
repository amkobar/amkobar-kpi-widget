import fetch from "node-fetch";

module.exports = async function handler(req, res) {
  if (req.query && req.query.action === "clients") {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      const projectDbId = "310efe1d-1acf-80ad-861f-ecc7567b10c9";

      if (!notionToken) {
        res.status(500).json({ error: "NOTION_TOKEN environment variable not set" });
        return;
      }

      const headers = {
        Authorization: "Bearer " + notionToken,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      };

      function getProp(page, key) {
        const p = page.properties[key];
        if (!p) return "";
        if (p.type === "title")
          return (p.title || []).map((t) => t.plain_text).join("") || "";
        if (p.type === "rich_text")
          return (p.rich_text || []).map((t) => t.plain_text).join("") || "";
        if (p.type === "select") return (p.select && p.select.name) || "";
        if (p.type === "number") return p.number != null ? p.number : 0;
        if (p.type === "checkbox") return p.checkbox || false;
        if (p.type === "date") return (p.date && p.date.start) || "";
        if (p.type === "formula") {
          const f = p.formula;
          if (f.type === "number") return f.number != null ? f.number : 0;
          if (f.type === "string") return f.string || "";
        }
        if (p.type === "rollup") {
          const r = p.rollup;
          if (r.type === "number") return r.number != null ? r.number : 0;
          if (r.type === "array" && r.array && r.array[0]) {
            const first = r.array[0];
            if (first.type === "select") return (first.select && first.select.name) || "";
            if (first.type === "number") return first.number != null ? first.number : 0;
          }
        }
        return "";
      }

      let all = [];
      let cursor;

      while (true) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;

        const resp = await fetch(
          "https://api.notion.com/v1/databases/" + projectDbId + "/query",
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
          }
        );

        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error("Notion API error: " + resp.status + " " + errorText);
        }

        const data = await resp.json();

        all = all.concat(data.results || []);
        if (!data.has_more) break;
        cursor = data.next_cursor;
      }

      const clients = all
        .map((p) => ({
          nama: getProp(p, "Nama Client"),
          nim: getProp(p, "NIM/NPM"),
          jenis: getProp(p, "Jenis Layanan"),
          aplikasi: getProp(p, "Aplikasi"),
          kodeAkses: getProp(p, "Kode Akses"),
          sisa: getProp(p, "Sisa Pembayaran"),
          statusProject: getProp(p, "Status Project"),
        }))
        .filter((c) => c.nama);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "s-maxage=60");

      res.status(200).json(clients);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(400).json({ error: "Bad Request" });
  }
};
