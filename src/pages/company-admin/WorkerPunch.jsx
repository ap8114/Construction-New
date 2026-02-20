import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, Camera, RefreshCw, AlertCircle, Play, Square, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WorkerPunch = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [timer, setTimer] = useState(0);
    const [activeJob, setActiveJob] = useState('North Tower Construction');
    const [siteLocation, setSiteLocation] = useState('Parkview, Block C');

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

    const handleToggle = () => {
        setIsClockedIn(!isClockedIn);
    };

    const recentLogs = [
        { date: 'Today', in: '07:00 AM', out: '---', duration: 'Active', job: 'North Tower' },
        { date: 'Yesterday', in: '07:15 AM', out: '04:30 PM', duration: '9h 15m', job: 'North Tower' },
        { date: 'Feb 16, 2026', in: '08:00 AM', out: '05:00 PM', duration: '9h 00m', job: 'Parkview Condos' },
    ];

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
                        <div className="flex items-center justify-center gap-4 text-slate-400 font-bold">
                            <span className="flex items-center gap-1.5"><MapPin size={16} /> {activeJob}</span>
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
                        <p className="font-bold text-slate-900">{isClockedIn ? '07:00 AM' : '--:--'}</p>
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
                    <button className="text-[10px] font-black text-blue-600 uppercase">View All</button>
                </div>
                <div className="divide-y divide-slate-50">
                    {recentLogs.map((log, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900">{log.date}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.job}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900">{log.in} - {log.out}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${log.duration === 'Active' ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                                    {log.duration}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkerPunch;
