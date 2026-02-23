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
    <style>
      html, body {
        margin:0;
        padding:0;
        background:#191919;
      }
    </style>
  </head>
  <body>

    <div style="
      padding:24px 8px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
    ">

      <!-- HERO CARD -->
      <div style="
        padding:34px 40px;
        border-radius:22px;
        background:linear-gradient(145deg,#1f1f1f,#242424);
        border:1px solid rgba(56,125,201,0.25);
        box-shadow:
          0 25px 60px rgba(0,0,0,0.7),
          0 0 40px rgba(56,125,201,0.15);
        margin-bottom:26px;
      ">

        <div style="
          font-size:12px;
          letter-spacing:1.4px;
          text-transform:uppercase;
          color:#387dc9;
          margin-bottom:16px;
        ">
          Total Revenue
        </div>

        <div style="
          font-size:48px;
          font-weight:700;
          color:white;
        ">
          Rp ${revenue.toLocaleString("id-ID")}
        </div>

      </div>

      <!-- SUPPORTING CARDS -->
      <div style="
        display:flex;
        gap:24px;
      ">

        ${smallCard("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${smallCard("Active", active)}
        ${smallCard("Queue", queue)}

      </div>

    </div>

  </body>
  </html>
  `);

  function smallCard(label, value) {
    return `
      <div style="
        flex:1;
        padding:26px 28px;
        border-radius:18px;
        background:linear-gradient(145deg,#1f1f1f,#242424);
        border:1px solid rgba(56,125,201,0.18);
        box-shadow:0 15px 35px rgba(0,0,0,0.6);
      ">

        <div style="
          font-size:11px;
          letter-spacing:1.3px;
          text-transform:uppercase;
          color:#387dc9;
          margin-bottom:12px;
        ">
          ${label}
        </div>

        <div style="
          font-size:28px;
          font-weight:600;
          color:white;
        ">
          ${value}
        </div>

      </div>
    `;
  }
}
