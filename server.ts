import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => { console.log("[" + req.method + "] " + req.url); next(); });
  app.use((req, res, next) => { console.log("[" + req.method + "] " + req.url); next(); });
  app.use(express.json({ limit: '50mb' })); app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
        credentials: "include",
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
            message: `BACKEND CAUGHT HTML: ${responseText.slice(0, 50)}...`
          }
        });
      }
      
      const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      for (const cookie of cookies) {
        const match = cookie.match(/session_id=([^;]+)/);
        if (match && data && data.result) {
          data.result.session_id = data.result.session_id || match[1];
        }
      }
      // Also fallback if getSetCookie is not available
      if (response.headers.get('set-cookie')) {
          const match = response.headers.get('set-cookie')?.match(/session_id=([^;]+)/);
          if (match && data && data.result) {
             data.result.session_id = data.result.session_id || match[1];
          }
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
        credentials: "include",
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

  app.all("/api/web/menu/load_menus", async (req, res) => {
    const targetUrl = req.headers["x-odoo-url"] as string;
    const sessionId = req.headers["x-odoo-session-id"] as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: { message: "Missing x-odoo-url header" } });
    }

    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/web/webclient/load_menus`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
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
          systemInstruction: `You are an AI Business Consultant for Odoo ERP.
You analyze the user's business needs and recommend which standard Odoo modules they should activate or deactivate.

You must reply in JSON format.
Your JSON must contain:
1. "reply": A conversational string reply asking for more details or explaining your recommendations.
2. "profileName": A short name for the recommended setup (e.g. "Retail Shop", "Service Agency").
3. "modulesToActivate": An array of objects with "name" (Display Name) and "xmlId" (Odoo group XML ID).
4. "modulesToDeactivate": An array of objects with "name" (Display Name) and "xmlId" (Odoo group XML ID).
5. "reasoning": A brief explanation of why these modules were chosen.

Common Odoo Group XML IDs to suggest:
- Sales: "sales_team.group_sale_salesman" or "sales_team.group_sale_salesman_all_leads"
- Invoicing: "account.group_account_invoice"
- Point of Sale: "point_of_sale.group_pos_user"
- CRM: "sales_team.group_sale_salesman_all_leads" (often shared with sales but can be used for CRM)
- Inventory: "stock.group_stock_user"
- Purchase: "purchase.group_purchase_user"
- Manufacturing: "mrp.group_mrp_user"
- Project: "project.group_project_user"
- HR / Employees: "hr.group_hr_user"

If you don't have enough information yet, ask clarifying questions in the "reply" and keep the recommendation arrays empty.`,
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
      
      try {
        // sometimes the AI wraps response in markdown code blocks
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        res.json(JSON.parse(cleanText.trim()));
      } catch (parseError) {
        console.error("AI JSON Parse Error. Raw response:", text);
        return res.json({
          reply: "I received a response, but it wasn't in the correct format. Let me provide a standard recommendation instead.",
          profileName: "Standard Setup (Fallback)",
          modulesToActivate: [
            { name: "Sales", xmlId: "sales_team.group_sale_salesman_all_leads" },
            { name: "Invoicing", xmlId: "account.group_account_invoice" }
          ],
          modulesToDeactivate: [],
          reasoning: "Provided as a safe fallback because the AI response was malformed."
        });
      }
    } catch (error: any) {
      console.error("AI Consultant Error:", error);
      let errorMessage = error.message;
      if (errorMessage && (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE"))) {
        return res.json({
          reply: "The AI service is currently experiencing high demand, so I am providing a standard fallback recommendation. Based on common business needs, I recommend starting with Sales and Invoicing. Let me know if you want to explore other specific modules!",
          profileName: "Standard Setup (Fallback)",
          modulesToActivate: [
            { name: "Sales", xmlId: "sales_team.group_sale_salesman_all_leads" },
            { name: "Invoicing", xmlId: "account.group_account_invoice" }
          ],
          modulesToDeactivate: [],
          reasoning: "These core modules form the backbone of most businesses, allowing you to quote customers and collect payments. (Provided via offline fallback due to API limits)."
        });
      }
      res.status(500).json({ error: { message: errorMessage } });
    }
  });

  
  app.all("/api/odoo/jsonrpc", async (req, res) => {
    const targetUrl = (req.headers["x-odoo-url"] as string) || 'https://odoo-api.airiv.id';
    
    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/jsonrpc`;
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
          error: { message: `Proxy error: Odoo returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...` }
        });
      }
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: { message: `Proxy error: Could not reach Odoo at ${targetUrl}. Details: ${error.message}` },
      });
    }
  });

  app.all("/api/odoo/web/dataset/call_kw", async (req, res) => {
    const targetUrl = (req.headers["x-odoo-url"] as string) || 'https://odoo-api.airiv.id';
    try {
      const endpoint = `${targetUrl.replace(/\/$/, "")}/web/dataset/call_kw`;
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
          error: { message: `Proxy error: Odoo returned HTML instead of JSON.` }
        });
      }
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: { message: `Proxy error: ${error.message}` },
      });
    }
  });
// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.all("/api/*", (req, res) => { res.status(404).json({ error: "API route not found: " + req.method + " " + req.url }); });
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
