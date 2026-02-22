export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  const rows = data.results;

  let revenue = 0;
  let outstanding = 0;
  let active = 0;
  let queue = 0;

  rows.forEach(row => {
    const props = row.properties;
    const cardType = props["Card Type"]?.select?.name;

    if (cardType === "Revenue") {
      revenue = props["Total Pendapatan"]?.rollup?.number || 0;
    }
    if (cardType === "Outstanding") {
      outstanding = props["Total Outstanding"]?.rollup?.number || 0;
    }
    if (cardType === "Active") {
      active = props["Count Project Aktif"]?.rollup?.number || 0;
    }
    if (cardType === "Queue") {
      queue = props["Count Queue"]?.rollup?.number || 0;
    }
  });

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <div style="background:#0f172a;color:white;padding:30px;border-radius:18px;font-family:sans-serif;display:flex;justify-content:space-between;gap:20px">
      <div><h4>Total Revenue</h4><h1>Rp ${revenue.toLocaleString()}</h1></div>
      <div><h4>Outstanding</h4><h1>Rp ${outstanding.toLocaleString()}</h1></div>
      <div><h4>Active</h4><h1>${active}</h1></div>
      <div><h4>Queue</h4><h1>${queue}</h1></div>
    </div>
  `);
}
