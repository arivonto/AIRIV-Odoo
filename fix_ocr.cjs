const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// Replace the base64 code
const oldBase64Code = `      // Remove the prefix "data:image/jpeg;base64," if it exists
      const base64Data = imageBase64.replace(/^data:image\\/\\w+;base64,/, "");`;

const newBase64Code = `      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';`;

if(serverCode.includes(oldBase64Code)) {
  serverCode = serverCode.replace(oldBase64Code, newBase64Code);
} else {
  // Try regex replace if exact match fails
  serverCode = serverCode.replace(/\/\/\s*Remove the prefix.*\n\s*const base64Data = imageBase64\.replace\(\/\^data:image\\\/\\w\+;base64,\/,\s*""\);/m, newBase64Code);
}

// Replace the prompt logic in server.ts
const oldGenerateCode = `      const response = await ai.models.generateContent({
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
                text: \`Extract structured data from this Indonesian KTP / National ID / Passport:
     {
       nik: string,
       name: string,
       address: string,
       rtrw: string,
       kel_desa: string,
       kecamatan: string,
       city: string,
       province: string,
       occupation: string
     }\`
              }
            ]
          }
        ],`;

const newGenerateCode = `      const response = await ai.models.generateContent({
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
        ],`;

serverCode = serverCode.replace(oldGenerateCode, newGenerateCode);

// Fix the parse output side just in case (stripping markdown)
const oldResTextCode = `      const text = response.text;`;
const newResTextCode = `      let text = response.text;
      if (text) {
        text = text.replace(/^\\\`\\\`\\\`json\\s*/i, '').replace(/\\\`\\\`\\\`\\s*$/i, '');
      }`;

if(serverCode.includes(oldResTextCode)) {
  serverCode = serverCode.replace(oldResTextCode, newResTextCode);
}

fs.writeFileSync('server.ts', serverCode);
console.log("Updated server.ts");
