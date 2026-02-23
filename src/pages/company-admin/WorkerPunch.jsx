import { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, CheckCircle, Camera, RefreshCw, AlertCircle, Play, Square, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const WorkerPunch = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [timer, setTimer] = useState(0);
    const [activeJob, setActiveJob] = useState(null);
    const [siteLocation, setSiteLocation] = useState('Not Clocked In');
    const [loading, setLoading] = useState(true);
    const [currentTimeLog, setCurrentTimeLog] = useState(null);
    const socketRef = useRef();
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [history, setHistory] = useState([]);

    // Fetch active log on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats (which includes assigned projects)
                const statsRes = await api.get('/reports/stats');
                if (statsRes.data.workerMetrics) {
                    setAssignedProjects(statsRes.data.workerMetrics.assignedProjects || []);
                    setIsClockedIn(statsRes.data.workerMetrics.isClockedIn);
                    setTimer(statsRes.data.workerMetrics.timer || 0);

                    if (statsRes.data.workerMetrics.assignedProjects?.length === 1) {
                        setSelectedProjectId(statsRes.data.workerMetrics.assignedProjects[0]._id);
                    }
                }

                const res = await api.get('/timelogs');
                // Filter logs for this user
                const userLogs = res.data.filter(log => log.userId?._id === user?._id);
                setHistory(userLogs.slice(0, 5)); // Show last 5 logs

                const active = userLogs.find(log => !log.clockOut);
                if (active) {
                    setCurrentTimeLog(active);
                    setActiveJob(active.projectId?.name || 'Assigned Site');
                    setSiteLocation(active.projectId?.location?.address || 'Site Recorded');
                } else {
                    setActiveJob(null);
                    setSiteLocation('Not Clocked In');
                }
            } catch (error) {
                console.error('Error fetching punch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Connect socket for status broadcasting
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://construction-backend-production-b192.up.railway.app';
        socketRef.current = io(socketUrl);
        socketRef.current.emit('register_user', user);

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user?._id]);

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

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggle = async () => {
        try {
            if (!isClockedIn && !selectedProjectId && assignedProjects.length > 0) {
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
                // Clock In
                const coords = await getPosition();
                const res = await api.post('/timelogs/clock-in', {
                    projectId: selectedProjectId || assignedProjects[0]?._id,
                    latitude: coords?.latitude,
                    longitude: coords?.longitude,
                    deviceInfo: navigator.userAgent
                });
                setCurrentTimeLog(res.data);
                const proj = assignedProjects.find(p => p._id === (selectedProjectId || assignedProjects[0]?._id));
                setActiveJob(proj?.name || 'Active Site');
                setSiteLocation(proj?.location?.address || 'Assigned Site');
                setIsClockedIn(true);
                // Prepend to history
                setHistory(prev => [res.data, ...prev].slice(0, 5));
            } else {
                // Clock Out
                const coords = await getPosition();
                await api.post('/timelogs/clock-out', {
                    latitude: coords?.latitude,
                    longitude: coords?.longitude
                });
                setIsClockedIn(false);
                setCurrentTimeLog(null);
                setTimer(0);
                setActiveJob(null);
                setSiteLocation('Not Clocked In');
                // Re-fetch to update the out time in history
                const res = await api.get('/timelogs');
                const userLogs = res.data.filter(log => log.userId?._id === user?._id);
                setHistory(userLogs.slice(0, 5));
            }
        } catch (error) {
            console.error('Error toggling clock:', error);
            alert(error.response?.data?.message || 'Failed to update attendance status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Time Clock</h1>
                <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Precision Tracking for Your Day</p>
            </div>

            {/* Main Punch Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden relative">
                <div className="p-10 flex flex-col items-center text-center space-y-8">
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isClockedIn ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        {isClockedIn ? 'Punch Active' : 'Off Clock'}
                    </div>

                    {/* Large Timer Display */}
                    <div className="space-y-4">
                        <h2 className="text-7xl font-black text-slate-900 tracking-tighter tabular-nums">
                            {isClockedIn ? formatTime(timer) : '00:00:00'}
                        </h2>
                        {!isClockedIn && assignedProjects.length > 0 && (
                            <div className="mt-6 mb-4 max-w-xs mx-auto">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Select Working Site</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">-- Choose Project --</option>
                                    {assignedProjects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-4 text-slate-400 font-bold">
                            <span className="flex items-center gap-1.5"><MapPin size={16} /> {isClockedIn ? activeJob : 'No Active Site'}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span className="flex items-center gap-1.5 text-blue-600"><CheckCircle size={16} /> Verified Site</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-4">
                        <button
                            onClick={handleToggle}
                            className={`w-full py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isClockedIn
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 hover:-translate-y-1'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'
                                }`}
                        >
                            {isClockedIn ? (
                                <>
                                    <Square size={24} fill="currentColor" /> Stop Timer & Clock Out
                                </>
                            ) : (
                                <>
                                    <Play size={24} fill="currentColor" /> Start Timer & Clock In
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-syncing your GPS location...</p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="text-center border-r border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Started At</p>
                        <p className="font-bold text-slate-900">
                            {currentTimeLog ? new Date(currentTimeLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Site Entry</p>
                        <p className="font-bold text-slate-900">{siteLocation}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions for Worker */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/company-admin/photos')}
                    className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition active:scale-95"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Camera size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-slate-700">Submit Photo</span>
                </button>
                <button
                    className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition active:scale-95 uppercase tracking-tight font-black"
                    onClick={() => navigate('/company-admin/timesheets')}
                >
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                        <RefreshCw size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-slate-700 text-center">Request Correction</span>
                </button>
            </div>

            {/* Recent Activity Mini-List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase text-xs">
                        <History size={16} className="text-slate-400" /> Recent History
                    </h3>
                    <button className="text-[10px] font-black text-blue-600 uppercase" onClick={() => navigate('/company-admin/timesheets')}>View All</button>
                </div>
                <div className="divide-y divide-slate-50">
                    {history.length > 0 ? history.map((log, i) => {
                        const cIn = new Date(log.clockIn);
                        const cOut = log.clockOut ? new Date(log.clockOut) : null;
                        const diff = cOut ? (cOut - cIn) / 1000 : 0;
                        const duration = cOut ? `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m` : 'Active';

                        return (
                            <div key={log._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900">
                                        {cIn.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {log.projectId?.name || 'Assigned Site'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900">
                                        {cIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {cOut ? cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                    </p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${!cOut ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                                        {duration}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                            No history yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkerPunch;
