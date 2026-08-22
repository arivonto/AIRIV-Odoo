const fs = require('fs');
let code = fs.readFileSync('src/components/CrudView.tsx', 'utf8');

code = code.replace(
  `const domain = menu.domain ? [...menu.domain] : [];`,
  `const domain = menu.domain ? [...menu.domain] : [];
      
      // Multi-tenant context filter
      if (session?.company_id && session.company_id[0] && !['survey.survey', 'res.users', 'ir.module.module', 'res.company'].includes(menu.model)) {
         domain.push(['company_id', '=', session.company_id[0]]);
      }`
);

fs.writeFileSync('src/components/CrudView.tsx', code);
