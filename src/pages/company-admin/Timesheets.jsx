import { useState, useEffect, useRef } from 'react';
import {
    Clock, MapPin, CheckCircle, XCircle, Search, Filter,
    Download, FileText, User, Calendar, Loader, MoreHorizontal,
    ChevronRight, ExternalLink, Hash, Check, Trash2, ShieldCheck, AlertCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import { io } from 'socket.io-client';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Timesheets = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const socketRef = useRef();
    const { user } = useAuth();
    const isWorker = user?.role === 'WORKER';

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/timelogs');
            // If worker, only show their own logs
            const data = isWorker ? response.data.filter(e => e.userId?._id === user._id) : response.data;
            setEntries(data);
        } catch (error) {
            console.error('Error fetching time logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Connect socket
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';
        socketRef.current = io(socketUrl);
        socketRef.current.emit('register_user', user);

        socketRef.current.on('attendance_update', (data) => {
            console.log('Timesheet attendance update:', data);
            fetchData();
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const filteredEntries = entries.filter(entry =>
        entry.userId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.projectId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApprove = async (id) => {
        try {
            await api.patch(`/timelogs/${id}`, { status: 'approved' });
            fetchData();
            if (selectedEntry && selectedEntry._id === id) setIsModalOpen(false);
        } catch (error) {
            console.error('Error approving entry:', error);
        }
    };

    const handleReject = async (id) => {
        try {
            await api.patch(`/timelogs/${id}`, { status: 'rejected' });
            fetchData();
            if (selectedEntry && selectedEntry._id === id) setIsModalOpen(false);
        } catch (error) {
            console.error('Error rejecting entry:', error);
        }
    };

    const handleApproveAll = async () => {
        if (!window.confirm('Approve all pending timesheets?')) return;
        try {
            const pendingIds = entries.filter(e => e.status === 'pending' && e.clockOut).map(e => e._id);
            await Promise.all(pendingIds.map(id => api.patch(`/timelogs/${id}`, { status: 'approved' })));
            fetchData();
        } catch (error) {
            console.error('Error approving all:', error);
        }
    };

    const handleExport = () => {
        const csv = [
            ['Employee', 'Project', 'Date', 'Time In', 'Time Out', 'Duration', 'Status', 'GPS Status'].join(','),
            ...filteredEntries.map(e => {
                const clockIn = new Date(e.clockIn);
                const clockOut = e.clockOut ? new Date(e.clockOut) : null;
                const duration = clockOut ? ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(1) : 'In Progress';
                return [
                    e.userId?.fullName || '',
                    e.projectId?.name || 'Manual Entry',
                    clockIn.toLocaleDateString(),
                    clockIn.toLocaleTimeString(),
                    clockOut ? clockOut.toLocaleTimeString() : '---',
                    duration,
                    e.status,
                    e.geofenceStatus === 'inside' ? 'Verified' : 'Flagged'
                ].join(',');
            })
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timesheets_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const openDetails = (entry) => {
        setSelectedEntry(entry);
        setIsModalOpen(true);
    };

    const stats = {
        totalHours: entries.reduce((sum, e) => {
            if (e.clockOut) {
                const hours = (new Date(e.clockOut) - new Date(e.clockIn)) / (1000 * 60 * 60);
                return sum + hours;
            }
            return sum;
        }, 0).toFixed(1),
        pending: entries.filter(e => e.status === 'pending').length,
        approved: entries.filter(e => e.status === 'approved').length,
        gpsFlags: entries.filter(e => e.geofenceStatus !== 'inside').length
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{isWorker ? 'My Hours' : 'Timesheets'}</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-blue-600" />
                        {isWorker ? 'Track your site hours and attendance history' : 'Verify and approve site manpower hours'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>
                    {!isWorker ? (
                        <button
                            onClick={handleApproveAll}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight"
                        >
                            <CheckCircle size={18} /> Approve All Pending
                        </button>
                    ) : (
                        <button
                            onClick={() => alert('Correction Request feature coming soon! Please contact your project manager.')}
                            className="bg-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition shadow-lg shadow-orange-200 font-black text-sm uppercase tracking-tight"
                        >
                            <RefreshCw size={18} /> Request Correction
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title={isWorker ? "My Total Hours" : "Total Hours"} value={`${stats.totalHours}h`} subtext="this period" icon={TrendingUp} color="blue" />
                <StatCard title={isWorker ? "Pending Approval" : "Pending Review"} value={stats.pending} subtext="requires action" icon={FileText} color="orange" />
                <StatCard title="Approved" value={stats.approved} subtext="finalized logs" icon={CheckCircle} color="emerald" />
                <StatCard title={isWorker ? "On-Clock Status" : "GPS Flags"} value={isWorker ? (entries.some(e => !e.clockOut) ? 'Active' : 'Offline') : stats.gpsFlags} subtext={isWorker ? "Current shift" : "site mismatches"} icon={isWorker ? Clock : MapPin} color={isWorker ? "emerald" : "red"} />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by employee name or project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Calendar size={18} /> Date Range
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Filter size={18} /> Filter Status
                    </button>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Project / Site</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Shift Details</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">GPS Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing Timelogs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEntries.length > 0 ? (
                                filteredEntries.map((entry) => {
                                    const clockInDate = new Date(entry.clockIn);
                                    const clockOutDate = entry.clockOut ? new Date(entry.clockOut) : null;
                                    const duration = clockOutDate
                                        ? ((clockOutDate - clockInDate) / (1000 * 60 * 60)).toFixed(1) + 'h'
                                        : 'In Progress';

                                    return (
                                        <tr key={entry._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200/50 shadow-sm group-hover:scale-110 transition-transform">
                                                        {entry.userId?.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-tight">{entry.userId?.fullName}</p>
                                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                                                            {entry.userId?.role?.replace('COMPANY_', '')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{entry.projectId?.name || 'Manual Log'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                                        <Hash size={10} /> {entry.projectId?._id.slice(-6).toUpperCase() || '---'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900">
                                                        {clockInDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] font-bold text-emerald-500">{clockInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className={`text-[10px] font-bold ${clockOutDate ? 'text-slate-400' : 'text-blue-600 italic animate-pulse font-black'}`}>
                                                            {clockOutDate ? clockOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 rounded-xl font-black text-xs border shadow-sm ${clockOutDate ? 'bg-white text-slate-900 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'}`}>
                                                    {duration}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex justify-center">
                                                    {entry.geofenceStatus === 'inside' ? (
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm" title="Verified Site Location">
                                                            <ShieldCheck size={16} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm animate-bounce" title="Outside Site Geofence!">
                                                            <MapPin size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border
                                                    ${entry.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        entry.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => openDetails(entry)}
                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-slate-100"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-8 py-32 text-center text-slate-300">
                                        <div className="flex flex-col items-center gap-4">
                                            <Clock size={48} className="opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-[11px]">No matching timelogs available</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Review Timesheet Record">
                {selectedEntry && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-inner">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-blue-600 shadow-sm overflow-hidden uppercase">
                                {selectedEntry.userId?.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                                    {selectedEntry.userId?.fullName}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                        {selectedEntry.userId?.role?.replace('COMPANY_', '')}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-sm font-bold text-slate-500">{selectedEntry.projectId?.name || 'Manual Log'}</span>
                                </div>
                            </div>
                            {selectedEntry.geofenceStatus === 'inside' ? (
                                <div className="hidden sm:flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                        <ShieldCheck size={14} /> GPS Verified
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 mr-1">Jobsite Radius Match</span>
                                </div>
                            ) : (
                                <div className="hidden sm:flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-red-600 font-black text-xs uppercase bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 animate-pulse">
                                        <AlertCircle size={14} /> GPS Flagged
                                    </div>
                                    <span className="text-[10px] font-bold text-red-400 mt-1 mr-1">Outside Site Area</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border-2 border-slate-50 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/10 transition-colors">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                                <div className="relative">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                                        <Clock size={12} className="text-emerald-500" /> Start of Shift
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {new Date(selectedEntry.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </p>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        {new Date(selectedEntry.clockIn).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white border-2 border-slate-50 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/10 transition-colors">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all"></div>
                                <div className="relative">
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                                        <Clock size={12} className="text-red-500" /> End of Shift
                                    </p>
                                    <p className={`text-3xl font-black tracking-tighter ${selectedEntry.clockOut ? 'text-slate-900' : 'text-blue-600 animate-pulse'}`}>
                                        {selectedEntry.clockOut ? new Date(selectedEntry.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'ACTIVE'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        {selectedEntry.clockOut
                                            ? new Date(selectedEntry.clockOut).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                            : 'User currently clocked in'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedEntry.clockOut && (
                            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-blue-100">Total Calculated Hours</p>
                                        <p className="text-2xl font-black leading-none mt-1">
                                            {((new Date(selectedEntry.clockOut) - new Date(selectedEntry.clockIn)) / (1000 * 60 * 60)).toFixed(2)}h
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase flex items-center gap-1 justify-end text-blue-200">
                                        <ShieldCheck size={12} /> Auto-Computed
                                    </p>
                                    <span className="text-[9px] italic text-blue-300 font-medium">Verified by KAAL Engine</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-auto">
                            <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                                Skip for now
                            </button>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {selectedEntry.status === 'pending' && selectedEntry.clockOut && (
                                    <>
                                        <button
                                            onClick={() => handleReject(selectedEntry._id)}
                                            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-tight text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100 shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedEntry._id)}
                                            className="flex-1 sm:flex-none px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tight text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Approve log
                                        </button>
                                    </>
                                )}
                                {(selectedEntry.status !== 'pending' || !selectedEntry.clockOut) && (
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tight text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Return to Dashboard
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const StatCard = ({ title, value, subtext, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 shadow-blue-100 border-blue-100',
        orange: 'bg-orange-50 text-orange-600 shadow-orange-100 border-orange-100',
        emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100 border-emerald-100',
        red: 'bg-red-50 text-red-600 shadow-red-100 border-red-100'
    };

    return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
            <div className={`p-4 rounded-2xl border ${colors[color]}`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{title}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
                <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">{subtext}</p>
            </div>
        </div>
    );
};

export default Timesheets;
