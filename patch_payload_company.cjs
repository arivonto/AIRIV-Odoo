const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `      // We should ideally fetch current company_id from session but since we don't have it directly in CrudView easily, 
      // the prompt says "company_id: user.company_id[0]" - we can omit company_id if it's auto-assigned by backend or fetch it from session. 
      // Actually we have Odoo session available if we pass it, but let's try without it first as it usually defaults to the user's current company.`,
  `      if (session?.company_id && session.company_id[0] && !editingRecord) {
        if (['product.template', 'res.partner', 'fleet.vehicle'].includes(menu.model)) {
          payload.company_id = session.company_id[0];
        }
      }`
);

fs.writeFileSync(path, code);
