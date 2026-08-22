const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const regex = /\/\/ Resolve province -> state_id[\s\S]*?closeScanner\(\);/m;
const replacement = `// Resolve province -> state_id
      let state_id = false;
      let country_id = false;
      
      if (formData.province) {
        const cleanProvince = formData.province.replace(/PROVINSI|DKI|DAERAH ISTIMEWA/gi, '').trim();
        const states = await odooService.searchRead('res.country.state', [['name', 'ilike', cleanProvince]], ['id', 'name']);
        if (states && states.length > 0) state_id = states[0].id;
      }
      
      // Default Indonesia
      const countries = await odooService.searchRead('res.country', [['code', '=', 'ID']], ['id', 'name'], 1);
      if (countries && countries.length > 0) country_id = countries[0].id;
      
      let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\\/\\w+;base64,/, "") : "";

      const bioSummary = \`<p>Verified Indonesian Citizen (NIK: \${formData.nik}). Registered domicile at \${formData.street}, \${formData.subdistrict}, \${formData.city}, \${formData.province}. Occupation: \${formData.occupation}.</p>\`;

      const payload = {
        vat: formData.nik,
        name: formData.name,
        street: formData.street,
        street2: formData.subdistrict,
        city: formData.city,
        state_id: state_id || false,
        country_id: country_id || undefined,
        function: formData.occupation || partnerData?.function,
        comment: bioSummary,
        avatar_128: base64Clean || undefined
      };

      await odooService.writeRecord('res.partner', partnerData.id, payload);
      
      // Dynamic Profile Re-fetch
      await fetchProfile();
      
      setIdToast('Identity details and bio updated successfully!');
      setTimeout(() => setIdToast(''), 4000);
      closeScanner();`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/UserProfile.tsx', code);
