const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const ocrEndpoint = `  app.post("/api/ocr", async (req, res) => {
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

      // Remove the prefix "data:image/jpeg;base64," if it exists
      const base64Data = imageBase64.replace(/^data:image\\/\\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "image/jpeg"
                }
              },
              {
                text: \`Extract all structured identity details from this National ID card / KTP / Passport image into JSON:
- id_number (string, e.g. NIK or Passport Number)
- full_name (string)
- birth_place_date (string)
- gender (string)
- address (string)
- rt_rw (string)
- kel_desa (string)
- kecamatan (string)
- city (string)
- province (string)
- occupation (string)\`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id_number: { type: Type.STRING },
              full_name: { type: Type.STRING },
              birth_place_date: { type: Type.STRING },
              gender: { type: Type.STRING },
              address: { type: Type.STRING },
              rt_rw: { type: Type.STRING },
              kel_desa: { type: Type.STRING },
              kecamatan: { type: Type.STRING },
              city: { type: Type.STRING },
              province: { type: Type.STRING },
              occupation: { type: Type.STRING }
            }
          }
        }
      });
      
      const text = response.text;
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
  });

`;

code = code.replace(
  /app\.post\("\/api\/consultant\/chat", async \(req, res\) => \{/,
  ocrEndpoint + 'app.post("/api/consultant/chat", async (req, res) => {'
);

fs.writeFileSync('server.ts', code);
