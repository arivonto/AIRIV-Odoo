const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLine = 'let actionId = menu.actionID || menu.action;';
const newLine = 'let actionId = menu.action || menu.actionID;';

code = code.replace(oldLine, newLine);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated actionId priority");
