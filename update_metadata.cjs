const fs = require('fs');
let code = fs.readFileSync('metadata.json', 'utf8');
const data = JSON.parse(code);
if (!data.requestFramePermissions) data.requestFramePermissions = [];
if (!data.requestFramePermissions.includes("identity-credentials-get")) {
    data.requestFramePermissions.push("identity-credentials-get");
}
fs.writeFileSync('metadata.json', JSON.stringify(data, null, 2));
