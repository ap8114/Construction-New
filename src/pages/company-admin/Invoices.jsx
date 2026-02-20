import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Download, Search, Filter, DollarSign,
    Trash2, CreditCard, Send, MoreHorizontal, Save, Loader, Eye
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';

const Invoices = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [items, setItems] = useState([{ id: 1, description: '', quantity: 1, unitPrice: 0 }]);
    const [formData, setFormData] = useState({ projectId: '', clientId: '', dueDate: '', invoiceNumber: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invRes, projRes, clientRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/projects'),
                api.get('/auth/users?role=CLIENT')
            ]);
            setInvoices(invRes.data);
            setProjects(projRes.data);
            setClients(clientRes.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            alert('Failed to load data: ' + (error.response?.data?.message || error.message) + '. Please try logging out and back in.');
        } finally {
            setLoading(false);
        }
    };

    const generateNextInvoiceNumber = (currentInvoices) => {
        const invList = currentInvoices || invoices;
        if (invList.length === 0) return 'INV-001';

        const numbers = invList
            .map(inv => {
                const numPart = inv.invoiceNumber?.split('-')[1];
                return numPart ? parseInt(numPart) : 0;
            })
            .filter(num => !isNaN(num));

        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNum = maxNum + 1;
        return `INV-${String(nextNum).padStart(3, '0')}`;
    };

    const openCreateModal = () => {
        const nextNumber = generateNextInvoiceNumber();
        setFormData({ projectId: '', clientId: '', dueDate: '', invoiceNumber: nextNumber });
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchData();
    }, [isModalOpen]);

    const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
    const removeItem = (id) => setItems(items.filter(i => i.id !== id));

    const updateItem = (id, field, value) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleSave = async () => {
        try {
            if (!formData.projectId || !formData.clientId) {
                alert('Please select both a Project and a Client.');
                return;
            }
            setIsSubmitting(true);
            const total = calculateTotal();
            const payload = {
                ...formData,
                items: items.map(({ description, quantity, unitPrice }) => ({
                    description,
                    quantity,
                    unitPrice,
                    total: quantity * unitPrice
                })),
                totalAmount: total,
                status: 'unpaid'
            };
            await api.post('/invoices', payload);
            await fetchData();
            setIsModalOpen(false);
            setFormData({ projectId: '', clientId: '', dueDate: '', invoiceNumber: '' });
            setItems([{ id: 1, description: '', quantity: 1, unitPrice: 0 }]);
        } catch (error) {
            console.error('Error creating invoice:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await api.delete(`/invoices/${id}`);
                setInvoices(invoices.filter(inv => inv._id !== id));
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    // Derived Stats
    const stats = {
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0),
        outstanding: invoices.filter(i => ['unpaid', 'partially_paid'].includes(i.status)).reduce((sum, i) => sum + (i.totalAmount || 0), 0),
        overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };

    const formatStatus = (status) => {
        if (!status) return '---';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                    <p className="text-slate-500 text-sm">Create and manage client invoices.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium"
                >
                    <Plus size={18} /> Create Invoice
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Revenue (Paid)</p>
                        <p className="text-xl font-bold text-slate-800">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Outstanding</p>
                        <p className="text-xl font-bold text-slate-800">${stats.outstanding.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Overdue</p>
                        <p className="text-xl font-bold text-slate-800">${stats.overdue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search invoice #"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-2 text-sm">
                        <Filter size={18} /> Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.filter(i => i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || i.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((inv) => (
                                <tr
                                    key={inv._id}
                                    className="hover:bg-slate-50 transition cursor-pointer group"
                                    onClick={() => navigate(`/company-admin/invoices/${inv._id}`)}
                                >
                                    <td className="px-6 py-4 font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4">{inv.projectId?.name || '---'}</td>
                                    <td className="px-6 py-4">{inv.clientId?.fullName || '---'}</td>
                                    <td className="px-6 py-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '---'}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">${inv.totalAmount?.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold 
                            ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                    ['unpaid', 'partially_paid'].includes(inv.status) ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'}`}>
                                            {formatStatus(inv.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => navigate(`/company-admin/invoices/${inv._id}`)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/company-admin/invoices/${inv._id}?print=true`)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(inv._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Invoice">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                            <select
                                required
                                value={formData.projectId}
                                onChange={e => {
                                    const selectedProjectId = e.target.value;
                                    const project = projects.find(p => p._id === selectedProjectId);

                                    // Only update client if the project has one, otherwise keep current or reset
                                    const associatedClientId = project?.clientId?._id;

                                    setFormData(prev => ({
                                        ...prev,
                                        projectId: selectedProjectId,
                                        clientId: associatedClientId || prev.clientId // Keep existing if project has no client
                                    }));
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.fullName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                            <input
                                type="text"
                                required
                                readOnly
                                value={formData.invoiceNumber}
                                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 outline-none text-slate-500 cursor-not-allowed font-mono font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 text-sm">Line Items</h3>
                            <button onClick={addItem} className="text-blue-600 text-xs font-bold hover:underline">+ Add Item</button>
                        </div>
                        <div className="flex gap-2 mb-2 text-sm font-semibold text-slate-500 uppercase px-1">
                            <div className="flex-1">Description</div>
                            <div className="w-16">Qty</div>
                            <div className="w-24">Price</div>
                            <div className="w-24 text-right">Total</div>
                            <div className="w-6"></div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-16 bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:border-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Rate"
                                        value={item.unitPrice}
                                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="w-24 bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none focus:border-blue-500"
                                    />
                                    <div className="w-24 text-right font-medium text-slate-700 text-sm">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Total Amount</p>
                                <p className="text-2xl font-bold text-slate-800">${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                            Generate Invoice
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Invoices;
