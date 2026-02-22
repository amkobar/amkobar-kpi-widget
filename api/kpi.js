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
      {
        method: "POST",
        headers: headers,
      }
    );

    const data = await response.json();

    data.results.forEach((page) => {
      const props = page.properties;

      revenue = props["Total Pendapatan"]?.rollup?.number || revenue;
      outstanding = props["Total Outstanding"]?.rollup?.number || outstanding;
      active = props["Count Project Aktif"]?.rollup?.number || active;
      queue = props["Count Queue"]?.rollup?.number || queue;
    });
  } catch (error) {
    console.error(error);
  }

  res.setHeader("Content-Type", "text/html");

  res.status(200).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;background:#0B1220;">
    
    <div style="
      display:flex;
      padding:28px 40px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      background:#111827;
      border-radius:14px;
      border:1px solid rgba(255,255,255,0.06);
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
          letter-spacing:1px;
          text-transform:uppercase;
          color:#60A5FA;
          margin-bottom:10px;
        ">
          ${label}
        </div>
        <div style="
          font-size:36px;
          font-weight:600;
          color:white;
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
        margin:0 28px;
        background:rgba(255,255,255,0.08);
      "></div>
    `;
  }
}
