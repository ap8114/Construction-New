import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
    LayoutDashboard, 
    FileText, 
    Package, 
    HardHat, 
    Truck, 
    Users, 
    ChevronDown, 
    ChevronRight, 
    DollarSign, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Plus,
    Minus,
    ArrowUpRight,
    Search,
    Filter,
    Download,
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    Calendar,
    Paperclip
} from 'lucide-react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/images/Logo.png';

const ProjectIntelligence = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [expandedTasks, setExpandedTasks] = useState({});

    // Fetch list of projects for the dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                const projectsData = Array.isArray(res.data) ? res.data : (res.data?.projects || []);
                setProjects(projectsData);
                if (projectsData.length > 0) {
                    setSelectedProjectId(projectsData[0]._id);
                }
            } catch (err) {
                console.error("Error fetching projects", err);
                setProjects([]);
            }
        };
        fetchProjects();
    }, []);

    // Fetch the detailed intelligence report
    useEffect(() => {
        if (!selectedProjectId) return;
        
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/reports/detailed/${selectedProjectId}`);
                setReportData(res.data);
            } catch (err) {
                console.error("Error fetching report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [selectedProjectId]);

    const toggleJob = (jobId) => {
        setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    };

    const toggleTask = (taskId) => {
        setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const handleDownloadJobPDF = (job) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const now = new Date().toLocaleDateString();
        const pageWidth = doc.internal.pageSize.width;

        // Header Background Bar
        doc.setFillColor(30, 58, 138); // Navy Blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Branded Header
        const img = new Image();
        img.src = logo;
        doc.addImage(img, 'PNG', 15, 8, 22, 22);
        
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('JOB INTELLIGENCE REPORT', 45, 18);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`KAAL Construction Management | System Generated: ${now}`, 45, 25);
        doc.text(`Project: ${project.name || 'N/A'}`, 45, 30);

        // Job Details Title
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.text(job.jobName?.toUpperCase() || 'UNTITLED JOB', 15, 55);
        doc.line(15, 58, 195, 58);

        // Summary Info Cards (Manual positioning)
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('CURRENT STATUS', 15, 65);
        doc.text('DATE TIMELINE', 80, 65);
        doc.text('TOTAL FINANCIAL OUTLAY', 145, 65);

        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text((job.status || 'Active').toUpperCase(), 15, 71);
        doc.text(`${job.startDate ? new Date(job.startDate).toLocaleDateString() : 'TBD'} - ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Ongoing'}`, 80, 71);
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${parseFloat(job.financials?.total || 0).toLocaleString()}`, 145, 71);

        let currentY = 82;
        if (job.description) {
            doc.setFontSize(11);
            doc.setTextColor(30, 58, 138);
            doc.setFont('helvetica', 'bold');
            doc.text('JOB SCOPE & DESCRIPTION', 15, currentY);
            
            doc.setFontSize(9);
            doc.setTextColor(70, 70, 70);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(job.description, 180);
            doc.text(splitNotes, 15, currentY + 6);
            currentY += (splitNotes.length * 5) + 12;
        }

        if (job.notes && job.notes.length > 0) {
            doc.setFontSize(11);
            doc.setTextColor(30, 58, 138);
            doc.setFont('helvetica', 'bold');
            doc.text('SITE REMARKS & COMMUNICATION', 15, currentY);
            currentY += 6;

            job.notes.forEach(note => {
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`${note.author} - ${new Date(note.date).toLocaleDateString()}`, 17, currentY);
                currentY += 4;
                
                doc.setFontSize(9);
                doc.setTextColor(80);
                doc.setFont('helvetica', 'normal');
                const splitNote = doc.splitTextToSize(`"${note.content}"`, 175);
                doc.text(splitNote, 17, currentY);
                currentY += (splitNote.length * 5) + 6;
                
                if (currentY > 270) { doc.addPage(); currentY = 20; }
            });
            currentY += 8;
        }

        // Section: FINANCIAL BREAKDOWN
        doc.setFontSize(12);
        doc.setTextColor(30, 58, 138);
        doc.text('FINANCIAL COST BREAKDOWN', 15, currentY);

        autoTable(doc, {
            startY: currentY + 3,
            head: [['Financial Dimension', 'Amount (USD)', 'Weightage (%)']],
            body: [
                ['Worker Labor Cost', `$ ${parseFloat(job.financials?.workerCost || 0).toLocaleString()}`, `${(job.financials?.workerCost / (job.financials?.total || 1) * 100 || 0).toFixed(1)}%`],
                ['Material Consumption', `$ ${parseFloat(job.financials?.materialCost || 0).toLocaleString()}`, `${(job.financials?.materialCost / (job.financials?.total || 1) * 100 || 0).toFixed(1)}%`],
                ['Equipment Usage', `$ ${parseFloat(job.financials?.equipmentCost || 0).toLocaleString()}`, `${(job.financials?.equipmentCost / (job.financials?.total || 1) * 100 || 0).toFixed(1)}%`],
                ['Subcontractor Cost', `$ ${parseFloat(job.financials?.subcontractorCost || 0).toLocaleString()}`, `${(job.financials?.subcontractorCost / (job.financials?.total || 1) * 100 || 0).toFixed(1)}%`],
                [{ content: 'TOTAL PROJECT EXPENDITURE', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: `$ ${parseFloat(job.financials?.total || 0).toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, '100%']
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: 50 },
            margin: { left: 15, right: 15 }
        });

        // Section: LABOR UTILIZATION
        if (job.workers?.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(30, 58, 138);
            doc.text('LABOR & PERSONNEL UTILIZATION', 15, doc.lastAutoTable.finalY + 15);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 18,
                head: [['Personnel Name', 'Role', 'Total Hours', 'Incurred Cost (USD)']],
                body: job.workers.map(w => [w.name, w.role, `${w.totalHours}h`, `$ ${parseFloat(w.cost || 0).toLocaleString()}`]),
                headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 }, // slate-600
                bodyStyles: { fontSize: 8 }
            });
        }

        // Section: MATERIAL CONSUMPTION
        if (job.materials?.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(30, 58, 138);
            doc.text('MATERIAL PROCUREMENT & CONSUMPTION', 15, doc.lastAutoTable.finalY + 12);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                head: [['Material / Item Description', 'PO Number', 'Quantity', 'Incurred Cost (USD)']],
                body: job.materials.map(m => [m.itemName, m.poNumber || 'N/A', m.quantity, `$ ${parseFloat(m.cost || 0).toLocaleString()}`]),
                headStyles: { fillColor: [180, 83, 9], textColor: 255, fontSize: 9 }, // amber-700
                bodyStyles: { fontSize: 8 }
            });
        }

        // Section: EQUIPMENT USAGE
        if (job.equipment?.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(30, 58, 138);
            doc.text('EQUIPMENT & TOOL UTILIZATION', 15, doc.lastAutoTable.finalY + 12);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                head: [['Equipment Name', 'Operating Hours', 'Incurred Cost (USD)']],
                body: job.equipment.map(e => [e.name, `${e.hoursUsed}h`, `$ ${parseFloat(e.cost || 0).toLocaleString()}`]),
                headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9 }, // violet-600
                bodyStyles: { fontSize: 8 }
            });
        }

        // Section: TASK INTELLIGENCE TREE
        if (job.tasks?.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(30, 58, 138);
            doc.text('TASK EXECUTION & PROGRESS TREE', 15, doc.lastAutoTable.finalY + 12);

            const taskData = [];
            job.tasks.forEach(task => {
                taskData.push([task.title, task.status.toUpperCase(), task.assignedTo?.fullName || 'Unassigned', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP']);
                if (task.subtasks) {
                    task.subtasks.forEach(st => {
                        taskData.push([`  ➥ ${st.title} (Sub-unit)`, st.status.toUpperCase(), st.assignedTo?.fullName || 'Unassigned', '-']);
                    });
                }
            });

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                head: [['Task Description', 'Status', 'Personnel', 'Deadline']],
                body: taskData,
                headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 9 },
                bodyStyles: { fontSize: 8 }
            });
        }

        // Footer
        const finalY = doc.lastAutoTable.finalY + 20;
        if (finalY < 270) {
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('This is a computer-generated audit report. All financial data is calculated based on approved time-logs and purchase orders.', 15, 280);
            doc.text(`${now} | Page 1 of 1`, pageWidth - 40, 280);
        }

        doc.save(`${(job.jobName || 'Job').replace(/\s+/g, '_')}_Analytics.pdf`);
    };

    if (!reportData && loading) return <Loader />;

    const { project, jobs } = reportData || { project: {}, jobs: [] };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-600 rounded-xl">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Project Intelligence Dashboard</h1>
                    </div>
                    <p className="text-slate-600 font-bold text-sm flex items-center gap-2">
                        Comprehensive end-to-end analytics for <span className="text-blue-600 font-black">{project.name || 'Select Project'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 appearance-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-w-[240px]"
                        >
                            {Array.isArray(projects) && projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>

                    <button 
                        onClick={() => window.print()}
                        className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : reportData ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* ── LEVEL 1: PROJECT SUMMARY ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <MetricCard 
                            label="Overall Progress" 
                            value={`${((project.completedTasks / project.totalTasks) * 100).toFixed(0)}%`} 
                            subtext={`${project.completedTasks} of ${project.totalTasks} Tasks Done`}
                            icon={CheckCircle}
                            color="text-emerald-600"
                            bgColor="bg-emerald-50"
                        />
                        <MetricCard 
                            label="Total Spend" 
                            value={`$${parseFloat(project.totalCost || 0).toLocaleString()}`} 
                            subtext="Accumulated Project Costs"
                            icon={DollarSign}
                            color="text-blue-600"
                            bgColor="bg-blue-50"
                        />
                        <MetricCard 
                            label="Labour Intel" 
                            value={`${project.totalHours}h`} 
                            subtext={`Across ${project.totalWorkers} Workers`}
                            icon={Users}
                            color="text-violet-600"
                            bgColor="bg-violet-50"
                        />
                    </div>

                    {/* Chart section removed as per client request */}

                    {/* ── LEVEL 2: JOB-WISE REPORTS ── */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                                <Layers size={20} className="text-blue-600" /> Job-Wise Detailed Report
                            </h2>
                            <span className="bg-slate-200/50 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {jobs.length} Active Jobs
                            </span>
                        </div>

                        {jobs.map(job => (
                            <JobReportCard 
                                key={job._id}
                                job={job}
                                isExpanded={expandedJobs[job._id]}
                                onToggle={() => toggleJob(job._id)}
                                onDownload={() => handleDownloadJobPDF(job)}
                                expandedTasks={expandedTasks}
                                onToggleTask={toggleTask}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-200 border-dashed">
                    <AlertCircle size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest">Select a project to generate report</p>
                </div>
            )}
        </div>
    );
};

// ─── HELPER COMPONENTS ───

const MetricCard = ({ label, value, subtext, icon: Icon, color, bgColor }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 ${bgColor} rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <ArrowUpRight size={18} className="text-slate-300" />
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h4 className={`text-2xl font-black ${color} tracking-tight mb-1`}>{value}</h4>
        <p className="text-slate-500 font-bold text-xs">{subtext}</p>
    </div>
);

const JobReportCard = ({ job, isExpanded, onToggle, onDownload, expandedTasks, onToggleTask }) => (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-blue-500/20 shadow-xl' : ''}`}>
        {/* Job Header */}
        <div 
            onClick={onToggle}
            className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <HardHat size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{job.jobName}</h3>
                    <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            job.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            job.status === 'active' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            'bg-amber-50 border-amber-100 text-amber-600'
                        }`}>
                            {job.status}
                        </span>
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(job.startDate).toLocaleDateString()} \u2014 {job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Active'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:gap-10">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Total Job Cost</p>
                    <p className="text-base font-black text-slate-900">
                        ${parseFloat(job.totalCost || 0).toLocaleString()}
                    </p>
                </div>

                <div className="min-w-[120px]">
                    <div className="flex items-center justify-between mb-1.5">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                         <p className="text-[10px] font-black text-blue-600">{job.progress}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${job.progress}%` }} />
                    </div>
                </div>

                <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDownload();
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-all border border-slate-100 flex items-center justify-center group/btn"
                    title="Download PDF"
                >
                    <Download size={18} />
                </button>
            </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                >
                    <div className="p-8 space-y-12">
                        {/* Summary metrics cards removed as per client request */}

                        {/* Job Notes / Timeline Updates Section */}
                        {(job.description || (job.notes && job.notes.length > 0)) && (
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-2">
                                    <FileText size={14} className="text-blue-600" /> Job Intelligence Notes & Communication
                                </h4>
                                
                                {job.description && (
                                    <div className="space-y-2 pb-6 border-b border-slate-200/50">
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Job Scope / Base Description</p>
                                        <p className="text-sm text-slate-600 leading-relaxed font-semibold">{job.description}</p>
                                    </div>
                                )}

                                {job.notes && job.notes.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent Updates & Site Remarks</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {job.notes.map((note, i) => (
                                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-[10px] font-black text-slate-900">{note.author}</p>
                                                        <p className="text-[9px] font-bold text-slate-300">{new Date(note.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-3">"{note.content}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-8">
                            {/* Worker Time Tracking */}
                            <SectionContainer title="Worker Time Tracking" icon={Users}>
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                                                <th className="pb-3">Worker / Role</th>
                                                <th className="pb-3 text-right">Hours</th>
                                                <th className="pb-3 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {job.workers.map((worker, i) => (
                                                <tr key={i} className="text-sm">
                                                    <td className="py-4">
                                                        <p className="font-black text-slate-800 text-xs leading-none mb-1">{worker.name}</p>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{worker.role}</span>
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-slate-600 text-xs">{worker.totalHours}h</td>
                                                    <td className="py-4 text-right font-black text-blue-600 text-xs">${parseFloat(worker.cost || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {job.workers.length === 0 && <EmptyTableRow colSpan={3} text="No workers logged hours" />}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionContainer>
                        </div>

                        {/* Material CONSUMPTION */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <SectionContainer title="Material Consumption" icon={Package}>
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                                                <th className="pb-3">Material / PO</th>
                                                <th className="pb-3 text-right">Qty</th>
                                                <th className="pb-3 text-right">Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {job.materials.map((mat, i) => (
                                                <tr key={i} className="text-sm">
                                                    <td className="py-4">
                                                        <p className="font-black text-slate-800 text-xs">{mat.itemName}</p>
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase">PO: {mat.poNumber}</span>
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-slate-600 text-xs">{mat.quantity}</td>
                                                    <td className="py-4 text-right font-black text-amber-600 text-xs">${parseFloat(mat.cost || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {job.materials.length === 0 && <EmptyTableRow colSpan={3} text="No material logs available" />}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionContainer>

                            {/* Equipment USAGE */}
                            <SectionContainer title="Equipment Usage" icon={Truck}>
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                                                <th className="pb-3">Equipment</th>
                                                <th className="pb-3 text-right">Hours</th>
                                                <th className="pb-3 text-right">Incurred Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {job.equipment.map((eq, i) => (
                                                <tr key={i} className="text-sm">
                                                    <td className="py-4 font-black text-slate-800 text-xs">{eq.name}</td>
                                                    <td className="py-4 text-right font-bold text-slate-600 text-xs">{eq.hoursUsed}h</td>
                                                    <td className="py-4 text-right font-black text-violet-600 text-xs">${parseFloat(eq.cost || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {job.equipment.length === 0 && <EmptyTableRow colSpan={3} text="No equipment usage logged" />}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionContainer>
                        </div>

                        {/* SUB-CONTRACTOR WORK */}
                        {job.subcontractors.length > 0 && (
                            <SectionContainer title="Subcontractor Work" icon={Users}>
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                                                <th className="pb-3">Subcontractor Name</th>
                                                <th className="pb-3">Description</th>
                                                <th className="pb-3 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {job.subcontractors.map((sub, i) => (
                                                <tr key={i} className="text-sm">
                                                    <td className="py-4 font-black text-slate-800 text-xs">{sub.name}</td>
                                                    <td className="py-4 text-slate-500 font-bold text-[11px]">{sub.work}</td>
                                                    <td className="py-4 text-right font-black text-emerald-600 text-xs">${parseFloat(sub.cost || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionContainer>
                        )}

                        {/* TASK TREE (CRITICAL 🔥) */}
                        <SectionContainer title="Job Task & Subtask Intelligence Tree" icon={Layers}>
                            <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/20">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-100/80">
                                        <tr className="text-[10px] font-black uppercase text-slate-700">
                                            <th className="px-6 py-4 border-b border-slate-200">Task Name & Structure</th>
                                            <th className="px-6 py-4 border-b border-slate-200">Status</th>
                                            <th className="px-6 py-4 border-b border-slate-200">Assigned To</th>
                                            <th className="px-6 py-4 text-right border-b border-slate-200">Date Line</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {job.tasks.map(task => (
                                            <TaskRow 
                                                key={task._id} 
                                                task={task} 
                                                isExpanded={expandedTasks[task._id]} 
                                                onToggle={() => onToggleTask(task._id)} 
                                            />
                                        ))}
                                        {job.tasks.length === 0 && <EmptyTableRow colSpan={4} text="No tasks found for this job" />}
                                    </tbody>
                                </table>
                            </div>
                        </SectionContainer>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const TaskRow = ({ task, isExpanded, onToggle }) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    
    return (
        <React.Fragment>
            <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-white'}`}>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        {hasSubtasks ? (
                            <button onClick={onToggle} className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors">
                                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}
                        <span className="text-xs font-black text-slate-800">{task.title}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                            {task.assignedTo?.fullName?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">
                            {task.assignedTo?.fullName || 'Unassigned'}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <p className="text-[10px] font-black text-slate-600">DUE</p>
                    <p className="text-[11px] font-bold text-slate-900">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}</p>
                </td>
            </tr>
            {isExpanded && hasSubtasks && task.subtasks.map(st => (
                <tr key={st._id} className="bg-slate-50/50">
                    <td className="px-8 py-3 pl-16">
                        <div className="flex items-center gap-2">
                            <ChevronRight size={12} className="text-slate-300" />
                            <span className="text-xs font-bold text-slate-500">{st.title}</span>
                        </div>
                    </td>
                    <td className="px-6 py-3">
                        <StatusBadge status={st.status} isSubtask />
                    </td>
                    <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                {st.assignedTo?.fullName?.charAt(0) || '?'}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">
                                {st.assignedTo?.fullName || 'Unassigned'}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                        <span className="text-[10px] font-bold text-slate-400">{st.dueDate ? new Date(st.dueDate).toLocaleDateString() : '--'}</span>
                    </td>
                </tr>
            ))}
        </React.Fragment>
    );
};

const StatusBadge = ({ status, isSubtask = false }) => {
    const colors = {
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
        active: 'bg-blue-50 text-blue-600 border-blue-100',
        todo: 'bg-slate-50 text-slate-400 border-slate-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    
    return (
        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${colors[status] || colors.todo}`}>
            {status}
        </span>
    );
};

const SectionContainer = ({ title, icon: Icon, children }) => (
    <div className="flex flex-col">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-4 flex items-center gap-2">
            <Icon size={16} className="text-blue-600" /> {title}
        </h4>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex-1">
            {children}
        </div>
    </div>
);

const JobSmallMetric = ({ label, value, total, unit, icon: Icon, color }) => (
    <div className={`bg-${color}-50/50 border border-${color}-100 p-4 rounded-2xl`}>
        <div className="flex justify-between items-center mb-1">
            <Icon size={16} className={`text-${color}-600`} />
            <span className={`text-[10px] font-black text-${color}-600 uppercase tracking-widest`}>{label}</span>
        </div>
        <p className={`text-xl font-black text-slate-800`}>
            {value}{unit || ''} {total !== undefined && <span className="text-slate-300 text-xs font-bold">/ {total}</span>}
        </p>
    </div>
);

const FinancialRow = ({ label, value, percentage, color }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600">{label}</span>
            <span className="font-black text-slate-900">${parseFloat(value || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-400 w-8">{percentage}%</span>
        </div>
    </div>
);

const EmptyTableRow = ({ colSpan, text }) => (
    <tr>
        <td colSpan={colSpan} className="py-12 text-center text-slate-400 font-bold italic text-xs">
            {text}
        </td>
    </tr>
);

const Loader = () => (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Computing Intelligence Report...</p>
    </div>
);

export default ProjectIntelligence;
