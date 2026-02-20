import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Plus, Briefcase, MapPin, Calendar, HardHat,
    DollarSign, Edit, Trash2, Clock, CheckCircle2, AlertCircle,
    Loader, ChevronRight, LayoutGrid, List, Search, Filter, AlertTriangle, Users
} from 'lucide-react';
import api from '../../utils/api';

const canSeeBudget = (role) =>
    ['COMPANY_OWNER', 'OWNER', 'PM', 'SUPER_ADMIN'].includes(role);

const statusConfig = {
    planning: { label: 'Planning', cls: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-400' },
    active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
    'on-hold': { label: 'On Hold', cls: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-400' },
    completed: { label: 'Completed', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.planning;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

const ProjectDetails = () => {
    const { id: projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAssigningPM, setIsAssigningPM] = useState(false);
    const [isAssigningForeman, setIsAssigningForeman] = useState(null); // jobID
    const [isAssigningWorkers, setIsAssigningWorkers] = useState(null); // jobID
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [returningEquipId, setReturningEquipId] = useState(null);

    const showBudget = canSeeBudget(user?.role);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            setLoading(true);
            const [projRes, jobsRes, usersRes, equipRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/jobs?projectId=${projectId}`).catch(() => ({ data: [] })),
                api.get('/auth/users').catch(() => ({ data: [] })),
                api.get('/equipment').catch(() => ({ data: [] }))
            ]);
            setProject(projRes.data);
            setJobs(jobsRes.data || []);
            setUsers(usersRes.data || []);
            setEquipment(equipRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [projectId]);

    const handleAssignPM = async (pmId) => {
        try {
            const res = await api.post(`/projects/${projectId}/assign-pm`, { pmId });
            setProject(res.data);
            setIsAssigningPM(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignForeman = async (jobId, foremanId) => {
        try {
            await api.post(`/jobs/${jobId}/assign-foreman`, { foremanId });
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, foremanId } : j));
            setIsAssigningForeman(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignWorkers = async (jobId, workerIds) => {
        try {
            await api.post(`/jobs/${jobId}/assign-workers`, { assignedWorkers: workerIds });
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, assignedWorkers: workerIds } : j));
            setIsAssigningWorkers(null);
        } catch (err) {
            console.error(err);
        }
    };

    // ── Delete Job ─────────────────────────────────────────────────────────────
    const handleDeleteJob = async (jobId) => {
        const jobEquipment = equipment.filter(e => e.assignedJob?._id === jobId || e.assignedJob === jobId);
        if (jobEquipment.length > 0) {
            alert(`Cannot delete job. There are ${jobEquipment.length} items of equipment still assigned to it. Please return all equipment first.`);
            return;
        }
        if (!window.confirm('Delete this job?')) return;
        try {
            setDeletingId(jobId);
            await api.delete(`/jobs/${jobId}`);
            setJobs(prev => prev.filter(j => j._id !== jobId));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleReturnEquipment = async (equipId) => {
        try {
            setReturningEquipId(equipId);
            await api.post(`/equipment/${equipId}/return`);
            setEquipment(prev => prev.map(e => e._id === equipId ? { ...e, assignedJob: null } : e));
        } catch (err) {
            console.error(err);
        } finally {
            setReturningEquipId(null);
        }
    };

    const handleUpdateJobStatus = async (jobId, newStatus) => {
        try {
            await api.patch(`/jobs/${jobId}`, { status: newStatus });
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
        } catch (err) {
            console.error(err);
        }
    };

    // ── Filter ─────────────────────────────────────────────────────────────────
    const filteredJobs = jobs.filter(j => {
        const matchSearch = j.name.toLowerCase().includes(search.toLowerCase()) ||
            (j.location || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || j.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const jobStats = {
        total: jobs.length,
        active: jobs.filter(j => j.status === 'active').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        planning: jobs.filter(j => j.status === 'planning').length,
    };

    const getLocationStr = (loc) => {
        if (!loc) return '';
        if (typeof loc === 'object') return loc.address || '';
        return loc;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-40">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-12">

            {/* ── Breadcrumb + Back ── */}
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                <button onClick={() => navigate('/company-admin/projects')}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all">
                    <ArrowLeft size={18} />
                </button>
                <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/company-admin/projects')}>
                    Projects
                </span>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-black">{project?.name || 'Project'}</span>
            </div>

            {/* ── Project Hero Card ── */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[40px] overflow-hidden relative">
                {/* Background image */}
                {project?.image && (
                    <div className="absolute inset-0">
                        <img src={project.image} alt="" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-blue-900/90" />
                    </div>
                )}
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-blue-400/10 blur-2xl" />

                <div className="relative z-10 p-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/50 shrink-0">
                                <Briefcase size={28} className="text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusBadge status={project?.status} />
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{project?.name}</h1>
                                {project?.location && (
                                    <div className="flex items-center gap-2 mt-2 text-slate-400">
                                        <MapPin size={14} className="text-blue-400" />
                                        <span className="text-sm font-bold">{getLocationStr(project.location)}</span>
                                    </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                                        <Users size={14} className="text-blue-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PM:</span>
                                        <span className="text-xs font-bold text-white">
                                            {project?.pmId?.fullName || users.find(u => u._id === (project?.pmId?._id || project?.pmId))?.fullName || 'Unassigned'}
                                        </span>
                                        {user?.role === 'COMPANY_OWNER' && (
                                            <select
                                                className="bg-transparent text-[10px] font-black text-blue-400 border-none focus:ring-0 cursor-pointer ml-1"
                                                value={typeof project?.pmId === 'object' ? project.pmId._id : (project?.pmId || '')}
                                                onChange={(e) => handleAssignPM(e.target.value)}
                                            >
                                                <option value="" className="bg-slate-800">Change PM</option>
                                                {users.filter(u => u.role === 'PM').map(u => (
                                                    <option key={u._id} value={u._id} className="bg-slate-800">{u.fullName}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Create Job CTA - Hidden for Foreman/Worker */}
                        {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                            <button
                                onClick={() => navigate(`/company-admin/projects/${projectId}/jobs/new`)}
                                className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/50 flex items-center gap-3 border border-blue-500/50">
                                <Plus size={20} />
                                Create Job
                            </button>
                        )}
                    </div>

                    {/* Project meta row */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Start Date', value: project?.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—', icon: Calendar },
                            { label: 'End Date', value: project?.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—', icon: Calendar },
                            { label: 'Total Jobs', value: jobStats.total, icon: Briefcase },
                            showBudget ? { label: 'Budget', value: `$${(Number(project?.budget) || 0).toLocaleString()}`, icon: DollarSign } : null,
                        ].filter(Boolean).map((item, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <item.icon size={13} className="text-blue-300" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                </div>
                                <p className="text-lg font-black text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Job Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Jobs', value: jobStats.total, color: 'blue', icon: Briefcase },
                    { label: 'Active', value: jobStats.active, color: 'emerald', icon: CheckCircle2 },
                    { label: 'Planning', value: jobStats.planning, color: 'orange', icon: Clock },
                    { label: 'Completed', value: jobStats.completed, color: 'slate', icon: CheckCircle2 },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl
              ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                    s.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                        'bg-slate-50 text-slate-500'}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Jobs Section ── */}
            <div className="space-y-5">
                {/* Section header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Jobs</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} in this project
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* View toggle */}
                        <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
                            <button onClick={() => setView('grid')}
                                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <LayoutGrid size={16} />
                            </button>
                            <button onClick={() => setView('table')}
                                className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                                <List size={16} />
                            </button>
                        </div>
                        {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                            <button
                                onClick={() => navigate(`/company-admin/projects/${projectId}/jobs/new`)}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-xs uppercase tracking-tight">
                                <Plus size={16} /> Create Job
                            </button>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search jobs..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400" />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 outline-none hover:bg-slate-50 transition-all appearance-none">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="planning">Planning</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Jobs Grid */}
                {view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Create Job card */}
                        {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                            <button
                                onClick={() => navigate(`/company-admin/projects/${projectId}/jobs/new`)}
                                className="group border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50/30 min-h-[200px]">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-all">
                                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-sm uppercase tracking-widest">Create New Job</p>
                                    <p className="text-[11px] font-bold mt-1 opacity-60">Add a job to this project</p>
                                </div>
                            </button>
                        )}

                        {filteredJobs.map(job => (
                            <div key={job._id}
                                className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 p-6 flex flex-col gap-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Briefcase size={18} className="text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-900 truncate">{job.name}</h3>
                                            {job.location && (
                                                <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                                                    <MapPin size={11} />
                                                    <span className="text-[11px] font-bold truncate">{job.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative group/status">
                                        <StatusBadge status={job.status} />
                                        {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                                            <select
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                value={job.status}
                                                onChange={(e) => handleUpdateJobStatus(job._id, e.target.value)}
                                            >
                                                <option value="planning">Planning</option>
                                                <option value="active">Active</option>
                                                <option value="on-hold">On Hold</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Alert for Completed Job with Equipment */}
                                {job.status === 'completed' && equipment.some(e => (e.assignedJob?._id === job._id || e.assignedJob === job._id)) && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                                        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-black text-red-700 uppercase tracking-widest leading-none mb-1">Attention Required</p>
                                            <p className="text-xs font-bold text-red-600/80">Job completed but equipment still assigned.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Details */}
                                <div className="space-y-3 flex-1">
                                    {/* Project Manager & Site Assignment */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Users size={13} className="text-blue-400 shrink-0" />
                                            <span className="text-xs font-bold truncate">
                                                PM: {project?.pmId?.fullName || users.find(u => u._id === (project?.pmId?._id || project?.pmId))?.fullName || 'Unassigned'}
                                            </span>
                                        </div>

                                        <div className="group/assign relative">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <HardHat size={13} className="text-slate-400 shrink-0" />
                                                <span className="text-xs font-bold truncate">
                                                    {(() => {
                                                        const assignee = job.foremanId?.role || users.find(u => u._id === (job.foremanId?._id || job.foremanId))?.role;
                                                        if (assignee === 'PM') return 'Project Manager';
                                                        if (assignee === 'FOREMAN') return 'Site Foreman';
                                                        if (assignee === 'WORKER') return 'Lead Worker';
                                                        return 'Lead';
                                                    })()}: {job.foremanId?.fullName || users.find(u => u._id === (job.foremanId?._id || job.foremanId))?.fullName || 'Unassigned'}
                                                </span>
                                            </div>
                                            {(['COMPANY_OWNER', 'SUPER_ADMIN', 'PM'].includes(user?.role)) && (
                                                <select
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                    value={typeof job.foremanId === 'object' ? job.foremanId._id : (job.foremanId || '')}
                                                    onChange={(e) => handleAssignForeman(job._id, e.target.value)}
                                                >
                                                    <option value="">Assign {user?.role === 'PM' ? 'Foreman' : 'Project Manager'}</option>
                                                    {users.filter(u => {
                                                        if (['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)) return u.role === 'PM';
                                                        if (user?.role === 'PM') return ['FOREMAN', 'WORKER'].includes(u.role);
                                                        return false;
                                                    }).map(u => (
                                                        <option key={u._id} value={u._id}>{u.fullName} ({u.role})</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* Workers Assignment */}
                                    <div className="group/assign-w relative">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Users size={13} className="text-slate-400 shrink-0" />
                                            <span className="text-xs font-bold truncate">
                                                Crew: {job.assignedWorkers?.length || 0} assigned
                                            </span>
                                        </div>
                                        {['COMPANY_OWNER', 'SUPER_ADMIN', 'PM'].includes(user?.role) && (
                                            <div className="absolute inset-0 opacity-0 cursor-pointer w-full" onClick={() => setIsAssigningWorkers(job._id)}></div>
                                        )}
                                        {user?.role === 'FOREMAN' && (
                                            <select
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                value={typeof job.foremanId === 'object' ? job.foremanId._id : (job.foremanId || '')}
                                                onChange={(e) => handleAssignForeman(job._id, e.target.value)}
                                            >
                                                <option value="">Assign Worker</option>
                                                {users.filter(u => u.role === 'WORKER').map(u => (
                                                    <option key={u._id} value={u._id}>{u.fullName} (WORKER)</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Multi-select for workers (simple dropdown for now) */}
                                    {isAssigningWorkers === job._id && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                                                <h3 className="text-lg font-black mb-4">Assign Crew Members</h3>
                                                <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                                                    {users.filter(u => u.role === 'WORKER').map(u => (
                                                        <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={job.assignedWorkers?.includes(u._id)}
                                                                onChange={(e) => {
                                                                    const current = job.assignedWorkers || [];
                                                                    const next = e.target.checked
                                                                        ? [...current, u._id]
                                                                        : current.filter(id => id !== u._id);
                                                                    handleAssignWorkers(job._id, next);
                                                                }}
                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-bold text-slate-700">{u.fullName}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <button onClick={() => setIsAssigningWorkers(null)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest">Close</button>
                                            </div>
                                        </div>
                                    )}

                                    {(job.startDate || job.endDate) && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={13} className="text-slate-400 shrink-0" />
                                            <span className="text-xs font-bold">
                                                {job.startDate ? new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?'}
                                                {' → '}
                                                {job.endDate ? new Date(job.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '?'}
                                            </span>
                                        </div>
                                    )}
                                    {showBudget && job.budget > 0 && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <DollarSign size={13} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-black text-slate-800">${Number(job.budget).toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Job Equipment List */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipment On Site</span>
                                            <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {equipment.filter(e => (e.assignedJob?._id === job._id || e.assignedJob === job._id)).length}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {equipment.filter(e => (e.assignedJob?._id === job._id || e.assignedJob === job._id)).map(e => (
                                                <div key={e._id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2 group/equip">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${e.category === 'Small Tools' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            <Briefcase size={12} />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-700 truncate">{e.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleReturnEquipment(e._id)}
                                                        disabled={returningEquipId === e._id}
                                                        className="opacity-0 group-hover/equip:opacity-100 transition-all text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100"
                                                    >
                                                        {returningEquipId === e._id ? '...' : 'Return'}
                                                    </button>
                                                </div>
                                            ))}
                                            {equipment.filter(e => (e.assignedJob?._id === job._id || e.assignedJob === job._id)).length === 0 && (
                                                <p className="text-[11px] text-slate-300 font-bold italic">No equipment assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate(`/company-admin/projects/${projectId}/jobs/${job._id}/deficiencies`)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-1.5"
                                        title="Deficiencies List"
                                    >
                                        <AlertTriangle size={16} />
                                        <span className="text-[10px] font-black uppercase">Punch List</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteJob(job._id)}
                                        disabled={deletingId === job._id}
                                        className="ml-auto p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        {deletingId === job._id
                                            ? <Loader size={16} className="animate-spin" />
                                            : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredJobs.length === 0 && jobs.length > 0 && (
                            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 text-slate-300">
                                <Search size={40} className="opacity-30" />
                                <p className="font-bold uppercase tracking-widest text-[11px]">No jobs match your search</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Table view */
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4">Job Name</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Project Manager</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Dates</th>
                                    {showBudget && <th className="px-6 py-4">Budget</th>}
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredJobs.length === 0 ? (
                                    <tr><td colSpan={showBudget ? 7 : 6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <Briefcase size={40} className="opacity-30" />
                                            <p className="font-bold uppercase tracking-widest text-[11px]">
                                                {jobs.length === 0 ? 'No jobs yet — create the first one!' : 'No jobs match your search'}
                                            </p>
                                        </div>
                                    </td></tr>
                                ) : filteredJobs.map(job => (
                                    <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-slate-900">{job.name}</td>
                                        <td className="px-6 py-4 text-slate-500 font-bold text-xs">{job.location || '—'}</td>
                                        <td className="px-6 py-4 text-slate-600 font-bold text-xs">
                                            {job.foremanId
                                                ? (typeof job.foremanId === 'object' ? job.foremanId.fullName : job.foremanId)
                                                : <span className="text-slate-300 italic">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                                        <td className="px-6 py-4 text-slate-400 font-bold text-xs">
                                            {job.startDate ? new Date(job.startDate).toLocaleDateString() : '—'}
                                            {job.endDate ? ` → ${new Date(job.endDate).toLocaleDateString()}` : ''}
                                        </td>
                                        {showBudget && (
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {job.budget > 0 ? `$${Number(job.budget).toLocaleString()}` : '—'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteJob(job._id)}
                                                disabled={deletingId === job._id}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                {deletingId === job._id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </div >
        </div >
    );
};

export default ProjectDetails;
