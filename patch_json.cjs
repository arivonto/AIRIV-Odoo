const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');

const targetStr2 = `      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      res.json(JSON.parse(text));`;

const replacementStr2 = `      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      try {
        // sometimes the AI wraps response in markdown code blocks
        let cleanText = text.trim();
        if (cleanText.startsWith('\`\`\`json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('\`\`\`')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('\`\`\`')) {
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
      }`;

content = content.replace(targetStr2, replacementStr2);
fs.writeFileSync('/app/applet/server.ts', content);
