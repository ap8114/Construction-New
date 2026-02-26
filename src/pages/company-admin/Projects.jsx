import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Search, Calendar, MapPin, Edit, Trash2,
  CheckCircle, Upload, ChevronRight, LayoutGrid, List, Globe, Filter,
  DollarSign, TrendingUp, Users, X, HardHat, Briefcase, ArrowRight, RefreshCw, FileText, ChevronDown
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getLocationStr = (loc) => {
  if (!loc) return '';
  if (typeof loc === 'object') return loc.address || '';
  return loc;
};

const canSeeBudget = (role) =>
  ['COMPANY_OWNER', 'OWNER', 'PM', 'SUPER_ADMIN'].includes(role);

// ─── Project Form (Create/Edit) ───────────────────────────────────────────────
const ProjectForm = ({ data, setData, onSubmit, submitLabel, clients, projectManagers }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setData({ ...data, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all";

  return (
    <div className="space-y-5">
      {/* Image Upload */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Upload size={13} className="text-blue-600" /> Project Image (optional)
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all relative group overflow-hidden cursor-pointer">
          <input type="file" accept="image/*" onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          {data.image && !data.image.includes('unsplash') ? (
            <div className="relative w-full h-36">
              <img src={data.image} alt="Preview" className="h-full w-full object-cover rounded-xl shadow-md" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <span className="text-white font-black text-xs uppercase tracking-widest">Change</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm">
                <Upload size={20} />
              </div>
              <span className="text-sm font-black text-slate-500">Drop project image here</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">JPG, PNG up to 10MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Name + Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Project Name</label>
          <input type="text" value={data.name} onChange={e => setData({ ...data, name: e.target.value })}
            className={inputCls} placeholder="e.g. Skyline Tower Phase II" required />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Client</label>
          <select value={data.clientId} onChange={e => setData({ ...data, clientId: e.target.value })}
            className={inputCls + ' appearance-none'}>
            <option value="">Select a Client</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.fullName}</option>)}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} className="text-blue-600" /> Start Date
          </label>
          <input type="date" value={data.startDate} onChange={e => setData({ ...data, startDate: e.target.value })} className={inputCls} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} className="text-orange-500" /> End Date
          </label>
          <input type="date" value={data.endDate} onChange={e => setData({ ...data, endDate: e.target.value })} className={inputCls} />
        </div>
      </div>

      {/* Budget + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign size={12} className="text-emerald-600" /> Budget
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
            <input type="number" value={data.budget} onChange={e => setData({ ...data, budget: e.target.value })}
              className={inputCls + ' pl-8'} placeholder="0.00" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</label>
          <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })}
            className={inputCls + ' appearance-none'}>
            <option value="planning">Pre-Construction</option>
            <option value="active">Active Site</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Handed Over</option>
          </select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <MapPin size={12} className="text-blue-600" /> Location / Address
        </label>
        <input type="text" value={data.location} onChange={e => setData({ ...data, location: e.target.value })}
          className={inputCls} placeholder="e.g. 123 Construction Way, New York, NY" />
      </div>

      {/* Project Manager Assignment */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Users size={12} className="text-blue-600" /> Assigned Project Manager
        </label>
        <select value={data.pmId} onChange={e => setData({ ...data, pmId: e.target.value })}
          className={inputCls + ' appearance-none'}>
          <option value="">Select a Project Manager</option>
          {projectManagers.map(pm => (
            <option key={pm._id} value={pm._id}>{pm.fullName}</option>
          ))}
        </select>
      </div>

      {/* Manual Progress Control */}
      <div className="space-y-4 bg-slate-50 p-6 rounded-[24px] border border-slate-200/60">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-600" /> Select Project Progress
        </label>
        <div className="relative">
          <select
            value={data.progress || 0}
            onChange={e => setData({ ...data, progress: parseInt(e.target.value) })}
            className={inputCls + ' appearance-none pl-4 pr-10 hover:border-blue-500/50 cursor-pointer'}
          >
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
              <option key={val} value={val}>{val}% Completion</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Geofencing Configuration */}
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200/60 space-y-4">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Globe size={14} className="text-blue-600" /> Geofence & Location Validation
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Site Latitude</label>
            <input type="number" step="any" value={data.siteLatitude || ''} onChange={e => setData({ ...data, siteLatitude: e.target.value })}
              className={inputCls} placeholder="e.g. 40.7128" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Site Longitude</label>
            <input type="number" step="any" value={data.siteLongitude || ''} onChange={e => setData({ ...data, siteLongitude: e.target.value })}
              className={inputCls} placeholder="e.g. -74.0060" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Radius (Meters)</label>
            <input type="number" value={data.allowedRadiusMeters || ''} onChange={e => setData({ ...data, allowedRadiusMeters: e.target.value })}
              className={inputCls} placeholder="Default: 100m" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <button
              onClick={() => setData({ ...data, strictGeofence: !data.strictGeofence })}
              className={`w-12 h-6 rounded-full transition-all relative ${data.strictGeofence ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.strictGeofence ? 'left-7' : 'left-1'}`} />
            </button>
            <label className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer" onClick={() => setData({ ...data, strictGeofence: !data.strictGeofence })}>
              Strict Geofence <span className="text-slate-400 font-normal normal-case">(Block if outside)</span>
            </label>
          </div>
        </div>
      </div>

      <button onClick={onSubmit} disabled={!data.name}
        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-2 flex items-center justify-center gap-2 shadow-xl
          ${data.name ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
        <CheckCircle size={18} /> {submitLabel}
      </button>
    </div>
  );
};

// ─── Insight Card ─────────────────────────────────────────────────────────────
const InsightCard = ({ title, value, subtext, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
      <div className={`p-4 rounded-2xl border ${colors[color]}`}><Icon size={28} /></div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">{subtext}</p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workerTab, setWorkerTab] = useState('planning'); // 'planning' | 'active' | 'completed'
  const [jobs, setJobs] = useState([]);
  const [view, setView] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const showBudget = canSeeBudget(user?.role);

  const EMPTY = {
    name: '', clientId: '', startDate: '', endDate: '', budget: '', pmId: '',
    status: 'active', progress: 0, location: '', image: '', companyId: user?.companyId,
    siteLatitude: '', siteLongitude: '', allowedRadiusMeters: 100, strictGeofence: false
  };
  const [formData, setFormData] = useState(EMPTY);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const isWorker = user?.role === 'WORKER';

      const [projRes, clientRes, usersRes, jobsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users?role=CLIENT').catch(() => ({ data: [] })),
        api.get('/auth/users').catch(() => ({ data: [] })),
        isWorker ? api.get('/jobs').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      setProjects(projRes.data || []);
      setClients(clientRes.data || []);
      setProjectManagers((usersRes.data || []).filter(u => u.role === 'PM'));
      if (isWorker) setJobs(jobsRes.data || []);
    } catch (err) {
      console.error('Projects fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      await api.post('/projects', { ...formData, companyId: user?.companyId });
      setIsCreateOpen(false);
      setFormData(EMPTY);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async () => {
    try {
      await api.patch(`/projects/${editingProject._id}`, editingProject);
      setIsEditOpen(false);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleQuickProgressUpdate = async (projectId, newProgress, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/projects/${projectId}`, { progress: newProgress });
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, progress: newProgress } : p));
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Archive this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const openEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject({
      ...project,
      location: getLocationStr(project.location),
      clientId: typeof project.clientId === 'object' ? (project.clientId?._id || '') : (project.clientId || ''),
      pmId: typeof project.pmId === 'object' ? (project.pmId?._id || '') : (project.pmId || ''),
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      siteLatitude: project.siteLatitude || '',
      siteLongitude: project.siteLongitude || '',
      allowedRadiusMeters: project.allowedRadiusMeters || 100,
      strictGeofence: project.strictGeofence || false,
    });
    setIsEditOpen(true);
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error('Update job status error:', err);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const loc = getLocationStr(p.location);
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isWorker = user?.role === 'WORKER';
  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = j.status === workerTab;
    return matchSearch && matchTab;
  });

  const stats = {
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    totalBudget: projects.reduce((s, p) => s + (Number(p.budget) || 0), 0),
  };

  const statusLabel = s =>
    s === 'active' ? 'Live Site' : s === 'planning' ? 'Planning' : s === 'on-hold' ? 'On Hold' : 'Finished';
  const statusColor = s =>
    s === 'active' ? 'bg-emerald-500/90 text-white border-emerald-400' :
      s === 'planning' ? 'bg-orange-500/90  text-white border-orange-400' :
        s === 'on-hold' ? 'bg-yellow-500/90  text-white border-yellow-400' :
          'bg-slate-500/90   text-white border-slate-400';

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            {user?.role === 'WORKER' ? 'Job Assignments' : 'Projects'}
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} className="text-blue-600" />
            {user?.role === 'WORKER' ? 'Manage your assigned operational objectives' : 'Click a project card to manage jobs'}
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'WORKER' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
              <button
                onClick={() => setWorkerTab('planning')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workerTab === 'planning' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setWorkerTab('active')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workerTab === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setWorkerTab('completed')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workerTab === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Complete
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
                <button onClick={() => setView('grid')}
                  className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setView('table')}
                  className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <List size={18} />
                </button>
              </div>
              {user?.role === 'COMPANY_OWNER' && (
                <button onClick={() => { setFormData(EMPTY); setIsCreateOpen(true); }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight">
                  <Plus size={18} /> Create Project
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {!isWorker && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <InsightCard title="Active Sites" value={stats.active} subtext="currently operational" icon={TrendingUp} color="blue" />
          <InsightCard title="Pre-Construction" value={stats.planning} subtext="in planning phase" icon={Calendar} color="orange" />
          {showBudget && (
            <InsightCard title="Total Portfolio" value={`$${(stats.totalBudget / 1000000).toFixed(1)}M`} subtext="contracted value" icon={DollarSign} color="emerald" />
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={isWorker ? "Search objectives or site names..." : "Search projects or locations..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
          />
        </div>
        {!isWorker && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 outline-none hover:bg-slate-50 transition-all appearance-none">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Pre-Con</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading {isWorker ? 'Objectives' : 'Projects'}...</p>
        </div>
      ) : isWorker ? (
        /* ── Worker Job Assignments View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full py-24 text-center flex flex-col items-center gap-4 text-slate-300">
              <Briefcase size={48} className="opacity-30" />
              <p className="font-bold uppercase tracking-widest text-[11px]">No objectives in this status</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job._id} className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm p-6 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <Briefcase size={20} className="text-blue-600" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Project</span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 truncate max-w-[140px]">
                    {job.projectId?.name || 'Commercial Site'}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{job.name}</h3>
              <p className="text-slate-500 text-xs font-bold flex items-center gap-2 mb-6">
                <MapPin size={12} /> {job.location || 'Main Site Entrance'}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Set Status</span>
                  <div className="flex gap-1.5">
                    {workerTab !== 'planning' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'planning')}
                        className="p-2 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all border border-orange-100"
                        title="Move to Pending"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {workerTab !== 'active' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'active')}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                        title="Start Work"
                      >
                        <TrendingUp size={14} />
                      </button>
                    )}
                    {workerTab !== 'completed' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'completed')}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                        title="Mark Complete"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/company-admin/projects/${job.projectId?._id || job.projectId}`)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  Details <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full py-24 text-center flex flex-col items-center gap-4 text-slate-300">
              <Briefcase size={48} className="opacity-30" />
              <p className="font-bold uppercase tracking-widest text-[11px]">No projects found</p>
              {user?.role === 'COMPANY_OWNER' && (
                <button onClick={() => { setFormData(EMPTY); setIsCreateOpen(true); }}
                  className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-tight hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2">
                  <Plus size={16} /> Create First Project
                </button>
              )}
            </div>
          ) : filtered.map(project => (
            <div key={project._id}
              onClick={() => {
                const path = user?.role === 'CLIENT'
                  ? `/client-portal/progress/${project._id}`
                  : `/company-admin/projects/${project._id}`;
                navigate(path);
              }}
              className="group bg-white rounded-[40px] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 overflow-hidden flex flex-col cursor-pointer">

              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={project.image || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={project.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md ${statusColor(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>
                {/* "View Jobs" hint on hover */}
                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                    <ArrowRight size={12} className="text-white" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">View Jobs</span>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-2 text-white/80 mb-1">
                    <MapPin size={13} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest truncate">
                      {getLocationStr(project.location) || 'Location TBD'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">{project.name}</h3>
                  <div className="flex items-center gap-2 text-white/60 mt-1">
                    <Users size={12} className="text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest truncate">
                      PM: {project.pmId?.fullName || (projectManagers?.find(u => u._id === (project.pmId?._id || project.pmId))?.fullName || 'Unassigned')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 flex-1">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group/progress relative">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                      {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                        <div className="flex items-center gap-1">
                          <select
                            value={project.progress || 0}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => handleQuickProgressUpdate(project._id, parseInt(e.target.value), e)}
                            className="bg-white border border-slate-200 rounded text-[9px] font-black text-slate-600 px-1 py-0.5 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none"
                          >
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                              <option key={val} value={val}>{val}%</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-700"
                          style={{ width: `${project.progress || 0}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-900 w-10 text-right">{project.progress || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Client + Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users size={11} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Client</p>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {project.clientId?.fullName || <span className="text-slate-300 italic">—</span>}
                    </p>
                  </div>
                  {showBudget && (
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                        <DollarSign size={11} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Budget</p>
                      </div>
                      <p className="text-xs font-black text-slate-900">${(Number(project.budget) || 0).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                  {user?.role !== 'CLIENT' && (
                    <button onClick={(e) => openEdit(project, e)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all border border-slate-200/50 flex items-center justify-center"
                      title="Edit Project"
                    >
                      <Edit size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`${user?.role === 'CLIENT' ? '/client-portal' : '/company-admin'}/drawings?projectId=${project._id}`)}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <FileText size={14} className="text-blue-600" /> Drawings
                  </button>

                  {user?.role === 'CLIENT' && (
                    <button
                      onClick={() => navigate(`/client-portal/progress/${project._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <TrendingUp size={14} /> Work Progress
                    </button>
                  )}

                  {user?.role !== 'CLIENT' && (
                    <button
                      onClick={() => navigate(`/company-admin/projects/${project._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <Briefcase size={14} /> View Jobs
                    </button>
                  )}

                  {user?.role !== 'CLIENT' && (
                    <button onClick={(e) => handleDelete(project._id, e)}
                      className="p-3 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-2xl transition-all border border-red-100"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div >
          ))}
        </div >
      ) : (
        /* ── Table View ── */
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Project Name</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Progress</th>
                {showBudget && <th className="px-8 py-5">Budget</th>}
                <th className="px-8 py-5">End Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={showBudget ? 7 : 6} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-300">
                    <Briefcase size={48} className="opacity-30" />
                    <p className="font-bold uppercase tracking-widest text-[11px]">No projects found</p>
                  </div>
                </td></tr>
              ) : filtered.map(project => (
                <tr key={project._id}
                  onClick={() => {
                    const path = user?.role === 'CLIENT'
                      ? `/client-portal/progress/${project._id}`
                      : `/company-admin/projects/${project._id}`;
                    navigate(path);
                  }}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <td className="px-8 py-5 font-black text-slate-900">{project.name}</td>
                  <td className="px-8 py-5 text-slate-500 font-bold text-xs max-w-[160px] truncate">
                    {getLocationStr(project.location) || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border
                      ${project.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        project.status === 'planning' ? 'bg-orange-50  text-orange-700  border-orange-100' :
                          project.status === 'on-hold' ? 'bg-yellow-50  text-yellow-700  border-yellow-100' :
                            'bg-slate-50   text-slate-600   border-slate-200'}`}>
                      {statusLabel(project.status)}
                    </span>
                  </td>
                  <td className="px-8 py-5" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1.5 group/progress-td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{project.progress || 0}%</span>
                      </div>
                      {['COMPANY_OWNER', 'PM'].includes(user?.role) && (
                        <select
                          value={project.progress || 0}
                          onClick={e => e.stopPropagation()}
                          onChange={(e) => handleQuickProgressUpdate(project._id, parseInt(e.target.value), e)}
                          className="bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 px-1 py-0.5 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none"
                        >
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                            <option key={val} value={val}>{val}%</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  {showBudget && (
                    <td className="px-8 py-5 font-bold text-slate-900">${(Number(project.budget) || 0).toLocaleString()}</td>
                  )}
                  <td className="px-8 py-5 text-slate-400 font-bold text-xs">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-8 py-5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${user?.role === 'CLIENT' ? '/client-portal' : '/company-admin'}/drawings?projectId=${project._id}`);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                        title="View Drawings"
                      >
                        <FileText size={18} />
                      </button>
                      <button onClick={(e) => openEdit(project, e)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                        title="Edit Project"
                      >
                        <Edit size={18} />
                      </button>
                      <button onClick={(e) => handleDelete(project._id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
        <ProjectForm data={formData} setData={setFormData} onSubmit={handleCreate}
          submitLabel="Create Project" clients={clients} projectManagers={projectManagers} />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project">
        {editingProject && (
          <ProjectForm data={editingProject} setData={setEditingProject} onSubmit={handleUpdate}
            submitLabel="Save Changes" clients={clients} projectManagers={projectManagers} />
        )}
      </Modal>
    </div >
  );
};

export default Projects;
