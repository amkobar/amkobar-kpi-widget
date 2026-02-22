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
      display:flex;
      align-items:center;
      padding:26px 48px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      background:#14161b;
      border-radius:16px;
      border:1px solid rgba(255,255,255,0.04);
      box-shadow:0 0 0 1px rgba(59,130,246,0.08);
    ">

      ${section("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
      ${divider()}
      ${section("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
      ${divider()}
      ${section("Active", active)}
      ${divider()}
      ${section("Queue", queue)}

    </div>

  </body>
  </html>
  `);

  function section(label, value) {
    return `
      <div style="flex:1;">
        <div style="
          font-size:11px;
          letter-spacing:1.2px;
          text-transform:uppercase;
          color:#6ea8ff;
          margin-bottom:12px;
        ">
          ${label}
        </div>
        <div style="
          font-size:40px;
          font-weight:600;
          color:white;
          line-height:1;
        ">
          ${value}
        </div>
      </div>
    `;
  }

  function divider() {
    return `
      <div style="
        width:1px;
        height:48px;
        margin:0 36px;
        background:rgba(255,255,255,0.06);
      "></div>
    `;
  }
}
