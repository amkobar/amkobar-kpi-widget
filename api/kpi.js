module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const projectDbId = "310efe1d1acf80ad861fecc7567b10c9";

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `https://api.notion.com/v1/databases/${projectDbId}/query`,
    { method: "POST", headers, body: JSON.stringify({}) }
  );
  const data = await response.json();
  const props = data.results[0]?.properties || {};

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    revenue_closed: props["Revenue Closed"],
    sisa_pembayaran: props["Sisa Pembayaran"],
    revenue_tahun_ini: props["Revenue Tahun Ini"],
    harga_netto: props["Harga Netto"],
  });
}
