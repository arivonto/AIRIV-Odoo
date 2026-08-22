const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/components/AIConsultantModal.tsx', 'utf8');

content = content.replace(
  'await odooClient.updateUserGroups(xmlIds);',
  `const deactivateXmlIds = recommendation.modulesToDeactivate.map(m => m.xmlId);
      await odooClient.updateUserGroups(xmlIds, deactivateXmlIds);`
);

fs.writeFileSync('/app/applet/src/components/AIConsultantModal.tsx', content);
