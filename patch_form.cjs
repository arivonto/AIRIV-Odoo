const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicFormView.tsx', 'utf8');

code = code.replace(/} catch \(err: any\) {/g, `} catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('access error')) {
        setError('Access Denied: You do not have permission to view or edit this record.');
      } else {
        setError(msg);
      }
      return;`);

fs.writeFileSync('src/components/DynamicFormView.tsx', code);
