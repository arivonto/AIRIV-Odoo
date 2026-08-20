const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

const additionalMocks = `
          } else if (model === 'ir.module.category' && action === 'search_read') {
            resolve([
              { id: 1, name: 'Sales', parent_id: false, sequence: 10 },
              { id: 2, name: 'Accounting', parent_id: false, sequence: 20 },
              { id: 3, name: 'Inventory', parent_id: false, sequence: 30 },
              { id: 4, name: 'Hidden', parent_id: false, sequence: 100 },
            ]);
          } else if (model === 'ir.module.module' && action === 'search_read') {
            resolve([
              { id: 1, name: 'sale_management', shortdesc: 'Sales', category_id: [1, 'Sales'], icon_image: false, sequence: 10 },
              { id: 2, name: 'crm', shortdesc: 'CRM', category_id: [1, 'Sales'], icon_image: false, sequence: 15 },
              { id: 3, name: 'account', shortdesc: 'Invoicing', category_id: [2, 'Accounting'], icon_image: false, sequence: 10 },
              { id: 4, name: 'stock', shortdesc: 'Inventory', category_id: [3, 'Inventory'], icon_image: false, sequence: 10 },
            ]);
`;

code = code.replace("} else if (model === 'ir.ui.menu' && action === 'search_read') {", additionalMocks + "          } else if (model === 'ir.ui.menu' && action === 'search_read') {");

fs.writeFileSync('src/services/odoo.ts', code);
