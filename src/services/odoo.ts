export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  uid: number | null;
  session_id?: string | null;
  name?: string | null;
  company_id?: number | null;
  useMock: boolean;
}

class OdooClient {
  private config: OdooConfig = {
    url: '',
    db: '',
    username: '',
    apiKey: '',
    uid: null,
    session_id: null,
    name: null,
    company_id: null,
    useMock: false,
  };

  private latency: number = 0;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const defaultConfig = {
      url: '',
      db: '',
      username: '',
      apiKey: '',
      uid: null,
      session_id: null,
      name: null,
      company_id: null,
      useMock: true,
    };
    const stored = sessionStorage.getItem('odoo_config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.config = { ...defaultConfig, ...parsed };
        return;
      } catch (e) {
        console.error('Failed to parse odoo config');
      }
    }
    this.config = defaultConfig;
  }

  saveConfig(newConfig: Partial<OdooConfig>) {
    this.config = { ...this.config, ...newConfig };
    sessionStorage.setItem('odoo_config', JSON.stringify(this.config));
  }

  clearConfig() {
    this.config = {
      url: '',
      db: '',
      username: '',
      apiKey: '',
      uid: null,
      session_id: null,
      name: null,
      company_id: null,
      useMock: false,
    };
    sessionStorage.removeItem('odoo_config');
  }

  getConfig() {
    return this.config;
  }

  getLatency() {
    return this.latency;
  }

  async jsonRpc(service: string, method: string, args: any[]) {
    if (this.config.useMock) {
      return this.mockRpc(service, method, args);
    }

    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');

    const endpoint = '/api/jsonrpc';
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      // Include session_id in a Cookie header if we were direct, but since we use a proxy,
      // Odoo handles JSON-RPC without session if we pass apiKey via common, or if we need
      // session for web endpoints. Wait, standard execute_kw does not require session_id,
      // just uid and password/apiKey. So we leave it as is for `execute_kw`.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-odoo-url': url
        },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);

      let data;
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = JSON.parse(responseText);
          if (errData.error?.message) errorMsg = errData.error.message;
        } catch (e) {} // Not JSON
        throw new Error(errorMsg);
      }

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response. The server returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`);
      }
      
      if (data.error) {
        const errorMsg = data.error.data?.message || data.error.message || 'Unknown Odoo error';
        
        if (errorMsg.toLowerCase().includes('access denied') || errorMsg.toLowerCase().includes('authentication') || errorMsg.toLowerCase().includes('expected singleton')) {
          this.clearConfig();
          throw new Error(`Authentication Expired: ${errorMsg}`);
        }
        throw new Error(errorMsg);
      }

      return data.result;
    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Could not reach Odoo via proxy. Ensure your Cloudflare tunnel is running and reachable. Details: ${error.message}`);
      }
      throw new Error(`Odoo RPC failed: ${error.message || 'Unknown network error'}`);
    }
  }

  async authenticate(db: string, username: string, apiKey: string) {
    if (this.config.useMock) {
      const mockResult = { uid: 1, session_id: 'mock_session_123', name: 'Admin (Mock)', company_id: 1 };
      this.saveConfig({ db, username, apiKey, ...mockResult, useMock: true });
      return mockResult;
    }

    const { url } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');

    const endpoint = '/api/web/session/authenticate';
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        db: db,
        login: username,
        password: apiKey
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-odoo-url': url
        },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);

      const data = await response.json();
      
      if (data.error) {
        const errorMsg = data.error.data?.message || data.error.message || 'Authentication failed';
        throw new Error(errorMsg);
      }

      const result = data.result;
      
      if (!result || !result.uid) {
        throw new Error('Authentication failed: Invalid credentials.');
      }
      
      this.saveConfig({ 
        db, 
        username, 
        apiKey, 
        uid: result.uid,
        session_id: result.session_id,
        name: result.name,
        company_id: result.company_id,
        useMock: false 
      });
      
      return result;
    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      throw new Error(`Auth failed: ${error.message || 'Unknown network error'}`);
    }
  }

  async executeKw(model: string, method: string, args: any[] = [], kwargs: any = {}) {
    let { db, uid, apiKey, useMock, username } = this.config;
    
    if (useMock) {
      return this.mockRpc('object', 'execute_kw', [db, uid, apiKey, model, method, args, kwargs]);
    }

    if (!db || !apiKey) {
      throw new Error('Not authenticated. Please configure settings first.');
    }

    // Auto-authenticate if we have credentials but no active session UID
    if (!uid) {
      const authResult = await this.authenticate(db, username, apiKey);
      uid = authResult.uid;
    }

    return this.jsonRpc('object', 'execute_kw', [
      db,
      uid,
      apiKey,
      model,
      method,
      args,
      kwargs
    ]);
  }

  async loadAction(actionId: number | string) {
    if (this.config.useMock) {
      return {
        res_model: 'mock.model',
        name: 'Mock Action',
        type: 'ir.actions.act_window',
        views: [['list', 'tree'], ['form', 'form']],
        domain: [],
        context: {}
      };
    }

    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');
    
    // Fallback to execute_kw if no session_id is available (though this might fail for non-admins)
    if (!session_id) {
       console.warn('Session ID is missing, falling back to executeKw for action load.');
       const actionData = await this.executeKw('ir.actions.act_window', 'search_read', [[['id', '=', typeof actionId === 'string' ? parseInt(actionId, 10) : actionId]]], {
          limit: 1
       });
       return actionData.length > 0 ? actionData[0] : null;
    }

    const endpoint = '/api/web/action/load';
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        action_id: typeof actionId === 'string' ? parseInt(actionId, 10) : actionId,
        additional_context: {}
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-odoo-url': url,
          'x-odoo-session-id': session_id
        },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Action load failed');
      }

      return data.result;
    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      throw new Error(`Load action failed: ${error.message || 'Unknown error'}`);
    }
  }

  async loadMenus() {
    if (this.config.useMock) {
      return {
        root: {
          id: 'root',
          children: [1, 2, 3]
        },
        1: { id: 1, name: 'Sales', actionID: 101, appID: 1, children: [11], xmlid: 'sale.menu_root' },
        11: { id: 11, name: 'Quotations', actionID: 101, appID: 1, children: [], xmlid: 'sale.menu_quotations' },
        2: { id: 2, name: 'CRM', actionID: 102, appID: 2, children: [12], xmlid: 'crm.crm_menu_root' },
        12: { id: 12, name: 'Pipeline', actionID: 102, appID: 2, children: [], xmlid: 'crm.crm_menu_pipeline' },
        3: { id: 3, name: 'Invoicing', actionID: 103, appID: 3, children: [13], xmlid: 'account.menu_finance' },
        13: { id: 13, name: 'Invoices', actionID: 103, appID: 3, children: [], xmlid: 'account.menu_finance_receivables' }
      };
    }

    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL is not configured');
    if (!session_id) throw new Error('Session ID is missing, please re-authenticate.');

    const endpoint = '/api/web/menu/load_menus';
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        root_id: false
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-odoo-url': url,
          'x-odoo-session-id': session_id
        },
        body: JSON.stringify(payload),
      });

      this.latency = Math.round(performance.now() - startTime);

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Menu load failed');
      }

      return data.result;
    } catch (error: any) {
      this.latency = Math.round(performance.now() - startTime);
      throw new Error(`Load menus failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Helper Methods for backward compatibility or direct calls
  async getLeads() {
    return this.executeKw('crm.lead', 'search_read', [[['active', '=', true]]], {
      fields: ['id', 'name', 'partner_id', 'stage_id', 'expected_revenue', 'probability', 'phone', 'email_from'],
      limit: 20,
    });
  }

  async createLead(data: any) {
    return this.executeKw('crm.lead', 'create', [data]);
  }

  async updateLead(id: number, data: any) {
    return this.executeKw('crm.lead', 'write', [[id], data]);
  }

  async getInvoices() {
    return this.executeKw('account.move', 'search_read', [[['move_type', 'in', ['out_invoice', 'out_refund']]]], {
      fields: ['id', 'name', 'partner_id', 'invoice_date', 'amount_total', 'amount_untaxed', 'amount_tax', 'amount_residual', 'payment_state', 'state'],
      limit: 25,
    });
  }

  async getProducts() {
    return this.executeKw('product.template', 'search_read', [[['sale_ok', '=', true]]], {
      fields: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'standard_price', 'categ_id'],
      limit: 30,
    });
  }

  // Mocks
  private mockRpc(service: string, method: string, params: any[]) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (service === 'common' && method === 'authenticate') resolve(1);
        
        if (service === 'object' && method === 'execute_kw') {
          const model = params[3];
          const action = params[4];
          
          if (model === 'crm.lead' && action === 'search_read') {
            resolve([
              { id: 1, name: 'ERP Implementation', partner_id: [1, 'PT ABC Makmur'], stage_id: [1, 'New'], expected_revenue: 150000000, probability: 10, phone: '08123456789', email_from: 'info@abcmakmur.co.id' },
              { id: 2, name: 'Cloud Migration', partner_id: [2, 'CV Tech Solusindo'], stage_id: [2, 'Qualified'], expected_revenue: 75000000, probability: 50, phone: '628987654321', email_from: 'contact@techsol.id' },
            ]);
          } else if (model === 'account.move' && action === 'search_read') {
            resolve([
              { id: 101, name: 'INV/2023/0001', partner_id: [1, 'PT ABC Makmur'], invoice_date: '2023-10-01', amount_untaxed: 10000000, amount_tax: 1100000, amount_total: 11100000, payment_state: 'not_paid', state: 'posted' },
              { id: 102, name: 'INV/2023/0002', partner_id: [2, 'CV Tech Solusindo'], invoice_date: '2023-10-05', amount_untaxed: 25000000, amount_tax: 2750000, amount_total: 27750000, payment_state: 'paid', state: 'posted' },
            ]);
          } else if (model === 'product.template' && action === 'search_read') {
            resolve([
              { id: 201, name: 'ERP Enterprise License', default_code: 'LIC-ERP', list_price: 15000000, qty_available: 99, standard_price: 0 },
              { id: 202, name: 'Server Hardware Type A', default_code: 'HW-SRV-A', list_price: 35000000, qty_available: 2, standard_price: 25000000 },
            ]);
          
          } else if (model === 'ir.module.category' && action === 'search_read') {
            resolve([
              { id: 1, name: 'Sales', parent_id: false, sequence: 10 },
              { id: 2, name: 'Accounting', parent_id: false, sequence: 20 },
              { id: 3, name: 'Inventory', parent_id: false, sequence: 30 },
              { id: 4, name: 'Hidden', parent_id: false, sequence: 100 },
            ]);
          } else if (model === 'ir.module.module' && action === 'search_read') {
            resolve([
              { id: 1, name: 'sale_management', shortdesc: 'Sales', category_id: [1, 'Sales'], icon_image: false, sequence: 10 },
              { id: 2, name: 'crm', shortdesc: 'CRM', category_id: [1, 'Sales'], icon_image: false, sequence: 15 },
              { id: 3, name: 'account', shortdesc: 'Invoicing', category_id: [2, 'Accounting'], icon_image: false, sequence: 10 },
              { id: 4, name: 'stock', shortdesc: 'Inventory', category_id: [3, 'Inventory'], icon_image: false, sequence: 10 },
            ]);
          } else if (model === 'ir.ui.menu' && action === 'search_read') {
            resolve([
              { id: 1, name: 'Sales', complete_name: 'Sales', action: 'ir.actions.act_window,101', child_id: [11], parent_id: false, web_icon: 'sale_management,static/description/icon.png', sequence: 10 },
              { id: 2, name: 'CRM', complete_name: 'CRM', action: 'ir.actions.act_window,102', child_id: [12], parent_id: false, web_icon: 'crm,static/description/icon.png', sequence: 15 },
              { id: 3, name: 'Invoicing', complete_name: 'Invoicing', action: 'ir.actions.act_window,103', child_id: [13], parent_id: false, web_icon: 'account,static/description/icon.png', sequence: 20 },
              { id: 4, name: 'Settings (No Action)', complete_name: 'Settings', action: false, child_id: [14], parent_id: false, web_icon: 'base,static/description/icon.png', sequence: 100 },
            ]);
          } else if (model === 'ir.actions.act_window' && action === 'search_read') {
            const domainArg = params[5] && params[5][0] ? params[5][0] : [];
            let actId = null;
            if (domainArg.length > 0 && domainArg[0][0] === 'id') {
               actId = domainArg[0][2];
            } else if (params[5] && params[5].length > 0) {
               // Fallback if they pass raw ID array directly in kwargs or args
               actId = Array.isArray(params[5]) && Array.isArray(params[5][0]) ? params[5][0][0] : null;
            }

            if (!actId && params[5] && params[5].length > 0) {
               if (typeof params[5][0] === 'number') actId = params[5][0];
            }
            
            // Try matching domain
            if (params[5] && Array.isArray(params[5])) {
               const idDomain = params[5].find((d: any) => d[0] === 'id');
               if (idDomain) actId = idDomain[2];
            }
            
            // Or raw array matching executeKw('ir.actions.act_window', 'search_read', [[['id', '=', 101]]])
            if (Array.isArray(params[5]) && Array.isArray(params[5][0]) && params[5][0][0] === 'id') {
               actId = params[5][0][2];
            }

            // A robust check for the mock
            let finalId = parseInt(String(actId)) || 101;
            const searchDomain = JSON.stringify(params[5] || []);
            if (searchDomain.includes('101')) finalId = 101;
            if (searchDomain.includes('102')) finalId = 102;
            if (searchDomain.includes('103')) finalId = 103;

            if (finalId === 101) resolve([{ id: 101, name: 'Sales Orders', res_model: 'sale.order', domain: "[('state', 'in', ['sale', 'done'])]", context: "{'default_state': 'sale'}", views: [['list', 'tree'], ['form', 'form']] }]);
            else if (finalId === 102) resolve([{ id: 102, name: 'Pipeline', res_model: 'crm.lead', domain: "[]", context: "{}", views: [['kanban', 'kanban'], ['list', 'tree'], ['form', 'form']] }]);
            else if (finalId === 103) resolve([{ id: 103, name: 'Invoices', res_model: 'account.move', domain: "[('move_type', '=', 'out_invoice')]", context: "{}", views: [['list', 'tree'], ['form', 'form']] }]);
            else resolve([{ id: finalId, name: 'Template Action', res_model: 'product.template', domain: "[]", context: "{}", views: [['list', 'tree']] }]);
          } else if (action === 'fields_get') {
            if (model === 'sale.order') {
               resolve({
                  name: { string: 'Order Reference', type: 'char', required: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner', required: true },
                  date_order: { string: 'Order Date', type: 'datetime' },
                  amount_total: { string: 'Total', type: 'monetary' },
                  state: { string: 'Status', type: 'selection', selection: [['draft', 'Quotation'], ['sale', 'Sales Order']] },
                  image_1920: { string: 'Image', type: 'binary' },
                  order_line: { string: 'Order Lines', type: 'one2many', relation: 'sale.order.line' }
               });
            } else if (model === 'crm.lead') {
               resolve({
                  name: { string: 'Opportunity', type: 'char', required: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner' },
                  expected_revenue: { string: 'Expected Revenue', type: 'monetary' },
                  probability: { string: 'Probability (%)', type: 'float' },
                  active: { string: 'Active', type: 'boolean' }
               });
            } else if (model === 'account.move') {
               resolve({
                  name: { string: 'Number', type: 'char', readonly: true },
                  partner_id: { string: 'Customer', type: 'many2one', relation: 'res.partner' },
                  invoice_date: { string: 'Invoice Date', type: 'date' },
                  amount_total: { string: 'Total', type: 'monetary' },
                  payment_state: { string: 'Payment Status', type: 'selection', selection: [['not_paid', 'Not Paid'], ['paid', 'Paid']] }
               });
            } else {
               resolve({ name: { string: 'Name', type: 'char' }});
            }
          } else if (model === 'sale.order' && action === 'search_read') {
            resolve([
              { id: 1, name: 'S0001', partner_id: [1, 'PT ABC Makmur'], date_order: '2023-10-01 10:00:00', amount_total: 15000000, state: 'sale' },
              { id: 2, name: 'S0002', partner_id: [2, 'CV Tech Solusindo'], date_order: '2023-10-02 11:30:00', amount_total: 25000000, state: 'draft' }
            ]);
          } else if (action === 'create' || action === 'write') {
             resolve(true); // Mock success
          } else {
             resolve([]);
          }
        }
      }, 500); // Simulate network latency
    });
  }
}

export const odooClient = new OdooClient();
