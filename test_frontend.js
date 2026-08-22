fetch('http://localhost:3000/api/web/menu/load_menus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-odoo-url': 'http://localhost:8069'
  },
  body: JSON.stringify({})
}).then(r => {
  console.log('Status:', r.status);
  return r.text();
}).then(t => console.log('Response:', t.substring(0, 100))).catch(e => console.error(e));
