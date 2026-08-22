const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');

const target = 'const endpoint = `${targetUrl.replace(/\\/$/, "")}/web/menu/load_menus`;';
const replacement = 'const endpoint = `${targetUrl.replace(/\\/$/, "")}/web/webclient/load_menus`;';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('/app/applet/server.ts', content);
  console.log('Patched endpoint');
} else {
  console.log('Target not found');
}
