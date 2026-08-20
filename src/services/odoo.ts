import { OdooConfig } from '../types';

class OdooClient {
  private config: OdooConfig;
  private latency: number = 0;

  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig(): OdooConfig {
    const defaultConfig: OdooConfig = {
      url: '',
      db: '',
      username: '',
      apiKey: '',
      uid: null,
      useMock: false,
    };

    const stored = sessionStorage.getItem('odoo_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse odoo config');
      }
    }
    return defaultConfig;
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

    const { url } = this.config;
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
        throw new Error(`Invalid JSON response. The server returned HTML instead of JSON (likely a Cloudflare error page or offline tunnel). Preview: ${responseText.slice(0, 50)}...`);
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
      this.saveConfig({ db, username, apiKey, uid: 1, useMock: true });
      return 1;
    }

    const uid = await this.jsonRpc('common', 'authenticate', [db, username, apiKey, {}]);
    if (!uid) {
      throw new Error('Authentication failed: Invalid database, username, or API key.');
    }
    
    this.saveConfig({ db, username, apiKey, uid, useMock: false });
    return uid;
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
      uid = await this.authenticate(db, username, apiKey);
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

  // Helper Methods
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
    return new Promise((resolve) => {
      setTimeout(() => {
        if (service === 'common' && method === 'authenticate') resolve(1);
        
        if (service === 'object' && method === 'execute_kw') {
          const model = params[3];
          const action = params[4];
          
          if (model === 'crm.lead' && action === 'search_read') {
            resolve([
              { id: 1, name: 'ERP Implementation', partner_id: [1, 'PT ABC Makmur'], stage_id: [1, 'New'], expected_revenue: 150000000, probability: 10, phone: '08123456789', email_from: 'info@abcmakmur.co.id' },
              { id: 2, name: 'Cloud Migration', partner_id: [2, 'CV Tech Solusindo'], stage_id: [2, 'Qualified'], expected_revenue: 75000000, probability: 50, phone: '628987654321', email_from: 'contact@techsol.id' },
              { id: 3, name: 'Website Redesign', partner_id: [3, 'Toko Sejahtera'], stage_id: [3, 'Proposition'], expected_revenue: 25000000, probability: 80, phone: '08111222333', email_from: 'owner@sejahtera.com' },
              { id: 4, name: 'Maintenance Contract', partner_id: [1, 'PT ABC Makmur'], stage_id: [4, 'Won'], expected_revenue: 50000000, probability: 100, phone: '08123456789', email_from: 'info@abcmakmur.co.id' },
            ]);
          } else if (model === 'account.move' && action === 'search_read') {
            resolve([
              { id: 101, name: 'INV/2023/0001', partner_id: [1, 'PT ABC Makmur'], invoice_date: '2023-10-01', amount_untaxed: 10000000, amount_tax: 1100000, amount_total: 11100000, payment_state: 'not_paid', state: 'posted' },
              { id: 102, name: 'INV/2023/0002', partner_id: [2, 'CV Tech Solusindo'], invoice_date: '2023-10-05', amount_untaxed: 25000000, amount_tax: 2750000, amount_total: 27750000, payment_state: 'paid', state: 'posted' },
              { id: 103, name: 'INV/2023/0003', partner_id: [4, 'UD Maju Bersama'], invoice_date: '2023-10-15', amount_untaxed: 5000000, amount_tax: 550000, amount_total: 5550000, payment_state: 'partial', state: 'posted' },
            ]);
          } else if (model === 'product.template' && action === 'search_read') {
            resolve([
              { id: 201, name: 'ERP Enterprise License', default_code: 'LIC-ERP', list_price: 15000000, qty_available: 99, standard_price: 0 },
              { id: 202, name: 'Server Hardware Type A', default_code: 'HW-SRV-A', list_price: 35000000, qty_available: 2, standard_price: 25000000 },
              { id: 203, name: 'Network Switch 24-port', default_code: 'HW-NET-24', list_price: 5500000, qty_available: 15, standard_price: 4000000 },
              { id: 204, name: 'Consulting Hour', default_code: 'SRV-CSL', list_price: 1500000, qty_available: 1000, standard_price: 500000 },
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
