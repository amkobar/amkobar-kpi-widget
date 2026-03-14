module.exports = async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN
  const kpiDbId = "323efe1d1acf8086b106e632903c0b96"
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  }
  const response = await fetch(
    `https://api.notion.com/v1/databases/${kpiDbId}/query`,
    { method: "POST", headers, body: JSON.stringify({}) }
  )
  const data = await response.json()
  res.setHeader("Content-Type", "application/json")
  res.status(200).json(data)
}
