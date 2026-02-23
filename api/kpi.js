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
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      padding:40px 0;
      max-width:1200px;
      margin:auto;
    ">

      <!-- HERO CARD -->
      <div style="
        padding:38px 44px;
        border-radius:22px;
        background:#1f1f1f;
        border:1px solid rgba(56,125,201,0.15);
        box-shadow:
  0 20px 40px rgba(0,0,0,0.45),
  0 5px 15px rgba(0,0,0,0.35);
        margin-bottom:36px;
      ">

        <div style="
          font-size:12px;
          letter-spacing:1.5px;
          text-transform:uppercase;
          color:#387dc9;
          margin-bottom:18px;
        ">
          Total Revenue
        </div>

        <div style="
          font-size:52px;
          font-weight:700;
          color:#ffffff;
        ">
          Rp ${revenue.toLocaleString("id-ID")}
        </div>

      </div>

      <!-- SUPPORTING ROW -->
      <div style="
        display:flex;
        gap:28px;
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
        padding:30px;
        border-radius:20px;
        background:#1f1f1f;
        border:1px solid rgba(56,125,201,0.12);
        box-shadow:
  0 18px 35px rgba(0,0,0,0.4),
  0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.25s ease;
      ">

        <div style="
          font-size:11px;
          letter-spacing:1.3px;
          text-transform:uppercase;
          color:#387dc9;
          margin-bottom:14px;
        ">
          ${label}
        </div>

        <div style="
          font-size:30px;
          font-weight:600;
          color:#ffffff;
        ">
          ${value}
        </div>

      </div>
    `;
  }
}
