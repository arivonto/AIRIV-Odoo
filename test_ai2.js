const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: "Say hello",
}).then(r => console.log(typeof r.text, typeof r.text())).catch(e => console.error(e));
