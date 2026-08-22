const fs = require('fs');
const content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');
const target = `  async updateUserGroups(xmlIds: string[]) {
    if (this.config.useMock) return true;

    const { uid } = this.config;
    if (!uid) throw new Error('Not authenticated');

    // 1. Fetch group IDs for the requested XML IDs
    // We fetch all XML IDs for res.groups since they are usually a few hundred
    const modelData = await this.executeKw('ir.model.data', 'search_read', [[['model', '=', 'res.groups']]], {
      fields: ['module', 'name', 'res_id']
    });

    const targetGroupIds = modelData`;

const replacement = `  async updateUserGroups(xmlIds: string[]) {
    if (this.config.useMock) return true;

    const { uid } = this.config;
    if (!uid) throw new Error('Not authenticated');

    let modelData;
    try {
      // 1. Fetch group IDs for the requested XML IDs
      // We fetch all XML IDs for res.groups since they are usually a few hundred
      modelData = await this.executeKw('ir.model.data', 'search_read', [[['model', '=', 'res.groups']]], {
        fields: ['module', 'name', 'res_id']
      });
    } catch (e: any) {
      if (e.message?.includes('ir.model.data') || e.message?.includes('Access Rights')) {
        throw new Error('You do not have Administrator access rights in Odoo to apply this setup. Please log in with an Administrator account.');
      }
      throw e;
    }

    const targetGroupIds = modelData`;

fs.writeFileSync('/app/applet/src/services/odoo.ts', content.replace(target, replacement));
