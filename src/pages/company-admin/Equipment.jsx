import { useState, useEffect } from 'react';
import {
    Wrench, Plus, Search, Filter, AlertTriangle, CheckCircle,
    Clock, MoreHorizontal, Trash2, Edit, Eye, Download,
    TrendingUp, Activity, MapPin, Calendar, Hash, X, Save,
    Fuel, Settings, Shield, ArrowUpRight, BarChart2, Zap
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
const EquipmentCard = ({ item, onEdit, onDelete }) => {
    const statusColors = {
        operational: 'bg-emerald-500',
        maintenance: 'bg-orange-400',
        idle: 'bg-slate-400',
        out_of_service: 'bg-red-500',
    };
    const icons = { excavator: '🚜', crane: '🏗️', truck: '🚛', bulldozer: '🚧', generator: '⚡', compactor: '🔩' };
    const emoji = icons[item.type?.toLowerCase()] || '🔧';

    return (
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
            {/* Card Header */}
            <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-slate-400'} shadow-lg ring-2 ring-white`} />
                <div className="absolute bottom-4 left-4">
                    <StatusBadge status={item.status} />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-black text-slate-900 tracking-tight">{item.name}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tight">{item.type} · #{item.serialNumber || item._id?.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit size={14} /></button>
                        <button onClick={() => onDelete(item._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                </div>

                <div className="space-y-2 text-xs">
                    {item.assignedProject && (
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">{item.assignedProject}</span>
                        </div>
                    )}
                    {item.lastService && (
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Calendar size={12} className="text-orange-400 flex-shrink-0" />
                            <span>Last service: {new Date(item.lastService).toLocaleDateString()}</span>
                        </div>
                    )}
                    {item.hoursLogged != null && (
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Clock size={12} className="text-indigo-400 flex-shrink-0" />
                            <span>{item.hoursLogged}h logged this week</span>
                        </div>
                    )}
                </div>

                {/* Utilisation bar */}
                {item.utilisation != null && (
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            <span>Utilisation</span>
                            <span>{item.utilisation}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${item.utilisation > 80 ? 'bg-emerald-500' : item.utilisation > 40 ? 'bg-blue-500' : 'bg-orange-400'}`}
                                style={{ width: `${item.utilisation}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_EQUIPMENT = [
    { _id: 'e1', name: 'CAT 320 Excavator', type: 'Excavator', status: 'operational', assignedProject: 'North Tower', lastService: '2026-01-15', hoursLogged: 38, utilisation: 82, serialNumber: 'CAT-320-001', fuelLevel: 75 },
    { _id: 'e2', name: 'Liebherr LTM 1100', type: 'Crane', status: 'operational', assignedProject: 'Parkview Condos', lastService: '2026-01-20', hoursLogged: 44, utilisation: 91, serialNumber: 'LIE-LTM-002', fuelLevel: 60 },
    { _id: 'e3', name: 'Volvo FH16 Truck', type: 'Truck', status: 'idle', assignedProject: null, lastService: '2026-02-01', hoursLogged: 12, utilisation: 28, serialNumber: 'VOL-FH16-003', fuelLevel: 90 },
    { _id: 'e4', name: 'Komatsu D65 Dozer', type: 'Bulldozer', status: 'maintenance', assignedProject: 'Ridgeway Centre', lastService: '2025-12-10', hoursLogged: 0, utilisation: 0, serialNumber: 'KOM-D65-004', fuelLevel: 40 },
    { _id: 'e5', name: 'Caterpillar 950M', type: 'Excavator', status: 'operational', assignedProject: 'Riverview Plaza', lastService: '2026-01-28', hoursLogged: 30, utilisation: 65, serialNumber: 'CAT-950-005', fuelLevel: 55 },
    { _id: 'e6', name: 'Atlas Copco Generator', type: 'Generator', status: 'operational', assignedProject: 'North Tower', lastService: '2026-02-05', hoursLogged: 168, utilisation: 100, serialNumber: 'ATL-GEN-006', fuelLevel: 30 },
    { _id: 'e7', name: 'Bomag BW 213 Compactor', type: 'Compactor', status: 'out_of_service', assignedProject: null, lastService: '2025-11-20', hoursLogged: 0, utilisation: 0, serialNumber: 'BOM-BW-007', fuelLevel: 0 },
    { _id: 'e8', name: 'Scania R500 Truck', type: 'Truck', status: 'operational', assignedProject: 'Greenfield Mall', lastService: '2026-02-10', hoursLogged: 22, utilisation: 48, serialNumber: 'SCA-R500-008', fuelLevel: 85 },
];

const EMPTY_FORM = { name: '', type: 'Excavator', status: 'operational', assignedProject: '', serialNumber: '', lastService: '', hoursLogged: '', utilisation: '', fuelLevel: '' };

// ─── Main Component ───────────────────────────────────────────────────────────
const Equipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        // Try real API, fall back to demo
        api.get('/equipment')
            .then(r => setEquipment(r.data?.length ? r.data : DEMO_EQUIPMENT))
            .catch(() => setEquipment(DEMO_EQUIPMENT))
            .finally(() => setLoading(false));
    }, []);

    const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
    const openEdit = item => { setEditingItem(item); setForm({ ...EMPTY_FORM, ...item }); setIsModalOpen(true); };

    const handleSave = async () => {
        try {
            if (editingItem) {
                await api.patch(`/equipment/${editingItem._id}`, form).catch(() => { });
                setEquipment(prev => prev.map(e => e._id === editingItem._id ? { ...e, ...form } : e));
            } else {
                const newItem = { ...form, _id: `e${Date.now()}` };
                await api.post('/equipment', form).catch(() => { });
                setEquipment(prev => [...prev, newItem]);
            }
        } catch { }
        setIsModalOpen(false);
    };

    const handleDelete = async id => {
        if (!window.confirm('Remove this equipment?')) return;
        await api.delete(`/equipment/${id}`).catch(() => { });
        setEquipment(prev => prev.filter(e => e._id !== id));
    };

    const statuses = ['all', 'operational', 'maintenance', 'idle', 'out_of_service'];
    const types = ['Excavator', 'Crane', 'Truck', 'Bulldozer', 'Generator', 'Compactor', 'Other'];

    const filtered = equipment.filter(e => {
        const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.type?.toLowerCase().includes(search.toLowerCase()) ||
            e.serialNumber?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const counts = {
        operational: equipment.filter(e => e.status === 'operational').length,
        maintenance: equipment.filter(e => e.status === 'maintenance').length,
        idle: equipment.filter(e => e.status === 'idle').length,
        out_of_service: equipment.filter(e => e.status === 'out_of_service').length,
    };
    const avgUtil = equipment.length
        ? Math.round(equipment.reduce((s, e) => s + (e.utilisation || 0), 0) / equipment.length)
        : 0;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Equipment</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Wrench size={14} className="text-blue-600" /> Fleet management & utilisation tracking
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all"><Download size={20} /></button>
                    <button onClick={openCreate}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight">
                        <Plus size={18} /> Add Equipment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Operational" value={counts.operational} sub="units running" icon={CheckCircle} color="bg-emerald-500" trend="+2" />
                <StatCard title="In Maintenance" value={counts.maintenance} sub="scheduled service" icon={Wrench} color="bg-orange-400" />
                <StatCard title="Avg Utilisation" value={`${avgUtil}%`} sub="fleet-wide" icon={BarChart2} color="bg-blue-600" trend="+5%" />
                <StatCard title="Out of Service" value={counts.out_of_service} sub="needs attention" icon={AlertTriangle} color="bg-red-500" />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                {/* Status filter tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
                    {statuses.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight whitespace-nowrap transition-all ${statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {s === 'all' ? 'All' : s === 'out_of_service' ? 'Out of Service' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search by name, type, or serial number..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400" />
                </div>

                {/* View toggle */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                        Grid
                    </button>
                    <button onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                        Table
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-[28px] h-64 animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-24 text-center flex flex-col items-center gap-4 text-slate-300">
                            <Wrench size={48} className="opacity-30" />
                            <p className="font-bold uppercase tracking-widest text-[11px]">No equipment found</p>
                        </div>
                    ) : filtered.map(item => (
                        <EquipmentCard key={item._id} item={item} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    {['Equipment', 'Type', 'Serial #', 'Assigned To', 'Hours', 'Fuel', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="8" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <Wrench size={48} className="opacity-30" />
                                            <p className="font-bold uppercase tracking-widest text-[11px]">No equipment found</p>
                                        </div>
                                    </td></tr>
                                ) : filtered.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                    {item.type === 'Excavator' ? '🚜' : item.type === 'Crane' ? '🏗️' : item.type === 'Truck' ? '🚛' : item.type === 'Generator' ? '⚡' : '🔧'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight">{item.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{item.type}</span>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-500 text-xs">{item.serialNumber || '---'}</td>
                                        <td className="px-6 py-5 font-bold text-slate-600 text-xs">{item.assignedProject || <span className="text-slate-300">Unassigned</span>}</td>
                                        <td className="px-6 py-5 font-black text-slate-900">{item.hoursLogged ?? '---'}h</td>
                                        <td className="px-6 py-5">
                                            {item.fuelLevel != null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${item.fuelLevel > 50 ? 'bg-emerald-500' : item.fuelLevel > 20 ? 'bg-orange-400' : 'bg-red-500'}`}
                                                            style={{ width: `${item.fuelLevel}%` }} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600">{item.fuelLevel}%</span>
                                                </div>
                                            ) : '---'}
                                        </td>
                                        <td className="px-6 py-5"><StatusBadge status={item.status} /></td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white rounded-t-[40px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Wrench size={22} /></div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Fleet Management</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Equipment Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. CAT 320 Excavator"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 appearance-none">
                                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Serial Number</label>
                                    <input type="text" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                                        placeholder="e.g. CAT-320-001"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 appearance-none">
                                        <option value="operational">Operational</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="idle">Idle</option>
                                        <option value="out_of_service">Out of Service</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Assigned Project</label>
                                <input type="text" value={form.assignedProject} onChange={e => setForm({ ...form, assignedProject: e.target.value })}
                                    placeholder="e.g. North Tower"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Hours Logged</label>
                                    <input type="number" value={form.hoursLogged} onChange={e => setForm({ ...form, hoursLogged: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Fuel Level %</label>
                                    <input type="number" min="0" max="100" value={form.fuelLevel} onChange={e => setForm({ ...form, fuelLevel: e.target.value })}
                                        placeholder="0-100"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Service</label>
                                    <input type="date" value={form.lastService} onChange={e => setForm({ ...form, lastService: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-tight transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={!form.name}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-xl flex items-center justify-center gap-2 ${form.name ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                                    <Save size={16} /> {editingItem ? 'Save Changes' : 'Add Equipment'}
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
