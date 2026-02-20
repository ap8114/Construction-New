import { useState, useEffect } from 'react';
import {
    Users, Clock, Search, Filter, CheckCircle, XCircle,
    MoreHorizontal, MapPin, AlertCircle, Play, Square,
    ChevronRight, ArrowRight, ShieldCheck, UserCheck,
    RefreshCw, Calendar, Check
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CrewClock = () => {
    const { user } = useAuth();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [activeJob, setActiveJob] = useState('North Tower Construction');
    const [stats, setStats] = useState({
        onSite: 0,
        offClock: 0,
        totalCrew: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all workers and their current clock status
            const [usersRes, logsRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/timelogs')
            ]);

            // Filter for workers only
            const workerList = usersRes.data.filter(u => u.role === 'WORKER');

            // Map status based on if they have a log without a clockOut
            const enrichedWorkers = workerList.map(worker => {
                const activeLog = logsRes.data.find(log => log.userId?._id === worker._id && !log.clockOut);
                return {
                    ...worker,
                    isClockedIn: !!activeLog,
                    activeLogId: activeLog?._id,
                    lastClockIn: activeLog?.clockIn,
                    site: activeLog?.projectId?.name || 'Assigned Site'
                };
            });

            setWorkers(enrichedWorkers);
            setStats({
                onSite: enrichedWorkers.filter(w => w.isClockedIn).length,
                offClock: enrichedWorkers.filter(w => !w.isClockedIn).length,
                totalCrew: enrichedWorkers.length
            });
        } catch (error) {
            console.error('Error fetching crew data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSelection = (id) => {
        setSelectedWorkers(prev =>
            prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedWorkers.length === workers.length) {
            setSelectedWorkers([]);
        } else {
            setSelectedWorkers(workers.map(w => w._id));
        }
    };

    const handleBulkClockIn = async () => {
        if (selectedWorkers.length === 0) return;
        try {
            setLoading(true);
            // In a real app, this would be an API call to bulk clock in
            // For now, we simulate success
            await Promise.all(selectedWorkers.map(wid => {
                const worker = workers.find(w => w._id === wid);
                if (!worker.isClockedIn) {
                    return api.post('/timelogs', {
                        userId: wid,
                        projectId: '65d1a5e5e4b0c5d1a5e5e4b0', // Mock project ID
                        clockIn: new Date().toISOString()
                    });
                }
                return Promise.resolve();
            }));
            await fetchData();
            setSelectedWorkers([]);
            alert('Selected crew members clocked in successfully.');
        } catch (error) {
            console.error('Error in bulk clock in:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkClockOut = async () => {
        if (selectedWorkers.length === 0) return;
        try {
            setLoading(true);
            await Promise.all(selectedWorkers.map(wid => {
                const worker = workers.find(w => w._id === wid);
                if (worker.isClockedIn && worker.activeLogId) {
                    return api.patch(`/timelogs/${worker.activeLogId}`, {
                        clockOut: new Date().toISOString()
                    });
                }
                return Promise.resolve();
            }));
            await fetchData();
            setSelectedWorkers([]);
            alert('Selected crew members clocked out successfully.');
        } catch (error) {
            console.error('Error in bulk clock out:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkers = workers.filter(w =>
        w.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Crew Control</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-blue-600" />
                        Manage on-site workforce attendance
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Live: {stats.onSite} Workers Active</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fleet</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalCrew}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current on Site</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">{stats.onSite}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Today</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">{stats.totalCrew}</p>
                    </div>
                </div>
            </div>

            {/* Main Action Bar */}
            <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search crew members by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/50 transition-all font-bold text-slate-800"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleBulkClockIn}
                        disabled={selectedWorkers.length === 0}
                        className={`flex-1 md:flex-none px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg
                            ${selectedWorkers.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        <Play size={16} fill="currentColor" /> Clock In ({selectedWorkers.length})
                    </button>
                    <button
                        onClick={handleBulkClockOut}
                        disabled={selectedWorkers.length === 0}
                        className={`flex-1 md:flex-none px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg
                            ${selectedWorkers.length > 0 ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        <Square size={16} fill="currentColor" /> Clock Out ({selectedWorkers.length})
                    </button>
                </div>
            </div>

            {/* Crew Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Select All Card */}
                <div
                    onClick={selectAll}
                    className="bg-slate-900 rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800 transition-all group border-4 border-transparent active:scale-95 shadow-xl"
                >
                    <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mb-4 transition-all
                        ${selectedWorkers.length === workers.length ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700 text-slate-500 group-hover:border-slate-500'}
                    `}>
                        {selectedWorkers.length === workers.length ? <Check size={24} /> : <Users size={24} />}
                    </div>
                    <p className="text-white font-black uppercase tracking-widest text-xs">
                        {selectedWorkers.length === workers.length ? 'Deselect All' : 'Select Entire Crew'}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">
                        {selectedWorkers.length} members currently selected
                    </p>
                </div>

                {filteredWorkers.map(worker => (
                    <div
                        key={worker._id}
                        onClick={() => toggleSelection(worker._id)}
                        className={`relative bg-white rounded-[2.5rem] p-6 border-2 transition-all cursor-pointer overflow-hidden group hover:shadow-xl
                            ${selectedWorkers.includes(worker._id) ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-100 hover:border-slate-200'}
                        `}
                    >
                        {/* Status Ripple Background */}
                        {worker.isClockedIn && (
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400 border border-slate-100">
                                    {worker.fullName.charAt(0)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center shadow-sm
                                    ${worker.isClockedIn ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}
                                `}>
                                    {worker.isClockedIn ? <Check size={12} /> : <Clock size={12} />}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 truncate tracking-tight">{worker.fullName}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <MapPin size={10} className="text-slate-400" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase truncate">{worker.site}</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${selectedWorkers.includes(worker._id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white'}
                            `}>
                                {selectedWorkers.includes(worker._id) && <Check size={14} />}
                            </div>
                        </div>

                        {/* Worker Action Details */}
                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Status</p>
                                <p className={`text-xs font-black uppercase tracking-tight 
                                    ${worker.isClockedIn ? 'text-emerald-600' : 'text-slate-400'}
                                `}>
                                    {worker.isClockedIn ? 'On Clock' : 'Off Duty'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Shift Time</p>
                                <p className="text-xs font-black text-slate-900">
                                    {worker.isClockedIn ? 'Active' : '-- : --'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredWorkers.length === 0 && (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">No workers found</h3>
                        <p className="text-slate-500 font-bold max-w-xs mx-auto mt-2">Try searching with a different name or role filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrewClock;
