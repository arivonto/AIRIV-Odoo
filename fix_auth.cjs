const fs = require('fs');

let text = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetAuthStart = text.indexOf('  async authenticate(db: string, username: string, apiKey: string) {');
const targetAuthEnd = text.indexOf('  async executeKw', targetAuthStart);

if (targetAuthStart !== -1 && targetAuthEnd !== -1) {
    const newAuth = `  async authenticate(db: string, username: string, apiKey: string) {
    if (this.config.useMock) {
      const mockResult = { uid: 1, session_id: 'mock_session_123', name: 'Admin (Mock)', company_id: 1 };
      this.saveConfig({ db, username, apiKey, ...mockResult, useMock: true });
      return mockResult;
    }

    const { url } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');

    const endpoint = \`\${getBaseUrl()}/jsonrpc\`;
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [db, username, apiKey, {}]
      },
      id: Date.now()
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Server returned HTML instead of JSON: ' + responseText.substring(0, 100));
      }

      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Authentication failed');
      }

      if (!data.result) {
        throw new Error('Invalid credentials or database name');
      }

      const uid = data.result; // Odoo JSON-RPC common.authenticate returns the uid as an integer
      
      const authResult = { 
         uid, 
         session_id: 'jsonrpc-session-' + uid, // we don't get a session id from common.authenticate, just a uid
         name: username, 
         company_id: 1 
      };
      
      this.saveConfig({ db, username, apiKey, ...authResult, useMock: false });
      return authResult;

    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      throw new Error(\`Auth failed: \${error.message}\`);
    }
  }

`;
    let before = text.substring(0, targetAuthStart);
    let after = text.substring(targetAuthEnd);
    fs.writeFileSync('src/services/odoo.ts', before + newAuth + after);
    console.log("Replaced auth method.");
} else {
    console.log("Could not find auth method boundaries.");
}
