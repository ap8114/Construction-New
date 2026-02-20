import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Briefcase, MapPin, Calendar, HardHat,
    DollarSign, CheckCircle, Loader, AlertTriangle, ChevronRight,
    Search, X
} from 'lucide-react';
import api from '../../utils/api';

const canSeeBudget = (role) =>
    ['COMPANY_OWNER', 'OWNER', 'PM', 'SUPER_ADMIN'].includes(role);

const CreateJob = () => {
    const { id: projectId } = useParams();   // project id from URL
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [equipSearch, setEquipSearch] = useState('');
    const [isEquipOpen, setIsEquipOpen] = useState(false);

    const showBudget = canSeeBudget(user?.role);

    const [form, setForm] = useState({
        name: '',
        location: '',
        startDate: '',
        endDate: '',
        pmId: '', // changed from foremanId
        budget: '',
        status: 'planning',
        description: '',
    });

    // ── Fetch project + team ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projRes, teamRes, equipRes] = await Promise.all([
                    api.get(`/projects/${projectId}`),
                    api.get('/auth/users').catch(() => ({ data: [] })),
                    api.get('/equipment').catch(() => ({ data: [] })),
                ]);
                setProject(projRes.data);
                const team = teamRes.data || [];
                // Filter: show if not assigned to a job OR explicitly idle
                const availableEquip = (equipRes.data || []).filter(e => {
                    const isAssigned = e.assignedJob && (typeof e.assignedJob === 'object' ? e.assignedJob._id : e.assignedJob);
                    return !isAssigned || e.status === 'idle';
                });
                setEquipment(availableEquip);

                // Assignment filter: Admins assign PMs, PMs assign Foremen/Workers, Foremen assign Workers
                if (['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)) {
                    setAssignableUsers(team.filter(m => m.role === 'PM'));
                } else if (user?.role === 'PM') {
                    setAssignableUsers(team.filter(m => ['FOREMAN', 'WORKER'].includes(m.role)));
                } else if (user?.role === 'FOREMAN') {
                    setAssignableUsers(team.filter(m => m.role === 'WORKER'));
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load project data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId, user?.role]);

    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.name.trim()) { setError('Job name is required.'); return; }
        try {
            setSaving(true);
            setError('');
            await api.post('/jobs', {
                ...form,
                foremanId: form.pmId, // Mapping pmId back to foremanId field for backend compatibility
                projectId,
                companyId: user?.companyId,
                equipmentIds: selectedEquipment,
            });
            setSuccess(true);
            setTimeout(() => navigate(`/company-admin/projects/${projectId}`), 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create job. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 font-bold text-slate-800 outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/8 transition-all placeholder:text-slate-300 placeholder:font-medium";
    const labelCls = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2";

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center">
                        <CheckCircle size={44} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Job Created!</h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">Redirecting to project...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/company-admin/projects/${projectId}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/company-admin/projects')}>
                            Projects
                        </span>
                        <ChevronRight size={14} />
                        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/company-admin/projects/${projectId}`)}>
                            {project?.name || 'Project'}
                        </span>
                        <ChevronRight size={14} />
                        <span className="text-slate-800">Create Job</span>
                    </div>
                </div>
            </div>

            {/* ── Page Content ── */}
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Hero Header */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-600/20 blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-400/10 blur-xl" />

                    <div className="relative z-10 flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/50 shrink-0">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <p className="text-blue-300 text-[11px] font-black uppercase tracking-widest mb-1">
                                {project?.name || 'Project'}
                            </p>
                            <h1 className="text-3xl font-black tracking-tight leading-tight">Create New Job</h1>
                            <p className="text-slate-400 text-sm font-bold mt-2">
                                Fill in the details below to create and assign a job to this project.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Form Card ── */}
                <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm relative">

                    {/* Section: Basic Info */}
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Briefcase size={16} className="text-blue-600" />
                            </div>
                            <h2 className="font-black text-slate-800 text-lg">Job Details</h2>
                        </div>

                        {/* Job Name */}
                        <div>
                            <label className={labelCls}>
                                <Briefcase size={12} className="text-blue-600" /> Job Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className={inputCls}
                                placeholder="e.g. Foundation Excavation, Electrical Wiring Floor 3..."
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className={labelCls}>
                                <MapPin size={12} className="text-blue-600" /> Location / Address
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                                className={inputCls}
                                placeholder="e.g. Site Block A, Level 3 or 123 Main St, New York"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>
                                    <Calendar size={12} className="text-blue-600" /> Start Date
                                </label>
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>
                                    <Calendar size={12} className="text-orange-500" /> End Date
                                </label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 mx-8" />

                    {/* Section: Assignment */}
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                <HardHat size={16} className="text-orange-500" />
                            </div>
                            <h2 className="font-black text-slate-800 text-lg">Assignment</h2>
                        </div>

                        {/* Assignment Dropdown */}
                        <div>
                            <label className={labelCls}>
                                <HardHat size={12} className="text-orange-500" />
                                {user?.role === 'FOREMAN' ? 'Assign Worker' :
                                    user?.role === 'PM' ? 'Assign Foreman / Supervisor' :
                                        'Assigned Project Manager'}
                            </label>
                            <select
                                value={form.pmId}
                                onChange={e => setForm({ ...form, pmId: e.target.value })}
                                className={inputCls + ' appearance-none cursor-pointer'}
                            >
                                <option value="">— Select {user?.role === 'FOREMAN' ? 'a Worker' :
                                    user?.role === 'PM' ? 'a Foreman' :
                                        'a Project Manager'} —</option>
                                {assignableUsers.length === 0 ? (
                                    <option disabled>No users found to assign</option>
                                ) : assignableUsers.map(u => (
                                    <option key={u._id} value={u._id}>
                                        {u.fullName} ({u.role})
                                    </option>
                                ))}
                            </select>
                            {assignableUsers.length === 0 && (
                                <p className="mt-2 text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    No suitable team members found to assign.
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className={labelCls}>Job Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                className={inputCls + ' appearance-none cursor-pointer'}
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Budget section — Owner/PM only */}
                    {showBudget && (
                        <>
                            <div className="h-px bg-slate-100 mx-8" />
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <DollarSign size={16} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-slate-800 text-lg">Budget</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visible to Owner & PM only</p>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        <DollarSign size={12} className="text-emerald-600" /> Job Budget / Contract Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">$</span>
                                        <input
                                            type="number"
                                            value={form.budget}
                                            onChange={e => setForm({ ...form, budget: e.target.value })}
                                            className={inputCls + ' pl-9'}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Description */}
                    <div className="h-px bg-slate-100 mx-8" />
                    <div className="p-8">
                        <label className={labelCls}>Description / Notes (optional)</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={4}
                            className={inputCls + ' resize-none'}
                            placeholder="Describe the scope of work, special instructions, or any notes..."
                        />
                    </div>

                    {/* Section: Equipment Assignment */}
                    <div className="h-px bg-slate-100 mx-8" />
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Briefcase size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-800 text-lg">Equipment Assignment</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select tools or heavy equipment for this job</p>
                            </div>
                        </div>

                        {equipment.length === 0 ? (
                            <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <p className="text-xs font-bold text-slate-400">No available equipment found in inventory.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Searchable Select Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setIsEquipOpen(!isEquipOpen)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-left transition-all hover:border-blue-400 focus:ring-4 focus:ring-blue-500/5 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEquipment.length === 0 ? (
                                                <span className="text-slate-400 font-bold text-sm italic">Click to search and assign equipment...</span>
                                            ) : (
                                                selectedEquipment.map(id => {
                                                    const item = equipment.find(e => e._id === id);
                                                    return (
                                                        <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-black uppercase tracking-tight">
                                                            {item?.name}
                                                            <X
                                                                size={14}
                                                                className="cursor-pointer hover:text-blue-900"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEquipment(selectedEquipment.filter(sid => sid !== id));
                                                                }}
                                                            />
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <ChevronRight size={18} className={`text-slate-300 transition-transform ${isEquipOpen ? 'rotate-90' : ''}`} />
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isEquipOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border-b-4 border-b-blue-500/20">
                                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, type, or serial..."
                                                    value={equipSearch}
                                                    onChange={(e) => setEquipSearch(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500/50"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[100px]">
                                            {equipment.filter(e =>
                                                (e.name || '').toLowerCase().includes(equipSearch.toLowerCase()) ||
                                                (e.type || '').toLowerCase().includes(equipSearch.toLowerCase()) ||
                                                (e.serialNumber || '').toLowerCase().includes(equipSearch.toLowerCase())
                                            ).map(item => (
                                                <div
                                                    key={item._id}
                                                    onClick={() => {
                                                        if (selectedEquipment.includes(item._id)) {
                                                            setSelectedEquipment(selectedEquipment.filter(id => id !== item._id));
                                                        } else {
                                                            setSelectedEquipment([...selectedEquipment, item._id]);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2
                                                        ${selectedEquipment.includes(item._id)
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                            : 'hover:bg-slate-50 border-transparent text-slate-700'}`}
                                                >
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                                        ${item.category === 'Small Tools' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[14px] font-black text-slate-900 leading-tight">{item.name}</p>
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                                {item.category === 'Small Tools' ? 'Tool' : 'Heavy'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            {item.type} <span className="mx-1 text-slate-200">|</span>
                                                            SN: <span className="text-blue-600/70">#{item.serialNumber || 'NA'}</span>
                                                        </p>
                                                    </div>
                                                    {selectedEquipment.includes(item._id) && (
                                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                                            <CheckCircle size={14} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {equipment.length > 0 && equipment.filter(e =>
                                                (e.name || '').toLowerCase().includes(equipSearch.toLowerCase()) ||
                                                (e.type || '').toLowerCase().includes(equipSearch.toLowerCase()) ||
                                                (e.serialNumber || '').toLowerCase().includes(equipSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="py-12 text-center bg-slate-50/50 rounded-2xl mx-2">
                                                        <Search size={32} className="mx-auto text-slate-200 mb-2" />
                                                        <p className="text-sm font-bold text-slate-400">No equipment matching "{equipSearch}"</p>
                                                    </div>
                                                )}
                                        </div>
                                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Selection</p>
                                                <p className="text-xs font-black text-slate-900">{selectedEquipment.length} item(s) to assign</p>
                                            </div>
                                            <button
                                                onClick={() => setIsEquipOpen(false)}
                                                className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                            >
                                                Confirm Selection
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl">
                        <AlertTriangle size={18} className="shrink-0" />
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                {/* ── Submit ── */}
                <div className="flex gap-4 pb-8">
                    <button
                        onClick={() => navigate(`/company-admin/projects/${projectId}`)}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name.trim()}
                        className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl
              ${saving || !form.name.trim()
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}>
                        {saving ? (
                            <>
                                <Loader size={18} className="animate-spin" /> Creating Job...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} /> Create Job
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateJob;
