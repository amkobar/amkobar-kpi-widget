const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.query && req.query.action === 'clients') {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      if (!notionToken) throw new Error('Environment variable NOTION_TOKEN missing');

      const projectDbId = '310efe1d-1acf-80ad-861f-ecc7567b10c9';
      const headers = {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      };

      function getProp(page, key) {
        const p = page.properties[key];
        if (!p) return '';
        if (p.type === 'title') return (p.title || []).map(t => t.plain_text).join('') || '';
        if (p.type === 'select') return p.select?.name || '';
        if (p.type === 'rich_text') return (p.rich_text || []).map(t => t.plain_text).join('') || '';
        if (p.type === 'number') return p.number ?? 0;
        if (p.type === 'checkbox') return p.checkbox || false;
        if (p.type === 'date') return p.date?.start || '';
        return '';
      }

      let all = [];
      let cursor = undefined;

      while (true) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;

        const response = await fetch(`https://api.notion.com/v1/databases/${projectDbId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Notion API error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        all = all.concat(data.results ?? []);

        if (!data.has_more) break;
        cursor = data.next_cursor;
      }

      const clients = all.map(p => ({
        nama: getProp(p, 'Nama Client'),
        nim: getProp(p, 'NIM/NPM'),
        jenis: getProp(p, 'Jenis Layanan'),
        aplikasi: getProp(p, 'Aplikasi'),
        kodeAkses: getProp(p, 'Kode Akses'),
        sisa: getProp(p, 'Sisa Pembayaran'),
        statusProject: getProp(p, 'Status Project'),
      })).filter(c => c.nama);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json(clients);
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(400).json({ error: 'Invalid API action' });
  }
};
