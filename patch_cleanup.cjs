const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// Find all occurrences of '{showIdScanner && ('
const regex = /\{showIdScanner && \([\s\S]*?\{\/\* Edit Bio Modal \*\/\}/g;
const matches = code.match(regex);

if (matches && matches.length > 1) {
    // Keep the first one, which is the new one, remove the second one
    const firstMatch = matches[0];
    const secondMatch = matches[1];
    
    // Replace the second match with just the Edit Bio Modal comment
    code = code.replace(secondMatch, '{/* Edit Bio Modal */}');
    fs.writeFileSync('src/components/UserProfile.tsx', code);
    console.log("Removed duplicate modal");
} else {
    console.log("No duplicate found, or something else is wrong.");
}
