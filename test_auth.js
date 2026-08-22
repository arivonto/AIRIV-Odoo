const { fetch } = require('node-fetch'); // wait, fetch is global in node 18
async function test() {
  const payload = {
    jsonrpc: "2.0", method: "call",
    params: { service: 'common', method: 'authenticate', args: ['OdooAIRIV', 'arivonto@gmail.com', 'admin', {}] },
    id: 1
  };
  const res = await fetch('https://odoo-api.airiv.id/jsonrpc', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  console.log(await res.json());
}
test();
