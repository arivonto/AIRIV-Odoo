async function test() {
  // authenticate
  const authPayload = {
    jsonrpc: "2.0", method: "call",
    params: { service: 'common', method: 'authenticate', args: ['OdooAIRIV', 'SportAcademy@odoo.airiv.id', 'SAClient', {}] },
    id: 1
  };
  const authRes = await fetch('https://odoo-api.airiv.id/jsonrpc', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(authPayload)
  });
  const authData = await authRes.json();
  const uid = authData.result;
  
  // query res.users
  const userPayload = {
    jsonrpc: "2.0", method: "call",
    params: { service: 'object', method: 'execute_kw', args: ['OdooAIRIV', uid, 'SAClient', 'res.users', 'search_read', [[]], {limit: 5}] },
    id: 2
  };
  const userRes = await fetch('https://odoo-api.airiv.id/jsonrpc', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userPayload)
  });
  const userData = await userRes.json();
  console.log("USERS:", JSON.stringify(userData).substring(0, 500));
}
test();
