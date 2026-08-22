const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetResolveAction = `  const resolveAction = async (menu: any) => {
    setActiveAction(null);`;

const replacementResolveAction = `  const [isResolving, setIsResolving] = useState(false);
  const resolveAction = async (menu: any) => {
    setIsResolving(true);
    setActiveAction(null);`;

code = code.replace(targetResolveAction, replacementResolveAction);

const targetResolveActionEnd1 = `    // Fallback if actionId missing or failed
    if (fallbackModel) {
      setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
    } else {
      setActiveAction({ error: \`No valid action or fallback model found for "\${menu.name}".\` });
    }
  };`;

const replacementResolveActionEnd1 = `    // Fallback if actionId missing or failed
    if (fallbackModel) {
      setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
    } else {
      setActiveAction({ error: \`No valid action or fallback model found for "\${menu.name}".\` });
    }
    setIsResolving(false);
  };`;
code = code.replace(targetResolveActionEnd1, replacementResolveActionEnd1);

const targetResolveActionEnd2 = `        if (loadedAction && loadedAction.res_model) {
          setActiveAction(loadedAction);
          return;
        } else if (loadedAction && loadedAction.type) {
           // Action exists but no res_model (e.g. client action)
           if (fallbackModel) {
              setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
           } else {
              setActiveAction({ error: \`Action \${loadedAction.type} not fully supported here, and no fallback model available for \${menu.name}.\` });
           }
           return;
        }`;

const replacementResolveActionEnd2 = `        if (loadedAction && loadedAction.res_model) {
          setActiveAction(loadedAction);
          setIsResolving(false);
          return;
        } else if (loadedAction && loadedAction.type) {
           // Action exists but no res_model (e.g. client action)
           if (fallbackModel) {
              setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
           } else {
              setActiveAction({ error: \`Action \${loadedAction.type} not fully supported here, and no fallback model available for \${menu.name}.\` });
           }
           setIsResolving(false);
           return;
        }`;
code = code.replace(targetResolveActionEnd2, replacementResolveActionEnd2);

const targetRenderContent = `    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <LayoutGrid className="w-16 h-16 mb-4 text-slate-300" />
        <p>Select a module to view records</p>
      </div>
    );`;

const replacementRenderContent = `    if (isResolving) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-10 h-10 mb-4 animate-spin text-indigo-400" />
          <p>Loading module...</p>
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <LayoutGrid className="w-16 h-16 mb-4 text-slate-300" />
        <p>Select a module to view records</p>
      </div>
    );`;
code = code.replace(targetRenderContent, replacementRenderContent);

fs.writeFileSync('src/App.tsx', code);
