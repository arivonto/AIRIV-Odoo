const fs = require('fs');
let content = fs.readFileSync('src/services/odoo.ts', 'utf8');

// Find the index of `async loadMenus() {`
let start = content.indexOf('async loadMenus() {');
// Find the index of `async executeKw`
let end = content.indexOf('async executeKw', start);

if (start !== -1 && end !== -1) {
    let before = content.substring(0, start);
    let after = content.substring(end);
    let newLoad = `async loadMenus() {
    if (this.config.useMock) {
      return {
        root: { id: 'root', children: [1, 2, 3] },
        1: { id: 1, name: 'Sales', actionID: 101, appID: 1, children: [11], xmlid: 'sale.menu_root' },
        11: { id: 11, name: 'Quotations', actionID: 101, appID: 1, children: [], xmlid: 'sale.menu_quotations' },
        2: { id: 2, name: 'CRM', actionID: 102, appID: 2, children: [12], xmlid: 'crm.crm_menu_root' },
        12: { id: 12, name: 'Pipeline', actionID: 102, appID: 2, children: [], xmlid: 'crm.crm_menu_pipeline' },
        3: { id: 3, name: 'Invoicing', actionID: 103, appID: 3, children: [13], xmlid: 'account.menu_finance' },
        13: { id: 13, name: 'Invoices', actionID: 103, appID: 3, children: [], xmlid: 'account.menu_finance_receivables' }
      };
    }

    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');
    if (!session_id) throw new Error('Session ID is missing, please re-authenticate.');

    const endpoint = \`\${getBaseUrl()}/web/dataset/call_kw\`;
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: "ir.ui.menu",
        method: "search_read",
        args: [[["parent_id", "=", false]]],
        kwargs: { fields: ["id", "name", "action", "web_icon_data", "sequence"] }
      },
      id: Date.now()
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST', mode: 'cors', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Server returned HTML instead of JSON (Status ' + response.status + '): ' + responseText.substring(0, 100));
      }
      if (data.error) throw new Error(data.error.data?.message || data.error.message || 'Menu load failed');

      const resultDict: any = { root: { id: 'root', children: [] } };
      if (Array.isArray(data.result)) {
        const menus = [...data.result].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        menus.forEach(m => {
          resultDict.root.children.push(m.id);
          let actionID = false;
          if (m.action) {
             const parts = m.action.split(',');
             if (parts.length === 2) actionID = parseInt(parts[1], 10);
          }
          resultDict[m.id] = {
             id: m.id, name: m.name, actionID: actionID, appID: m.id, children: [], xmlid: '', web_icon_data: m.web_icon_data
          };
        });
      }
      return resultDict;
    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      throw new Error(\`Load menus failed: \${error.message || 'Unknown error'}\`);
    }
  }

  `;
  fs.writeFileSync('src/services/odoo.ts', before + newLoad + after);
  console.log("Rewrote loadMenus");
}
