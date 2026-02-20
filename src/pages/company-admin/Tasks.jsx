import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Calendar, MapPin, MoreVertical,
    CheckCircle, Clock, AlertCircle, LayoutGrid, List, User, Loader,
    Hash, ChevronRight, Target, ShieldAlert, Edit, Trash2, Check,
    AlertTriangle, Layers, TrendingUp
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DraggableTask = ({ task, status, onEdit, onDelete, columns }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            className={`bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden
                ${isDragging ? 'z-50 ring-2 ring-blue-500/20' : ''}`}
        >
            <div className="flex justify-between items-start mb-4">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm
                    ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        task.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {task.priority} Priority
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors group-hover:text-slate-600"
                >
                    <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-4 top-12 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(task); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                            <Edit size={14} /> Edit Task
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={14} /> Archive Task
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h4 className="font-black text-slate-900 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                <div className="flex items-center gap-1.5">
                    <Hash size={10} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                        {task.projectId?.name || 'Site Unassigned'}
                    </span>
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="flex -space-x-2">
                    {task.assignedTo?.length > 0 ? task.assignedTo.map((u, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm" title={u.fullName}>
                            {u.fullName.charAt(0)}
                        </div>
                    )) : (
                        <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-300">
                            ?
                        </div>
                    )}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black 
                    ${task.dueDate && new Date(task.dueDate) < new Date() && status !== 'completed' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Clock size={12} />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'ASAP'}
                </div>
            </div>

            {status === 'completed' && <div className="absolute -bottom-2 -right-2 transform rotate-12 opacity-10"><CheckCircle size={60} /></div>}
        </div>
    );
};

const DroppableColumn = ({ status, style, filteredTasks, children, onEdit, onDelete, columns }) => {
    const { setNodeRef } = useDroppable({ id: status });
    const taskIds = filteredTasks.filter(t => t.status === status).map(t => t._id);

    return (
        <div ref={setNodeRef} className="flex-1 flex flex-col min-w-[320px] bg-slate-50/50 rounded-[40px] border border-slate-200/60 h-full max-h-full transition-all group/col">
            <div className="p-6 pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${style.dot} shadow-sm group-hover/col:scale-125 transition-transform`}></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{style.label}</h3>
                    </div>
                    <span className="bg-white border border-slate-200 text-slate-400 px-3 py-1 rounded-xl text-[10px] font-black shadow-sm">
                        {taskIds.length}
                    </span>
                </div>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {filteredTasks.filter(t => t.status === status).map(task => (
                        <DraggableTask key={task._id} task={task} status={status} onEdit={onEdit} onDelete={onDelete} columns={columns} />
                    ))}
                </SortableContext>
                {taskIds.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl mx-2">
                        <Layers size={32} />
                        <span className="text-[10px] font-black uppercase mt-2">Zero Tasks</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Tasks = () => {
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

    const [formData, setFormData] = useState({
        title: '', projectId: '', assignedTo: [], priority: 'Medium', status: 'todo', dueDate: '', description: ''
    });

    const columns = {
        'todo': { label: 'To Do', dot: 'bg-slate-400' },
        'in_progress': { label: 'In Execution', dot: 'bg-blue-600' },
        'review': { label: 'In Review', dot: 'bg-orange-500' },
        'completed': { label: 'Finalized', dot: 'bg-emerald-500' }
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
            setTasks(tasksRes.data);
            setProjects(projectsRes.data);
            setTeam(usersRes.data.filter(user => user.role !== 'COMPANY_OWNER'));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        } catch (error) {
            fetchData();
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

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (editingTask) await api.patch(`/tasks/${editingTask._id}`, formData);
            else await api.post('/tasks', formData);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={14} className="text-blue-600" />
                        Task tracking and operational logistics
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-1 flex shadow-sm">
                        <button onClick={() => setView('kanban')} className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List size={18} />
                        </button>
                    </div>
                    <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition shadow-xl shadow-blue-200 font-black text-sm uppercase tracking-tight">
                        <Plus size={18} /> Deploy New Task
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search objectives, sites, or crew leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <button className="px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                    <Filter size={18} /> Filter Priorities
                </button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Logistics...</p>
                    </div>
                ) : view === 'kanban' ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="flex gap-8 h-full overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
                            {Object.entries(columns).map(([status, style]) => (
                                <DroppableColumn
                                    key={status}
                                    status={status}
                                    style={style}
                                    filteredTasks={filteredTasks}
                                    onEdit={(t) => { setEditingTask(t); setFormData({ ...t, projectId: t.projectId?._id, assignedTo: t.assignedTo?.map(u => u._id) || [] }); setIsModalOpen(true); }}
                                    onDelete={(t) => { setTaskToDelete(t); setIsDeleteModalOpen(true); }}
                                    columns={columns}
                                />
                            ))}
                        </div>
                    </DndContext>
                ) : (
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 h-full overflow-hidden flex flex-col">
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-8 py-5">Objective</th>
                                        <th className="px-8 py-5">Project Site</th>
                                        <th className="px-8 py-5">Personnel</th>
                                        <th className="px-8 py-5">Priority</th>
                                        <th className="px-8 py-5">Due Date</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTasks.map((task) => (
                                        <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">{task.title}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                        <Clock size={10} /> Created {new Date(task.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{task.projectId?.name || 'Manual Task'}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] border border-blue-100">
                                                        {task.assignedTo?.[0]?.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700">{task.assignedTo?.[0]?.fullName || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border
                                                    ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-black text-slate-800 text-sm">
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setEditingTask(task); setFormData({ ...task, projectId: task.projectId?._id, assignedTo: task.assignedTo?.map(u => u._id) || [] }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => { setTaskToDelete(task); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500 transition-all">
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
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Reconfigure Objective" : "New Operational Task"}>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} className="text-blue-600" /> Task / Objective Name
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            placeholder="e.g. Structural Steel Inspection"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Personnel</label>
                            <select
                                value={formData.assignedTo[0] || ''}
                                onChange={e => setFormData({ ...formData, assignedTo: [e.target.value] })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none pointer-events-auto"
                            >
                                <option value="">Select Personnel</option>
                                {team.map(member => (
                                    <option key={member._id} value={member._id}>{member.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Project Site</label>
                            <select
                                value={formData.projectId}
                                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none"
                                required
                            >
                                <option value="">Select Project</option>
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>{project.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Priority Mapping</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="Low">Standard Priority</option>
                                <option value="Medium">Elevated Priority</option>
                                <option value="High">Critical Priority</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Target Deadline</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Strategic Instructions</label>
                        <textarea
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-[32px] p-6 font-bold text-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none shadow-inner"
                            placeholder="Detail the technical scope of this objective..."
                        ></textarea>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-tight hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-3">
                            {isSubmitting ? <Loader size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            {editingTask ? 'Commit Changes' : 'Initialize Task'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Archive Objective">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-100 animate-bounce">
                        <AlertTriangle size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Archive Task?</h3>
                    <p className="text-slate-500 font-bold mb-8 max-w-xs">
                        Removing <span className="text-red-500">"{taskToDelete?.title}"</span> will permanently hide this operational objective from all charts.
                    </p>
                    <div className="flex gap-4 w-full">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition font-black text-xs uppercase tracking-widest">Cancel</button>
                        <button onClick={confirmDelete} className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200">Archive Forever</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tasks;
