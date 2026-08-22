
const BASE_URL = 'https://odoo-api.airiv.id';

async function test() {
  const authPayload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "authenticate",
      args: ["OdooAIRIV", "SportAcademy@odoo.airiv.id", "SAClient", {}]
    },
    id: 1
  };

  let res = await fetch(`${BASE_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authPayload)
  });
  let data = await res.json();
  console.log("Auth:", JSON.stringify(data));
  const uid = data.result;

  const kwPayload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [
        "OdooAIRIV", uid, "SAClient", "res.users", "search_read", [[["id", "=", uid]]], {"fields": ["id", "name"], "limit": 50}
      ]
    },
    id: 2
  };
  res = await fetch(`${BASE_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kwPayload)
  });
  data = await res.json();
  console.log("SearchRead:", JSON.stringify(data));
}
test();
