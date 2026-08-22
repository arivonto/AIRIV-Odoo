const fs = require('fs');
let content = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// 1. Add NIK Badge
const headerRegex = /<h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight break-words">\s*\{userData\?\.name\}\s*<\/h2>/;
const headerReplacement = `<div className="flex items-center gap-3 flex-wrap">
                   <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                     {userData?.name}
                   </h2>
                   {partnerData?.vat && (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                       <Shield className="w-3.5 h-3.5" />
                       NIK: {partnerData.vat}
                     </span>
                   )}
                 </div>`;
content = content.replace(headerRegex, headerReplacement);

// 2. Update Location rendering
const locRegex = /\{\[partnerData\?\.street, partnerData\?\.city, partnerData\?\.country_id\?\.\[1\]\]\.filter\(Boolean\)\.join\(\', \'\) \|\| \'-\'\}/;
const locReplacement = `{[partnerData?.street, partnerData?.street2, partnerData?.city, partnerData?.state_id?.[1]].filter(Boolean).join(', ') || '-'}`;
content = content.replace(locRegex, locReplacement);

// 3. Update submitIdVerification
const submitRegex = /let base64Clean = idImageBase64 \? idImageBase64\.replace\(\/\^data:image\\\/\\w\+;base64,\/, ""\) : "";[\s\S]*?fetchProfile\(\);/;
const submitReplacement = `let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\\/\\w+;base64,/, "") : "";

      const bioNarrative = \`Verified Indonesian Citizen (NIK: \${formData.nik}). Registered domicile at \${formData.street}, \${formData.subdistrict}, \${formData.city}, \${formData.province}. Occupation: \${formData.occupation}.\`;

      const payload = {
        vat: formData.nik,
        name: formData.name,
        street: formData.street,
        street2: formData.subdistrict,
        city: formData.city,
        state_id: state_id || undefined,
        country_id: country_id || undefined,
        function: formData.occupation || partnerData?.function,
        comment: bioNarrative,
        avatar_128: base64Clean || undefined
      };

      await odooService.writeRecord('res.partner', partnerData.id, payload);
      
      // Instant Live UI Refresh
      setPartnerData(prev => prev ? {
        ...prev,
        vat: formData.nik,
        street: formData.street,
        street2: formData.subdistrict,
        city: formData.city,
        state_id: state_id ? [state_id, formData.province] : prev.state_id,
        country_id: country_id ? [country_id, 'Indonesia'] : prev.country_id,
        function: formData.occupation || prev.function,
        comment: bioNarrative
      } : null);
      if (formData.name && userData) {
         setUserData(prev => prev ? { ...prev, name: formData.name } : null);
      }
      
      setIdToast('Identity details and bio updated successfully!');
      setTimeout(() => setIdToast(''), 4000);
      closeScanner();`;
content = content.replace(submitRegex, submitReplacement);

fs.writeFileSync('src/components/UserProfile.tsx', content);
