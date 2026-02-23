import { useState, useEffect } from 'react';
import {
    Wrench, Plus, Search, Filter, AlertTriangle, CheckCircle,
    Clock, MoreHorizontal, Trash2, Edit, Eye, Download,
    TrendingUp, Activity, MapPin, Calendar, Hash, X, Save,
    Fuel, Settings, Shield, ArrowUpRight, BarChart2, Zap,
    Hammer, Box, RotateCcw, Link2, AlertCircle, Briefcase
} from 'lucide-react';
import api from '../../utils/api';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group">
        <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
            {sub && <p className="text-[11px] font-bold text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {trend && (
            <div className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={14} />{trend}
            </div>
        )}
    </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        operational: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        maintenance: 'bg-orange-50  text-orange-700  border-orange-100',
        idle: 'bg-slate-50   text-slate-600   border-slate-200',
        out_of_service: 'bg-red-50  text-red-700     border-red-100',
    };
    const labels = {
        operational: 'Operational',
        maintenance: 'Maintenance',
        idle: 'Idle',
        out_of_service: 'Out of Service',
    };
    return (
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${map[status] || map.idle}`}>
            {labels[status] || status}
        </span>
    );
};

// ─── Equipment Card (Grid View) ───────────────────────────────────────────────
const EquipmentCard = ({ item, onEdit, onDelete, onAssign, onReturn }) => {
    const isJobCompleted = item.assignedJob?.status === 'completed';
    const isSmallTool = item.category === 'Small Tools';

    const icons = {
        excavator: '🚜', crane: '🏗️', truck: '🚛', bulldozer: '🚧', generator: '⚡', compactor: '🔩',
        'power drill': '🔌', ladder: '🪜', scaffolding: '🪜', 'power tool': '⚙️'
    };
    const emoji = icons[item.type?.toLowerCase()] || (isSmallTool ? '🛠️' : '🚜');

    return (
        <div className={`bg-white rounded-[28px] shadow-sm border ${isJobCompleted ? 'border-red-200 bg-red-50/10' : 'border-slate-200/60'} overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group`}>
            {/* Card Header */}
            <div className={`relative h-32 flex items-center justify-center ${isSmallTool ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                {isJobCompleted && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                        <AlertCircle size={12} /> Job Finished
                    </div>
                )}
                <div className="absolute bottom-4 right-4">
                    <StatusBadge status={item.status} />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 tracking-tight truncate max-w-[140px]">{item.name}</h3>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isSmallTool ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                {item.category === 'Small Tools' ? 'Tool' : 'Heavy'}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tight">{item.type} · #{item.serialNumber || 'SN-NA'}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit size={14} /></button>
                        <button onClick={() => onDelete(item._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-50 mb-3">
                    {item.assignedJob ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Job</span>
                                <button
                                    onClick={() => onReturn(item._id)}
                                    className="text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                >
                                    <RotateCcw size={10} /> Return
                                </button>
                            </div>
                            <div className={`p-3 rounded-xl border ${isJobCompleted ? 'bg-red-50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <Briefcase size={10} className={isJobCompleted ? 'text-red-500' : 'text-blue-500'} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest truncate ${isJobCompleted ? 'text-red-700' : 'text-blue-700'}`}>
                                            {item.assignedJob?.projectId?.name || 'Unknown Project'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={12} className={isJobCompleted ? 'text-red-500' : 'text-blue-500'} />
                                        <span className={`text-xs font-black truncate ${isJobCompleted ? 'text-red-700' : 'text-blue-700'}`}>
                                            {item.assignedJob?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Equipment is Idle</p>
                            <button
                                onClick={() => onAssign(item)}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <Link2 size={12} /> Assign to Job
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Last Used</span>
                    <span className="text-slate-900">{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Simple Demo ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    name: '',
    category: 'Heavy Equipment',
    type: 'Excavator',
    status: 'operational',
    serialNumber: '',
    notes: ''
};

const Equipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [assignTarget, setAssignTarget] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eqRes, jobRes] = await Promise.all([
                api.get('/equipment'),
                api.get('/jobs')
            ]);
            setEquipment(eqRes.data || []);
            setJobs(jobRes.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        try {
            if (editingItem) {
                const res = await api.patch(`/equipment/${editingItem._id}`, form);
                setEquipment(prev => prev.map(e => e._id === editingItem._id ? res.data : e));
            } else {
                const res = await api.post('/equipment', form);
                setEquipment(prev => [...prev, res.data]);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async id => {
        if (!window.confirm('Remove this equipment?')) return;
        try {
            await api.delete(`/equipment/${id}`);
            setEquipment(prev => prev.filter(e => e._id !== id));
        } catch (err) { }
    };

    const handleAssign = async () => {
        if (!selectedJobId || !assignTarget) return;
        try {
            const res = await api.post(`/equipment/${assignTarget._id}/assign`, { jobId: selectedJobId });
            setEquipment(prev => prev.map(e => e._id === assignTarget._id ? res.data : e));
            setIsAssignModalOpen(false);
            setAssignTarget(null);
            setSelectedJobId('');
        } catch (err) { }
    };

    const handleReturn = async id => {
        if (!window.confirm('Mark this equipment as returned?')) return;
        try {
            const res = await api.post(`/equipment/${id}/return`);
            setEquipment(prev => prev.map(e => e._id === id ? res.data : e));
        } catch (err) { }
    };

    const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
    const openEdit = item => { setEditingItem(item); setForm({ ...item, assignedJob: item.assignedJob?._id }); setIsModalOpen(true); };
    const openAssign = item => { setAssignTarget(item); setIsAssignModalOpen(true); };

    const filtered = equipment.filter(e => {
        const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.type?.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const counts = {
        heavy: equipment.filter(e => e.category === 'Heavy Equipment').length,
        tools: equipment.filter(e => e.category === 'Small Tools').length,
        assigned: equipment.filter(e => e.assignedJob).length,
        alerts: equipment.filter(e => e.assignedJob?.status === 'completed').length
    };

    const categories = ['Heavy Equipment', 'Small Tools'];
    const types = form.category === 'Heavy Equipment'
        ? ['Excavator', 'Crane', 'Truck', 'Bulldozer', 'Generator', 'Compactor', 'Other']
        : ['Power Drill', 'Circular Saw', 'Scaffolding', 'Ladder', 'Concrete Mixer', 'Hand Tool', 'Other'];

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory & Fleet</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Wrench size={14} className="text-blue-600" /> Equipment tracking and job assignments
                    </p>
                </div>
                <button onClick={openCreate}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight">
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            {/* Notification Banner for Pending Returns */}
            {counts.alerts > 0 && (
                <div className="bg-red-50 border-2 border-red-100 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-200">
                            <AlertTriangle size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-red-900 tracking-tight">Active Warning: Pending Returns</h3>
                            <p className="text-sm font-bold text-red-600/70 leading-relaxed max-w-lg">
                                There are <span className="font-black text-red-900">{counts.alerts}</span> items still assigned to jobs that have been marked as "Completed". Please recall these items to make them available for other projects.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Heavy Assets" value={counts.heavy} sub="Large units" icon={Box} color="bg-slate-900" />
                <StatCard title="Small Tools" value={counts.tools} sub="Power & Hand tools" icon={Hammer} color="bg-indigo-600" />
                <StatCard title="Assigned" value={counts.assigned} sub="Currently on site" icon={Link2} color="bg-blue-600" />
                <StatCard title="Alerts" value={counts.alerts} sub="Pending Return" icon={AlertTriangle} color={counts.alerts > 0 ? "bg-red-500 shadow-lg shadow-red-100" : "bg-emerald-500"} />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                {/* Category filter tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setCategoryFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        All Assets
                    </button>
                    {categories.map(c => (
                        <button key={c} onClick={() => setCategoryFilter(c)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight whitespace-nowrap transition-all ${categoryFilter === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {c}
                        </button>
                    ))}
                </div>

                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search by name or type..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400" />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-[28px] h-80 animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-24 text-center flex flex-col items-center gap-4 text-slate-300">
                            <Box size={48} className="opacity-30" />
                            <p className="font-bold uppercase tracking-widest text-[11px]">No equipment found</p>
                        </div>
                    ) : filtered.map(item => (
                        <EquipmentCard
                            key={item._id}
                            item={item}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onAssign={openAssign}
                            onReturn={handleReturn}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Plus size={22} /></div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{editingItem ? 'Edit Asset' : 'Add New Asset'}</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Inventory Management</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Asset Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. DeWalt DCK283D2 Drill Set"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none appearance-none">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none appearance-none">
                                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Serial Number</label>
                                    <input type="text" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Initial Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none appearance-none">
                                        <option value="operational">Operational</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="idle">Idle</option>
                                        <option value="out_of_service">Out of Service</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-tight transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={!form.name}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-xl flex items-center justify-center gap-2 ${form.name ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                                    <Save size={16} /> {editingItem ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-900 p-8 text-white text-center">
                            <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg mx-auto mb-4 border-4 border-slate-800"><Link2 size={24} /></div>
                            <h2 className="text-xl font-black tracking-tight">Assign Equipment</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Select an active job for {assignTarget?.name}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Job</label>
                                <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-800 outline-none appearance-none focus:ring-4 focus:ring-blue-500/5">
                                    <option value="">Choose a Job...</option>
                                    {jobs.filter(j => j.status !== 'completed').map(j => (
                                        <option key={j._id} value={j._id}>{j.name} ({j.projectId?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={handleAssign} disabled={!selectedJobId}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-lg flex items-center justify-center gap-2 ${selectedJobId ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 outline-none' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    <CheckCircle size={18} /> Confirm Assignment
                                </button>
                                <button onClick={() => setIsAssignModalOpen(false)}
                                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-tight transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipment;
