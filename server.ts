import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for Odoo Proxy
  app.post("/api/jsonrpc", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: { message: "Missing x-odoo-url header" } });
    }

    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/jsonrpc`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. The tunnel may be offline, expired, or require Cloudflare Access verification. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(502).json({
        error: {
          message: `Proxy error: Could not reach Odoo at ${targetUrl}. Tunnel may be offline or unreachable. Details: ${error.message}`,
        },
      });
    }
  });

  app.post("/api/web/session/authenticate", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: { message: "Missing x-odoo-url header" } });
    }

    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/web/session/authenticate`;
      // Odoo relies on cookies for session_id. Fetch API doesn't forward them to the client automatically in this proxy,
      // but Odoo returns session_id in the JSON response body under result.session_id which we can extract!
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(502).json({
        error: {
          message: `Proxy error: Could not reach Odoo at ${targetUrl}. Tunnel may be offline or unreachable. Details: ${error.message}`,
        },
      });
    }
  });

  app.post("/api/web/action/load", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] as string;
    const sessionId = req.headers["x-odoo-session-id"] as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: { message: "Missing x-odoo-url header" } });
    }

    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/web/action/load`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(sessionId ? { "Cookie": `session_id=${sessionId}` } : {})
        },
        body: JSON.stringify(req.body),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(502).json({
        error: {
          message: `Proxy error: Could not reach Odoo at ${targetUrl}. Tunnel may be offline or unreachable. Details: ${error.message}`,
        },
      });
    }
  });

  app.post("/api/web/menu/load_menus", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] as string;
    const sessionId = req.headers["x-odoo-session-id"] as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: { message: "Missing x-odoo-url header" } });
    }

    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/web/menu/load_menus`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(sessionId ? { "Cookie": `session_id=${sessionId}` } : {})
        },
        body: JSON.stringify(req.body),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(502).json({
        error: {
          message: `Proxy error: Could not reach Odoo at ${targetUrl}. Tunnel may be offline or unreachable. Details: ${error.message}`,
        },
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
