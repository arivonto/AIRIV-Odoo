const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');

const target = `  async updateUserGroups(xmlIds: string[]) {
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

const replacement = `  async updateUserGroups(xmlIdsToActivate: string[], xmlIdsToDeactivate: string[] = []) {
    if (this.config.useMock) return true;

    const { uid } = this.config;
    if (!uid) throw new Error('Not authenticated');

    try {
      // 1. Fetch group IDs for the requested XML IDs
      const modelData = await this.executeKw('ir.model.data', 'search_read', [[['model', '=', 'res.groups']]], {
        fields: ['module', 'name', 'res_id']
      });

      const activateIds = modelData
        .filter((d: any) => xmlIdsToActivate.includes(\`\${d.module}.\${d.name}\`))
        .map((d: any) => d.res_id);
        
      const deactivateIds = modelData
        .filter((d: any) => xmlIdsToDeactivate.includes(\`\${d.module}.\${d.name}\`))
        .map((d: any) => d.res_id);

      // Always ensure base.group_user (Internal User) is included
      const baseUser = modelData.find((d: any) => d.module === 'base' && d.name === 'group_user');
      if (baseUser && !activateIds.includes(baseUser.res_id)) {
        activateIds.push(baseUser.res_id);
      }

      // 2. Update the user
      // Command 4 is 'add' (link), Command 3 is 'remove' (unlink)
      // This is non-destructive to existing roles like Settings or Access Rights!
      const commands = [
        ...activateIds.map(id => [4, id]),
        ...deactivateIds.map(id => [3, id])
      ];

      if (commands.length > 0) {
        return await this.executeKw('res.users', 'write', [[uid], { groups_id: commands }]);
      }
      return true;
    } catch (e: any) {
      if (e.message?.includes('ir.model.data') || e.message?.includes('res.users') || e.message?.includes('Access Rights')) {
        throw new Error('Odoo rejected the change. You may need to refresh your session or log in as arivonto@gmail.com.');
      }
      throw e;
    }
  }`;

content = content.replace(target, replacement);
fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
