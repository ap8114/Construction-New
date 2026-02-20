import { useState, useEffect } from 'react';
import {
    ShoppingCart, Plus, Search, Filter, CheckCircle, XCircle,
    FileText, Truck, AlertCircle, DollarSign, Trash2, Loader,
    MoreHorizontal, ChevronRight, Hash, Check, MapPin, Calendar, Clock
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PurchaseOrders = () => {
    const { user } = useAuth();
    const isOwner = user?.role === 'COMPANY_OWNER';
    const isPM = user?.role === 'PM';
    const isForeman = user?.role === 'FOREMAN';
    const isOwnerOrPM = isOwner || isPM;

    const [orders, setOrders] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ projectId: '', vendor: '', items: '', totalAmount: '', deliveryDate: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, projectsRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/projects')
            ]);
            setOrders(ordersRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        try {
            const payload = {
                ...formData,
                vendorName: formData.vendor,
                poNumber: `PO-${Date.now().toString().slice(-6)}`,
                items: [{
                    description: formData.items,
                    quantity: 1,
                    unitPrice: Number(formData.totalAmount) || 0,
                    total: Number(formData.totalAmount) || 0
                }]
            };

            await api.post('/purchase-orders', payload);
            fetchData();
            setIsModalOpen(false);
            setFormData({ projectId: '', vendor: '', items: '', totalAmount: '', deliveryDate: '' });
        } catch (error) {
            console.error('Error creating purchase order:', error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/purchase-orders/${id}`, { status: newStatus });
            setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase order?')) {
            try {
                await api.delete(`/purchase-orders/${id}`);
                setOrders(orders.filter(o => o._id !== id));
            } catch (error) {
                console.error('Error deleting purchase order:', error);
            }
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        approved: orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };

    const filteredOrders = orders.filter(o =>
        o.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Purchase Orders</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingCart size={14} className="text-blue-600" />
                        Manage material procurement and vendor expenses
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all">
                        <MoreHorizontal size={20} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight"
                    >
                        <Plus size={18} /> New Purchase Order
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-cols-1 ${isOwnerOrPM ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-5`}>
                <POStatCard title="Total POs" value={stats.total} subtext="all time" icon={FileText} color="blue" />
                {isOwnerOrPM && (
                    <>
                        <POStatCard title="Pending Spend" value={`$${stats.pending.toLocaleString()}`} subtext="awaiting approval" icon={Clock} color="orange" />
                        <POStatCard title="Approved Spend" value={`$${stats.approved.toLocaleString()}`} subtext="committed budget" icon={CheckCircle} color="emerald" />
                    </>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by vendor name or PO number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Filter size={18} /> Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">PO Number</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Items Summary</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                {isOwnerOrPM && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Amount</th>}
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Fetching Orders...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5 font-black text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Hash size={14} />
                                            </div>
                                            {order.poNumber || `PO-${order._id.slice(-4).toUpperCase()}`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                                                {order.vendor?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700">{order.vendor}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-bold text-slate-500">{order.projectId?.name || '---'}</td>
                                    <td className="px-8 py-5">
                                        <p className="text-slate-500 truncate max-w-[200px] font-bold text-xs">
                                            {Array.isArray(order.items)
                                                ? order.items.map(i => i.description).join(', ')
                                                : (order.items || '---')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-slate-400 font-bold text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    {isOwnerOrPM && <td className="px-8 py-5 text-center font-black text-slate-900">${order.totalAmount?.toLocaleString()}</td>}
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border
                                            ${order.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                order.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            {order.status === 'pending' && (
                                                <>
                                                    <button onClick={() => updateStatus(order._id, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl bg-white border border-emerald-100 shadow-sm transition-all" title="Approve">
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => updateStatus(order._id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-xl bg-white border border-red-100 shadow-sm transition-all" title="Reject">
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(order._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Purchase Order">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Truck size={14} className="text-blue-600" /> Vendor Name
                            </label>
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                placeholder="e.g. Acme Concrete Supplies"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} className="text-blue-600" /> Jobsite / Project
                            </label>
                            <select
                                value={formData.projectId}
                                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Materials & Items Summary</label>
                        <textarea
                            rows="3"
                            value={formData.items}
                            onChange={e => setFormData({ ...formData, items: e.target.value })}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-3xl p-6 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none shadow-inner"
                            placeholder="List materials, quantities, or specific SKU numbers..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {isOwnerOrPM && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign size={14} className="text-blue-600" /> Total Estimated Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={formData.totalAmount}
                                        onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                        className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}
                        <div className={`space-y-2 ${!isOwnerOrPM ? 'md:col-span-2' : ''}`}>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" /> Delivery Date
                            </label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!formData.vendor || !formData.projectId || (isOwnerOrPM && !formData.totalAmount)}
                            className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-xl flex items-center gap-3
                                ${formData.vendor && formData.projectId && (!isOwnerOrPM || formData.totalAmount)
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                        >
                            <Check size={18} /> {isOwnerOrPM ? 'Submit PO Request' : 'Submit PO Requisition'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const POStatCard = ({ title, value, subtext, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100'
    };

    return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
            <div className={`p-4 rounded-2xl border ${colors[color]}`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{title}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
                <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">{subtext}</p>
            </div>
        </div>
    );
};

export default PurchaseOrders;
