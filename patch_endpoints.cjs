const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/const endpoint = '\/api\/jsonrpc';/g, "const endpoint = `${url}/jsonrpc`;");
code = code.replace(/const endpoint = '\/api\/web\/session\/authenticate';/g, "const endpoint = `${url}/web/session/authenticate`;");
code = code.replace(/const endpoint = '\/api\/web\/action\/load';/g, "const endpoint = `${url}/web/action/load`;");
code = code.replace(/const endpoint = '\/api\/web\/menu\/load_menus';/g, "const endpoint = `${url}/web/menu/load_menus`;");

// We don't need 'x-odoo-url' or 'x-odoo-session-id' headers anymore if we go direct, but keeping them won't hurt, unless it triggers a CORS preflight failure if Odoo doesn't allow those headers.
// Let's remove them just in case they cause CORS errors.
code = code.replace(/'x-odoo-url': url,/g, "");
code = code.replace(/'x-odoo-session-id': session_id \|\| ''/g, "");
code = code.replace(/'x-odoo-session-id': session_id/g, "");

fs.writeFileSync('src/services/odoo.ts', code);
