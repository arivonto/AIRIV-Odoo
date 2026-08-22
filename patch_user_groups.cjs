const fs = require('fs');

let text = fs.readFileSync('src/services/odoo.ts', 'utf8');

const targetStr = "  async loadAction(actionId: number | string) {";

const newMethod = `  async updateUserGroups(activateXmlIds: string[], deactivateXmlIds: string[] = []) {
    if (this.config.useMock) {
       return true;
    }
    
    let { uid } = this.config;
    if (!uid) {
       throw new Error('Not authenticated.');
    }
    
    const allXmlIds = [...activateXmlIds, ...deactivateXmlIds];
    if (allXmlIds.length === 0) return true;
    
    const promises = allXmlIds.map(async (xmlId) => {
        const parts = xmlId.split('.');
        if (parts.length !== 2) return { xmlId, res_id: null };
        const [module, name] = parts;
        try {
            const result = await this.executeKw('ir.model.data', 'search_read', [[['module', '=', module], ['name', '=', name], ['model', '=', 'res.groups']]], { fields: ['res_id'], limit: 1 });
            return { xmlId, res_id: result.length > 0 ? result[0].res_id : null };
        } catch (e) {
            console.error(\`Failed to resolve group \${xmlId}\`, e);
            return { xmlId, res_id: null };
        }
    });
    
    const results = await Promise.all(promises);
    
    const groupsToAdd = results.filter(r => activateXmlIds.includes(r.xmlId) && r.res_id).map(r => r.res_id);
    const groupsToRemove = results.filter(r => deactivateXmlIds.includes(r.xmlId) && r.res_id).map(r => r.res_id);
    
    if (groupsToAdd.length === 0 && groupsToRemove.length === 0) {
        return true;
    }
    
    const writeCommands = [];
    groupsToAdd.forEach(id => writeCommands.push([4, id]));
    groupsToRemove.forEach(id => writeCommands.push([3, id]));
    
    await this.executeKw('res.users', 'write', [[uid], {
        groups_id: writeCommands
    }]);
    
    return true;
  }

`;

if (text.includes(targetStr) && !text.includes('async updateUserGroups')) {
    text = text.replace(targetStr, newMethod + targetStr);
    fs.writeFileSync('src/services/odoo.ts', text);
    console.log("Added updateUserGroups method.");
} else {
    console.log("Could not find target or method already exists.");
}
