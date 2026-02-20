import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Activity } from 'lucide-react';
import api from '../../utils/api';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        financials: { totalRevenue: 0, totalInvoiced: 0, outstanding: 0, projectBudget: 0 },
        projects: { total: 0, active: 0, completed: 0, atRisk: 0 },
        labor: { totalHours: 0, productivityData: [] },
        safety: { totalIncidents: 0, daysIncidentFree: 0 }
    });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/reports/company');
                setData(res.data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    const { financials, projects, labor, safety } = data;
    const { productivityData } = labor;
    const revenueData = [
        { name: 'Revenue', value: financials.totalRevenue },
        { name: 'Outstanding', value: financials.outstanding }
    ];

    const projectStatusData = [
        { name: 'Active', value: projects.active, color: '#3b82f6' },
        { name: 'Completed', value: projects.completed, color: '#10b981' },
        { name: 'At Risk', value: projects.atRisk, color: '#ef4444' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
                    <p className="text-slate-500 text-sm">Financial health, project status, and workforce productivity.</p>
                </div>
                <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition shadow-sm font-medium">
                    <Download size={18} /> Export PDF
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Revenue</p>
                        {/* <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowUpRight size={10} /> 12%
                        </span> */}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">${financials.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-500 uppercase font-bold">Project Budget</p>
                        {/* <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowDownRight size={10} /> 3%
                        </span> */}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">${financials.projectBudget.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-500 uppercase font-bold">Labor Hours</p>
                        {/* <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowUpRight size={10} /> 5%
                        </span> */}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{labor.totalHours.toLocaleString()}h</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-500 uppercase font-bold">Safety Incidents</p>
                        <div className="p-1 bg-emerald-50 rounded text-emerald-600">
                            <Activity size={16} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{safety ? safety.totalIncidents : 0}</h3>
                    <p className="text-xs text-slate-500 mt-1">{safety ? safety.daysIncidentFree : 0} Days incident free</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Financial Overview</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Revenue</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Expenses</span>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Status Pie */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6">Project Health</h3>
                    <div className="flex items-center justify-center h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projectStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6">Weekly Labor Productivity</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productivityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <RechartsTooltip cursor={false} />
                            <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Reports;
