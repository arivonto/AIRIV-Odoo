const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicFormView.tsx', 'utf8');

code = code.replace("import { ChevronLeft, Save, Loader2, Search } from 'lucide-react';", "import { ChevronLeft, Save, Loader2, Search, Trash2 } from 'lucide-react';");

const saveFunction = `  const handleSave = async () => {`;
const deleteFunction = `  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    setDeleting(true);
    setError('');
    try {
      await odooClient.unlink(model, id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data');
      setDeleting(false);
    }
  };

  const handleSave = async () => {`;

code = code.replace(saveFunction, deleteFunction);

const saveButton = `<button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan</span>
        </button>`;

const buttons = `
        <div className="flex items-center gap-2">
          {id && (
            <button 
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan</span>
          </button>
        </div>`;

code = code.replace(saveButton, buttons);

fs.writeFileSync('src/components/DynamicFormView.tsx', code);
