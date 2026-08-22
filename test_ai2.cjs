const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: "Say hello",
}).then(r => {
  console.log("r.text is:", typeof r.text);
  try {
    console.log("r.text() is:", typeof r.text());
  } catch (e) {
    console.log("r.text() failed", e.message);
  }
}).catch(e => console.error(e));
