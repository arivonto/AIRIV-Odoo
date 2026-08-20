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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(req.body),
      });

      const setCookie = response.headers.get('set-cookie');
      let extractedSessionId = null;
      if (setCookie) {
        const match = setCookie.match(/session_id=([^;]+)/);
        if (match) extractedSessionId = match[1];
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        if (extractedSessionId && data.result) {
           data.result.session_id = data.result.session_id || extractedSessionId;
        }
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. The tunnel may be offline, expired, or require Cloudflare Access verification. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.status(response.status).json(data);
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(req.body),
      });

      const setCookie = response.headers.get('set-cookie');
      let extractedSessionId = null;
      if (setCookie) {
        const match = setCookie.match(/session_id=([^;]+)/);
        if (match) extractedSessionId = match[1];
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        if (extractedSessionId && data.result) {
           data.result.session_id = data.result.session_id || extractedSessionId;
        }
      } catch (e) {
        return res.status(502).json({
          error: {
            message: `Proxy error: Odoo tunnel returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      res.status(response.status).json(data);
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
      
      res.status(response.status).json(data);
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
      
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(502).json({
        error: {
          message: `Proxy error: Could not reach Odoo at ${targetUrl}. Tunnel may be offline or unreachable. Details: ${error.message}`,
        },
      });
    }
  });

  app.post("/api/consultant/chat", async (req, res) => {
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const { messages } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: messages,
        config: {
          systemInstruction: `Anda adalah Konsultan Bisnis AI untuk Odoo ERP yang berbicara dalam bahasa Indonesia.
Anda menganalisis kebutuhan bisnis pengguna dan merekomendasikan modul standar Odoo mana yang harus mereka aktifkan atau nonaktifkan.

Anda HARUS merespons dalam format JSON.
JSON Anda harus berisi:
1. "reply": Balasan string percakapan yang meminta detail lebih lanjut atau menjelaskan rekomendasi Anda.
2. "profileName": Nama singkat untuk konfigurasi yang disarankan (misal: "Toko Ritel", "Agensi Jasa", "Bengkel").
3. "modulesToActivate": Array objek dengan "name" (Nama Tampilan, misal "Penjualan") dan "xmlId" (Odoo group XML ID).
4. "modulesToDeactivate": Array objek dengan "name" (Nama Tampilan) dan "xmlId" (Odoo group XML ID).
5. "reasoning": Penjelasan singkat mengapa modul ini dipilih.

Odoo Group XML IDs yang umum disarankan:
- Penjualan (Sales): "sales_team.group_sale_salesman" atau "sales_team.group_sale_salesman_all_leads"
- Faktur (Invoicing): "account.group_account_invoice"
- Kasir (Point of Sale): "point_of_sale.group_pos_user"
- CRM: "sales_team.group_sale_salesman_all_leads" 
- Inventaris (Inventory): "stock.group_stock_user"
- Pembelian (Purchase): "purchase.group_purchase_user"
- Manufaktur (Manufacturing): "mrp.group_mrp_user"
- Proyek (Project): "project.group_project_user"
- Karyawan (HR / Employees): "hr.group_hr_user"

Jika Anda belum memiliki cukup informasi, ajukan pertanyaan klarifikasi di "reply" dan biarkan array rekomendasi kosong.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              profileName: { type: Type.STRING },
              modulesToActivate: { 
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    xmlId: { type: Type.STRING }
                  },
                  required: ["name", "xmlId"]
                } 
              },
              modulesToDeactivate: { 
                type: Type.ARRAY, 
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    xmlId: { type: Type.STRING }
                  },
                  required: ["name", "xmlId"]
                } 
              },
              reasoning: { type: Type.STRING }
            },
            required: ["reply", "profileName", "modulesToActivate", "modulesToDeactivate", "reasoning"]
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("AI Consultant Error:", error);
      res.status(500).json({ error: { message: error.message } });
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
