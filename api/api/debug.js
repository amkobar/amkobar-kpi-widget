module.exports = async function handler(req, res) {
  var resp = await fetch(
    "https://api.notion.com/v1/databases/310efe1d-1acf-80ad-861f-ecc7567b10c9",
    {
      headers: {
        "Authorization": "Bearer " + process.env.NOTION_TOKEN,
        "Notion-Version": "2022-06-28"
      }
    }
  );
  var data = await resp.json();
  
  // Ambil semua property name + type
  var props = {};
  for (var key in data.properties) {
    props[key] = data.properties[key].type;
  }
  
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(props);
};
