import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Printer, Mail, Truck,
    CheckCircle, XCircle, Clock, Package,
    FileText, User, Calendar, DollarSign,
    MoreVertical, Trash2, Send, Archive
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PurchaseOrders.css';

const PurchaseOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'COMPANY_OWNER';
    const isPM = user?.role === 'PM';

    useEffect(() => {
        const fetchPO = async () => {
            try {
                const res = await api.get(`/purchase-orders/${id}`);
                setPo(res.data);
            } catch (error) {
                console.error('Error fetching PO:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPO();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        try {
            await api.patch(`/purchase-orders/${id}`, { status: newStatus });
            setPo({ ...po, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center">Loading...</div>;
    if (!po) return <div className="text-center py-20">Purchase Order not found</div>;

    const getStatusColor = (status) => {
        const colors = {
            'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
            'Pending Approval': 'bg-orange-50 text-orange-600 border-orange-100',
            'Approved': 'bg-blue-50 text-blue-600 border-blue-100',
            'Sent': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'Closed': 'bg-slate-800 text-slate-200 border-slate-700',
            'Cancelled': 'bg-red-50 text-red-600 border-red-100'
        };
        return colors[status] || colors['Draft'];
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-fade-in">
            {/* Header / Actions Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">{po.poNumber}</h1>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(po.status)}`}>
                                {po.status}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold text-sm">{po.projectId?.name || 'Project Name'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold text-xs uppercase tracking-widest">
                        <Printer size={16} /> Print
                    </button>
                    {(isAdmin || isPM) && po.status === 'Pending Approval' && (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('Approved')}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                            >
                                <CheckCircle size={16} /> Approve PO
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Cancelled')}
                                className="flex items-center gap-2 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition font-black text-xs uppercase tracking-widest"
                            >
                                <XCircle size={16} /> Reject PO
                            </button>
                        </>
                    )}
                    {(isAdmin || isPM) && po.status === 'Approved' && (
                        <button
                            onClick={() => handleStatusUpdate('Sent')}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200"
                        >
                            <Send size={16} /> Send to Vendor
                        </button>
                    )}
                    {(isAdmin || isPM) && po.status === 'Sent' && (
                        <button
                            onClick={() => handleStatusUpdate('Delivered')}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200"
                        >
                            <Truck size={16} /> Mark Delivered
                        </button>
                    )}
                    {po.status === 'Draft' && (
                        <button
                            onClick={() => handleStatusUpdate('Pending Approval')}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                        >
                            <Send size={16} /> Submit for Approval
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Details */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Info Grid */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Truck size={12} className="text-blue-600" /> Vendor
                            </p>
                            <p className="font-black text-slate-800">{po.vendorName || po.vendorId?.name || '---'}</p>
                            <p className="text-xs font-bold text-slate-400">{po.vendorEmail || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} className="text-blue-600" /> Key Dates
                            </p>
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-bold text-slate-700">Created: <span className="text-slate-400 ml-1">{new Date(po.createdAt).toLocaleDateString()}</span></p>
                                <p className="text-xs font-bold text-slate-700">Expected: <span className="text-slate-400 ml-1">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</span></p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={12} className="text-blue-600" /> Created By
                            </p>
                            <p className="font-black text-slate-800">{po.createdBy?.fullName || 'John Doe'}</p>
                            <p className="text-xs font-bold text-slate-400">{po.createdBy?.role || 'Project Manager'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {Array.isArray(po.items) ? po.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-800 text-sm">{item.itemName || 'Material'}</p>
                                            <p className="text-xs font-bold text-slate-400">{item.description}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-slate-700">{item.quantity}</td>
                                        <td className="px-8 py-6 text-right font-black text-slate-700">${(item.unitPrice || 0).toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900">${(item.total || 0).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-6 text-center text-slate-400">No items available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Totals Summary */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-400">Subtotal</span>
                                    <span className="font-black text-slate-700">${(po.subtotal || po.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-400">Estimated Tax</span>
                                    <span className="font-black text-slate-700">${(po.tax || 0).toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-xl font-black text-blue-600">${(po.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200/60 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes to Vendor</h3>
                            <p className="text-sm font-bold text-slate-600 italic">
                                "{po.notesToVendor || 'No specific notes provided.'}"
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200/60 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Remarks</h3>
                            <p className="text-sm font-bold text-slate-600">
                                {po.internalNotes || 'Internal documentation only.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Timeline Bar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200/60 space-y-6 sticky top-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Timeline</h3>

                        <div className="space-y-8 relative">
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />

                            <TimelineStep
                                active={['Draft', 'Pending Approval', 'Approved', 'Sent', 'Delivered'].includes(po.status)}
                                completed={['Pending Approval', 'Approved', 'Sent', 'Delivered', 'Closed'].includes(po.status)}
                                label="Created / Requested"
                                date={new Date(po.createdAt).toLocaleDateString()}
                            />
                            <TimelineStep
                                active={['Pending Approval', 'Approved', 'Sent', 'Delivered'].includes(po.status)}
                                completed={['Approved', 'Sent', 'Delivered', 'Closed'].includes(po.status)}
                                label="Manager Approval"
                            />
                            <TimelineStep
                                active={['Sent', 'Delivered'].includes(po.status)}
                                completed={['Delivered', 'Closed'].includes(po.status)}
                                label="Sent to Vendor"
                            />
                            <TimelineStep
                                active={['Delivered'].includes(po.status)}
                                completed={['Closed'].includes(po.status)}
                                label="Material Delivered"
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-2">
                            {(isAdmin || isPM) && po.status !== 'Closed' && po.status !== 'Cancelled' && (
                                <button
                                    onClick={() => handleStatusUpdate('Closed')}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition"
                                >
                                    <Archive size={14} /> Close Purchase Order
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/company-admin/purchase-orders/edit/${id}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition"
                            >
                                Edit PO Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimelineStep = ({ active, completed, label, date }) => (
    <div className="flex items-start gap-4 relative z-10">
        <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${completed ? 'bg-emerald-500 border-emerald-50 border-emerald-50 text-white' :
            active ? 'bg-blue-600 border-blue-50 text-white' :
                'bg-white border-slate-100 text-slate-300'
            }`}>
            {completed ? <CheckCircle size={14} /> : active ? <Clock size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-100" />}
        </div>
        <div className="space-y-1 pt-1">
            <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-300'}`}>
                {label}
            </p>
            {date && <p className="text-[9px] font-bold text-slate-400">{date}</p>}
        </div>
    </div>
);

export default PurchaseOrderDetail;
