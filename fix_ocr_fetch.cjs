const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const oldOcrBlock = `  app.post("/api/ocr", async (req, res) => {
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
      
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body." });
      }
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              },
              {
                text: "Extract all structured information from this ID document / KTP / Passport as strict JSON. Return only the JSON object with keys: nik, name, birth_place_date, address, rtrw, kel_desa, kecamatan, city, province, occupation."
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nik: { type: Type.STRING },
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              rtrw: { type: Type.STRING },
              kel_desa: { type: Type.STRING },
              kecamatan: { type: Type.STRING },
              city: { type: Type.STRING },
              province: { type: Type.STRING },
              occupation: { type: Type.STRING }
            }
          }
        }
      });
      
      let text = response.text;
      if (text) {
        text = text.replace(/^\\\`\\\`\\\`json\\s*/i, '').replace(/\\\`\\\`\\\`\\s*$/i, '');
      }
      if (!text) throw new Error("No response from AI");
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
    } catch (error: any) {
      console.error("AI OCR Error:", error);
      res.status(500).json({ error: error.message });
    }
  });`;

const newOcrBlock = `  app.post("/api/ocr", async (req, res) => {
    try {
      const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || 
                     (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                     '';

      if (!apiKey) {
        throw new Error("Missing Gemini API Key in environment");
      }
                     
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\\/(png|jpeg|jpg|webp);base64,/, '');

      const prompt = \`You are an expert OCR system for Indonesian Identity Cards (KTP). Extract all visible text accurately from this image into strict JSON format with these exact keys:
      {
        "nik": "string",
        "name": "string",
        "birth_place_date": "string",
        "address": "string",
        "rtrw": "string",
        "kel_desa": "string",
        "kecamatan": "string",
        "city": "string",
        "province": "string",
        "occupation": "string"
      }
      Return ONLY raw JSON, no markdown formatting.\`;

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(\`Gemini API error (\${response.status}): \${errBody}\`);
      }

      const jsonResponse = await response.json();
      let text = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("No response from AI");
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
    } catch (error: any) {
      console.error("AI OCR Error:", error);
      res.status(500).json({ error: error.message });
    }
  });`;

// Remove escaped newlines from oldOcrBlock just in case, but let's try direct replace first:
if (serverCode.includes(oldOcrBlock)) {
  serverCode = serverCode.replace(oldOcrBlock, newOcrBlock);
  fs.writeFileSync('server.ts', serverCode);
  console.log("Updated server.ts successfully");
} else {
  // Let's use regex to find and replace everything between app.post("/api/ocr", async (req, res) => { and the next app.post
  const regex = /app\.post\("\/api\/ocr", async \(req, res\) => \{[\s\S]*?\}\s*\);/g;
  if(regex.test(serverCode)) {
      serverCode = serverCode.replace(regex, newOcrBlock);
      fs.writeFileSync('server.ts', serverCode);
      console.log("Updated server.ts via regex successfully");
  } else {
      console.log("Failed to find block");
  }
}
