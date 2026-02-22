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
      gap:18px;
      padding:18px 24px;
      box-sizing:border-box;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
    ">

      ${card("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
      ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
      ${card("Active", active)}
      ${card("Queue", queue)}

    </div>

  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div style="
        flex:1;
        padding:20px 22px;
        border-radius:10px;
        background:#111827;
        border:1px solid rgba(255,255,255,0.05);
        position:relative;
      ">
        <div style="
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:3px;
          background:#3B82F6;
          border-top-left-radius:10px;
          border-top-right-radius:10px;
        "></div>

        <div style="
          font-size:12px;
          letter-spacing:0.8px;
          text-transform:uppercase;
          color:#93C5FD;
          margin-bottom:10px;
        ">
          ${label}
        </div>

        <div style="
          font-size:32px;
          font-weight:600;
          color:white;
        ">
          ${value}
        </div>
      </div>
    `;
  }
}
