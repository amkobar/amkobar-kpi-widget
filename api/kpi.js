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
  <body style="margin:0;background:#0f1115;overflow:hidden;">

    <div style="
      width:100%;
      max-width:100%;
      box-sizing:border-box;
      padding:24px 28px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:32px;

        background:linear-gradient(135deg,#0c1b2f,#0e2440);
        border-radius:16px;
        padding:28px 32px;

        border:1px solid rgba(255,255,255,0.04);
        box-shadow:0 15px 40px rgba(0,0,0,0.5);

        width:100%;
        box-sizing:border-box;
      ">

        ${card("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
        ${divider()}
        ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${divider()}
        ${card("Active", active)}
        ${divider()}
        ${card("Queue", queue)}

      </div>

    </div>

  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div style="flex:1;text-align:left;">
        <div style="
          font-size:11px;
          letter-spacing:1.2px;
          text-transform:uppercase;
          color:#5da2ff;
          margin-bottom:8px;
        ">
          ${label}
        </div>

        <div style="
          font-size:34px;
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
        height:40px;
        background:rgba(255,255,255,0.08);
      "></div>
    `;
  }
}
