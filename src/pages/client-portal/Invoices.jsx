import { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, AlertTriangle, Loader } from 'lucide-react';
import api from '../../utils/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await api.get('/invoices');
        setInvoices(res.data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleDownload = (id) => {
    alert(`Downloading invoice ${id}...`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices & Payments</h1>
          <p className="text-slate-500 text-sm">View and manage your project billing history.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-right hidden sm:block">
          <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold block mb-1">Total Outstanding</span>
          <span className="text-xl font-bold text-slate-800">${totalOutstanding.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Project</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{invoice.invoiceNumber || invoice._id.slice(-8)}</td>
                <td className="px-6 py-4 hidden md:table-cell">{invoice.projectId?.name || '---'}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">${(invoice.totalAmount || 0).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {invoice.status === 'paid' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDownload(invoice._id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
