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

      if (props["Total Pendapatan"]?.rollup?.number)
        revenue = props["Total Pendapatan"].rollup.number || 0;

      if (props["Total Outstanding"]?.rollup?.number)
        outstanding = props["Total Outstanding"].rollup.number || 0;

      if (props["Count Project Aktif"]?.rollup?.number)
        active = props["Count Project Aktif"].rollup.number || 0;

      if (props["Count Queue"]?.rollup?.number)
        queue = props["Count Queue"].rollup.number || 0;
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
  <body style="margin:0;padding:0;background:transparent;">
    
    <div style="
      width:100%;
      padding:26px 40px;
      box-sizing:border-box;
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      color:#E5E7EB;
      background:rgba(17,24,39,0.65);
      border:1px solid rgba(59,130,246,0.35);
      backdrop-filter:blur(6px);
    ">

      ${card("TOTAL REVENUE", "Rp " + revenue.toLocaleString("id-ID"))}
      ${card("OUTSTANDING", "Rp " + outstanding.toLocaleString("id-ID"))}
      ${card("ACTIVE", active)}
      ${card("QUEUE", queue)}

    </div>

  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div style="min-width:120px;">
        <div style="
          font-size:12px;
          letter-spacing:1px;
          text-transform:uppercase;
          color:#60A5FA;
          margin-bottom:8px;
        ">
          ${label}
        </div>
        <div style="
          font-size:30px;
          font-weight:600;
          color:white;
        ">
          ${value}
        </div>
      </div>
    `;
  }
}
