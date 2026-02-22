export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  let revenue = 0;
  let outstanding = 0;
  let active = 0;
  let queue = 0;

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      { method: "POST", headers }
    );

    const data = await response.json();

    data.results.forEach((page) => {
      const props = page.properties;
      revenue = props["Total Pendapatan"]?.rollup?.number || revenue;
      outstanding = props["Total Outstanding"]?.rollup?.number || outstanding;
      active = props["Count Project Aktif"]?.rollup?.number || active;
      queue = props["Count Queue"]?.rollup?.number || queue;
    });
  } catch (err) {
    console.error(err);
  }

  res.setHeader("Content-Type", "text/html");

  res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;background:#0f1115;">

    <div style="
      width:100%;
      padding:36px 52px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
    ">

      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:40px;

        background:linear-gradient(145deg,#0c1626,#0f1e34);
        border-radius:18px;

        padding:42px 48px;

        box-shadow:
          0 20px 60px rgba(0,0,0,0.55),
          inset 0 1px 0 rgba(255,255,255,0.04);

        border:1px solid rgba(255,255,255,0.04);
      ">

        ${card("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
        ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${card("Active", active)}
        ${card("Queue", queue)}

      </div>

    </div>

  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div style="flex:1; text-align:left; position:relative;">

        <div style="
          font-size:12px;
          letter-spacing:1.4px;
          text-transform:uppercase;
          color:#5da2ff;
          margin-bottom:14px;
        ">
          ${label}
        </div>

        <div style="
          font-size:40px;
          font-weight:600;
          color:#ffffff;
        ">
          ${value}
        </div>

      </div>
    `;
  }
}
