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
<html>
<body style="margin:0;padding:0;background:transparent;">
  <div style="
    width:100%;
    padding:28px 48px;
    box-sizing:border-box;
    display:flex;
    justify-content:space-between;
    align-items:center;
    color:white;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
    background:linear-gradient(135deg,#2563EB,#1E40AF);
  ">

    <div style="text-align:left;">
      <div style="font-size:14px;opacity:0.8;">Total Revenue</div>
      <div style="font-size:32px;font-weight:600;margin-top:6px;">
        Rp ${revenue.toLocaleString()}
      </div>
    </div>

    <div style="text-align:left;">
      <div style="font-size:14px;opacity:0.8;">Outstanding</div>
      <div style="font-size:32px;font-weight:600;margin-top:6px;">
        Rp ${outstanding.toLocaleString()}
      </div>
    </div>

    <div style="text-align:left;">
      <div style="font-size:14px;opacity:0.8;">Active</div>
      <div style="font-size:32px;font-weight:600;margin-top:6px;">
        ${active}
      </div>
    </div>

    <div style="text-align:left;">
      <div style="font-size:14px;opacity:0.8;">Queue</div>
      <div style="font-size:32px;font-weight:600;margin-top:6px;">
        ${queue}
      </div>
    </div>

  </div>
</body>
</html>
`);
}
