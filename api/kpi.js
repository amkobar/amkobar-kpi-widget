export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = "310efe1d1acf80ad861fecc7567b10c9";

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${projectDbId}/query`,
      { method: "POST", headers, body: JSON.stringify({}) }
    );
    const data = await response.json();
    const firstPage = data.results[0];
    const props = firstPage?.properties || {};
    
    // Tampilkan detail property yang kita butuhkan
    const debug = {
      total_results: data.results.length,
      status_project: props["Status Project"],
      revenue_closed: props["Revenue Closed"],
      harga_netto: props["Harga Netto"],
      sisa_pembayaran: props["Sisa Pembayaran"],
      revenue_tahun_ini: props["Revenue Tahun Ini"],
      selesai_tahun_ini: props["Selesai Tahun Ini"],
      is_antrian: props["Is Antrian"],
    };

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(debug);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
