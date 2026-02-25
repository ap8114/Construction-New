import {
  TrendingUp, Users, AlertTriangle, CheckCircle, Calendar, Plus,
  MessageSquare, X, Check, ArrowRight, Activity, FileText,
  DollarSign, MapPin, Camera, AlertCircle, RefreshCw, Search,
  ChevronDown, Bell, Wrench, ClipboardList, Clock, Briefcase,
  MoreHorizontal, Smartphone, ExternalLink, Trash2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CancellationModal from '../../components/jobs/CancellationModal';

const SummaryCard = ({ title, value, subtext, icon: Icon, color, loading, showFinancials = true }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between group hover:shadow-md transition-all duration-300">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg"></div>
        ) : (
          <span className="text-3xl font-black text-slate-900 leading-none">{value}</span>
        )}
        {subtext && <span className="text-xs font-bold text-slate-400">{subtext}</span>}
      </div>
    </div>
    {title === "Open POs" && showFinancials && (
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 leading-none">Total: <CheckCircle size={10} className="inline text-emerald-500" /></p>
        <p className="text-sm font-black text-slate-900">${(value * 2500).toLocaleString()}</p> {/* Simulated total value if specific field missing, or just value if already calculated */}
      </div>
    )}
  </div>
);

const QuickActionButton = ({ label, icon: Icon, color, bg, onClick }) => (
  <button
    onClick={onClick}
    className={`${bg} ${color} flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all w-full md:w-auto border border-white/20`}
  >
    <div className={`p-2 rounded-lg bg-white/20`}>
      <Icon size={20} />
    </div>
    {label}
  </button>
);

