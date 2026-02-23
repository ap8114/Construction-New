import { useState, useEffect } from 'react';
import {
  AlertCircle, CheckCircle, Clock, Filter, Plus, X, Save,
  Trash2, Edit, AlertTriangle, Loader, Hash, MapPin, Users,
  ChevronRight, Info, ShieldAlert, Target, Check, Trash
} from 'lucide-react';
import api from '../../utils/api';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../../components/Modal';

const DraggableIssue = ({ issue, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden
                ${isDragging ? 'z-50 ring-2 ring-red-500/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm
                    ${issue.priority === 'critical' ? 'bg-red-600 text-white border-red-500' :
            issue.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
              'bg-blue-50 text-blue-600 border-blue-100'}`}>
          {issue.priority} Priority
        </span>
        <span className="text-[10px] font-black text-slate-300">#{issue._id.slice(-4).toUpperCase()}</span>
      </div>

      <div className="space-y-1">
        <h4 className="font-black text-slate-900 leading-tight tracking-tight group-hover:text-red-600 transition-colors uppercase">{issue.title}</h4>
        <div className="flex items-center gap-1.5">
          <MapPin size={10} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
            {issue.projectId?.name || 'Site Unknown'}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
            {issue.assignedTo ? issue.assignedTo.fullName.charAt(0) : '?'}
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-[80px]">
            {issue.assignedTo?.fullName || 'Unassigned'}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase
                    ${issue.dueDate && new Date(issue.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
          <Clock size={12} /> {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
        </div>
      </div>

      {issue.priority === 'critical' && <div className="absolute -right-4 -top-4 w-12 h-12 bg-red-600/5 rounded-full blur-xl animate-pulse"></div>}
    </div>
  );
};

const DroppableColumn = ({ status, statusLabel, colorClass, dotClass, issues, onIssueClick }) => {
  const { setNodeRef } = useDroppable({ id: status });
  const issueIds = issues.filter(i => i.status === status).map(i => i._id);

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[320px] bg-slate-50/50 border border-slate-200/60 rounded-[40px] flex flex-col h-full max-h-full transition-all group/col">
      <div className="p-6 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${dotClass} shadow-sm group-hover/col:scale-125 transition-transform`}></div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{statusLabel}</h3>
          </div>
          <span className="bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-xl text-[10px] font-black shadow-sm">
            {issueIds.length}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.filter(i => i.status === status).map(issue => (
            <DraggableIssue key={issue._id} issue={issue} onClick={() => onIssueClick(issue)} />
          ))}
        </SortableContext>
        {issueIds.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl mx-2">
            <CheckCircle size={32} />
            <span className="text-[10px] font-black uppercase mt-2">All Clear</span>
          </div>
        )}
      </div>
    </div>
  );
};

