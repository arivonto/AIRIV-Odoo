const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

const stateRegex = /const \[isSaving, setIsSaving\] = useState\(false\);/;
code = code.replace(stateRegex, `const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
`);

const handleSaveSuccessRegex = /fetchRecords\(\);\n    \} catch \(err: any\) \{/;
code = code.replace(handleSaveSuccessRegex, `fetchRecords();
      setToastMessage(editingRecord ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {`);

const handleDeleteSuccessRegex = /fetchRecords\(\);\n    \} catch \(err: any\) \{/;
code = code.replace(handleDeleteSuccessRegex, `fetchRecords();
      setToastMessage('Record deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {`);

const toastRender = `      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <Check className="w-5 h-5" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}
      {isModalOpen && (`;

code = code.replace(/      \{isModalOpen && \(/, toastRender);

const importsRegex = /import \{ Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X \} from 'lucide-react';/;
code = code.replace(importsRegex, `import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';`);

fs.writeFileSync(path, code);
