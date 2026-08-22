const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const fallbackStr = `'settings': 'res.config.settings', 'apps': 'ir.module.module'`;
const newFallbackStr = `'settings': 'res.config.settings', 'apps': 'ir.module.module',
    'users': 'res.users', 'companies': 'res.company', 'contacts': 'res.partner'`;

if (code.includes(fallbackStr)) {
    code = code.replace(fallbackStr, newFallbackStr);
} else {
    // try finding just settings
    const fallbackStr2 = `'settings': 'res.config.settings'`;
    if (code.includes(fallbackStr2)) {
        code = code.replace(fallbackStr2, `'settings': 'res.config.settings', 'apps': 'ir.module.module', 'users': 'res.users', 'companies': 'res.company', 'contacts': 'res.partner'`);
    } else {
        console.log("Could not patch fallback map in App.tsx!");
    }
}

// Modify resolveAction
// The prompt says: "When a menu item is clicked, parse its action field."
// "If action is a string (e.g. "ir.actions.act_window,123"), split it to get the action model and ID, then call"

const resolveActionRegex = /let actionId = menu.actionID \|\| menu.action;\s+if \(typeof actionId === 'string' && actionId.includes\(','\)\) {\s+actionId = parseInt\(actionId.split\(','\)\[1\]\);\s+}/;
const newResolveAction = `let actionId = menu.actionID || menu.action;
    // We pass the raw action string to odooClient.loadAction if it's a string, so it can parse "ir.actions.act_window,123"`;

code = code.replace(resolveActionRegex, newResolveAction);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx");
