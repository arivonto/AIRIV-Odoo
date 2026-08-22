async function test() {
  const authPayload = {
    jsonrpc: "2.0", method: "call",
    params: { service: 'common', method: 'authenticate', args: ['OdooAIRIV', 'admin', 'admin', {}] },
    id: 1
  };
  const authRes = await fetch('https://odoo-api.airiv.id/jsonrpc', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(authPayload)
  });
  console.log(await authRes.json());
}
test();
