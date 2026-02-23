import { useState, useEffect } from 'react';
import {
    CloudSun, Sun, CloudRain, Wind,
    Calendar, Search, Filter, FileText, Users, Loader,
    Clock, ChevronRight, Hash, Check
} from 'lucide-react';
import api from '../../utils/api';

const WeatherIcon = ({ status, size = 20 }) => {
    switch (status) {
        case 'Sunny': return <Sun size={size} className="text-orange-500" />;
        case 'Cloudy': return <CloudSun size={size} className="text-slate-500" />;
        case 'Rainy': return <CloudRain size={size} className="text-blue-500" />;
        case 'Windy': return <Wind size={size} className="text-sky-500" />;
        default: return <Sun size={size} className="text-orange-500" />;
    }
};

const ClientDailyLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const res = await api.get('/dailylogs');
                setLogs(res.data);
            } catch (error) {
                console.error('Error fetching daily logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.workPerformed?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Daily Site Logs</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-blue-600" />
                        View daily site progress and operations
                    </p>
                </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs by project or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Filter size={18} /> Filters
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Calendar size={18} /> This Week
                    </button>
                </div>
            </div>

            {/* Log Cards */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 gap-4 text-slate-400">
                    <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="font-bold uppercase tracking-widest text-xs">Loading logs...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLogs.map(log => (
                        <div key={log._id} className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            {/* Card Header */}
                            <div className="h-28 bg-slate-100 relative overflow-hidden">
                                <img
                                    src={`https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400`}
                                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                                    alt="Site"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                                <div className="absolute top-4 left-4">
                                    <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-white/50 shadow-sm flex items-center gap-2">
                                        <Hash size={12} className="text-blue-600" />
                                        <span className="text-[11px] font-black text-slate-800 truncate max-w-[120px] uppercase tracking-tight">
                                            {log.projectId?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0 space-y-5 flex-1 flex flex-col -mt-4 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                            Daily Summary
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <WeatherIcon status={log.weather?.status} size={24} />
                                        <span className="text-xs font-black text-slate-800 mt-1">{log.weather?.temperature}°F</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 leading-none">
                                                {log.manpower?.reduce((acc, m) => acc + m.count, 0) || 0}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Manpower</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 leading-none">
                                                {log.manpower?.reduce((acc, m) => acc + (m.hours * m.count), 0) || 0}h
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Hours</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Check size={14} className="text-blue-600" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Work Performed</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed line-clamp-4 italic bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                        "{log.workPerformed}"
                                    </p>
                                </div>

                                <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] font-black text-slate-600">
                                            {log.reportedBy?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 leading-none">{log.reportedBy?.fullName || 'Unknown'}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                {log.reportedBy?.role === 'PM' ? 'Project Manager' :
                                                    log.reportedBy?.role === 'FOREMAN' ? 'Site Foreman' : 'Lead Worker'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredLogs.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 gap-6">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                <FileText size={40} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-slate-900">No Daily Logs Available</h3>
                                <p className="text-slate-500 font-bold max-w-xs mx-auto mt-2">
                                    No site logs have been recorded yet. Check back later for updates.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientDailyLogs;
