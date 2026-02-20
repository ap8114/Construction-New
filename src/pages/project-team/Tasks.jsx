import { useState } from 'react';
import {
    Search, Filter, CheckCircle2, Clock,
    AlertCircle, ChevronRight, MessageSquare,
    MoreHorizontal, Calendar, Tag, X
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Tasks = () => {
    const [filter, setFilter] = useState('All');
    const [selectedTask, setSelectedTask] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [taskList, setTaskList] = useState([
        {
            id: 1,
            title: 'Inspect Reinforcement Section B',
            priority: 'High',
            status: 'In Progress',
            dueDate: 'Today, 4:00 PM',
            location: 'Site Block 2, Lvl 3',
            category: 'Inspection'
        },
        {
            id: 2,
            title: 'Concrete Pouring Lvl 4',
            priority: 'Critical',
            status: 'Pending',
            dueDate: 'Tomorrow, 9:00 AM',
            location: 'Main Tower',
            category: 'Masonry'
        },
        {
            id: 3,
            title: 'Site Cleanup & Material Sorting',
            priority: 'Medium',
            status: 'Completed',
            dueDate: 'Yesterday',
            location: 'Ground Floor',
            category: 'Maintenance'
        },
        {
            id: 4,
            title: 'Install Safety Nets - East Side',
            priority: 'High',
            status: 'Pending',
            dueDate: 'Feb 15, 2026',
            location: 'Exterior Scaffold',
            category: 'Safety'
        },
    ]);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
            case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    const getStatusIcon = (s) => {
        switch (s) {
            case 'Completed': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'In Progress': return <Clock size={18} className="text-blue-500" />;
            default: return <AlertCircle size={18} className="text-slate-400" />;
        }
    };

    const handleChat = (e, task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsChatOpen(true);
    };

    const handleMenu = (e, task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsMenuOpen(true);
    };

    const handleDetails = (e, task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsDetailsOpen(true);
    };

    // Modal Actions
    const handleEditTask = () => {
        alert(`Editing task: ${selectedTask.title}`);
        setIsMenuOpen(false);
    };

    const handleCompleteTask = () => {
        setTaskList(taskList.map(t =>
            t.id === selectedTask.id ? { ...t, status: 'Completed' } : t
        ));
        setIsMenuOpen(false);
    };

    const handleDeleteTask = () => {
        setTaskList(taskList.filter(t => t.id !== selectedTask.id));
        setIsMenuOpen(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks, locations, or IDs..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            <div className="grid grid-cols-1 gap-4">
                {taskList.map((task) => (
                    <div
                        key={task.id}
                        onClick={(e) => handleDetails(e, task)}
                        className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Hover bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {getStatusIcon(task.status)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-bold transition-colors ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {task.title}
                                        </h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tighter ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Calendar size={14} className="text-slate-400" /> {task.dueDate}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Tag size={14} className="text-slate-400" /> {task.category}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Location</p>
                                    <p className="text-xs font-semibold text-slate-700">{task.location}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleChat(e, task)}
                                        className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                        title="Chat"
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => handleMenu(e, task)}
                                        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition"
                                        title="Options"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDetails(e, task)}
                                        className="p-2 text-slate-300 group-hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                        title="View Details"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Footer */}
            <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-xl border border-slate-100 flex flex-wrap gap-8 items-center justify-around md:justify-start">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">My Performance</p>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-slate-800">92%</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full w-[92%]"></div>
                        </div>
                    </div>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div className="text-center md:text-left">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-2xl font-black text-emerald-500">24 <span className="text-sm text-slate-400 font-medium">this week</span></p>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Overdue</p>
                    <p className="text-2xl font-black text-red-500">1</p>
                </div>
            </div>

            {/* Chat Modal */}
            <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} title={`Chat: ${selectedTask?.title}`}>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                        <p className="font-bold text-slate-800 mb-1">System:</p>
                        <p>Chat started for task #{selectedTask?.id}.</p>
                    </div>
                    <div className="h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                        No messages yet.
                    </div>
                    <input type="text" placeholder="Type a message..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
            </Modal>

            {/* Menu Modal */}
            <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="Task Options">
                <div className="space-y-2">
                    <button
                        onClick={handleEditTask}
                        className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition"
                    >
                        Edit Task
                    </button>
                    <button
                        onClick={handleCompleteTask}
                        className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition"
                    >
                        Mark as Completed
                    </button>
                    <button
                        onClick={handleDeleteTask}
                        className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition"
                    >
                        Delete Task
                    </button>
                </div>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Task Details">
                {selectedTask && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Title</p>
                            <p className="font-semibold text-slate-800">{selectedTask.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-bold ${getPriorityColor(selectedTask.priority)}`}>
                                    {selectedTask.priority}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Due Date</p>
                                <p className="text-sm font-medium text-slate-700">{selectedTask.dueDate}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                            <p className="text-sm font-medium text-slate-700">{selectedTask.location}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Category</p>
                            <p className="text-sm font-medium text-slate-700">{selectedTask.category}</p>
                        </div>
                        <button onClick={() => setIsDetailsOpen(false)} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 transition">
                            Close
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Tasks;
