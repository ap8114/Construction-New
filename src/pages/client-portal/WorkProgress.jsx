import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Activity, CheckCircle2, Clock, Calendar,
    ArrowLeft, ChevronRight, TrendingUp,
    ShieldCheck, ListChecks, MessageSquare,
    Image as ImageIcon, Loader
} from 'lucide-react';
import api from '../../utils/api';

const WorkProgress = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [updates, setUpdates] = useState([]);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                setLoading(true);
                const [progRes, updateRes] = await Promise.all([
                    api.get(`/projects/${id}/client-progress`),
                    api.get(`/projects/${id}/client-updates`)
                ]);
                setProgressData(progRes.data);
                setUpdates(updateRes.data);
            } catch (err) {
                console.error('Error fetching progress:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-40">
                <div className="flex flex-col items-center gap-4">
                    <Loader size={40} className="text-blue-600 animate-spin" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Analyzing Progress...</p>
                </div>
            </div>
        );
    }

    if (!progressData) return <div className="p-20 text-center font-bold text-slate-400">Project details not found.</div>;

    const statusColors = {
        active: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        planning: 'text-blue-500 bg-blue-50 border-blue-100',
        on_hold: 'text-orange-500 bg-orange-50 border-orange-100',
        completed: 'text-indigo-500 bg-indigo-50 border-indigo-100'
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <button
                        onClick={() => navigate('/client-portal')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        {progressData.projectName}
                        <span className={`px-4 py-1.5 text-[10px] uppercase tracking-widest rounded-full border shadow-sm ${statusColors[progressData.status] || 'bg-slate-50 text-slate-500'}`}>
                            {progressData.status?.replace('_', ' ')}
                        </span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-blue-600" />
                        Live Work Progress View
                    </p>
                </div>
            </div>

            {/* Top Grid: Progress & Current Phase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Large Progress Card */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
                    <div className="relative w-48 h-48 mb-8">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                            <circle
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={552.9}
                                strokeDashoffset={552.9 - (552.9 * (progressData.progress || 0)) / 100}
                                className="text-blue-600 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900 leading-none">{progressData.progress}%</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Overall</span>
                        </div>
                    </div>
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                            <span>Started: {new Date(progressData.startDate).toLocaleDateString()}</span>
                            <span>Est. Finish: {new Date(progressData.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressData.progress}%` }} />
                        </div>
                    </div>
                </div>

                {/* Current Phase Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white flex flex-col justify-between border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Phase</p>
                        <h2 className="text-3xl font-black tracking-tight">{progressData.currentPhase}</h2>
                        <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            In Progress
                        </div>
                    </div>
                    <div className="relative z-10 pt-10">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Our team is currently focused on <span className="text-white font-bold">{progressData.currentPhase}</span>.
                            Everything is following the schedule.
                        </p>
                    </div>
                </div>
            </div>

            {/* Middle Grid: Completed & Upcoming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Completed Milestones */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-emerald-50 group-hover:scale-110 transition-all">
                        <ShieldCheck size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                            Completed Milestones
                        </h3>
                        <div className="space-y-6">
                            {progressData.completedWork?.length > 0 ? (
                                progressData.completedWork.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">{item}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic text-sm">No milestones completed yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Work */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-blue-50 group-hover:scale-110 transition-all">
                        <ListChecks size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Clock size={24} className="text-blue-600" />
                            Next Steps
                        </h3>
                        <div className="space-y-6">
                            {progressData.upcomingWork?.length > 0 ? (
                                progressData.upcomingWork.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">{item}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic text-sm">No upcoming tasks scheduled.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Updates Timeline */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Site Activity</h3>
                </div>

                <div className="relative space-y-8 before:absolute before:left-8 before:top-4 before:bottom-0 before:w-1 before:bg-slate-100">
                    {updates.length > 0 ? (
                        updates.map((update, idx) => (
                            <div key={update._id} className="relative pl-24 group">
                                <div className="absolute left-4 top-2 w-10 h-10 rounded-2xl bg-white border-4 border-blue-600 shadow-xl group-hover:scale-110 transition-transform flex items-center justify-center text-blue-600 z-10">
                                    <Calendar size={18} />
                                </div>
                                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                        <h4 className="text-lg font-black text-slate-800">{update.title}</h4>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 h-fit uppercase tracking-tighter">
                                            {new Date(update.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium leading-relaxed text-sm">{update.description}</p>

                                    {update.images && update.images.length > 0 && (
                                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {update.images.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                    <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Activity" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-slate-50 rounded-[40px] p-20 border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                            <Loader size={40} className="text-slate-200" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No updates posted yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkProgress;
