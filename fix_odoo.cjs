const fs = require('fs');
const path = 'src/services/odoo.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `    } catch (error: any) {
      console.error('API Call Failed:', \`\${BASE_URL}\${endpoint}\`, error);
      throw error;
    }`,
  `    } catch (error: any) {
      const errMsg = error.message || '';
      if (!errMsg.includes("doesn't exist") && !errMsg.includes("not allowed") && !errMsg.includes("Access Denied")) {
        console.error('API Call Failed:', \`\${BASE_URL}\${endpoint}\`, error.message);
      }
      throw error;
    }`
);

fs.writeFileSync(path, code);
