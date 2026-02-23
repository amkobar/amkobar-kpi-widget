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
      * { box-sizing: border-box; }

      body {
        margin:0;
        padding:24px 14px;
        background:#191919;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
        overflow-x:hidden;
      }

      .kpi-row {
        display:grid;
        gap:18px;
      }

      .card {
        padding:22px;
        border-radius:18px;
        background:#21252b;
        border:1px solid rgba(56,125,201,0.12);
        box-shadow:
          0 10px 20px rgba(0,0,0,0.35),
          0 3px 8px rgba(0,0,0,0.25),
          inset 0 1px 0 rgba(255,255,255,0.04);
      }

      .label {
        font-size:10px;
        letter-spacing:1.4px;
        text-transform:uppercase;
        color:#387dc9;
        margin-bottom:10px;
      }

      .value {
        font-size:24px;
        font-weight:600;
        color:#ffffff;
        word-break: break-word;
      }
    </style>
  </head>
  <body>

    <div class="kpi-row" id="kpiGrid">
      ${card("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
      ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
      ${card("Active", active)}
      ${card("Queue", queue)}
    </div>

    <script>
      function setColumns() {
        const width = window.innerWidth;
        const grid = document.getElementById("kpiGrid");

        if (width <= 800) {
          grid.style.gridTemplateColumns = "repeat(2, 1fr)";
        } else {
          grid.style.gridTemplateColumns = "repeat(4, 1fr)";
        }
      }

      setColumns();
      window.addEventListener("resize", setColumns);
    </script>

  </body>
  </html>
  `);

  function card(label, value) {
    return `
      <div class="card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </div>
    `;
  }
}
