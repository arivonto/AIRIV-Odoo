const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');

const target = `  async updateUserGroups(xmlIds: string[]) {
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

    const targetGroupIds = modelData
      .filter((d: any) => xmlIds.includes(\`\${d.module}.\${d.name}\`))
      .map((d: any) => d.res_id);

    if (targetGroupIds.length === 0 && xmlIds.length > 0) {
      throw new Error("Could not resolve any of the requested XML IDs in the database.");
    }

    // Always ensure base.group_user (Internal User) is included
    const baseUser = modelData.find((d: any) => d.module === 'base' && d.name === 'group_user');
    if (baseUser && !targetGroupIds.includes(baseUser.res_id)) {
      targetGroupIds.push(baseUser.res_id);
    }

    // 2. Update the user
    // Command 6 is 'replace with', syntax: (6, 0, [ids])
    return this.executeKw('res.users', 'write', [[uid], { groups_id: [[6, 0, targetGroupIds]] }]);
  }`;

const replacement = `  async updateUserGroups(xmlIds: string[]) {
    if (this.config.useMock) return true;

    const { uid } = this.config;
    if (!uid) throw new Error('Not authenticated');

    try {
      // 1. Fetch group IDs for the requested XML IDs
      // We fetch all XML IDs for res.groups since they are usually a few hundred
      const modelData = await this.executeKw('ir.model.data', 'search_read', [[['model', '=', 'res.groups']]], {
        fields: ['module', 'name', 'res_id']
      });

      const targetGroupIds = modelData
        .filter((d: any) => xmlIds.includes(\`\${d.module}.\${d.name}\`))
        .map((d: any) => d.res_id);

      if (targetGroupIds.length === 0 && xmlIds.length > 0) {
        throw new Error("Could not resolve any of the requested XML IDs in the database.");
      }

      // Always ensure base.group_user (Internal User) is included
      const baseUser = modelData.find((d: any) => d.module === 'base' && d.name === 'group_user');
      if (baseUser && !targetGroupIds.includes(baseUser.res_id)) {
        targetGroupIds.push(baseUser.res_id);
      }

      // 2. Update the user
      // Command 6 is 'replace with', syntax: (6, 0, [ids])
      return await this.executeKw('res.users', 'write', [[uid], { groups_id: [[6, 0, targetGroupIds]] }]);
    } catch (e: any) {
      if (e.message?.includes('ir.model.data') || e.message?.includes('res.users') || e.message?.includes('Access Rights')) {
        throw new Error('You do not have Administrator access rights in Odoo to apply this setup. Please log in with an Administrator account (e.g. arivonto@gmail.com) and try again.');
      }
      throw e;
    }
  }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
  console.log('Success');
} else {
  console.log('Target not found');
}
