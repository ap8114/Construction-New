import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, Clock, CheckCircle, AlertCircle, Plus,
    Search, Filter, MoreHorizontal, Camera, FileText,
    Users, MapPin, DollarSign, ChevronRight, Layout,
    Trash2, Edit, Save, X, ArrowLeft, TrendingUp,
    AlertTriangle, ShoppingCart, Download, History, UserPlus
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
    const [jobPOs, setJobPOs] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    // Assign modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assigningTask, setAssigningTask] = useState(null);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);

    const [activeTimeLog, setActiveTimeLog] = useState(null);
    const [clockTogglingId, setClockTogglingId] = useState(null);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const [jobRes, tasksRes, usersRes, poRes, logsRes] = await Promise.all([
                api.get(`/jobs/${jobId}`),
                api.get(`/job-tasks/job/${jobId}`),
                api.get('/auth/users').catch(() => ({ data: [] })),
                api.get(`/purchase-orders?jobId=${jobId}`).catch(() => ({ data: [] })),
                api.get(`/timelogs?userId=${user?._id}`).catch(() => ({ data: [] }))
            ]);
            setJob(jobRes.data);
            setTasks(tasksRes.data);

            const logs = logsRes.data || [];
            const activeLog = logs.find(l => !l.clockOut);
            setActiveTimeLog(activeLog || null);
            const users = usersRes.data || [];
            console.log('fetchJobDetails - Raw Users:', users);
            setCompanyUsers(users);
            setJobPOs(poRes?.data || []);
            // Pre-load workers for foreman assign modal
            if (user?.role === 'FOREMAN') {
                setAvailableWorkers(users.filter(u => u.role === 'WORKER'));
            }
        } catch (err) {
            console.error('Error fetching job details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    // Handle assigning a worker to a task (Foreman action)
    const handleAssignWorker = async (workerId) => {
        if (!assigningTask) return;
        try {
            setAssignLoading(true);
            await api.patch(`/job-tasks/${assigningTask._id}`, { assignedTo: workerId });
            setIsAssignModalOpen(false);
            setAssigningTask(null);
            fetchJobDetails();
        } catch (err) {
            console.error('Error assigning worker:', err);
            alert('Failed to assign worker. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await api.get(`/jobs/${jobId}/full-history`);
            setHistoryData(res.data);
        } catch (err) {
            console.error('Error fetching job history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, jobId]);

    const handleDownloadHistory = async () => {
        try {
            const response = await api.get(`/jobs/${jobId}/history-pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${job?.name || 'Job'}_History.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading history:', err);
            alert('Failed to download history PDF');
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            const res = await api.patch(`/job-tasks/${taskId}`, { status: newStatus });
            setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
            fetchJobDetails(); // Refresh to update job progress
        } catch (err) {
            console.error('Error updating task status:', err);
        }
    };

    const handleClockToggle = async (taskId) => {
        try {
            setClockTogglingId(taskId);

            const getPosition = () => new Promise((resolve) => {
                if (!navigator.geolocation) return resolve(null);
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos.coords),
                    () => resolve(null),
                    { timeout: 5000 }
                );
            });

            if (activeTimeLog && activeTimeLog.taskId?._id === taskId) {
                // Stop Clock
                const coords = await getPosition();
                await api.post('/timelogs/clock-out', {
                    latitude: coords?.latitude,
                    longitude: coords?.longitude
                });
                setActiveTimeLog(null);
            } else if (!activeTimeLog) {
                // Start Clock
                const coords = await getPosition();
                const res = await api.post('/timelogs/clock-in', {
                    projectId: job?.projectId?._id,
                    jobId: job?._id,
                    taskId: taskId,
                    latitude: coords?.latitude,
                    longitude: coords?.longitude,
                    deviceInfo: navigator.userAgent
                });
                setActiveTimeLog(res.data);
                // Update local task state to bypass refresh
                setTasks(prev => prev.map(t =>
                    t._id === taskId ? { ...t, status: 'in_progress' } : t
                ));
            } else {
                alert('You are already clocked into another task. Please clock out first.');
            }
        } catch (err) {
            console.error('Clock toggle error:', err);
            alert(err.response?.data?.message || 'Error occurred while toggling the clock.');
        } finally {
            setClockTogglingId(null);
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

    const isWorkerOrForeman = ['WORKER', 'FOREMAN'].includes(user?.role);
    const tabs = user?.role === 'WORKER'
        ? [
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
        ]
        : user?.role === 'FOREMAN' ? [
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'history', label: 'History', icon: History },
        ]
            : [
                // { id: 'overview', label: 'Overview', icon: Layout },
                { id: 'tasks', label: 'Tasks', icon: CheckCircle },
                { id: 'pos', label: 'Purchase Orders', icon: ShoppingCart },
                { id: 'history', label: 'History', icon: History },
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
                        onClick={() => {
                            if (isWorkerOrForeman) {
                                navigate('/company-admin/projects');
                            } else {
                                navigate(`/company-admin/projects/${projectId}`);
                            }
                        }}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-2"
                    >
                        <ArrowLeft size={14} /> {isWorkerOrForeman ? 'Back to My Jobs' : 'Back to Project'}
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
                                                        {(() => {
                                                            const isActive = (activeTimeLog?.taskId?._id || activeTimeLog?.taskId) === task._id;
                                                            return user?.role === 'WORKER' ? (
                                                                <>
                                                                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleClockToggle(task._id)}
                                                                                disabled={clockTogglingId === task._id}
                                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isActive
                                                                                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-100'
                                                                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100'
                                                                                    }`}
                                                                                title={isActive ? "Clock Out" : "Clock In"}
                                                                            >
                                                                                <Clock size={13} /> {isActive ? 'Stop Timer' : 'Start Timer'}
                                                                            </button>

                                                                            <button
                                                                                onClick={() => {
                                                                                    setTaskToCancel(task._id);
                                                                                    setIsCancellationModalOpen(true);
                                                                                }}
                                                                                className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200"
                                                                                title="Cancel Task"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </>
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
                                                            ) : user?.role === 'FOREMAN' ? (
                                                                <>
                                                                    {/* Assign Button for Foreman - Quick assign a worker */}
                                                                    <button
                                                                        onClick={() => {
                                                                            setAssigningTask(task);
                                                                            setIsAssignModalOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-100"
                                                                        title="Assign Worker"
                                                                    >
                                                                        <UserPlus size={13} /> Assign
                                                                    </button>
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
                                                            )
                                                        })()}
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
                {activeTab === 'pos' && (
                    <div className="p-0 animate-fade-in">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Job Purchase Orders</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Procurement specifically for this site job</p>
                            </div>
                            <button
                                onClick={() => navigate(`/company-admin/purchase-orders/new?projectId=${projectId}&jobId=${jobId}`)}
                                className="w-full md:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition shadow-xl shadow-blue-200 border border-blue-500/50"
                            >
                                <Plus size={18} /> Raise PO Request
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Number</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Details</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {jobPOs.length > 0 ? jobPOs.map(po => (
                                        <tr
                                            key={po._id}
                                            onClick={() => navigate(`/company-admin/purchase-orders/${po._id}`)}
                                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-8 py-5 font-black text-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                        <FileText size={16} />
                                                    </div>
                                                    {po.poNumber}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] uppercase border border-blue-100">
                                                        {(po.vendorName || po.vendorId?.name || 'V').charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{po.vendorName || po.vendorId?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900">
                                                ${po.totalAmount?.toLocaleString()}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm bg-slate-50 text-slate-600 border-slate-200`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-400 font-bold text-xs">
                                                {new Date(po.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center border border-slate-100">
                                                        <ShoppingCart size={32} className="opacity-20" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black uppercase tracking-widest text-xs">No project costs recorded</p>
                                                        <p className="text-[10px] font-bold text-slate-400">Raise a PO to start tracking expenses for this job</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'history' && (
                    <div className="p-0 animate-fade-in flex flex-col gap-6 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Job Full History</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Complete record of every action and work hour</p>
                            </div>
                            <button
                                onClick={handleDownloadHistory}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Download size={14} /> Download Full History
                            </button>
                        </div>

                        {historyLoading && !historyData ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {/* SECTION 1: Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Workers', value: historyData?.worker_summary?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'Total Hours', value: historyData?.worker_summary?.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1) || '0.0', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Total Days Worked', value: historyData?.daily_logs?.length || 0, icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { label: 'Completion', value: `${job?.progress || 0}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                                <stat.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* SECTION 2: Worker Summary Table */}
                                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mt-4">
                                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Worker Summary Aggregation</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Worker</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Days</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hours</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Avg Hours/Day</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {historyData?.worker_summary?.length > 0 ? historyData.worker_summary.map((w, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] uppercase">
                                                                    {w.workerName.charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-black text-slate-700">{w.workerName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{w.totalDays}</td>
                                                        <td className="px-6 py-4 text-center text-xs font-black text-slate-900">{w.totalHours.toFixed(1)} hrs</td>
                                                        <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">{(w.totalHours / (w.totalDays || 1)).toFixed(1)} hrs</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="4" className="px-6 py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No work records found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* SECTION 2.5: Task Summary Table */}
                                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mt-4">
                                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Hours Aggregation</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Task Title</th>
                                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total Hours Allocated</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {historyData?.task_summary?.length > 0 ? historyData.task_summary.map((t, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-black text-[10px] uppercase">
                                                                    {(t.taskName || 'U').charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-black text-slate-700">{t.taskName || 'Unassigned / Global'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900">{t.totalTaskHours.toFixed(2)} hrs</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="2" className="px-6 py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No task records found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                    {/* SECTION 3: Daily Time Log Table */}
                                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily Work Records</h4>
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Worker | Date</th>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">In / Out</th>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Hours</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {historyData?.daily_logs?.length > 0 ? historyData.daily_logs.map((log, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <p className="text-xs font-black text-slate-700">{log.workerId?.fullName || 'Worker'}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.workDate).toLocaleDateString()}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <p className="text-[10px] font-bold text-slate-600">
                                                                    {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-xs font-black text-emerald-600">{log.totalHours.toFixed(1)}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="3" className="px-6 py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No logs yet</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* SECTION 4: Activity Timeline */}
                                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Timeline</h4>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[500px] custom-scrollbar">
                                            {historyData?.activity_logs?.length > 0 ? historyData.activity_logs.map((act, idx) => (
                                                <div key={idx} className="relative pl-8 pb-2">
                                                    {/* Timeline Line */}
                                                    {idx !== historyData.activity_logs.length - 1 && (
                                                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100" />
                                                    )}

                                                    {/* Timeline Dot */}
                                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                                        ${act.actionType === 'CREATED' ? 'bg-blue-500' :
                                                            act.actionType === 'COMPLETED' ? 'bg-emerald-500' :
                                                                act.actionType === 'STATUS_CHANGED' ? 'bg-orange-400' :
                                                                    act.actionType.includes('WORKER') ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                                        {act.actionType === 'CREATED' ? <Plus size={10} className="text-white" /> :
                                                            act.actionType === 'COMPLETED' ? <CheckCircle size={10} className="text-white" /> :
                                                                act.actionType.includes('WORKER') ? <Users size={10} className="text-white" /> :
                                                                    <Clock size={10} className="text-white" />}
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{act.actionType}</span>
                                                            <span className="text-[9px] font-bold text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-700 leading-snug">{act.description}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">By {act.createdBy?.fullName || 'System'}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                    <History size={40} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest mt-3">No activity recorded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
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
                                if (['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)) {
                                    list = companyUsers.filter(u => ['PM', 'FOREMAN', 'SUBCONTRACTOR', 'WORKER'].includes(u.role));
                                } else if (user?.role === 'PM') {
                                    list = companyUsers.filter(u => ['FOREMAN', 'SUBCONTRACTOR'].includes(u.role));
                                } else {
                                    list = companyUsers.filter(u => u.role === 'WORKER');
                                }
                            }

                            // Fallback
                            if (list.length === 0 && job?.assignedWorkers && job.assignedWorkers.length > 0) {
                                if (user?.role !== 'PM' && !['COMPANY_OWNER', 'SUPER_ADMIN'].includes(user?.role)) {
                                    list = job.assignedWorkers.filter(u => u.role === 'WORKER');
                                }
                            }

                            console.log('Modal Personnel Count:', list.length);
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

            {/* Assign Worker Modal - For Foreman */}
            {isAssignModalOpen && assigningTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="bg-slate-900 p-7 text-white relative">
                            <button
                                onClick={() => { setIsAssignModalOpen(false); setAssigningTask(null); }}
                                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
                                    <UserPlus size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight">Assign Worker</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate max-w-[240px]">Task: {assigningTask.title}</p>
                                </div>
                            </div>
                        </div>
                        {/* Worker List */}
                        <div className="p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select a worker to assign this task</p>
                            {availableWorkers.length === 0 ? (
                                <div className="py-10 text-center text-slate-300">
                                    <Users size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No workers available</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                    {/* Unassign option */}
                                    <button
                                        onClick={() => handleAssignWorker('')}
                                        disabled={assignLoading}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all text-left group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                                            <X size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-500 tracking-tight">Unassigned</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remove current assignment</p>
                                        </div>
                                    </button>
                                    {availableWorkers.map(worker => (
                                        <button
                                            key={worker._id}
                                            onClick={() => handleAssignWorker(worker._id)}
                                            disabled={assignLoading}
                                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left group ${assigningTask?.assignedTo?._id === worker._id || assigningTask?.assignedTo === worker._id
                                                ? 'border-emerald-200 bg-emerald-50'
                                                : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50'
                                                }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                                                {worker.fullName?.charAt(0) || 'W'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{worker.fullName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{worker.role}</p>
                                            </div>
                                            {(assigningTask?.assignedTo?._id === worker._id || assigningTask?.assignedTo === worker._id) && (
                                                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {assignLoading && (
                                <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
                                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    <span className="text-xs font-bold">Assigning...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default JobDetails;
