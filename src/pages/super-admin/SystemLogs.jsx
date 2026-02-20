import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Shield, AlertCircle, RefreshCw, Search, Terminal, Filter } from 'lucide-react';
import api from '../../utils/api';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/super-admin/logs');
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load system audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionColor = (action) => {
        if (action.includes('CREATE') || action.includes('UPLOAD')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (action.includes('DELETE') || action.includes('REJECT')) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && logs.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center">
                <RefreshCw className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Terminal size={32} className="text-blue-600" /> System Audit Logs
                    </h1>
                    <p className="text-slate-500 text-sm">Track all administrative actions and security events system-wide.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchLogs} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <RefreshCw size={20} />
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by action, user, or module..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 w-80 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Timestamp</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Action</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Module</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">User</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Details</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-slate-300 font-medium px-2 py-1 rounded bg-slate-800 text-[11px]">
                                            {log.module}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                                {log.userId?.fullName?.charAt(0) || 'S'}
                                            </div>
                                            <span className="text-slate-300 font-medium">{log.userId?.fullName || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-slate-800/80 group-hover:rounded-lg group-hover:p-2 transition-all">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                                        {log.ipAddress || '127.0.0.1'}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-500">
                                        <Activity size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-lg font-medium">No system logs found</p>
                                        <p className="text-sm">Try clearing your filters or search terms.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-700">
                    <p className="font-bold mb-1">Log Retention Policy</p>
                    <p>System audit logs are retained for 365 days. Exports can be requested via the primary platform administrator.</p>
                </div>
            </div>
        </div>
    );
};

export default SystemLogs;
