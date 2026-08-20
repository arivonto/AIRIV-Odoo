export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  uid?: number | null;
  useMock?: boolean;
}

export interface CrmLead {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  stage_id: [number, string] | false;
  expected_revenue: number;
  probability: number;
  phone: string;
  email_from: string;
}

export interface AccountMove {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  invoice_date: string;
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  amount_residual?: number;
  payment_state: string;
  state: string;
}

export interface ProductTemplate {
  id: number;
  name: string;
  default_code: string;
  list_price: number;
  qty_available: number;
  standard_price: number;
  categ_id?: [number, string] | false;
}
