const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetStart = code.indexOf('  async loadAction(actionId: number | string) {');
const targetEnd = code.indexOf('  async loadMenus() {', targetStart);

if (targetStart !== -1 && targetEnd !== -1) {
    const newMethod = `  async loadAction(actionId: number | string) {
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
    
    try {
        let id = actionId;
        let actionModel = 'ir.actions.act_window';
        
        if (typeof actionId === 'string' && actionId.includes(',')) {
            const parts = actionId.split(',');
            actionModel = parts[0];
            id = parseInt(parts[1], 10);
        } else if (typeof actionId === 'string') {
            id = parseInt(actionId, 10);
        }

        const actionData = await this.executeKw(actionModel, 'read', [[id], ['res_model', 'view_mode', 'domain', 'context', 'name', 'type']]);
        
        if (actionData && actionData.length > 0) {
            return actionData[0];
        }
        
        // If not found, try search_read on ir.actions.act_window just in case
        const genericAction = await this.executeKw('ir.actions.act_window', 'search_read', [[['id', '=', id]]], {
            limit: 1
        });
        return genericAction.length > 0 ? genericAction[0] : null;
    } catch (error: any) {
        throw new Error(\`Failed to load action: \${error.message}\`);
    }
  }

`;
    let before = code.substring(0, targetStart);
    let after = code.substring(targetEnd);
    fs.writeFileSync('src/services/odoo.ts', before + newMethod + after);
    console.log("Updated loadAction");
} else {
    console.log("Could not find boundaries for loadAction.");
}
