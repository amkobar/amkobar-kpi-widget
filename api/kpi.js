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
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;
}

.wrapper {
  padding:20px 14px 10px 14px;
}

.kpi-row {
  display:grid;
  grid-template-columns: repeat(4, 1fr);
  gap:18px;
}

.card {
  padding:20px;
  border-radius:16px;
  background:#21252b;
  border:1px solid rgba(56,125,201,0.10);
  box-shadow:
    0 6px 14px rgba(0,0,0,0.30),
    0 2px 6px rgba(0,0,0,0.20),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.label {
  font-size:10px;
  letter-spacing:1.2px;
  text-transform:uppercase;
  color:#387dc9;
  margin-bottom:8px;
}

.value {
  font-size:22px;
  font-weight:600;
  color:#ffffff;
}

/* Tablet */
@media (max-width: 1024px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Android */
@media (max-width: 600px) {

  .wrapper {
    padding:16px 12px 8px 12px;
  }

  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
    gap:14px;
  }

  .card {
    padding:16px;
    border-radius:14px;
  }

  .value {
    font-size:20px;
  }
}

    </style>
  </head>
  <body>

    <div class="wrapper">
      <div class="kpi-row">
        ${card("Total Revenue", "Rp " + revenue.toLocaleString("id-ID"))}
        ${card("Outstanding", "Rp " + outstanding.toLocaleString("id-ID"))}
        ${card("Active", active)}
        ${card("Queue", queue)}
      </div>
    </div>

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