const IssueForm = ({ data, setData, onSubmit, submitLabel, projects, users, isSubmitting }) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <AlertTriangle size={14} className="text-red-600" /> Issue / Snag Title
      </label>
      <input
        type="text"
        required
        value={data.title}
        onChange={e => setData({ ...data, title: e.target.value })}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all text-sm"
        placeholder="e.g. Water Seepage in Basement Slab"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Project Site</label>
        <select
          value={data.projectId}
          onChange={e => setData({ ...data, projectId: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none"
          required
        >
          <option value="">Select Site</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Personnel Responsible</label>
        <select
          value={data.assignedTo}
          onChange={e => setData({ ...data, assignedTo: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none"
        >
          <option value="">Unassigned</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.fullName}</option>
          ))}
        </select>
      </div>
    </div>
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Issue Category</label>
      <select
        value={data.category}
        onChange={e => setData({ ...data, category: e.target.value })}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none"
      >
        <option value="general">General Issue</option>
        <option value="safety">Safety / Incident</option>
        <option value="quality">Quality / Defect</option>
        <option value="equipment">Equipment Related</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Severity Level</label>
        <select
          value={data.priority}
          onChange={e => setData({ ...data, priority: e.target.value })}
          className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 font-bold outline-none transition-all text-sm appearance-none
                        ${data.priority === 'critical' ? 'border-red-400 text-red-700 bg-red-50' : 'border-slate-200 text-slate-800'}`}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical Path Impact</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Resolution Deadline</label>
        <input
          type="date"
          value={data.dueDate}
          onChange={e => setData({ ...data, dueDate: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 text-sm"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Technical Description</label>
      <textarea
        value={data.description}
        onChange={e => setData({ ...data, description: e.target.value })}
        className="w-full bg-slate-50 border border-slate-200 rounded-[32px] p-6 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all h-32 resize-none shadow-inner text-sm"
        placeholder="Describe the issue, defect, or safety concern in detail..."
      />
    </div>

    <button
      onClick={onSubmit}
      disabled={isSubmitting}
      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50"
    >
      {isSubmitting ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
      {submitLabel}
    </button>
  </div>
);

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [formData, setFormData] = useState({
    title: '', projectId: '', priority: 'medium', status: 'open', assignedTo: '', dueDate: '', description: '', category: 'general'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issueRes, projRes, userRes] = await Promise.all([
        api.get('/issues'),
        api.get('/projects'),
        api.get('/auth/users')
      ]);
      setIssues(issueRes.data);
      setProjects(projRes.data);
      setUsers(userRes.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const issueId = active.id;
    const newStatus = over.id;
    const issue = issues.find(i => i._id === issueId);
    if (!issue || issue.status === newStatus || !['open', 'in_review', 'resolved'].includes(newStatus)) return;

    setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
    try {
      await api.patch(`/issues/${issueId}`, { status: newStatus });
    } catch (error) {
      fetchData();
    }
  };

  const handleSaveReport = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/issues', formData);
      fetchData();
      setIsReportOpen(false);
    } catch (error) {
      console.error('Error reporting issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      await api.patch(`/issues/${selectedIssue._id}`, formData);
      fetchData();
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/issues/${selectedIssue._id}`);
      fetchData();
      setIsDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  const statusConfig = {
    'open': { label: 'Active Snags', dot: 'bg-red-500 shadow-red-200' },
    'in_review': { label: 'In Correction', dot: 'bg-orange-500 shadow-orange-200' },
    'resolved': { label: 'Verified Fixed', dot: 'bg-emerald-500 shadow-emerald-200' }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Site Issues & Snags</h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600" />
            Defect management and safety oversight
          </p>
        </div>
        <button
          onClick={() => { setFormData({ title: '', projectId: '', priority: 'medium', status: 'open', assignedTo: '', dueDate: '', description: '', category: 'general' }); setIsReportOpen(true); }}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-700 transition shadow-xl shadow-red-200 font-black text-sm uppercase tracking-tight"
        >
          <Plus size={18} /> Log Critical Snag
        </button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-8 h-full overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
            {Object.entries(statusConfig).map(([status, config]) => (
              <DroppableColumn
                key={status}
                status={status}
                statusLabel={config.label}
                dotClass={config.dot}
                issues={issues}
                onIssueClick={(i) => { setSelectedIssue(i); setIsViewOpen(true); }}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Modals */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Report Site Defect">
        <IssueForm data={formData} setData={setFormData} onSubmit={handleSaveReport} submitLabel="Commit to Snag List" projects={projects} users={users} isSubmitting={isSubmitting} />
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Snag Parameters">
        <IssueForm data={formData} setData={setFormData} onSubmit={handleSaveEdit} submitLabel="Secure Updates" projects={projects} users={users} isSubmitting={isSubmitting} />
      </Modal>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Incident Snapshot">
        {selectedIssue && (
          <div className="space-y-8">
            <div className={`p-6 rounded-[32px] border shadow-inner flex justify-between items-start
                            ${selectedIssue.priority === 'critical' ? 'bg-red-50 border-red-100 shadow-red-50' : 'bg-slate-50 border-slate-100 shadow-slate-50'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm
                                        ${selectedIssue.priority === 'critical' ? 'bg-red-600 text-white border-red-500' : 'bg-blue-600 text-white border-blue-500'}`}>
                    {selectedIssue.priority} Gravity
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 shadow-sm">
                    ID: {selectedIssue._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">{selectedIssue.title}</h3>
                <div className="flex items-center gap-2 text-slate-400 mt-2">
                  <MapPin size={14} />
                  <span className="text-sm font-bold">{selectedIssue.projectId?.name || 'Unassigned Site'}</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3
                                ${selectedIssue.priority === 'critical' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                <AlertTriangle size={28} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="p-4 bg-white border-2 border-slate-50 rounded-3xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Users size={12} className="text-blue-500" /> Responsibility
                </p>
                <p className="text-sm font-black text-slate-900">{selectedIssue.assignedTo?.fullName || 'Crew Alert Issued'}</p>
              </div>
              <div className="p-4 bg-white border-2 border-slate-50 rounded-3xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Clock size={12} className="text-orange-500" /> Deadline
                </p>
                <p className="text-sm font-black text-slate-900">
                  {selectedIssue.dueDate ? new Date(selectedIssue.dueDate).toLocaleDateString() : 'ASAP LOGGED'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 flex items-center gap-2">
                <Info size={12} /> Technical Context
              </p>
              <div className="bg-slate-50/50 border-2 border-slate-100 rounded-[32px] p-6 shadow-inner italic font-bold text-slate-700 leading-relaxed text-sm">
                "{selectedIssue.description || "No specific technical instructions or site photos attached to this incident report."}"
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-4 border-t border-slate-100">
              <button onClick={() => setIsViewOpen(false)} className="w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                Return to Boards
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => { setIsEditOpen(true); setIsViewOpen(false); setFormData({ ...selectedIssue, projectId: selectedIssue.projectId?._id, assignedTo: selectedIssue.assignedTo?._id, dueDate: selectedIssue.dueDate ? new Date(selectedIssue.dueDate).toISOString().split('T')[0] : '' }); }}
                  className="flex-1 sm:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Edit size={16} /> Re-Evaluate
                </button>
                <button onClick={() => { setIsDeleteOpen(true); setIsViewOpen(false); }}
                  className="flex-1 sm:flex-none px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Trash size={16} /> Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Permanently Archive Snag">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 border border-red-100 animate-pulse">
            <ShieldAlert size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Archive Snag Report?</h3>
          <p className="text-slate-500 font-bold mb-8 max-w-xs text-sm">
            This action will remove <span className="text-red-600">"{selectedIssue?.title}"</span> from the active remediation board. Historical records will be archived.
          </p>
          <div className="flex gap-4 w-full">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition font-black text-xs uppercase tracking-widest">Negate</button>
            <button onClick={confirmDelete} className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200">Confirm Archive</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Issues;
