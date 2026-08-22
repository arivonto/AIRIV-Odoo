const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetStart = code.indexOf('  async loadMenus() {');
const targetEnd = code.indexOf('  private mockRpc(', targetStart);

if (targetStart !== -1 && targetEnd !== -1) {
    const newMethod = `  async loadMenus() {
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
      // Fetch ALL menus
      const menusData = await this.executeKw('ir.ui.menu', 'search_read', [[]], {
          fields: ["id", "name", "action", "web_icon_data", "sequence", "parent_id", "app_id"]
      });

      const resultDict: any = { root: { id: 'root', children: [] } };
      
      if (Array.isArray(menusData)) {
        // First pass: initialize all nodes
        menusData.forEach((m: any) => {
          let actionID: number | false = false;
          if (m.action) {
             const parts = m.action.split(',');
             if (parts.length === 2) actionID = parseInt(parts[1], 10);
          }
          resultDict[m.id] = {
             id: m.id, 
             name: m.name, 
             actionID: actionID, 
             appID: m.app_id ? m.app_id[0] : m.id, 
             children: [], 
             xmlid: '', 
             web_icon_data: m.web_icon_data || null,
             sequence: m.sequence || 0,
             parent_id: m.parent_id ? m.parent_id[0] : false
          };
        });

        // Second pass: build the tree
        menusData.forEach((m: any) => {
          const node = resultDict[m.id];
          if (node.parent_id && resultDict[node.parent_id]) {
            resultDict[node.parent_id].children.push(node.id);
          } else if (!node.parent_id) {
            resultDict.root.children.push(node.id);
          }
        });

        // Third pass: sort children by sequence
        Object.values(resultDict).forEach((node: any) => {
           if (node.children && node.children.length > 0) {
              node.children.sort((aId: number, bId: number) => {
                 const aSeq = resultDict[aId]?.sequence || 0;
                 const bSeq = resultDict[bId]?.sequence || 0;
                 return aSeq - bSeq;
              });
           }
        });
      }
      return resultDict;
    } catch (error: any) {
      throw new Error(\`Load menus failed: \${error.message || 'Unknown error'}\`);
    }
  }

`;
    let before = code.substring(0, targetStart);
    let after = code.substring(targetEnd);
    fs.writeFileSync('src/services/odoo.ts', before + newMethod + after);
    console.log("Replaced loadMenus to build full tree.");
} else {
    console.log("Could not find boundaries.");
}
