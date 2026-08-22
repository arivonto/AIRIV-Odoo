const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

const targetStr = `      } catch (fErr: any) {
        console.warn(\`fields_get failed for \${model}: \${fErr.message}.\`);
        setMetadataWarning(\`Metadata restricted for \${model}. Displaying basic fields.\`);
        fieldsData = {
          id: { string: 'ID', type: 'integer' },
          name: { string: 'Name', type: 'char' },
          display_name: { string: 'Display Name', type: 'char' },
          create_date: { string: 'Created On', type: 'datetime' }
        };
      }`;

const newStr = `      } catch (fErr: any) {
        console.warn(\`fields_get failed for \${model}: \${fErr.message}.\`);
        setMetadataWarning(\`Metadata restricted for \${model}. Displaying basic fields.\`);
        
        let fallbackFields: any = {
          id: { string: 'ID', type: 'integer' },
          name: { string: 'Name', type: 'char' },
          display_name: { string: 'Display Name', type: 'char' },
          create_date: { string: 'Created On', type: 'datetime' }
        };
        
        if (model === 'res.users') {
          fallbackFields = {
             id: { string: 'ID', type: 'integer' },
             name: { string: 'Name', type: 'char' },
             login: { string: 'Login', type: 'char' },
             company_id: { string: 'Company', type: 'many2one' }
          };
        } else if (model === 'res.company') {
          fallbackFields = {
             id: { string: 'ID', type: 'integer' },
             name: { string: 'Company Name', type: 'char' },
             email: { string: 'Email', type: 'char' }
          };
        } else if (model === 'res.partner') {
          fallbackFields = {
             id: { string: 'ID', type: 'integer' },
             name: { string: 'Name', type: 'char' },
             email: { string: 'Email', type: 'char' },
             phone: { string: 'Phone', type: 'char' }
          };
        } else if (model === 'ir.module.module') {
          fallbackFields = {
             id: { string: 'ID', type: 'integer' },
             name: { string: 'Name', type: 'char' },
             shortdesc: { string: 'Description', type: 'char' },
             state: { string: 'Status', type: 'char' }
          };
        }
        
        fieldsData = fallbackFields;
      }`;

code = code.replace(targetStr, newStr);

// Also we should ensure validFields has these for standard search_read if they exist
const targetFilter = `        .filter(([k, v]: [string, any]) => 
          k === 'id' || 
          k === 'name' || 
          k === 'display_name' || 
          priorityFields.includes(k) || 
          (Object.keys(fieldsData).length < 6)
        )`;
        
const newFilter = `        .filter(([k, v]: [string, any]) => 
          k === 'id' || 
          k === 'name' || 
          k === 'display_name' || 
          k === 'login' ||
          k === 'company_id' ||
          k === 'email' ||
          k === 'phone' ||
          k === 'shortdesc' ||
          priorityFields.includes(k) || 
          (Object.keys(fieldsData).length < 6)
        )`;

code = code.replace(targetFilter, newFilter);

fs.writeFileSync('src/components/DynamicListView.tsx', code);
console.log("Updated DynamicListView.tsx with fallback models");
