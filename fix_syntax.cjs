const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const startTag = '{/* Identity Scanner Modal */}';
const endTag = '{/* Edit Bio Modal */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newModal = fs.readFileSync('modal.txt', 'utf8');
  code = code.substring(0, startIndex) + newModal + code.substring(endIndex);
  fs.writeFileSync('src/components/UserProfile.tsx', code);
}
