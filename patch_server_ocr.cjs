const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `Extract all structured identity details from this National ID card / KTP / Passport image into JSON:
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
- occupation (string)`,
  `Extract structured data from this Indonesian KTP / National ID / Passport:
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
     }`
);

code = code.replace(
  `            properties: {
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
            }`,
  `            properties: {
              nik: { type: Type.STRING },
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              rtrw: { type: Type.STRING },
              kel_desa: { type: Type.STRING },
              kecamatan: { type: Type.STRING },
              city: { type: Type.STRING },
              province: { type: Type.STRING },
              occupation: { type: Type.STRING }
            }`
);

fs.writeFileSync('server.ts', code);
