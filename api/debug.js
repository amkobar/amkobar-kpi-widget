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
  
  var props = {};
  for (var key in data.properties) {
    var p = data.properties[key];
    var info = { type: p.type };
    
    if (p.type === "select" && p.select && p.select.options) {
      info.options = p.select.options.map(function(o) { 
        return o.name; 
      });
    }
    if (p.type === "status" && p.status && p.status.options) {
      info.options = p.status.options.map(function(o) { 
        return o.name; 
      });
    }
    props[key] = info;
  }
  
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(props);
};
