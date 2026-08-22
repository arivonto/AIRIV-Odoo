const fs = require('fs');
let code = fs.readFileSync('src/components/CrudView.tsx', 'utf8');

// Add state
code = code.replace(
  /const \[isModalOpen, setIsModalOpen\] = useState\(false\);/,
  `const [isModalOpen, setIsModalOpen] = useState(false);\n  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);`
);

// Update handleDelete
code = code.replace(
  /const handleDelete = async \(id: number\) => {[\s\S]*?};\n/,
  `const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await odooService.unlinkRecord(menu.model, deleteConfirmId);
      fetchRecords();
      setToastMessage('Record deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setDeleteConfirmId(null);
    }
  };\n`
);

// Add delete modal
code = code.replace(
  /\{isModalOpen && \(/,
  `{deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Confirm Deletion</h2>
            </div>
            <div className="p-6 text-slate-600">
              Are you sure you want to delete this record? This action cannot be undone.
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (`
);

fs.writeFileSync('src/components/CrudView.tsx', code);
