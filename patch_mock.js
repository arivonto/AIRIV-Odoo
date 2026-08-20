const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

const additionalMocks = `
          } else if (model === 'ir.ui.menu' && action === 'search_read') {
            resolve([
              { id: 1, name: 'Sales', action: 'ir.actions.act_window,101', child_id: [11] },
              { id: 2, name: 'CRM', action: 'ir.actions.act_window,102', child_id: [12] },
              { id: 3, name: 'Invoicing', action: 'ir.actions.act_window,103', child_id: [13] },
            ]);
          } else if (model === 'ir.actions.act_window' && action === 'search_read') {
            const actId = params[2][0][2];
            if (actId === 101) resolve([{ res_model: 'sale.order' }]);
            else if (actId === 102) resolve([{ res_model: 'crm.lead' }]);
            else if (actId === 103) resolve([{ res_model: 'account.move' }]);
            else resolve([{ res_model: 'product.template' }]);
          } else if (action === 'fields_get') {
            if (model === 'sale.order') {
               resolve({
                  name: { string: 'Order Reference', type: 'char', required: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner', required: true },
                  date_order: { string: 'Order Date', type: 'datetime' },
                  amount_total: { string: 'Total', type: 'monetary' },
                  state: { string: 'Status', type: 'selection', selection: [['draft', 'Quotation'], ['sale', 'Sales Order']] }
               });
            } else if (model === 'crm.lead') {
               resolve({
                  name: { string: 'Opportunity', type: 'char', required: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner' },
                  expected_revenue: { string: 'Expected Revenue', type: 'monetary' },
                  probability: { string: 'Probability (%)', type: 'float' },
                  active: { string: 'Active', type: 'boolean' }
               });
            } else if (model === 'account.move') {
               resolve({
                  name: { string: 'Number', type: 'char', readonly: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner' },
                  invoice_date: { string: 'Invoice Date', type: 'date' },
                  amount_total: { string: 'Total', type: 'monetary' },
                  payment_state: { string: 'Payment Status', type: 'selection', selection: [['not_paid', 'Not Paid'], ['paid', 'Paid']] }
               });
            } else {
               resolve({ name: { string: 'Name', type: 'char' }});
            }
          } else if (model === 'sale.order' && action === 'search_read') {
            resolve([
              { id: 1, name: 'S0001', partner_id: [1, 'PT ABC Makmur'], date_order: '2023-10-01 10:00:00', amount_total: 15000000, state: 'sale' },
              { id: 2, name: 'S0002', partner_id: [2, 'CV Tech Solusindo'], date_order: '2023-10-02 11:30:00', amount_total: 25000000, state: 'draft' }
            ]);
`;

code = code.replace("} else if (action === 'create' || action === 'write') {", additionalMocks + "          } else if (action === 'create' || action === 'write') {");

fs.writeFileSync('src/services/odoo.ts', code);
