import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Filter, Calendar, MoreVertical,
    CheckCircle, Clock, AlertCircle, LayoutGrid, List, Loader,
    Hash, Target, Edit, Trash2,
    AlertTriangle, Layers, TrendingUp, X, UserCheck, Flag,
    ChevronDown, Users, Briefcase, CheckCircle2, ArrowRight
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS = {
    WORKER: 'Worker',
    FOREMAN: 'Foreman',
    SUBCONTRACTOR: 'Subcontractor',
    PM: 'Project Manager',
    COMPANY_OWNER: 'Owner',
};

const ROLE_COLORS = {
    WORKER: 'bg-blue-50 text-blue-600 border-blue-100',
    FOREMAN: 'bg-orange-50 text-orange-600 border-orange-100',
    SUBCONTRACTOR: 'bg-purple-50 text-purple-600 border-purple-100',
    PM: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    COMPANY_OWNER: 'bg-slate-50 text-slate-700 border-slate-200',
};

const getTaskUrgency = (task) => {
    if (task.status === 'completed') return 'completed';
    if (!task.dueDate) return 'normal';
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffMs < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return 'normal';
};

const urgencyStyles = {
    overdue: { card: 'border-red-200 bg-red-50/30', badge: 'bg-red-100 text-red-700', label: 'OVERDUE' },
    'due-soon': { card: 'border-yellow-200 bg-yellow-50/20', badge: 'bg-yellow-100 text-yellow-700', label: 'DUE SOON' },
    completed: { card: 'border-emerald-200 bg-emerald-50/10', badge: 'bg-emerald-100 text-emerald-700', label: 'DONE' },
    normal: { card: 'border-slate-200/60 bg-white', badge: '', label: '' },
};

const priorityStyles = {
    High: 'bg-red-50 text-red-600 border-red-100',
    Medium: 'bg-orange-50 text-orange-600 border-orange-100',
    Low: 'bg-blue-50 text-blue-600 border-blue-100',
};

