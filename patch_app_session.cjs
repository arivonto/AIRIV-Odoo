const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  `return <CrudView key={activeMenu.id} menu={activeMenu} />;`,
  `return <CrudView key={activeMenu.id} menu={activeMenu} session={session} />;`
);
fs.writeFileSync('src/App.tsx', appCode);

let crudCode = fs.readFileSync('src/components/CrudView.tsx', 'utf8');
crudCode = crudCode.replace(
  `interface CrudViewProps {\n  menu: any;\n}`,
  `interface CrudViewProps {\n  menu: any;\n  session?: any;\n}`
);
crudCode = crudCode.replace(
  `export const CrudView: React.FC<CrudViewProps> = ({ menu }) => {`,
  `export const CrudView: React.FC<CrudViewProps> = ({ menu, session }) => {`
);
fs.writeFileSync('src/components/CrudView.tsx', crudCode);
