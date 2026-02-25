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
    const [gpsAddresses, setGpsAddresses] = useState({});
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const socketRef = useRef();
    const { user } = useAuth();
    const isWorker = user?.role === 'WORKER' || user?.role === 'SUBCONTRACTOR';

    const [activeTab, setActiveTab] = useState('logs');
    const [corrections, setCorrections] = useState([]);
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/timelogs');
            const data = isWorker ? response.data.filter(e => e.userId?._id === user._id) : response.data;
            setEntries(data);

            // If admin/pm, also fetch correction requests
            if (!isWorker) {
                fetchCorrections();
            }

            // Fetch addresses for entries with GPS
            fetchGpsAddresses(data);
        } catch (error) {
            console.error('Error fetching time logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCorrections = async () => {
        try {
            setIsCorrectionLoading(true);
            const res = await api.get('/corrections');
            setCorrections(res.data);
        } catch (error) {
            console.error('Error fetching corrections:', error);
        } finally {
            setIsCorrectionLoading(false);
        }
    };

    const handleApproveCorrection = async (id) => {
        try {
            await api.patch(`/corrections/${id}`, { status: 'approved' });
            fetchCorrections();
            fetchData(); // Refresh logs to show updated times
            alert('Correction request approved and timelog updated.');
        } catch (error) {
            console.error('Error approving correction:', error);
            alert('Failed to approve correction.');
        }
    };

    const handleRejectCorrection = async (id) => {
        const reason = window.prompt('Enter rejection reason:');
        if (reason === null) return;
        try {
            await api.patch(`/corrections/${id}`, { status: 'rejected', reviewNotes: reason });
            fetchCorrections();
            alert('Correction request rejected.');
        } catch (error) {
            console.error('Error rejecting correction:', error);
            alert('Failed to reject correction.');
        }
    };

    const fetchGpsAddresses = async (data) => {
        const addressMap = {};
        const withGps = data.filter(e => e.gpsIn?.latitude && e.gpsIn?.longitude);
        await Promise.all(withGps.map(async (entry) => {
            try {
                const { latitude: lat, longitude: lng } = entry.gpsIn;
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const json = await res.json();
                const addr = json.address;
                const short = [
                    addr?.road || addr?.neighbourhood,
                    addr?.city || addr?.town || addr?.village || addr?.county,
                    addr?.country
                ].filter(Boolean).join(', ');
                addressMap[entry._id] = short || json.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            } catch {
                const { latitude: lat, longitude: lng } = entry.gpsIn;
                addressMap[entry._id] = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
        }));
        setGpsAddresses(addressMap);
    };

    useEffect(() => {
        fetchData();

        // Connect socket
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://construction-backend-production-b192.up.railway.app';
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

    const filteredEntries = entries.filter(entry => {
        const nameMatch = entry.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const projectMatch = entry.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const searchMatch = nameMatch || projectMatch;

        let dateMatch = true;
        if (dateFrom) dateMatch = dateMatch && new Date(entry.clockIn) >= new Date(dateFrom);
        if (dateTo) {
            const toEnd = new Date(dateTo);
            toEnd.setHours(23, 59, 59, 999);
            dateMatch = dateMatch && new Date(entry.clockIn) <= toEnd;
        }

        const statusMatch = statusFilter === 'all' || entry.status === statusFilter;

        return searchMatch && dateMatch && statusMatch;
    });

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
        const wrap = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const csv = [
            ['Employee', 'Project', 'Date', 'Time In', 'Time Out', 'Duration (h)', 'Status', 'Geofence Status', 'Location Verified', 'GPS In', 'GPS Out'].map(wrap).join(','),
            ...filteredEntries.map(e => {
                const clockIn = new Date(e.clockIn);
                const clockOut = e.clockOut ? new Date(e.clockOut) : null;
                const duration = clockOut ? ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2) : 'In Progress';
                const geofence = e.isOutsideGeofence ? 'OUTSIDE' : (e.geofenceStatus === 'inside' ? 'INSIDE' : 'UNKNOWN');
                return [
                    e.userId?.fullName || '',
                    e.projectId?.name || 'Manual Entry',
                    clockIn.toLocaleDateString('en-GB'),
                    clockIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    clockOut ? clockOut.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '---',
                    duration,
                    e.status,
                    geofence,
                    e.isOutsideGeofence ? 'Flagged' : 'Verified',
                    e.clockInLatitude ? `${e.clockInLatitude}, ${e.clockInLongitude}` : '',
                    e.clockOutLatitude ? `${e.clockOutLatitude}, ${e.clockOutLongitude}` : ''
                ].map(wrap).join(',');
            })
        ].join('\n');
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
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
        gpsTracked: entries.filter(e => e.gpsIn?.latitude && e.gpsIn?.longitude).length
    };

    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
    const [correctionData, setCorrectionData] = useState({ timeLogId: '', reason: '', clockIn: '', clockOut: '' });
    const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

    const handleCorrectionSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmittingCorrection(true);
            await api.post('/corrections', {
                timeLogId: correctionData.timeLogId,
                requestedChanges: {
                    clockIn: correctionData.clockIn || undefined,
                    clockOut: correctionData.clockOut || undefined,
                    reason: correctionData.reason
                }
            });
            alert('Correction request submitted successfuly.');
            setIsCorrectionModalOpen(false);
            setCorrectionData({ timeLogId: '', reason: '', clockIn: '', clockOut: '' });
        } catch (error) {
            console.error('Error submitting correction:', error);
            alert('Failed to submit correction request.');
        } finally {
            setIsSubmittingCorrection(false);
        }
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
                            onClick={() => setIsCorrectionModalOpen(true)}
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
                <StatCard
                    title={isWorker ? "On-Clock Status" : "GPS Tracked"}
                    value={isWorker ? (entries.some(e => !e.clockOut) ? 'Active' : 'Offline') : stats.gpsTracked}
                    subtext={isWorker ? "Current shift" : `of ${entries.length} entries`}
                    icon={isWorker ? Clock : MapPin}
                    color={isWorker ? "emerald" : "blue"}
                />
            </div>

            {/* Dashboard Sub-Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {!isWorker && (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Time Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('corrections')}
                            className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'corrections' ? 'bg-white text-orange-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Corrections
                            {corrections.filter(c => c.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] text-white items-center justify-center font-black">
                                        {corrections.filter(c => c.status === 'pending').length}
                                    </span>
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center flex-1 w-full">
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
                        <div className="flex gap-2 w-full md:w-auto relative">
                            {/* Date Range */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowDatePicker(p => !p); setShowStatusFilter(false); }}
                                    className={`flex-1 md:flex-none px-5 py-3 border rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${dateFrom || dateTo ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <Calendar size={18} /> Date Range
                                    {(dateFrom || dateTo) && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                </button>
                                {showDatePicker && (
                                    <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-64 space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">From</label>
                                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">To</label>
                                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400" />
                                        </div>
                                        <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                            className="w-full text-xs font-bold text-slate-400 hover:text-red-500 transition-colors text-center">
                                            Clear Dates
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Filter Status */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowStatusFilter(p => !p); setShowDatePicker(false); }}
                                    className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${statusFilter !== 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Filter size={18} /> Filter Status
                                    {statusFilter !== 'all' && <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-black uppercase">{statusFilter}</span>}
                                </button>
                                {showStatusFilter && (
                                    <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden w-44">
                                        {['all', 'pending', 'approved', 'rejected'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm font-bold capitalize transition-colors ${statusFilter === s ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                            >
                                                {s === 'all' ? '✦ All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            {activeTab === 'logs' ? (
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Project / Site</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Shift Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Location Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px) font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
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
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    const lat = entry.clockInLatitude || entry.gpsIn?.latitude;
                                                                    const lng = entry.clockInLongitude || entry.gpsIn?.longitude;
                                                                    if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                                                }}
                                                                disabled={!(entry.clockInLatitude || entry.gpsIn?.latitude)}
                                                                title="View Clock-In Location"
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${entry.clockInLatitude || entry.gpsIn?.latitude ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                            >
                                                                <MapPin size={14} />
                                                            </button>
                                                            {entry.clockOut && (
                                                                <button
                                                                    onClick={() => {
                                                                        const lat = entry.clockOutLatitude || entry.gpsOut?.latitude;
                                                                        const lng = entry.clockOutLongitude || entry.gpsOut?.longitude;
                                                                        if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                                                    }}
                                                                    disabled={!(entry.clockOutLatitude || entry.gpsOut?.latitude)}
                                                                    title="View Clock-Out Location"
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${entry.clockOutLatitude || entry.gpsOut?.latitude ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                                >
                                                                    <MapPin size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${entry.isOutsideGeofence ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {entry.isOutsideGeofence ? 'Outside' : 'Inside'}
                                                        </span>
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
            ) : (
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Worker</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Log</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Requested Changes</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isCorrectionLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center text-slate-400">Loading requests...</td>
                                    </tr>
                                ) : corrections.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center text-slate-400">No correction requests found.</td>
                                    </tr>
                                ) : (
                                    corrections.map(req => (
                                        <tr key={req._id}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center font-black text-orange-600">
                                                        {req.userId?.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 tracking-tight">{req.userId?.fullName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{req.userId?.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-[10px] space-y-1">
                                                    <p className="font-bold text-slate-400 uppercase tracking-widest">Original Log</p>
                                                    <p className="text-slate-600 font-bold">
                                                        {new Date(req.timeLogId?.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {req.timeLogId?.clockOut ? new Date(req.timeLogId.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 flex items-center gap-4">
                                                    {req.requestedChanges?.clockIn && (
                                                        <div>
                                                            <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-0.5">Start</p>
                                                            <p className="text-xs font-black text-orange-600">{new Date(req.requestedChanges.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    )}
                                                    {req.requestedChanges?.clockIn && req.requestedChanges?.clockOut && (
                                                        <div className="h-6 w-px bg-orange-200"></div>
                                                    )}
                                                    {req.requestedChanges?.clockOut && (
                                                        <div>
                                                            <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-0.5">End</p>
                                                            <p className="text-xs font-black text-orange-600">{new Date(req.requestedChanges.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs text-slate-600 max-w-[200px] leading-relaxed italic">"{req.requestedChanges?.reason}"</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${req.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleRejectCorrection(req._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Reject Correction"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveCorrection(req._id)}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Approve & Update Log"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

            {/* Correction Request Modal */}
            <Modal
                isOpen={isCorrectionModalOpen}
                onClose={() => setIsCorrectionModalOpen(false)}
                title="Submit Correction Request"
            >
                <form onSubmit={handleCorrectionSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Select Timesheet Record</label>
                            <select
                                required
                                value={correctionData.timeLogId}
                                onChange={(e) => {
                                    const log = entries.find(item => item._id === e.target.value);
                                    setCorrectionData({
                                        ...correctionData,
                                        timeLogId: e.target.value,
                                        clockIn: log?.clockIn ? new Date(log.clockIn).toISOString().slice(0, 16) : '',
                                        clockOut: log?.clockOut ? new Date(log.clockOut).toISOString().slice(0, 16) : ''
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">-- Choose a record to correct --</option>
                                {entries.filter(e => e.status !== 'approved').map(log => (
                                    <option key={log._id} value={log._id}>
                                        {new Date(log.clockIn).toLocaleDateString()} - {log.projectId?.name || 'Manual Log'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Correct Clock In</label>
                                <input
                                    type="datetime-local"
                                    value={correctionData.clockIn}
                                    onChange={(e) => setCorrectionData({ ...correctionData, clockIn: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Correct Clock Out</label>
                                <input
                                    type="datetime-local"
                                    value={correctionData.clockOut}
                                    onChange={(e) => setCorrectionData({ ...correctionData, clockOut: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Reason for Correction</label>
                            <textarea
                                required
                                rows="3"
                                placeholder="Why does this record need correction? (e.g. Forgot to clock out, GPS error)"
                                value={correctionData.reason}
                                onChange={(e) => setCorrectionData({ ...correctionData, reason: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsCorrectionModalOpen(false)}
                            className="flex-1 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmittingCorrection || !correctionData.timeLogId}
                            className="flex-[2] bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmittingCorrection ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} /> Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
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
