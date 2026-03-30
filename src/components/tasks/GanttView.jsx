import React, { useState, useEffect, useMemo } from 'react';
import { Layers, ChevronRight, Share2, CornerDownRight, UserCheck } from 'lucide-react';

const GanttView = ({ tasks, onTaskUpdate, onTaskClick }) => {
    const [viewMode, setViewMode] = useState('month');
    const [hoveredBar, setHoveredBar] = useState(null);
    const [dragState, setDragState] = useState(null); // { taskId, type: 'move'|'resize-left'|'resize-right', startX, deltaDays }

    const today = new Date();
    const currentMonthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days = useMemo(() => {
        const dayCount = viewMode === 'month' ? 30 : 7;
        return Array.from({ length: dayCount }).map((_, i) => {
            const d = new Date(today);
            if (viewMode === 'week') {
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
                d.setDate(diff + i);
            } else {
                d.setDate(i + 1);
            }
            return d;
        });
    }, [viewMode]);

    const { scheduledTasks, rows } = useMemo(() => {
        const scheduled = tasks.filter(t => t.startDate);
        const flattenedRows = [];
        scheduled.forEach(task => {
            flattenedRows.push({ ...task, isSubTask: false });
            (task.subTasks || []).forEach(st => {
                if (st.startDate) {
                    flattenedRows.push({ ...st, isSubTask: true, parentId: task.id || task._id });
                }
            });
        });
        return { scheduledTasks: scheduled, rows: flattenedRows };
    }, [tasks]);

    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - dragState.startX;
            const dayWidth = 52;
            const deltaDays = Math.round(deltaX / dayWidth);

            setDragState(prev => ({ ...prev, deltaDays }));
        };

        const handleMouseUp = () => {
            if (dragState.deltaDays !== 0) {
                const rowObj = rows.find(r => (r._id || r.id) === dragState.taskId);
                if (rowObj) {
                    const startIdx = days.findIndex(d => d.toDateString() === new Date(rowObj.startDate).toDateString());
                    const endIdx = days.findIndex(d => d.toDateString() === new Date(rowObj.endDate || rowObj.dueDate || rowObj.startDate).toDateString());

                    let newStartIdx = startIdx;
                    let newEndIdx = endIdx;

                    if (dragState.type === 'move') {
                        newStartIdx += dragState.deltaDays;
                        newEndIdx += dragState.deltaDays;
                    } else if (dragState.type === 'resize-left') {
                        newStartIdx += dragState.deltaDays;
                    } else if (dragState.type === 'resize-right') {
                        newEndIdx += dragState.deltaDays;
                    }

                    // Ensure indices are within bounds and valid
                    newStartIdx = Math.max(0, Math.min(days.length - 1, newStartIdx));
                    newEndIdx = Math.max(newStartIdx, Math.min(days.length - 1, newEndIdx));

                    const newStart = new Date(days[newStartIdx]);
                    newStart.setHours(9, 0, 0, 0);
                    const newEnd = new Date(days[newEndIdx]);
                    newEnd.setHours(17, 0, 0, 0);

                    onTaskUpdate(dragState.taskId, { 
                        startDate: newStart.toISOString(), 
                        dueDate: newEnd.toISOString() 
                    }, rowObj.isSubTask);
                }
            }
            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, days, rows, onTaskUpdate]);

    const getStatusColor = (status, overdue) => {
        if (status === 'completed') return 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200/50';
        if (overdue) return 'bg-red-500 border-red-600 text-white shadow-red-200/50';
        if (status === 'in_progress') return 'bg-blue-500 border-blue-600 text-white shadow-blue-200/50';
        if (status === 'review') return 'bg-orange-400 border-orange-500 text-white shadow-orange-200/50';
        return 'bg-slate-400 border-slate-500 text-white shadow-slate-200/50';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-3xl border border-slate-200/60 shadow-md overflow-hidden animate-fade-in group">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-200/60 flex items-center justify-between bg-white shadow-sm relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                        <Share2 size={14} />
                    </div>
                    <div>
                        <h2 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-2">Project Gantt Chart</h2>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentMonthLabel}</span>
                    </div>
                </div>
                <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1 shadow-sm">
                    <button 
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Month
                    </button>
                    <button 
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Week
                    </button>
                </div>
            </div>

            {/* Gantt Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Task List Column */}
                <div className="w-64 border-r border-slate-200/60 bg-white flex flex-col shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.02)] z-10 relative">
                    <div className="h-[48px] border-b border-slate-200/60 bg-slate-50/80 flex items-center px-4 shrink-0 shadow-sm sticky top-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={13} className="text-slate-400" /> Task Structure
                        </span>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {rows.map((row) => (
                            <div 
                                key={row._id || row.id} 
                                onClick={() => onTaskClick && onTaskClick(row.isSubTask ? { ...row, _id: row._id || row.id } : row)}
                                className={`h-[56px] border-b border-slate-100 flex flex-col justify-center transition-colors relative group/row cursor-pointer ${row.isSubTask ? 'bg-slate-50/30 pl-10 pr-4' : 'bg-white px-4'}`}
                            >
                                {/* Row hover indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${row.isSubTask ? 'bg-blue-400' : 'bg-purple-500'}`} />

                                <div className="flex items-center gap-2">
                                    {row.isSubTask && <CornerDownRight size={12} className="text-slate-300" />}
                                    <span className={`text-[12px] font-black truncate leading-tight transition-colors ${row.isSubTask ? 'text-slate-600 group-hover/row:text-blue-600' : 'text-slate-800 group-hover/row:text-purple-700'}`}>
                                        {row.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                    {(row.assignedTo || Array.isArray(row.assignedTo)) && (
                                        <div className={`w-[14px] h-[14px] rounded-full flex items-center justify-center text-[7px] font-bold border ${row.isSubTask ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {(() => {
                                                const assigned = Array.isArray(row.assignedTo) ? row.assignedTo[0] : row.assignedTo;
                                                const name = assigned?.fullName || assigned?.name || row.jobName || 'A';
                                                return name.charAt(0).toUpperCase();
                                            })()}
                                        </div>
                                    )}
                                    <span className="text-[9px] font-bold text-slate-400 capitalize truncate leading-none">
                                        {(row.status || 'todo').replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 flex flex-col overflow-auto custom-scrollbar relative bg-slate-50/30">
                    {/* Header Dates */}
                    <div className="flex h-[48px] border-b border-slate-200/60 bg-white shrink-0 sticky top-0 z-30 shadow-sm">
                        {days.map((date, idx) => {
                            const isToday = date.toDateString() === today.toDateString();
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return (
                                <div key={idx} className={`w-[52px] shrink-0 border-r border-slate-100 flex flex-col items-center justify-center relative ${isWeekend ? 'bg-slate-50/80' : ''}`}>
                                    {isToday && <div className="absolute top-0 w-full h-[3px] bg-red-400" />}
                                    <span className={`text-[7px] font-black uppercase tracking-widest ${isToday ? 'text-red-500' : 'text-slate-400'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1)}
                                    </span>
                                    <span className={`text-[11px] font-black mt-0.5 ${isToday ? 'text-white bg-red-500 w-5 h-5 flex items-center justify-center rounded-md shadow-sm' : 'text-slate-700'}`}>
                                        {date.getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Gantt Body */}
                    <div className="relative min-w-max">
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none z-0">
                            {days.map((date, idx) => {
                                const isToday = date.toDateString() === today.toDateString();
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                    <div key={idx} className={`w-[52px] shrink-0 border-r border-slate-100 relative ${isWeekend ? 'bg-slate-50/80' : ''}`}>
                                        {isToday && <div className="absolute inset-y-0 left-1/2 w-px bg-red-200 drop-shadow-[0_0_2px_rgba(248,113,113,0.5)] -translate-x-1/2 z-0" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* SVG Overlay for Dependency Lines */}
                        <svg className="absolute inset-0 pointer-events-none z-5 w-full h-full min-w-max">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                                </marker>
                            </defs>
                            {rows.map(target => {
                                if (!target.dependencies?.length) return null;
                                const targetIdx = rows.findIndex(r => (r._id || r.id) === (target._id || target.id));
                                if (targetIdx === -1) return null;

                                return target.dependencies.map(depId => {
                                    const source = rows.find(r => (r._id || r.id) === depId);
                                    if (!source || !source.startDate) return null;
                                    const sourceIdx = rows.findIndex(r => (r._id || r.id) === depId);

                                    const sStart = days.findIndex(d => d.toDateString() === new Date(source.startDate).toDateString());
                                    const sEnd = days.findIndex(d => d.toDateString() === new Date(source.endDate || source.dueDate || source.startDate).toDateString());
                                    const tStart = days.findIndex(d => d.toDateString() === new Date(target.startDate).toDateString());

                                    if (sStart === -1 || tStart === -1) return null;

                                    const sDrag = dragState?.taskId === (source._id || source.id);
                                    const tDrag = dragState?.taskId === (target._id || target.id);
                                    
                                    const sEndIdx = (sEnd === -1 ? days.length - 1 : sEnd) + (sDrag && (dragState.type === 'move' || dragState.type === 'resize-right') ? dragState.deltaDays || 0 : 0);
                                    const tStartIdx = (tStart === -1 ? 0 : tStart) + (tDrag && (dragState.type === 'move' || dragState.type === 'resize-left') ? dragState.deltaDays || 0 : 0);

                                    const x1 = (sEndIdx + 1) * 52 - 4;
                                    const y1 = sourceIdx * 56 + 28;
                                    const x2 = tStartIdx * 52 + 4;
                                    const y2 = targetIdx * 56 + 28;

                                    return (
                                        <g key={`${source._id || source.id}-${target._id || target.id}`}>
                                            <path 
                                                d={`M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x1 + 10} ${y2} L ${x2} ${y2}`} 
                                                stroke="#cbd5e1" 
                                                strokeWidth="1.5" 
                                                fill="none" 
                                                markerEnd="url(#arrow)"
                                                className="transition-all duration-75"
                                            />
                                        </g>
                                    );
                                });
                            })}
                        </svg>

                        {/* Task Rows & Connector Lines */}
                        <div className="relative z-10 pt-0">
                            {rows.map((row, i) => {
                                if (!row.startDate) return null;
                                const tStart = new Date(row.startDate);
                                const tEnd = new Date(row.endDate || row.dueDate || row.startDate);
                                
                                // Find index in days array for positioning
                                const startIdx = days.findIndex(d => d.toDateString() === tStart.toDateString());
                                const endIdx = days.findIndex(d => d.toDateString() === tEnd.toDateString());
                                
                                if (startIdx === -1 && endIdx === -1) return null;

                                const displayStart = startIdx === -1 ? 0 : startIdx;
                                const displayEnd = endIdx === -1 ? days.length - 1 : endIdx;
                                const durationDays = Math.max(0.5, displayEnd - displayStart + 1);

                                const isOverdue = (row.endDate || row.dueDate) && new Date(row.endDate || row.dueDate) < new Date() && row.status !== 'completed';
                                const colorClass = row.isSubTask ? 'bg-blue-400 border-blue-500 shadow-blue-200/50' : getStatusColor(row.status, isOverdue);

                                return (
                                    <div key={row._id || row.id} className="h-[56px] border-b border-transparent flex items-center relative group/row hover:bg-slate-100/40 transition-colors w-full z-10">
                                        <div
                                            onMouseDown={(e) => {
                                                if (e.button !== 0) return;
                                                e.stopPropagation();
                                                setDragState({ 
                                                    taskId: row._id || row.id, 
                                                    type: 'move', 
                                                    startX: e.clientX, 
                                                    deltaDays: 0 
                                                });
                                            }}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredBar({
                                                    ...row,
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top - 10
                                                });
                                            }}
                                            onMouseLeave={() => setHoveredBar(null)}
                                            onClick={() => onTaskClick && onTaskClick(row.isSubTask ? { ...row, _id: row._id || row.id } : row)}
                                            className={`absolute h-[28px] rounded-lg border shadow-sm transition-all duration-75 cursor-grab active:cursor-grabbing z-20 flex items-center hover:ring-2 hover:ring-white/80 group/bar hover:shadow-lg ${colorClass} overflow-visible ${dragState?.taskId === (row._id || row.id) ? 'ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.4)] border-white scale-[1.01]' : ''}`}
                                            style={{ 
                                                left: `${(dragState?.taskId === (row._id || row.id) && (dragState.type === 'move' || dragState.type === 'resize-left') 
                                                    ? displayStart + (dragState.deltaDays || 0) 
                                                    : displayStart) * 52 + 4}px`, 
                                                width: `${(dragState?.taskId === (row._id || row.id) 
                                                    ? (dragState.type === 'move' ? durationDays : (dragState.type === 'resize-left' ? durationDays - (dragState.deltaDays || 0) : durationDays + (dragState.deltaDays || 0)))
                                                    : durationDays) * 52 - 8}px` 
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-lg" />
                                            
                                            {/* High-visibility drag edges */}
                                            {dragState?.taskId === (row._id || row.id) && (
                                                <>
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[2px_0_10px_rgba(255,255,255,1)] z-40 rounded-l-lg animate-pulse" />
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[-2px_0_10px_rgba(255,255,255,1)] z-40 rounded-r-lg animate-pulse" />
                                                </>
                                            )}
                                            
                                            {/* Resize Handle Left */}
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-30 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDragState({ taskId: row._id || row.id, type: 'resize-left', startX: e.clientX, deltaDays: 0 });
                                                }}
                                            >
                                                <div className="w-[1px] h-3 bg-white/60" />
                                            </div>

                                            <div className="px-3 flex items-center gap-1.5 w-full relative z-10 pointer-events-none">
                                                <span className="text-[10px] font-black text-white truncate drop-shadow-sm select-none break-all">
                                                    {row.title}
                                                </span>
                                            </div>

                                            {/* Resize Handle Right */}
                                            <div 
                                                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-30 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDragState({ taskId: row._id || row.id, type: 'resize-right', startX: e.clientX, deltaDays: 0 });
                                                }}
                                            >
                                                <div className="w-[1px] h-3 bg-white/60" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rich Details Popover */}
                    {hoveredBar && (
                        <div 
                            className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in duration-200"
                            style={{ 
                                left: `${hoveredBar.x}px`, 
                                top: `${hoveredBar.y}px`,
                                transform: 'translate(-50%, -100%)'
                            }}
                        >
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-white/10 min-w-[200px] backdrop-blur-xl bg-opacity-95">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                                            {hoveredBar.isSubTask ? 'Sub Task Details' : 'Gantt Task Details'}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${hoveredBar.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    </div>
                                    <h4 className="text-sm font-black leading-tight">{hoveredBar.title}</h4>
                                    <div className="h-px bg-white/10 my-1" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Project</p>
                                            <p className="text-[10px] font-black truncate">{hoveredBar.projectId?.name || 'Site'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Assignee</p>
                                            <div className="flex items-center gap-1">
                                                <UserCheck size={10} className="text-purple-400" />
                                                <p className="text-[10px] font-black">
                                                    {(Array.isArray(hoveredBar.assignedTo) ? hoveredBar.assignedTo[0]?.fullName : hoveredBar.assignedTo?.fullName) || 'Crew'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                            <p className="text-[10px] font-black capitalize">{(hoveredBar.status || 'todo').replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                                            <p className="text-[10px] font-black">{hoveredBar.progress || 0}%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttView;