// ─── Kanban Task Card ──────────────────────────────────────────────────────────
const DraggableTask = ({ task, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
    const [menuOpen, setMenuOpen] = useState(false);
    const urgency = getTaskUrgency(task);
    const uStyle = urgencyStyles[urgency];

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-5 rounded-3xl border shadow-sm hover:shadow-xl hover:shadow-slate-200/50 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden ${uStyle.card} ${isDragging ? 'z-50 ring-2 ring-blue-500/20' : ''}`}
        >
            {/* Urgency strip */}
            {urgency !== 'normal' && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${urgency === 'overdue' ? 'bg-red-500' : urgency === 'due-soon' ? 'bg-yellow-400' : 'bg-emerald-500'}`} />
            )}

            <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                    {task.priority}
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition-colors"
                >
                    <MoreVertical size={15} />
                </button>
                {menuOpen && (
                    <div className="absolute right-4 top-12 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(task); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                            <Edit size={13} /> Edit Task
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-1 mb-4">
                <h4 className="font-black text-slate-900 leading-tight text-sm group-hover:text-blue-600 transition-colors">{task.title}</h4>
                <div className="flex items-center gap-1.5">
                    <Hash size={9} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{task.projectId?.name || '—'}</span>
                </div>
            </div>

            {/* Assignee row */}
            {task.assignedTo?.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                        {task.assignedTo.slice(0, 3).map((u, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-500 flex items-center justify-center" title={u.fullName}>
                                {u.fullName?.charAt(0)}
                            </div>
                        ))}
                    </div>
                    {task.assignedRoleType && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${ROLE_COLORS[task.assignedRoleType] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {ROLE_LABELS[task.assignedRoleType] || task.assignedRoleType}
                        </span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {urgency !== 'normal' && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${uStyle.badge}`}>{uStyle.label}</span>
                )}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-black ml-auto ${urgency === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Clock size={11} />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'ASAP'}
                </div>
            </div>
        </div>
    );
};

// ─── Kanban Column ─────────────────────────────────────────────────────────────
const DroppableColumn = ({ status, style, filteredTasks, onEdit, onDelete }) => {
    const { setNodeRef } = useDroppable({ id: status });
    const colTasks = filteredTasks.filter(t => t.status === status);
    const taskIds = colTasks.map(t => t._id);

    return (
        <div ref={setNodeRef} className="flex-1 flex flex-col min-w-[300px] bg-slate-50/50 rounded-[32px] border border-slate-200/60 h-full max-h-full">
            <div className="p-5 pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{style.label}</h3>
                    </div>
                    <span className="bg-white border border-slate-200 text-slate-400 px-2.5 py-0.5 rounded-xl text-[10px] font-black">
                        {colTasks.length}
                    </span>
                </div>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {colTasks.map(task => (
                        <DraggableTask key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </SortableContext>
                {colTasks.length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-200 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Layers size={28} />
                        <span className="text-[10px] font-black uppercase mt-2">Empty</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Tasks Page ───────────────────────────────────────────────────────────
const Tasks = () => {
    const { user } = useAuth();
    const [view, setView] = useState('kanban');
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterDueFrom, setFilterDueFrom] = useState('');
    const [filterDueTo, setFilterDueTo] = useState('');
    const [filterProject, setFilterProject] = useState('');

    const [formData, setFormData] = useState({
        title: '', projectId: '', assignedTo: [], assignedRoleType: '',
        priority: 'Medium', status: 'todo', dueDate: '', startDate: '', description: ''
    });

    const columns = {
        'todo': { label: 'To Do', dot: 'bg-slate-400' },
        'in_progress': { label: 'In Progress', dot: 'bg-blue-600' },
        'review': { label: 'In Review', dot: 'bg-orange-500' },
        'completed': { label: 'Completed', dot: 'bg-emerald-500' },
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/projects'),
                api.get('/auth/users')
            ]);
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
            // Only include field workers for assignment dropdown
            setTeam((usersRes.data || []).filter(u =>
                ['WORKER', 'FOREMAN', 'SUBCONTRACTOR', 'PM'].includes(u.role)
            ));
        } catch (error) {
            console.error('Error fetching task data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Default to list view for workers/subcontractors for better mobile experience
        if (['WORKER', 'SUBCONTRACTOR'].includes(user?.role)) {
            setView('list');
        }
    }, [user?.role]);

    // Filtered team based on selected role type in form
    const filteredTeamByRole = useMemo(() => {
        let list = team;
        if (formData.assignedRoleType) {
            list = team.filter(u => u.role === formData.assignedRoleType);
        }

        if (user?.role === 'PM') {
            list = list.filter(u => ['FOREMAN', 'SUBCONTRACTOR'].includes(u.role));
        } else if (['FOREMAN', 'SUBCONTRACTOR'].includes(user?.role)) {
            list = list.filter(u => u.role === 'WORKER');
        }

        return list;
    }, [team, formData.assignedRoleType, user?.role]);

    // Apply all filters
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.assignedTo?.some(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchStatus = !filterStatus || task.status === filterStatus;
            const matchRole = !filterRole || task.assignedRoleType === filterRole;
            const matchProject = !filterProject || task.projectId?._id === filterProject;

            let matchDue = true;
            if (task.dueDate) {
                const due = new Date(task.dueDate);
                if (filterDueFrom) matchDue = matchDue && due >= new Date(filterDueFrom);
                if (filterDueTo) matchDue = matchDue && due <= new Date(filterDueTo);
            }

            return matchSearch && matchStatus && matchRole && matchProject && matchDue;
        });
    }, [tasks, searchTerm, filterStatus, filterRole, filterProject, filterDueFrom, filterDueTo]);

    // Stats
    const stats = useMemo(() => ({
        total: tasks.length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
    }), [tasks]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;
        const taskId = active.id;
        const newStatus = over.id;
        const task = tasks.find(t => t._id === taskId);
        if (!task || task.status === newStatus || !columns[newStatus]) return;

        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        try {
            await api.patch(`/tasks/${taskId}`, { status: newStatus });
        } catch {
            fetchData();
        }
    };

    const openCreate = () => {
        setEditingTask(null);
        setFormData({ title: '', projectId: '', assignedTo: [], assignedRoleType: '', priority: 'Medium', status: 'todo', dueDate: '', startDate: '', description: '' });
        setIsModalOpen(true);
    };

    const openEdit = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title || '',
            projectId: task.projectId?._id || task.projectId || '',
            assignedTo: task.assignedTo?.map(u => u._id || u) || [],
            assignedRoleType: task.assignedRoleType || '',
            priority: task.priority || 'Medium',
            status: task.status || 'todo',
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            startDate: task.startDate ? task.startDate.split('T')[0] : '',
            description: task.description || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                assignedTo: formData.assignedTo.filter(Boolean),
            };
            if (editingTask) {
                await api.patch(`/tasks/${editingTask._id}`, payload);
            } else {
                await api.post('/tasks', payload);
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        try {
            setIsSubmitting(true);
            await api.delete(`/tasks/${taskToDelete._id}`);
            setTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        } catch (error) {
            console.error('Error deleting task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canManage = ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM', 'FOREMAN'].includes(user?.role);

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12 h-[calc(100vh-140px)] flex flex-col">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Task Command Center</h1>
                    <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={13} className="text-blue-600" /> Task tracking & assignment
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Stats pills */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <AlertTriangle size={12} /> {stats.overdue} Overdue
                        </span>
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} /> {stats.inProgress} Active
                        </span>
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle size={12} /> {stats.completed} Done
                        </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-1 flex shadow-sm">
                        <button onClick={() => setView('kanban')} className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid size={17} />
                        </button>
                        <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List size={17} />
                        </button>
                    </div>
                    {canManage && (
                        <button onClick={openCreate} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition shadow-xl shadow-blue-200 font-black text-sm uppercase tracking-tight">
                            <Plus size={17} /> New Task
                        </button>
                    )}
                </div>
            </div>

            {/* ── Search & Filters ── */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 space-y-3 shrink-0">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tasks, projects, or assignees..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-5 py-2.5 border rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter size={16} /> Filters
                        {(filterStatus || filterRole || filterProject || filterDueFrom || filterDueTo) && (
                            <span className="bg-white/30 text-white px-1.5 py-0.5 rounded-full text-[9px]">ON</span>
                        )}
                    </button>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                            <option value="">All Roles</option>
                            <option value="WORKER">Worker</option>
                            <option value="FOREMAN">Foreman</option>
                            <option value="SUBCONTRACTOR">Subcontractor</option>
                            <option value="PM">Project Manager</option>
                        </select>
                        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <input type="date" value={filterDueFrom} onChange={e => setFilterDueFrom(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="Due From" />
                        <div className="flex items-center gap-2">
                            <input type="date" value={filterDueTo} onChange={e => setFilterDueTo(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="Due To" />
                            <button onClick={() => { setFilterStatus(''); setFilterRole(''); setFilterProject(''); setFilterDueFrom(''); setFilterDueTo(''); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden min-h-0">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Tasks...</p>
                    </div>
                ) : view === 'kanban' ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="flex gap-5 h-full overflow-x-auto pb-4 custom-scrollbar">
                            {Object.entries(columns).map(([status, style]) => (
                                <DroppableColumn
                                    key={status}
                                    status={status}
                                    style={style}
                                    filteredTasks={filteredTasks}
                                    onEdit={openEdit}
                                    onDelete={(t) => { setTaskToDelete(t); setIsDeleteModalOpen(true); }}
                                />
                            ))}
                        </div>
                    </DndContext>
                ) : (
                    /* ── List View ── */
                    <div className="bg-white rounded-[36px] shadow-sm border border-slate-200/60 h-full overflow-hidden flex flex-col">
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-4">Task</th>
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Assigned To</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Priority</th>
                                        <th className="px-6 py-4">Due Date</th>
                                        {canManage && <th className="px-6 py-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-300">
                                                    <Layers size={36} />
                                                    <p className="font-black uppercase tracking-widest text-xs">No tasks found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTasks.map(task => {
                                        const urgency = getTaskUrgency(task);
                                        return (
                                            <tr key={task._id} className={`hover:bg-slate-50/50 transition-colors group ${urgency === 'overdue' ? 'bg-red-50/30' : urgency === 'due-soon' ? 'bg-yellow-50/20' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {urgency === 'overdue' && <div className="w-1.5 h-8 bg-red-500 rounded-full shrink-0" />}
                                                        {urgency === 'due-soon' && <div className="w-1.5 h-8 bg-yellow-400 rounded-full shrink-0" />}
                                                        {urgency === 'completed' && <div className="w-1.5 h-8 bg-emerald-400 rounded-full shrink-0" />}
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm">{task.title}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">By: {task.assignedBy?.fullName || task.createdBy?.fullName || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-500">{task.projectId?.name || '—'}</td>
                                                <td className="px-6 py-4">
                                                    {task.assignedTo?.length > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] border border-blue-100">
                                                                {task.assignedTo[0]?.fullName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-700">{task.assignedTo[0]?.fullName}</p>
                                                                {task.assignedTo.length > 1 && <p className="text-[10px] font-bold text-slate-400">+{task.assignedTo.length - 1} more</p>}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-slate-300 text-xs font-bold">Unassigned</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.assignedRoleType ? (
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${ROLE_COLORS[task.assignedRoleType] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {ROLE_LABELS[task.assignedRoleType] || task.assignedRoleType}
                                                        </span>
                                                    ) : <span className="text-slate-300 text-[10px] font-bold">—</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest
                                                        ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                task.status === 'review' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                    'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {task.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-xs font-black ${urgency === 'overdue' ? 'text-red-600' : urgency === 'due-soon' ? 'text-yellow-600' : 'text-slate-800'}`}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button onClick={() => openEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                                                                <Edit size={15} />
                                                            </button>
                                                            <button onClick={() => { setTaskToDelete(task); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ── */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
                <form onSubmit={handleSave} className="space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Target size={13} className="text-blue-600" /> Task Title
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            placeholder="e.g. Install Safety Nets Level 3"
                        />
                    </div>

                    {/* Project */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase size={13} className="text-blue-600" /> Project
                        </label>
                        <select
                            required
                            value={formData.projectId}
                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Role + Assignee row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <UserCheck size={13} className="text-blue-600" /> Assign Role
                            </label>
                            <select
                                value={formData.assignedRoleType}
                                onChange={e => setFormData({ ...formData, assignedRoleType: e.target.value, assignedTo: [] })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Any Role</option>
                                {(!user?.role || ['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role) || ['FOREMAN', 'SUBCONTRACTOR'].includes(user?.role)) && (
                                    <option value="WORKER">Worker</option>
                                )}
                                {(!user?.role || ['COMPANY_OWNER', 'SUPER_ADMIN', 'PM'].includes(user?.role)) && (
                                    <>
                                        <option value="FOREMAN">Foreman</option>
                                        <option value="SUBCONTRACTOR">Subcontractor</option>
                                    </>
                                )}
                                {(!user?.role || ['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)) && (
                                    <option value="PM">Project Manager</option>
                                )}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users size={13} className="text-blue-600" /> Assign To
                            </label>
                            <select
                                value={formData.assignedTo[0] || ''}
                                onChange={e => setFormData({ ...formData, assignedTo: e.target.value ? [e.target.value] : [] })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Unassigned</option>
                                {filteredTeamByRole.map(m => (
                                    <option key={m._id} value={m._id}>{m.fullName} ({ROLE_LABELS[m.role] || m.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Priority + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Flag size={13} className="text-blue-600" /> Priority
                            </label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none">
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">In Review</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={13} className="text-blue-600" /> Start Date
                            </label>
                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={13} className="text-orange-500" /> Due Date
                            </label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-500/50 resize-none"
                            placeholder="Task description or scope..."
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-tight hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-3 disabled:opacity-60">
                            {isSubmitting ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            {editingTask ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Modal ── */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Task">
                <div className="flex flex-col items-center p-4 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border border-red-100">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Delete Task?</h3>
                    <p className="text-slate-500 font-bold mb-7 text-sm max-w-xs">
                        <span className="text-red-500">"{taskToDelete?.title}"</span> will be permanently deleted.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition">Cancel</button>
                        <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 transition flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader size={15} className="animate-spin" /> : null} Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