const AlertItem = ({ count, label, color, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-3.5 rounded-xl ${color} cursor-pointer group hover:scale-[1.02] hover:shadow-md transition-all border border-transparent hover:border-white/50 active:scale-[0.98]`}
  >
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded flex items-center justify-center bg-white/20 text-white text-[10px] font-black">
        {count}
      </div>
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <ArrowRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </div>
);

const DailyLogCard = ({ job, date, foreman, foremanRole, photos }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 hover:border-slate-200 bg-white sm:bg-transparent">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm border border-slate-200">
        <img src={`https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=200`} alt="Job" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">{job}</h4>
        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{date}</p>
        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
          {foremanRole === 'PM' ? 'Project Manager' : 'Site Foreman'}: {foreman}
        </p>
      </div>
    </div>
    {/* <button className="w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap border border-blue-100">
      View Log
    </button> */}
  </div>
);

const CompanyAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeJobs: 0,
    crewOnSiteCount: 0,
    totalCrew: 0,
    hoursToday: 0,
    equipmentRunning: 0,
    openPos: 0,
    openPosValue: 0,
    pendingApprovals: 0,
    equipmentAlerts: 0
  });

  const [trendData, setTrendData] = useState([]);
  const [crewActivity, setCrewActivity] = useState([]);
  const [recentDailyLogs, setRecentDailyLogs] = useState([]);
  const [topProject, setTopProject] = useState(null);

  // Worker Specific State
  const [workerMetrics, setWorkerMetrics] = useState({
    myHoursToday: '0.0h',
    currentJob: '---',
    weeklyTarget: '40h',
    weeklyDone: '0h done'
  });
  const [myRecentActivity, setMyRecentActivity] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const socketRef = useRef();

  const [selectedProjectId, setSelectedProjectId] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/stats');
      const data = res.data;

      if (data.metrics) setMetrics(prev => ({ ...data.metrics, myJobs: data.myJobs || prev.myJobs || [] }));
      if (data.trendData) setTrendData(data.trendData);
      if (data.crewActivity) setCrewActivity(data.crewActivity);
      if (data.recentDailyLogs) setRecentDailyLogs(data.recentDailyLogs);
      if (data.topProject) setTopProject(data.topProject);

      if (data.workerMetrics) {
        setWorkerMetrics(data.workerMetrics);
        setIsClockedIn(data.workerMetrics.isClockedIn);
        setTimer(data.workerMetrics.timer || 0);

        // Auto-select project if only one exists and not selected yet
        if (data.workerMetrics.assignedProjects?.length === 1 && !selectedProjectId) {
          setSelectedProjectId(data.workerMetrics.assignedProjects[0]._id);
        }
      }
      if (data.myRecentActivity) setMyRecentActivity(data.myRecentActivity);

      // Fetch worker tasks (JobTasks) and global Tasks
      if (['WORKER', 'SUBCONTRACTOR', 'FOREMAN'].includes(user?.role)) {
        try {
          const [jobTasksRes, globalTasksRes] = await Promise.all([
            api.get('/job-tasks/worker'),
            api.get('/tasks/my-tasks')
          ]);

          // Normalize global tasks to look like job tasks for the dashboard widget
          const normalizedGlobal = (globalTasksRes.data || []).map(t => ({
            ...t,
            isGlobal: true,
            jobId: t.projectId // Map projectId to jobId for UI consistency
          }));

          setMyTasks([...(jobTasksRes.data || []), ...normalizedGlobal]);
        } catch (taskErr) {
          console.error('Error fetching tasks for dashboard:', taskErr);
        }
      }

      // Fetch equipment alerts separately as it's a new feature
      const equipRes = await api.get('/equipment');
      const alertsCount = equipRes.data?.filter(e => e.assignedJob?.status === 'completed').length || 0;
      setMetrics(prev => ({ ...prev, equipmentAlerts: alertsCount }));

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Connect socket
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://construction-backend-production-b192.up.railway.app';
    socketRef.current = io(socketUrl);
    socketRef.current.emit('register_user', user);

    socketRef.current.on('attendance_update', (data) => {
      console.log('Dashboard attendance update:', data);
      fetchDashboardData();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isClockedIn) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const handleToggle = async () => {
    try {
      if (!isClockedIn && !selectedProjectId && workerMetrics.assignedProjects?.length > 0) {
        alert('Please select a project to clock into.');
        return;
      }

      setLoading(true);
      const getPosition = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          () => resolve(null),
          { timeout: 5000 }
        );
      });

      if (!isClockedIn) {
        const coords = await getPosition();
        await api.post('/timelogs/clock-in', {
          projectId: selectedProjectId || workerMetrics.assignedProjects?.[0]?._id,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          deviceInfo: navigator.userAgent
        });
        setIsClockedIn(true);
        fetchDashboardData();
      } else {
        const coords = await getPosition();
        await api.post('/timelogs/clock-out', {
          latitude: coords?.latitude,
          longitude: coords?.longitude
        });
        setIsClockedIn(false);
        setTimer(0);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error toggling clock:', error);
      alert(error.response?.data?.message || 'Failed to update attendance status');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleTaskStatus = async (task, currentStatus) => {
    try {
      const isGlobal = !!task.isGlobal;
      const apiPath = isGlobal ? `/tasks/${task._id}` : `/job-tasks/${task._id}`;

      let nextStatus;
      if (isGlobal) {
        nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      } else {
        nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      }

      await api.patch(apiPath, { status: nextStatus });
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const handleCancelTask = async (reason) => {
    try {
      setSubmitting(true);
      // Currently cancellation is only for JobTasks in this UI
      await api.patch(`/job-tasks/${taskToCancel}`, {
        status: 'cancelled',
        cancellationReason: reason
      });
      setIsCancellationModalOpen(false);
      setTaskToCancel(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling task:', error);
      alert('Failed to cancel task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId, isGlobal) => {
    if (!window.confirm('Are you sure you want to remove this task?')) return;
    try {
      setLoading(true);
      const apiPath = isGlobal ? `/tasks/${taskId}` : `/job-tasks/${taskId}`;
      await api.delete(apiPath);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.role === 'COMPANY_OWNER';
  const isPM = user?.role === 'PM';
  const isForeman = user?.role === 'FOREMAN';
  const isWorker = user?.role === 'WORKER';
  const isSubcontractor = user?.role === 'SUBCONTRACTOR';
  const isOwnerOrPM = isOwner || isPM;

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header Content Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
            <Smartphone size={14} className="text-blue-600" />
            Own Your Time. Control Your Site.
          </p>
        </div>
        {/* <div className="flex gap-2">
          <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div> */}
      </div>

      {/* Worker / Subcontractor Clock Widget */}
      {(isWorker || isSubcontractor) && (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-200 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={120} />
          </div>
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full mx-auto md:mx-0">
                <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                {isClockedIn ? 'Currently On Clock' : 'Ready to Start'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                {isClockedIn ? formatTime(timer) : '00:00:00'}
              </h2>
              {!isClockedIn && workerMetrics.assignedProjects?.length > 0 && (
                <div className="mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Select Site for Clock In</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 w-full max-w-sm"
                  >
                    <option value="">-- Choose Project --</option>
                    {workerMetrics.assignedProjects.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.jobName})</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-slate-500 font-bold flex items-center gap-2 justify-center md:justify-start">
                <MapPin size={16} className="text-slate-400" /> {isClockedIn ? workerMetrics.currentJob : 'Not Active'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={handleToggle}
                className={`flex-1 md:flex-none px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-tight shadow-lg transition-all transform active:scale-95 ${isClockedIn
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  }`}
              >
                {isClockedIn ? 'Stop Clock Out' : 'Start Clock In'}
              </button>
            </div>
          </div>

          {isClockedIn && (
            <div className="bg-emerald-50 px-8 py-3 border-t border-emerald-100 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-emerald-700 text-xs font-black uppercase tracking-wider">GPS Verification Active • Site: {workerMetrics.currentJob}</p>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-5">
        {(isOwner || isPM) && (
          <>
            <SummaryCard title="Active Jobs" value={metrics.activeJobs} icon={Briefcase} color="bg-orange-400" loading={loading} />
            <SummaryCard title="Crew On Site" value={metrics.crewOnSiteCount} subtext={`of ${metrics.totalCrew}`} icon={Users} color="bg-emerald-400" loading={loading} />
            <SummaryCard title="Hours Today" value={`${metrics.hoursToday}h`} subtext="crew total" icon={Clock} color="bg-blue-500" loading={loading} />
            <SummaryCard title="Equipment Running" value={metrics.equipmentRunning} icon={Wrench} color="bg-indigo-500" loading={loading} />
            <SummaryCard title="Open POs" value={metrics.openPos} icon={ClipboardList} color="bg-blue-600" loading={loading} showFinancials={isOwner} />
            <SummaryCard title="Pending Approvals" value={metrics.pendingApprovals} icon={AlertCircle} color="bg-slate-400" loading={loading} />
          </>
        )}

        {isForeman && (
          <>
            <SummaryCard title="Crew On Site" value={metrics.crewOnSiteCount} subtext={`of ${metrics.totalCrew}`} icon={Users} color="bg-emerald-400" loading={loading} />
            <SummaryCard title="Hours Today" value={`${metrics.hoursToday}h`} icon={Clock} color="bg-blue-500" loading={loading} />
            <SummaryCard title="Equipment Running" value={metrics.equipmentRunning} icon={Wrench} color="bg-indigo-500" loading={loading} />
          </>
        )}

        {isWorker && (
          <>
            <SummaryCard title="My Hours Today" value={workerMetrics.myHoursToday} icon={Clock} color="bg-blue-600" loading={loading} />
            <SummaryCard title="Current Job" value={workerMetrics.currentJob} icon={Briefcase} color="bg-orange-400" loading={loading} />
            <SummaryCard title="Weekly Target" value={workerMetrics.weeklyTarget} subtext={workerMetrics.weeklyDone} icon={TrendingUp} color="bg-emerald-500" loading={loading} />
          </>
        )}

        {isSubcontractor && (
          <>
            <SummaryCard title="My Hours Today" value={workerMetrics.myHoursToday} icon={Clock} color="bg-orange-500" loading={loading} />
            <SummaryCard title="Current Job" value={workerMetrics.currentJob} icon={Briefcase} color="bg-blue-500" loading={loading} />
            <SummaryCard title="Weekly Target" value={workerMetrics.weeklyTarget} subtext={workerMetrics.weeklyDone} icon={TrendingUp} color="bg-emerald-500" loading={loading} />
          </>
        )}
      </div>

      {/* Quick Actions & Alerts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left: Quick Actions */}
        <div className="xl:col-span-3 space-y-8">
          <div className="bg-transparent">
            <h3 className="text-lg font-black text-slate-800 mb-5 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isOwnerOrPM && (
                <>
                  <QuickActionButton label="Clock In crew" icon={CheckCircle} bg="bg-blue-600" color="text-white" onClick={() => navigate('/company-admin/timesheets')} />
                  <QuickActionButton label="Daily Log" icon={FileText} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/daily-logs')} />
                  <QuickActionButton label="Upload Photo" icon={Camera} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/photos')} />
                  {/* <QuickActionButton label="Equipment Hours" icon={Wrench} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/equipment')} /> */}
                  <QuickActionButton label="Create PO" icon={ClipboardList} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/purchase-orders')} />
                </>
              )}

              {isForeman && (
                <>
                  <QuickActionButton label="Clock In Crew" icon={Users} bg="bg-blue-600" color="text-white" onClick={() => navigate('/company-admin/crew-clock')} />
                  <QuickActionButton label="Add Daily Log" icon={FileText} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/daily-logs')} />
                  <QuickActionButton label="Upload Site Photo" icon={Camera} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/photos')} />
                  {/* <QuickActionButton label="Equipment Tracking" icon={Wrench} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/equipment')} /> */}
                  <QuickActionButton label="Create PO" icon={ClipboardList} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/purchase-orders')} />
                </>
              )}

              {isWorker && (
                <>
                  <QuickActionButton label="Clock In / Out" icon={Clock} bg="bg-blue-600" color="text-white" onClick={() => navigate('/company-admin/clock')} />
                  <QuickActionButton label="Submit Photo" icon={Camera} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/photos')} />
                  <QuickActionButton label="Request Correction" icon={RefreshCw} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/timesheets')} />
                </>
              )}

              {isSubcontractor && (
                <>
                  <QuickActionButton label={isClockedIn ? "Stop Clock Out" : "Start Clock In"} icon={Clock} bg={isClockedIn ? "bg-red-500" : "bg-orange-500"} color="text-white" onClick={handleToggle} />
                  <QuickActionButton label="Upload Photo" icon={Camera} bg="bg-white" color="text-slate-700" onClick={() => navigate('/company-admin/photos')} />
                </>
              )}
            </div>
          </div>

          {/* Assigned Jobs - For Subcontractors & Foremen */}
          {(isForeman || isSubcontractor) && metrics.myJobs?.length > 0 && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Assignments</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.myJobs.map(job => (
                  <div key={job.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm tracking-tight">{job.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Site Assignment</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Tasks Section - For Workers & Subcontractors */}
          {(isWorker || isSubcontractor || isForeman) && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Assigned Tasks</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{myTasks.filter(t => t.status !== 'completed').length} Pending Tasks</p>
                  </div>
                </div>
                {myTasks.length > 0 && (
                  <button
                    onClick={() => navigate('/company-admin/projects')}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                  >
                    View Jobs
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto no-scrollbar">
                {myTasks.map((task) => (
                  <div key={task._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(task, task.status)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                            ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                            task.status === 'cancelled' ? 'bg-red-50 border-red-200 text-transparent' :
                              'border-slate-200 text-transparent hover:border-emerald-500'}`}
                      >
                        {task.status === 'completed' ? <Check size={12} strokeWidth={4} /> :
                          task.status === 'cancelled' ? <X size={12} className="text-red-500" /> : null}
                      </button>
                      <div className="min-w-0">
                        <p className={`font-black text-slate-900 text-sm tracking-tight truncate 
                          ${task.status === 'completed' ? 'text-slate-400 line-through' :
                            task.status === 'cancelled' ? 'text-red-500' : ''}`}>
                          {task.title}
                          {task.isGlobal && <span className="ml-2 text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">Global</span>}
                        </p>
                        {task.status === 'cancelled' && task.cancellationReason && (
                          <p className="text-[10px] text-red-400 font-bold italic mt-0.5 max-w-[200px] truncate">
                            Cancelled: {task.cancellationReason}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Briefcase size={10} /> {task.jobId?.name || task.projectId?.name || 'Project Assignment'}
                          </span>
                          {task.dueDate && (
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border
                        ${task.priority?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                          task.priority?.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'}`}>
                        {task.priority || 'Medium'}
                      </span>
                      {!task.isGlobal && task.status !== 'completed' && task.status !== 'cancelled' ? (
                        <button
                          onClick={() => {
                            setTaskToCancel(task._id);
                            setIsCancellationModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Cancel Task"
                        >
                          <X size={14} />
                        </button>
                      ) : (task.status === 'cancelled' || task.isGlobal) ? (
                        <button
                          onClick={() => handleDeleteTask(task._id, task.isGlobal)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          if (task.isGlobal) {
                            navigate('/company-admin/tasks');
                          } else {
                            navigate(`/company-admin/projects/${task.jobId?.projectId?._id || 'all'}/jobs/${task.jobId?._id || task.jobId}`);
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {myTasks.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <CheckCircle size={32} className="text-slate-200" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">All caught up! No tasks assigned.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Recent Activity - For Workers & Subcontractors */}
          {(isWorker || isSubcontractor) && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">My Recent Activity</h3>
                <button
                  onClick={() => navigate('/company-admin/timesheets')}
                  className="text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                >
                  View Full History
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {myRecentActivity.map((item) => (
                  <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${item.action === 'Clocked In' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm tracking-tight">{item.action}</p>
                        <p className="text-xs text-slate-500 font-bold">{item.job}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm tracking-tight">{item.time}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.date}</p>
                    </div>
                  </div>
                ))}
                {myRecentActivity.length === 0 && (
                  <div className="p-10 text-center text-slate-400 text-sm font-bold">No recent activity found.</div>
                )}
              </div>
            </div>
          )}

          {/* Live Crew Activity Table */}
          {(isOwnerOrPM || isForeman) && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Live Crew Activity</h3>
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Job</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Clock In</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">GPS</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {crewActivity.map((member, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
                              {member.avatar}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{member.job}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{member.time}</span>
                            {member.subtext && <span className="text-[10px] text-slate-400 font-bold">{member.subtext}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${member.status === 'On Site' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                            }`}>
                            {member.status === 'On Site' ? <CheckCircle size={12} /> : <X size={12} />}
                            {member.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              if (member.lat && member.lng) {
                                window.open(`https://www.google.com/maps?q=${member.lat},${member.lng}`, '_blank');
                              } else {
                                window.open(`https://www.google.com/maps/search/?api=1&query=my+location`, '_blank');
                              }
                            }}
                            title={member.lat ? `View location: ${member.lat.toFixed(4)}, ${member.lng.toFixed(4)}` : 'No GPS recorded'}
                            className="group flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-all"
                          >
                            <div className="relative">
                              <MapPin size={15} className="text-emerald-500 group-hover:scale-125 transition-transform" />
                              {member.lat && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-white" />}
                            </div>
                            <span className="hidden sm:inline">{member.lat ? 'View' : 'N/A'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-12 h-8 rounded border overflow-hidden text-[8px] flex items-center justify-center font-black ${member.status === 'On Site' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}>
                            {member.status === 'On Site' ? '● LIVE' : 'OUT'}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {crewActivity.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-sm font-bold">No crew activity found today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {crewActivity.map((member, i) => (
                  <div key={i} className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 border border-slate-200">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{member.job}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${member.status === 'On Site' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {member.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl px-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" />
                        <span>In: {member.time}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (member.lat && member.lng) {
                            window.open(`https://www.google.com/maps?q=${member.lat},${member.lng}`, '_blank');
                          } else {
                            window.open(`https://www.google.com/maps/search/?api=1&query=my+location`, '_blank');
                          }
                        }}
                        className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <div className="relative">
                          <MapPin size={13} className="text-emerald-500" />
                          {member.lat && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                        </div>
                        <span>{member.lat ? 'View on Map' : 'No GPS'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend Chart - Owner Only */}
          {isOwnerOrPM && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Hours Trend</h3>
                  {/* <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1">
                    View Log <ExternalLink size={10} />
                  </button> */}
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden border border-slate-300">
                    <img src={topProject?.image || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=200"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">{topProject?.name || "No Active Project"}</h4>
                    <p className="text-xs font-bold text-slate-400">Total: {topProject?.hours || 0}h logged</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Lead: {topProject?.manager || "N/A"}</p>
                  </div>
                </div>
                <div className="h-40 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">7-day Hours Trend</h3>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-slate-400">112h</span>
                  <div className="w-full h-px bg-slate-100"></div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Alerts & Recent Logs */}
        <div className="space-y-8">
          {/* Attention & Alerts */}
          {!isWorker && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-800 mb-6 tracking-tight">Attention & Alerts</h3>
              <div className="space-y-3">
                {metrics.overdueTasks > 0 && (
                  <AlertItem
                    label="Overdue Tasks"
                    count={metrics.overdueTasks}
                    color="bg-red-500/90 text-white"
                    onClick={() => navigate('/company-admin/tasks')}
                  />
                )}
                {metrics.equipmentAlerts > 0 && (
                  <AlertItem
                    label="Equipment Pending Return"
                    count={metrics.equipmentAlerts}
                    color="bg-orange-500 text-white"
                    onClick={() => navigate('/company-admin/equipment')}
                  />
                )}
                {metrics.overdueRFIs > 0 && (
                  <AlertItem
                    label="Overdue RFIs"
                    count={metrics.overdueRFIs}
                    color="bg-red-600 animate-pulse text-white shadow-lg"
                    onClick={() => navigate('/company-admin/rfi')}
                  />
                )}
                {(isOwner || isPM) && metrics.pendingApprovals > 0 && (
                  <AlertItem
                    label="Approval Requests"
                    count={metrics.pendingApprovals}
                    color="bg-blue-600 text-white"
                    onClick={() => navigate('/company-admin/timesheets')}
                  />
                )}
                {metrics.offlineSyncs > 0 && (
                  <AlertItem
                    label="Offline Syncs Pending"
                    count={metrics.offlineSyncs}
                    color="bg-slate-500 text-white"
                    onClick={() => navigate('/company-admin/timesheets')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Recent Daily Logs - Hidden for Worker */}
          {(isOwner || isPM || isForeman) && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Daily Logs</h3>
              </div>
              <div className="space-y-2">
                {recentDailyLogs.map((log, idx) => (
                  <DailyLogCard key={idx} job={log.job} date={log.date} foreman={log.foreman} foremanRole={log.foremanRole} />
                ))}
                {recentDailyLogs.length === 0 && (
                  <div className="p-10 text-center text-slate-400 text-sm font-bold italic">No daily logs submitted yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {isCancellationModalOpen && (
        <CancellationModal
          isOpen={isCancellationModalOpen}
          onClose={() => {
            setIsCancellationModalOpen(false);
            setTaskToCancel(null);
          }}
          onConfirm={handleCancelTask}
          loading={submitting}
        />
      )}
    </div >
  );
};

export default CompanyAdminDashboard;
