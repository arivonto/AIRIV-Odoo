import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { AccountMove } from '../types';
import { formatIDR, formatWIBDate, sanitizeWhatsApp } from '../lib/utils';
import { Plus, Search, FileText, MessageSquare, Download } from 'lucide-react';

export function InvoiceList() {
  const [invoices, setInvoices] = useState<AccountMove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await odooClient.getInvoices();
      setInvoices(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (state: string, paymentState: string) => {
    if (state === 'draft') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Draft</span>;
    }
    if (state === 'cancel') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Cancelled</span>;
    }
    
    switch (paymentState) {
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span>;
      case 'partial':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partial</span>;
      case 'not_paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Unpaid</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Posted</span>;
    }
  };

  const handleSendWA = (invoice: AccountMove) => {
    // In a real app, we'd fetch the partner's phone number here or include it in the initial read
    // Using a placeholder phone for demonstration based on requirements
    const phone = sanitizeWhatsApp('08123456789'); // Simulated partner phone
    const partnerName = invoice.partner_id ? invoice.partner_id[1] : 'Pelanggan Terhormat';
    
    const message = `Halo ${partnerName},\n\nBerikut adalah tagihan (Invoice) dengan nomor *${invoice.name}*.\n\nTotal Tagihan: *${formatIDR(invoice.amount_total)}*\nStatus: ${invoice.payment_state === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}\n\nMohon segera melakukan pembayaran ke rekening kami.\n\nTerima kasih,\nAIRIV ERP`;
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.partner_id && inv.partner_id[1].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
        <div className="h-16 border-b border-slate-200 bg-slate-50"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 border-b border-slate-100 flex items-center px-6 gap-6">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-8 bg-slate-200 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium text-rose-800 mb-2">Error Loading Invoices</h3>
        <p className="text-rose-600 mb-4">{error}</p>
        <button onClick={fetchInvoices} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
            placeholder="Search invoices by number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Number
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-900">No invoices found</p>
                      <p className="text-xs">We couldn't find any invoices matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-bold text-xs text-indigo-600">{invoice.name}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-slate-900 text-xs font-medium">{invoice.partner_id ? invoice.partner_id[1] : 'Unknown'}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-slate-500 text-[10px]">{formatWIBDate(invoice.invoice_date)}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="text-slate-900 text-xs font-bold">{formatIDR(invoice.amount_total)}</div>
                      <div className="text-[10px] text-slate-400">DPP: {formatIDR(invoice.amount_untaxed)}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      {getStatusBadge(invoice.state, invoice.payment_state)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors" title="Download PDF">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleSendWA(invoice)}
                          className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition-colors" 
                          title="Send WA Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
