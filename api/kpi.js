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
      gap:32px;
      padding:32px 48px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      background:#121417;
      border-radius:16px;
      border:1px solid rgba(255,255,255,0.035);
    ">

      <!-- HERO REVENUE -->
      <div style="flex:1.3;">
        <div style="
          font-size:12px;
          letter-spacing:1.2px;
          text-transform:uppercase;
          color:#5da2ff;
          margin-bottom:14px;
        ">
          Total Revenue
        </div>

        <div style="
          font-size:54px;
          font-weight:700;
          color:white;
          line-height:1;
        ">
          Rp ${revenue.toLocaleString("id-ID")}
        </div>
      </div>

      <!-- SUPPORTING METRICS -->
      <div style="
        flex:1;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        gap:24px;
      ">

        ${mini("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${mini("Active", active)}
        ${mini("Queue", queue)}

      </div>

    </div>

  </body>
  </html>
  `);

  function mini(label, value) {
    return `
      <div>
        <div style="
          font-size:11px;
          letter-spacing:1px;
          text-transform:uppercase;
          color:#5da2ff;
          margin-bottom:6px;
        ">
          ${label}
        </div>
        <div style="
          font-size:26px;
          font-weight:600;
          color:white;
        ">
          ${value}
        </div>
      </div>
    `;
  }
}
