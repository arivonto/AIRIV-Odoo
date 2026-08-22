const fs = require('fs');
let text = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetLoadActionStart = text.indexOf('  async loadAction(actionId: number | string) {');
const targetLoadActionEnd = text.indexOf('  async loadMenus() {', targetLoadActionStart);

if (targetLoadActionStart !== -1 && targetLoadActionEnd !== -1) {
    const newLoadAction = `  async loadAction(actionId: number | string) {
    if (this.config.useMock) {
      return {
        res_model: 'mock.model',
        name: 'Mock Action',
        type: 'ir.actions.act_window',
        views: [['list', 'tree'], ['form', 'form']],
        domain: [],
        context: {}
      };
    }

    const { url } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');
    
    // Use executeKw directly to avoid session cookie requirements of /web/action/load
    try {
        const id = typeof actionId === 'string' ? parseInt(actionId, 10) : actionId;
        const actionData = await this.executeKw('ir.actions.act_window', 'search_read', [[['id', '=', id]]], {
            limit: 1
        });
        
        if (actionData && actionData.length > 0) {
            return actionData[0];
        }
        
        // If not found in act_window, try general actions
        const genericAction = await this.executeKw('ir.actions.actions', 'search_read', [[['id', '=', id]]], {
            limit: 1
        });
        return genericAction.length > 0 ? genericAction[0] : null;
    } catch (error: any) {
        throw new Error(\`Failed to load action: \${error.message}\`);
    }
  }

`;
    let before = text.substring(0, targetLoadActionStart);
    let after = text.substring(targetLoadActionEnd);
    fs.writeFileSync('src/services/odoo.ts', before + newLoadAction + after);
    console.log("Replaced loadAction method.");
} else {
    console.log("Could not find loadAction method boundaries.");
}
