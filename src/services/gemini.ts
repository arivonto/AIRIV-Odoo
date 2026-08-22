export function getGeminiApiKey(): string {
  return (
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.API_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    localStorage.getItem('AIRIV_GEMINI_API_KEY') ||
    ''
  );
}

export async function performKtpOcr(base64Image: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is required. Please set it in Settings.");
  }

  const rawData = base64Image.split(',')[1] || base64Image;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: rawData } },
          { text: 'Extract all Indonesian KTP details into a strict JSON object with fields: nik, name, address, rtrw, kel_desa, kecamatan, city, province, occupation. Return ONLY raw JSON without backticks.' }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson);
}
