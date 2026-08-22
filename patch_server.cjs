const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const proxyRoute = `
  app.all("/api/odoo/jsonrpc", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] || 'https://odoo-api.airiv.id';
    
    try {
      const endpoint = \`\${targetUrl.replace(/\\/$/, "")}/jsonrpc\`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(req.body),
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: { message: \`Proxy error: Odoo returned HTML instead of JSON. Preview: \${responseText.slice(0, 50)}...\` }
        });
      }
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: { message: \`Proxy error: Could not reach Odoo at \${targetUrl}. Details: \${error.message}\` },
      });
    }
  });

  app.all("/api/odoo/web/dataset/call_kw", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] || 'https://odoo-api.airiv.id';
    try {
      const endpoint = \`\${targetUrl.replace(/\\/$/, "")}/web/dataset/call_kw\`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(req.body),
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: { message: \`Proxy error: Odoo returned HTML instead of JSON.\` }
        });
      }
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: { message: \`Proxy error: \${error.message}\` },
      });
    }
  });
`;

// Insert the proxyRoute before the vite middleware setup
const viteIndex = serverCode.indexOf('// Vite middleware for development');
if (viteIndex !== -1) {
    serverCode = serverCode.substring(0, viteIndex) + proxyRoute + serverCode.substring(viteIndex);
    fs.writeFileSync('server.ts', serverCode);
    console.log("Patched server.ts with Odoo proxy routes.");
} else {
    console.log("Could not find vite middleware setup in server.ts");
}
