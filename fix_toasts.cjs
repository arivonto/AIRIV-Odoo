const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `      fetchRecords();
      setToastMessage(editingRecord ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');`,
  `      fetchRecords();
      setToastMessage('Record deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');`
);

code = code.replace(
  `      setIsModalOpen(false);
      fetchRecords();
      setToastMessage('Record deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record');`,
  `      setIsModalOpen(false);
      fetchRecords();
      setToastMessage(editingRecord ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record');`
);

fs.writeFileSync(path, code);
