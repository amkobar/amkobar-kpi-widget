export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = "310efe1d1acf80ad861fecc7567b10c9";

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  let totalRevenue = 0;
  let totalSelesai = 0;
  let revenueTahunIni = 0;
  let selesaiTahunIni = 0;
  let outstanding = 0;
  let antrian = 0;

  try {
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const body = cursor ? { start_cursor: cursor } : {};
      const response = await fetch(
        `https://api.notion.com/v1/databases/${projectDbId}/query`,
        { method: "POST", headers, body: JSON.stringify(body) }
      );
      const data = await response.json();

      data.results.forEach((page) => {
        const props = page.properties;
        const status = props["Status Project"]?.select?.name || "";
        const revClosed = props["Revenue Closed"]?.formula?.number || 0;
        const revTahun = props["Revenue Tahun Ini"]?.formula?.number || 0;
        const selesaiTahun = props["Selesai Tahun Ini"]?.formula?.number || 0;
        const sisa = props["Sisa Pembayaran"]?.formula?.number || 0;
        const isAntrian = props["Is Antrian"]?.formula?.number || 0;

        totalRevenue += revClosed;
        totalSelesai += status === "Selesai" ? 1 : 0;
        revenueTahunIni += revTahun;
        selesaiTahunIni += selesaiTahun;
        outstanding += sisa;
        antrian += isAntrian;
      });

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }
  } catch (err) {
    console.error(err);
  }

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      html, body { margin:0; padding:0; background:#191919; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; }
      .wrapper { padding:40px 20px; }
      .section-label { font-size:10px; letter-spacing:1.6px; text-transform:uppercase; color:#4a5568; margin-bottom:14px; margin-top:28px; }
      .section-label:first-child { margin-top:0; }
      .kpi-row { display:grid; gap:20px; }
      .row-2 { grid-template-columns: repeat(2, 1fr); }
      .row-4 { grid-tem
