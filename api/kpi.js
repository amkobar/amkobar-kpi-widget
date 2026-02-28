export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      { method: "POST", headers }
    );
    const data = await response.json();
    
    // Tampilkan semua nama property yang ada
    const props = data.results[0]?.properties || {};
    const propNames = Object.keys(props);
    
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ 
      total_results: data.results.length,
      property_names: propNames,
      raw: props
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
