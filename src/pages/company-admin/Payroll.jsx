import { useState, useEffect } from 'react';
import {
    DollarSign, Clock, Download, Send, Search, Filter,
    Eye, Printer, ArrowUpRight, MoreHorizontal, CheckCircle,
    AlertCircle, ChevronRight, Banknote, Wallet, FileText
} from 'lucide-react';
import api from '../../utils/api';

const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group">
        <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">{value}</p>
            {sub && <p className="text-[11px] font-bold text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {trend && (
            <div className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={14} />{trend}
            </div>
        )}
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        pending: 'bg-orange-50  text-orange-700  border-orange-100',
        processing: 'bg-blue-50    text-blue-700    border-blue-100',
        held: 'bg-red-50     text-red-700     border-red-100',
    };
    return (
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${map[status] || map.pending}`}>
            {status}
        </span>
    );
};

const DEMO = [
    { uid: '1', name: 'Jack Black', role: 'FOREMAN', hours: 42.5, rate: 45, gross: 1912.50, tax: 344.25, net: 1568.25, entries: 6, status: 'paid' },
    { uid: '2', name: 'Anna Garcia', role: 'WORKER', hours: 38.0, rate: 32, gross: 1216.00, tax: 218.88, net: 997.12, entries: 5, status: 'paid' },
    { uid: '3', name: 'Ryan Smith', role: 'PM', hours: 44.0, rate: 55, gross: 2420.00, tax: 435.60, net: 1984.40, entries: 6, status: 'processing' },
    { uid: '4', name: 'Chris Evans', role: 'WORKER', hours: 36.5, rate: 32, gross: 1168.00, tax: 210.24, net: 957.76, entries: 5, status: 'pending' },
    { uid: '5', name: 'Maria Lopez', role: 'WORKER', hours: 40.0, rate: 30, gross: 1200.00, tax: 216.00, net: 984.00, entries: 5, status: 'pending' },
    { uid: '6', name: 'David Kim', role: 'FOREMAN', hours: 45.0, rate: 42, gross: 1890.00, tax: 340.20, net: 1549.80, entries: 6, status: 'held' },
];

const Payroll = () => {
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState('this-week');
    const [modal, setModal] = useState(false);
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        api.get('/timesheets')
            .then(r => setTimesheets(r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Build rows from real timesheets, fall back to demo
    const realRows = (() => {
        const map = {};
        timesheets.forEach(ts => {
            const uid = ts.userId?._id || ts.userId;
            const name = ts.userId?.fullName || 'Unknown';
            const role = ts.userId?.role?.replace('COMPANY_', '') || 'WORKER';
            if (!uid) return;
            if (!map[uid]) map[uid] = { uid, name, role, hours: 0, entries: 0, rate: 35, status: 'pending' };
            if (ts.clockIn && ts.clockOut) {
                map[uid].hours += (new Date(ts.clockOut) - new Date(ts.clockIn)) / 3600000;
                map[uid].entries += 1;
                if (ts.status === 'approved') map[uid].status = 'paid';
            }
        });
        return Object.values(map).map(r => ({
            ...r,
            hours: +r.hours.toFixed(2),
            gross: +(r.hours * r.rate).toFixed(2),
            tax: +(r.hours * r.rate * 0.18).toFixed(2),
            net: +(r.hours * r.rate * 0.82).toFixed(2),
        }));
    })();

    const rows = realRows.length > 0 ? realRows : DEMO;
    const filtered = rows.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.role.toLowerCase().includes(search.toLowerCase())
    );

    const totGross = rows.reduce((s, r) => s + r.gross, 0);
    const totNet = rows.reduce((s, r) => s + r.net, 0);
    const totTax = rows.reduce((s, r) => s + r.tax, 0);
    const totHours = rows.reduce((s, r) => s + r.hours, 0);

    const toggleRow = uid => setSelected(p => p.includes(uid) ? p.filter(x => x !== uid) : [...p, uid]);
    const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(r => r.uid));

    const periods = [
        { v: 'this-week', l: 'This Week' }, { v: 'last-week', l: 'Last Week' },
        { v: 'this-month', l: 'This Month' }, { v: 'last-month', l: 'Last Month' },
    ];

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Payroll</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Banknote size={14} className="text-blue-600" /> Crew compensation & pay period management
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all"><Download size={20} /></button>
                    <button className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all"><Printer size={20} /></button>
                    <button onClick={() => { setStep(1); setModal(true); }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight">
                        <Send size={18} /> Run Payroll
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Gross" value={`$${totGross.toLocaleString()}`} sub="this pay period" icon={DollarSign} color="bg-blue-600" trend="+4.2%" />
                <StatCard title="Total Net Pay" value={`$${totNet.toLocaleString()}`} sub="after deductions" icon={Wallet} color="bg-emerald-500" trend="+3.8%" />
                <StatCard title="Tax Withheld" value={`$${totTax.toLocaleString()}`} sub="18% flat rate" icon={FileText} color="bg-orange-400" />
                <StatCard title="Total Hours" value={`${totHours.toFixed(1)}h`} sub={`${rows.length} employees`} icon={Clock} color="bg-indigo-500" trend="+2.1%" />
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                    {periods.map(p => (
                        <button key={p.v} onClick={() => setPeriod(p.v)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${period === p.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {p.l}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search employee or role..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 text-sm font-bold text-slate-700 placeholder:text-slate-400" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-5 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Filter size={16} /> Filter
                    </button>
                    {selected.length > 0 && (
                        <button className="flex-1 md:flex-none px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                            <Send size={16} /> Pay {selected.length}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5">
                                    <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                                        onChange={toggleAll} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                                </th>
                                {['Employee', 'Role', 'Hours', 'Rate/hr', 'Gross Pay', 'Tax (18%)', 'Net Pay', 'Status', ''].map(h => (
                                    <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? [...Array(5)].map((_, i) => (
                                <tr key={i}>{[...Array(10)].map((_, j) => (
                                    <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg animate-pulse" /></td>
                                ))}</tr>
                            )) : filtered.length === 0 ? (
                                <tr><td colSpan="10" className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <DollarSign size={48} className="opacity-30" />
                                        <p className="font-bold uppercase tracking-widest text-[11px]">No payroll records found</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map(row => (
                                <tr key={row.uid} className={`hover:bg-slate-50/50 transition-colors group ${selected.includes(row.uid) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-8 py-5">
                                        <input type="checkbox" checked={selected.includes(row.uid)} onChange={() => toggleRow(row.uid)}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                {row.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-tight">{row.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{row.entries} entries</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{row.role}</span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-900">{row.hours}h</td>
                                    <td className="px-6 py-5 font-bold text-slate-500">${row.rate}/hr</td>
                                    <td className="px-6 py-5 font-black text-slate-900">${row.gross.toLocaleString()}</td>
                                    <td className="px-6 py-5 font-bold text-red-500">-${row.tax.toLocaleString()}</td>
                                    <td className="px-6 py-5"><span className="font-black text-emerald-600 text-base">${row.net.toLocaleString()}</span></td>
                                    <td className="px-6 py-5"><StatusBadge status={row.status} /></td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Download size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><MoreHorizontal size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {!loading && filtered.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-900 text-white">
                                    <td className="px-8 py-5" colSpan="5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pay Period Totals</span>
                                    </td>
                                    <td className="px-6 py-5 font-black">${totGross.toLocaleString()}</td>
                                    <td className="px-6 py-5 font-black text-red-400">-${totTax.toLocaleString()}</td>
                                    <td className="px-6 py-5 font-black text-emerald-400 text-base">${totNet.toLocaleString()}</td>
                                    <td colSpan="2" />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Run Payroll Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Send size={22} /></div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Run Payroll</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Step {step} of 3</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                ))}
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            {step === 1 && (
                                <>
                                    <h3 className="font-black text-slate-900 text-lg">Review Summary</h3>
                                    <div className="space-y-3">
                                        {[
                                            { l: 'Employees', v: `${rows.length} crew members` },
                                            { l: 'Total Hours', v: `${totHours.toFixed(1)}h` },
                                            { l: 'Gross Pay', v: `$${totGross.toLocaleString()}` },
                                            { l: 'Tax Withheld', v: `$${totTax.toLocaleString()}` },
                                            { l: 'Net Payout', v: `$${totNet.toLocaleString()}`, hi: true },
                                        ].map(item => (
                                            <div key={item.l} className={`flex justify-between items-center p-4 rounded-2xl ${item.hi ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                                                <span className="text-sm font-bold text-slate-500">{item.l}</span>
                                                <span className={`font-black ${item.hi ? 'text-emerald-600 text-lg' : 'text-slate-900'}`}>{item.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {step === 2 && (
                                <>
                                    <h3 className="font-black text-slate-900 text-lg">Confirm & Authorize</h3>
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4">
                                        <AlertCircle size={22} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-black text-orange-800 text-sm">This action is irreversible</p>
                                            <p className="text-orange-600 text-xs font-bold mt-1">Funds will be disbursed to {rows.length} employees. Total: <strong>${totNet.toLocaleString()}</strong></p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Authorization PIN</label>
                                        <input type="password" placeholder="••••" maxLength={4}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-black text-slate-800 outline-none focus:border-blue-500/50 text-center text-2xl tracking-[1rem]" />
                                    </div>
                                </>
                            )}
                            {step === 3 && (
                                <div className="text-center py-4">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                                        <CheckCircle size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-xl mb-2">Payroll Submitted!</h3>
                                    <p className="text-slate-500 font-bold text-sm">${totNet.toLocaleString()} disbursed to {rows.length} employees within 1–2 business days.</p>
                                    <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-left space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-500">Reference ID</span>
                                            <span className="font-black text-slate-900">PAY-{Date.now().toString().slice(-8)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-500">Processed At</span>
                                            <span className="font-black text-slate-900">{new Date().toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                {step < 3 ? (
                                    <>
                                        <button onClick={() => step > 1 ? setStep(s => s - 1) : setModal(false)}
                                            className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-tight transition-all">
                                            {step > 1 ? 'Back' : 'Cancel'}
                                        </button>
                                        <button onClick={() => setStep(s => s + 1)}
                                            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                                            {step === 2 ? <><Send size={16} /> Authorize</> : <><ChevronRight size={16} /> Continue</>}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setModal(false)}
                                        className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-lg">
                                        Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
