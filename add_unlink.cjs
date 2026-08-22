const fs = require('fs');
const path = 'src/services/odoo.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  `  async deleteRecord(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  },`,
  `  async deleteRecord(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  },
  async unlinkRecord(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  },`
);
fs.writeFileSync(path, code);
