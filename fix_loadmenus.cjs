const fs = require('fs');

let text = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetLoadMenuStart = text.indexOf('  async loadMenus() {');
const targetLoadMenuEnd = text.indexOf('  private mockRpc(', targetLoadMenuStart); // original was next method

if (targetLoadMenuStart !== -1 && targetLoadMenuEnd !== -1) {
    const newLoadMenus = `  async loadMenus() {
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

    const { url } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');

    try {
      const menusData = await this.executeKw('ir.ui.menu', 'search_read', [[['parent_id', '=', false]]], {
          fields: ["id", "name", "action", "web_icon_data", "sequence"]
      });

      const resultDict = { root: { id: 'root', children: [] } };
      if (Array.isArray(menusData)) {
        const menus = [...menusData].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
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
      throw new Error(\`Load menus failed: \${error.message || 'Unknown error'}\`);
    }
  }

`;
    let before = text.substring(0, targetLoadMenuStart);
    let after = text.substring(targetLoadMenuEnd);
    fs.writeFileSync('src/services/odoo.ts', before + newLoadMenus + after);
    console.log("Replaced loadMenus method.");
} else {
    console.log("Could not find loadMenus method boundaries.");
}
