const fs = require('fs');
const path = 'src/services/odoo.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `    if (uid) {
      currentSession = { db, uid, apiKey, username: login, name: login };`,
  `    if (uid) {
      currentSession = { db, uid, apiKey, username: login, name: login };
      try {
        const users = await this.executeKw('res.users', 'search_read', [[['id', '=', uid]]], { fields: ['company_id'], limit: 1 });
        if (users && users.length > 0) {
          currentSession.company_id = users[0].company_id;
        }
      } catch (e) {
        console.error("Failed to fetch user company", e);
      }`
);

fs.writeFileSync(path, code);
