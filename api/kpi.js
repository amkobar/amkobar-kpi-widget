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

      if (props["Total Pendapatan"]?.rollup?.number) {
        revenue = props["Total Pendapatan"].rollup.number || 0;
      }

      if (props["Total Outstanding"]?.rollup?.number) {
        outstanding = props["Total Outstanding"].rollup.number || 0;
      }

      if (props["Count Project Aktif"]?.rollup?.number) {
        active = props["Count Project Aktif"].rollup.number || 0;
      }

      if (props["Count Queue"]?.rollup?.number) {
        queue = props["Count Queue"].rollup.number || 0;
      }
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
      padding:22px 40px;
      box-sizing:border-box;
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
      color:white;
      background:#1E3A8A;
    ">

      <div>
        <div style="font-size:13px;opacity:0.75;letter-spacing:0.5px;">
          TOTAL REVENUE
        </div>
        <div style="font-size:28px;font-weight:600;margin-top:6px;">
          Rp ${revenue.toLocaleString("id-ID")}
        </div>
      </div>

      <div>
        <div style="font-size:13px;opacity:0.75;letter-spacing:0.5px;">
          OUTSTANDING
        </div>
        <div style="font-size:28px;font-weight:600;margin-top:6px;">
          Rp ${outstanding.toLocaleString("id-ID")}
        </div>
      </div>

      <div>
        <div style="font-size:13px;opacity:0.75;letter-spacing:0.5px;">
          ACTIVE
        </div>
        <div style="font-size:28px;font-weight:600;margin-top:6px;">
          ${active}
        </div>
      </div>

      <div>
        <div style="font-size:13px;opacity:0.75;letter-spacing:0.5px;">
          QUEUE
        </div>
        <div style="font-size:28px;font-weight:600;margin-top:6px;">
          ${queue}
        </div>
      </div>

    </div>

  </body>
  </html>
  `);
}
