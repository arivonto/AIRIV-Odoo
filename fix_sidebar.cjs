const fs = require('fs');
const path = 'src/components/Sidebar.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `{ id: 'reports', name: 'Scouting Reports', icon: FileText, model: 'survey.survey' },
      { id: 'evaluations', name: 'Metrics', icon: Activity, model: 'hr.evaluation' }`,
  `{ id: 'reports', name: 'Scouting Templates', icon: FileText, model: 'survey.survey' },
      { id: 'evaluations', name: 'Scout Assessments', icon: Activity, model: 'survey.user_input' }`
);

fs.writeFileSync(path, code);
