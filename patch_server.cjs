const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {`;

const replace = `      const setCookie = response.headers.get('set-cookie');
      let extractedSessionId = null;
      if (setCookie) {
        const match = setCookie.match(/session_id=([^;]+)/);
        if (match) extractedSessionId = match[1];
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        if (extractedSessionId && data.result) {
           data.result.session_id = data.result.session_id || extractedSessionId;
        }
      } catch (e) {`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
