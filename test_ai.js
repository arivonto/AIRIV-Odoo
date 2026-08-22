fetch('http://localhost:3000/api/consultant/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages: [{ role: 'user', parts: [{ text: 'Hello' }] }] })
}).then(r => r.json()).then(t => console.log(t)).catch(e => console.error(e));
