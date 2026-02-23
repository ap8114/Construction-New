import { useState, useEffect, useRef } from 'react';
import {
    DollarSign, Clock, Download, Send, Search, Filter,
    Eye, Printer, ArrowUpRight, MoreHorizontal, CheckCircle,
    AlertCircle, ChevronRight, Banknote, Wallet, FileText, X,
    Calendar, Briefcase
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
            {status || 'preview'}
        </span>
    );
};

const Payroll = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState('this-week');
    const [modal, setModal] = useState(false);
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Detail Modal state
    const [detailModal, setDetailModal] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);
    const [detailLogs, setDetailLogs] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const slipRef = useRef(null);

    const getDates = (p) => {
        const now = new Date();
        let start, end;
        if (p === 'this-week') {
            start = new Date(now.setDate(now.getDate() - now.getDay()));
            end = new Date();
        } else if (p === 'last-week') {
            const first = now.getDate() - now.getDay() - 7;
            start = new Date(now.setDate(first));
            end = new Date(now.setDate(first + 6));
        } else if (p === 'this-month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date();
        } else {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        }
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const { start, end } = getDates(period);
            const r = await api.get(`/payroll/preview?startDate=${start}&endDate=${end}`);
            setRows(r.data || []);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [period]);

    // ── Action: View Detail Modal ──────────────────────────────────────────────
    const handleView = async (row) => {
        setDetailRecord(row);
        setDetailLogs([]);
        setDetailModal(true);
        setDetailLoading(true);
        try {
            const { start, end } = getDates(period);
            const res = await api.get(`/payroll/details?userId=${row.userId}&startDate=${start}&endDate=${end}`);
            setDetailLogs(res.data || []);
        } catch (e) {
            console.error('Failed to load payroll details', e);
        } finally {
            setDetailLoading(false);
        }
    };

    // ── Action: Download / Print Payslip ───────────────────────────────────────
    const handleDownload = (row) => {
        const { start, end } = getDates(period);
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Payslip – ${row.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 680px; margin: 40px auto; color: #1e293b; }
    h1 { font-size: 26px; font-weight: 900; letter-spacing: -1px; margin: 0 0 4px; }
    .sub { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 32px; }
    .info-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; }
    .info-item small { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 2px; font-weight: 700; }
    .info-item strong { font-size: 15px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f1f5f9; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #64748b; font-weight: 900; padding: 10px 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .total-row { background: #0f172a; color: white; font-weight: 900; font-size: 15px; }
    .total-row td { padding: 14px 12px; border: none; }
    .deductions { color: #ef4444; }
    .positive { color: #10b981; }
    footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>PAYSLIP</h1>
  <div class="sub">Pay Period: ${start} → ${end}</div>
  <div class="info-grid">
    <div class="info-item"><small>Employee</small><strong>${row.name}</strong></div>
    <div class="info-item"><small>Role</small><strong>${row.role}</strong></div>
    <div class="info-item"><small>Total Hours</small><strong>${row.totalHours?.toFixed(2)}h</strong></div>
    <div class="info-item"><small>Hourly Rate</small><strong>$${row.rate}/hr</strong></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>Gross Pay</td><td>$${row.grossPay?.toFixed(2)}</td></tr>
      <tr class="deductions"><td>CPP Deduction</td><td>−$${row.cpp?.toFixed(2)}</td></tr>
      <tr class="deductions"><td>EI Deduction</td><td>−$${row.ei?.toFixed(2)}</td></tr>
      <tr class="deductions"><td>Federal Tax</td><td>−$${row.federalTax?.toFixed(2)}</td></tr>
      <tr><td>WCB (Employer)</td><td>$${row.wcb?.toFixed(2)}*</td></tr>
      <tr class="total-row"><td>NET PAY</td><td class="positive">$${row.netPay?.toFixed(2)}</td></tr>
    </tbody>
  </table>
  <p style="font-size:11px;color:#94a3b8;">* WCB is an employer contribution and is not deducted from your pay.</p>
  <footer>Generated on ${new Date().toLocaleDateString()} · Ref: PAY-${Date.now().toString().slice(-8)}</footer>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        if (win) {
            win.addEventListener('load', () => {
                win.focus();
                win.print();
            });
        }
    };

    // ── Payroll Run ────────────────────────────────────────────────────────────
    const handleRunPayroll = async () => {
        setSubmitting(true);
        try {
            const { start, end } = getDates(period);
            const targetIds = selected.length > 0 ? selected : rows.map(r => r.userId);
            const targetRows = rows.filter(r => targetIds.includes(r.userId));
            await api.post('/payroll/run', {
                records: targetRows,
                startDate: start,
                endDate: end
            });
            // Immediately update status in local state so table reflects 'paid'
            setRows(prev => prev.map(r =>
                targetIds.includes(r.userId) ? { ...r, status: 'paid' } : r
            ));
            setStep(3);
        } catch (e) {
            alert('Failed to run payroll. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = rows.filter(r =>
        (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.role || '').toLowerCase().includes(search.toLowerCase())
    );

    const totGross = rows.reduce((s, r) => s + (r.grossPay || 0), 0);
    const totNet = rows.reduce((s, r) => s + (r.netPay || 0), 0);
    const totCPP = rows.reduce((s, r) => s + (r.cpp || 0), 0);
    const totEI = rows.reduce((s, r) => s + (r.ei || 0), 0);
    const totTax = rows.reduce((s, r) => s + (r.federalTax || 0), 0);
    const totWCB = rows.reduce((s, r) => s + (r.wcb || 0), 0);
    const totHours = rows.reduce((s, r) => s + (r.totalHours || 0), 0);

    const toggleRow = uid => setSelected(p => p.includes(uid) ? p.filter(x => x !== uid) : [...p, uid]);
    const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(r => r.userId));

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
                        <Banknote size={14} className="text-blue-600" /> Crew compensation &amp; pay period management
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        title="Print payroll summary"
                        onClick={() => window.print()}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all"
                    >
                        <Printer size={20} />
                    </button>
                    <button onClick={() => { setStep(1); setModal(true); }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-black text-sm uppercase tracking-tight">
                        <Send size={18} /> Run Payroll
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Gross" value={`$${totGross.toLocaleString()}`} sub="this pay period" icon={DollarSign} color="bg-blue-600" />
                <StatCard title="Total Net Pay" value={`$${totNet.toLocaleString()}`} sub="after deductions" icon={Wallet} color="bg-emerald-500" />
                <StatCard title="Deductions" value={`$${(totCPP + totEI + totTax + totWCB).toLocaleString()}`} sub="CPP, EI, Tax, WCB" icon={FileText} color="bg-orange-400" />
                <StatCard title="Total Hours" value={`${totHours.toFixed(1)}h`} sub={`${rows.length} employees`} icon={Clock} color="bg-indigo-500" />
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
                        <button
                            onClick={() => { setStep(1); setModal(true); }}
                            className="flex-1 md:flex-none px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
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
                                {['Employee', 'Role', 'Hours', 'Rate/hr', 'Gross', 'CPP', 'EI', 'Fed Tax', 'WCB', 'Net Pay', 'Status', 'ACTION'].map(h => (
                                    <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? [...Array(5)].map((_, i) => (
                                <tr key={i}>{[...Array(13)].map((_, j) => (
                                    <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-lg animate-pulse" /></td>
                                ))}</tr>
                            )) : filtered.length === 0 ? (
                                <tr><td colSpan="13" className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                        <DollarSign size={48} className="opacity-30" />
                                        <p className="font-bold uppercase tracking-widest text-[11px]">No payroll records found</p>
                                        <p className="text-[11px] text-slate-400">No approved time logs found for this period.</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map(row => (
                                <tr key={row.userId} className={`hover:bg-slate-50/50 transition-colors group ${selected.includes(row.userId) ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-8 py-5">
                                        <input type="checkbox" checked={selected.includes(row.userId)} onChange={() => toggleRow(row.userId)}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                {(row.name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-tight">{row.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{(row.totalHours || 0).toFixed(1)}h worked</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{row.role}</span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-900">{(row.totalHours || 0).toFixed(1)}h</td>
                                    <td className="px-6 py-5 font-bold text-slate-500">${row.rate}</td>
                                    <td className="px-6 py-5 font-black text-slate-900">${(row.grossPay || 0).toLocaleString()}</td>
                                    <td className="px-6 py-5 text-red-400 font-bold">-${(row.cpp || 0).toFixed(2)}</td>
                                    <td className="px-6 py-5 text-red-400 font-bold">-${(row.ei || 0).toFixed(2)}</td>
                                    <td className="px-6 py-5 text-red-400 font-bold">-${(row.federalTax || 0).toFixed(2)}</td>
                                    <td className="px-6 py-5 text-orange-400 font-bold">${(row.wcb || 0).toFixed(2)}*</td>
                                    <td className="px-6 py-5"><span className="font-black text-emerald-600 text-base">${(row.netPay || 0).toLocaleString()}</span></td>
                                    <td className="px-6 py-5"><StatusBadge status={row.status || 'pending'} /></td>
                                    {/* ── ACTION Column ── */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1">
                                            {/* View detail */}
                                            <button
                                                title="View time log breakdown"
                                                onClick={() => handleView(row)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {/* Download slip */}
                                            <button
                                                title="Download / Print payslip"
                                                onClick={() => handleDownload(row)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            >
                                                <Download size={16} />
                                            </button>
                                            {/* Quick pay single */}
                                            <button
                                                title="Mark as paid"
                                                onClick={() => { setSelected([row.userId]); setStep(1); setModal(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
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
                                    <td className="px-6 py-5 font-black text-red-400">-${totCPP.toFixed(2)}</td>
                                    <td className="px-6 py-5 font-black text-red-400">-${totEI.toFixed(2)}</td>
                                    <td className="px-6 py-5 font-black text-red-400">-${totTax.toFixed(2)}</td>
                                    <td className="px-6 py-5 font-black text-orange-400">${totWCB.toFixed(2)}</td>
                                    <td className="px-6 py-5 font-black text-emerald-400 text-base">${totNet.toLocaleString()}</td>
                                    <td colSpan="2" />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* Detail Modal                                                       */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            {detailModal && detailRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal header */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg">
                                        {(detailRecord.name || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{detailRecord.name}</h2>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{detailRecord.role}</span>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xs font-bold mt-3 uppercase tracking-widest">Time Log Breakdown</p>
                            </div>
                            <button onClick={() => setDetailModal(false)} className="p-2 hover:bg-slate-700 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary chips */}
                        <div className="flex gap-3 px-8 pt-6 flex-wrap">
                            {[
                                { label: 'Gross Pay', value: `$${(detailRecord.grossPay || 0).toFixed(2)}` },
                                { label: 'Net Pay', value: `$${(detailRecord.netPay || 0).toFixed(2)}`, green: true },
                                { label: 'Total Hours', value: `${(detailRecord.totalHours || 0).toFixed(2)}h` },
                                { label: 'Rate', value: `$${detailRecord.rate}/hr` },
                            ].map(c => (
                                <div key={c.label} className={`flex-1 min-w-[100px] rounded-2xl p-4 ${c.green ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                                    <p className={`font-black text-lg ${c.green ? 'text-emerald-600' : 'text-slate-900'}`}>{c.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Deductions */}
                        <div className="px-8 pt-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Deductions</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: 'CPP', value: detailRecord.cpp },
                                    { label: 'EI', value: detailRecord.ei },
                                    { label: 'Fed Tax', value: detailRecord.federalTax },
                                    { label: 'WCB*', value: detailRecord.wcb },
                                ].map(d => (
                                    <div key={d.label} className="bg-red-50 rounded-2xl p-3 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">{d.label}</p>
                                        <p className="font-black text-red-600">-${(d.value || 0).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contributing Logs */}
                        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Contributing Time Logs</p>
                            {detailLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : detailLogs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <Clock size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-bold text-sm">No approved time logs found for this period.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {detailLogs.map((log, idx) => (
                                        <div key={log._id || idx} className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-xl"><Calendar size={14} className="text-blue-500" /></div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">
                                                        {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 ml-2">
                                                    <Briefcase size={12} className="text-slate-400" />
                                                    <span className="text-[11px] font-bold text-slate-500">{log.job}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">{log.hours}h</p>
                                                <p className="text-[11px] font-bold text-emerald-600">${log.amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="px-8 pb-8 flex gap-3">
                            <button onClick={() => setDetailModal(false)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-tight transition-all">
                                Close
                            </button>
                            <button onClick={() => { setDetailModal(false); handleDownload(detailRecord); }}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                <Download size={16} /> Download Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* Run Payroll Modal                                                  */}
            {/* ─────────────────────────────────────────────────────────────────── */}
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
                                            { l: 'Employees', v: `${selected.length > 0 ? selected.length : rows.length} crew members` },
                                            { l: 'Total Hours', v: `${totHours.toFixed(1)}h` },
                                            { l: 'Gross Pay', v: `$${totGross.toLocaleString()}` },
                                            { l: 'CPP/EI/Tax', v: `-$${(totCPP + totEI + totTax).toLocaleString()}` },
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
                                    <h3 className="font-black text-slate-900 text-lg">Confirm &amp; Authorize</h3>
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4">
                                        <AlertCircle size={22} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-black text-orange-800 text-sm">This action is irreversible</p>
                                            <p className="text-orange-600 text-xs font-bold mt-1">Funds will be disbursed to {selected.length > 0 ? selected.length : rows.length} employees. Total: <strong>${totNet.toLocaleString()}</strong></p>
                                        </div>
                                    </div>
                                    {/* Employees being paid */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {(selected.length > 0 ? rows.filter(r => selected.includes(r.userId)) : rows).map(r => (
                                            <div key={r.userId} className="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">{(r.name || '?').charAt(0)}</div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{r.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{r.role}</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-emerald-600">${(r.netPay || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {step === 3 && (
                                <div className="text-center py-2">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                                        <CheckCircle size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-xl mb-1">Payroll Submitted!</h3>
                                    <p className="text-slate-500 font-bold text-sm mb-4">Status updated to <span className="text-emerald-600 font-black">PAID</span> for {selected.length > 0 ? selected.length : rows.length} employees.</p>
                                    {/* Paid employees list */}
                                    <div className="space-y-2 max-h-36 overflow-y-auto text-left mb-4">
                                        {(selected.length > 0 ? rows.filter(r => selected.includes(r.userId)) : rows).map(r => (
                                            <div key={r.userId} className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5">
                                                <span className="font-black text-slate-900 text-sm">{r.name}</span>
                                                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                                                    <CheckCircle size={12} /> ${(r.netPay || 0).toFixed(2)} Paid
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2">
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
                                        <button
                                            onClick={() => step === 1 ? setStep(2) : handleRunPayroll()}
                                            disabled={submitting}
                                            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-tight transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                                            {submitting ? 'Processing...' : step === 2 ? <><Send size={16} /> Authorize</> : <><ChevronRight size={16} /> Continue</>}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { setModal(false); setStep(1); setSelected([]); }}
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
