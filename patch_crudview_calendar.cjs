const fs = require('fs');
let code = fs.readFileSync('src/components/CrudView.tsx', 'utf8');

code = code.replace(
  `if (session?.company_id && session.company_id[0] && !['survey.survey', 'survey.user_input', 'res.users', 'ir.module.module', 'res.company'].includes(menu.model)) {`,
  `if (session?.company_id && session.company_id[0] && !['survey.survey', 'survey.user_input', 'res.users', 'ir.module.module', 'res.company', 'calendar.event'].includes(menu.model)) {`
);

fs.writeFileSync('src/components/CrudView.tsx', code);
