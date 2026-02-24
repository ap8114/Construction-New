import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, Clock, CheckCircle, AlertCircle, Plus,
    Search, Filter, MoreHorizontal, Camera, FileText,
    Users, MapPin, DollarSign, ChevronRight, Layout,
    Trash2, Edit, Save, X, ArrowLeft, TrendingUp,
    AlertTriangle
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import TaskModal from '../../components/jobs/TaskModal';
import CancellationModal from '../../components/jobs/CancellationModal';

const JobDetails = () => {
    const { projectId, jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [companyUsers, setCompanyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tasks');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskToCancel, setTaskToCancel] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const [jobRes, tasksRes, usersRes] = await Promise.all([
                api.get(`/jobs/${jobId}`),
                api.get(`/job-tasks/job/${jobId}`),
                api.get('/auth/users').catch(() => ({ data: [] }))
            ]);
            setJob(jobRes.data);
            setTasks(tasksRes.data);
            const users = usersRes.data || [];
            console.log('fetchJobDetails - Raw Users:', users);
            setCompanyUsers(users);
        } catch (err) {
            console.error('Error fetching job details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            const res = await api.patch(`/job-tasks/${taskId}`, { status: newStatus });
            setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
            fetchJobDetails(); // Refresh to update job progress
        } catch (err) {
            console.error('Error updating task status:', err);
        }
    };

    const handleCancelTask = async (reason) => {
        try {
            setSubmitting(true);
            const res = await api.patch(`/job-tasks/${taskToCancel}`, {
                status: 'cancelled',
                cancellationReason: reason
            });
            setTasks(prev => prev.map(t => t._id === taskToCancel ? res.data : t));
            setIsCancellationModalOpen(false);
            setTaskToCancel(null);
            fetchJobDetails(); // Refresh progress
        } catch (err) {
            console.error('Error cancelling task:', err);
            alert('Failed to cancel task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/job-tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t._id !== taskId));
            const refreshedJob = await api.get(`/jobs/${jobId}`);
            setJob(refreshedJob.data);
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const tabs = [
        // { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle },
        // { id: 'photos', label: 'Photos', icon: Camera },
        // { id: 'documents', label: 'Documents', icon: FileText },
        // { id: 'logs', label: 'Daily Logs', icon: Clock },
    ];

    if (loading && !job) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate(`/company-admin/projects/${projectId}`)}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-2"
                    >
                        <ArrowLeft size={14} /> Back to Project
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        {job?.name}
                        <span className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded-full border shadow-sm 
                            ${job?.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                job?.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {job?.status}
                        </span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-tight flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" /> {job?.location || 'No location set'}
                    </p>
                </div>

                {['COMPANY_OWNER', 'PM', 'FOREMAN'].includes(user?.role) && (
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-tight text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Edit size={16} /> Edit Job
                        </button>
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setIsTaskModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    </div>
                )}
            </div>

            {/* Stats / Progress Quick Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black relative">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-100" />
                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * (job?.progress || 0)) / 100} className="text-blue-600 transition-all duration-1000" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs">{job?.progress || 0}%</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global Progress</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">{job?.progress || 0}% Complete</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tasks Overview</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">
                            {tasks.filter(t => t.status === 'completed').length} / {tasks.length} Completed
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Team Assigned</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">
                            {job?.assignedWorkers?.length || 0} Workers
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar rounded-t-3xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-8 py-5 flex items-center gap-2.5 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap
                            ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-3xl border-x border-b border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                {activeTab === 'tasks' && (
                    <div className="p-0 animate-fade-in">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-bold shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Filter size={14} /> Filter
                                </button>
                                <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    Priority: All
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Priority</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Due Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tasks.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-300">
                                                    <CheckCircle size={48} className="opacity-20" />
                                                    <p className="font-black uppercase tracking-widest text-xs">No tasks added yet</p>
                                                    {(user.role !== 'WORKER') && (
                                                        <button
                                                            onClick={() => setIsTaskModalOpen(true)}
                                                            className="mt-2 text-blue-600 text-xs font-bold hover:underline"
                                                        >
                                                            Create the first task
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        tasks.map(task => (
                                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <button
                                                        onClick={() => {
                                                            if (task.status === 'cancelled') return;
                                                            const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
                                                            handleUpdateTaskStatus(task._id, nextStatus);
                                                        }}
                                                        disabled={task.status === 'cancelled'}
                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                                                            ${task.status === 'completed'
                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                                : task.status === 'cancelled'
                                                                    ? 'bg-red-50 border-red-200 text-red-500'
                                                                    : 'border-slate-200 text-transparent hover:border-emerald-500'}`}
                                                    >
                                                        {task.status === 'cancelled' ? <X size={12} /> : <CheckCircle size={14} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className={`text-sm font-black tracking-tight 
                                                            ${task.status === 'completed' ? 'text-slate-400 line-through decoration-2' :
                                                                task.status === 'cancelled' ? 'text-red-500' : 'text-slate-900'}`}>
                                                            {task.title}
                                                        </p>
                                                        {task.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">{task.description}</p>}
                                                        {task.status === 'cancelled' && task.cancellationReason && (
                                                            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-xl">
                                                                <div className="flex items-center gap-1 text-[9px] text-red-600 font-black uppercase tracking-widest mb-1">
                                                                    <AlertTriangle size={10} /> Cancellation Reason
                                                                </div>
                                                                <p className="text-xs text-red-500 font-bold italic pl-4 border-l-2 border-red-200 ml-1">
                                                                    {task.cancellationReason}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                            {task.assignedTo?.fullName?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600">{task.assignedTo?.fullName || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit
                                                            ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                    'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                            {task.priority}
                                                        </span>
                                                        {task.status === 'cancelled' && (
                                                            <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest w-fit animate-pulse">
                                                                Cancelled
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-xs font-bold text-slate-500">
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date'}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        {user?.role === 'WORKER' ? (
                                                            <>
                                                                {task.status !== 'completed' && task.status !== 'cancelled' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setTaskToCancel(task._id);
                                                                            setIsCancellationModalOpen(true);
                                                                        }}
                                                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-100"
                                                                        title="Cancel Task"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                                {task.status === 'cancelled' && (
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task._id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete Cancelled Task"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTask(task);
                                                                        setIsTaskModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Edit Task"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTask(task._id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Delete Task"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'overview' && (
                    <div className="p-10 flex flex-col items-center justify-center text-center gap-4 animate-fade-in py-32">
                        <TrendingUp size={48} className="text-slate-200" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Detail View Coming Soon</h3>
                        <p className="max-w-xs text-xs text-slate-400 font-bold leading-relaxed">The job overview will feature advanced analytics, budget tracking, and timeline visualizations in the next update.</p>
                    </div>
                )}
                {['photos', 'documents', 'logs'].includes(activeTab) && (
                    <div className="p-10 flex flex-col items-center justify-center text-center gap-4 animate-fade-in py-32">
                        <Layout size={48} className="text-slate-200" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Module Integration Pending</h3>
                        <p className="max-w-xs text-xs text-slate-400 font-bold leading-relaxed">We are currently linking this job to the central {activeTab} repository.</p>
                    </div>
                )}
            </div>

            {
                isTaskModalOpen && (
                    <TaskModal
                        isOpen={isTaskModalOpen}
                        onClose={() => setIsTaskModalOpen(false)}
                        onSave={() => {
                            setIsTaskModalOpen(false);
                            fetchJobDetails();
                        }}
                        jobId={jobId}
                        task={editingTask}
                        assignedWorkers={(() => {
                            let list = [];
                            if (companyUsers && companyUsers.length > 0) {
                                // Filter specifically for workers as requested
                                list = companyUsers.filter(u => u.role === 'WORKER');
                            }

                            // Fallback to job assigned workers if list is empty (usually these are also workers)
                            if (list.length === 0 && job?.assignedWorkers && job.assignedWorkers.length > 0) {
                                list = job.assignedWorkers.filter(u => u.role === 'WORKER');
                            }

                            console.log('Modal Workers Count (Filtered to WORKER):', list.length);
                            return list;
                        })()}
                    />
                )
            }

            {
                isCancellationModalOpen && (
                    <CancellationModal
                        isOpen={isCancellationModalOpen}
                        onClose={() => {
                            setIsCancellationModalOpen(false);
                            setTaskToCancel(null);
                        }}
                        onConfirm={handleCancelTask}
                        loading={submitting}
                    />
                )
            }
        </div >
    );
};

export default JobDetails;
