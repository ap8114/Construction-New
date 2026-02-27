import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import {
    X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
    Highlighter, MessageSquare, ArrowUpRight, Square,
    Pencil, Type, Save, Download, Maximize2,
    Trash2, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';

// Set up worker from CDN for better reliability in production
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const DrawingViewer = ({ drawing, version, onClose }) => {
    // PDF State
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(true);

    // Annotation State
    const [activeTool, setActiveTool] = useState(null); // 'highlight', 'arrow', 'box', 'text', 'comment'
    const [annotations, setAnnotations] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [showComments, setShowComments] = useState(true);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [exportProgress, setExportProgress] = useState(0);

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const renderTaskRef = useRef(null);

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                const url = getServerUrl(version.fileUrl);
                const loadingTask = pdfjsLib.getDocument(url);
                const pdfInstance = await loadingTask.promise;
                setPdf(pdfInstance);
                setNumPages(pdfInstance.numPages);

                // Fetch existing annotations
                const annRes = await api.get(`/drawings/${drawing._id}/annotations`, {
                    params: { versionId: version._id }
                });
                setAnnotations(annRes.data);
            } catch (err) {
                console.error('Error loading PDF:', err);
                alert(`Failed to load PDF: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (version?.fileUrl) {
            loadPdf();
        }
    }, [drawing._id, version]);

    // Render Page
    useEffect(() => {
        if (!pdf) return;

        const renderPage = async () => {
            const page = await pdf.getPage(currentPage);
            const viewport = page.getViewport({ scale: zoom });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Sync overlay size
            if (overlayRef.current) {
                overlayRef.current.style.width = `${viewport.width}px`;
                overlayRef.current.style.height = `${viewport.height}px`;
            }

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            renderTaskRef.current = page.render(renderContext);
            try {
                await renderTaskRef.current.promise;
            } catch (err) {
                if (err.name !== 'RenderingCancelledException') {
                    console.error('Render error:', err);
                }
            }
        };

        renderPage();
    }, [pdf, currentPage, zoom]);

    // Coordinate mapping helper
    const getCoordinates = (e) => {
        const rect = overlayRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    };

    // Drawing Handlers
    const handleMouseDown = (e) => {
        if (!activeTool || activeTool === 'comment') return;

        const coords = getCoordinates(e);
        setIsDrawing(true);
        setCurrentAnnotation({
            type: activeTool,
            pageNumber: currentPage,
            coordinates: { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y },
            drawingId: drawing._id,
            versionId: version._id
        });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !currentAnnotation) return;

        const coords = getCoordinates(e);
        setCurrentAnnotation(prev => ({
            ...prev,
            coordinates: { ...prev.coordinates, x2: coords.x, y2: coords.y }
        }));
    };

    const handleMouseUp = async () => {
        if (!isDrawing || !currentAnnotation) return;
        setIsDrawing(false);

        // Don't save tiny annotations
        const { x1, y1, x2, y2 } = currentAnnotation.coordinates;
        if (Math.abs(x2 - x1) < 2 && Math.abs(y2 - y1) < 2) {
            setCurrentAnnotation(null);
            return;
        }

        if (activeTool === 'text') {
            const content = prompt('Enter your note:');
            if (!content) {
                setCurrentAnnotation(null);
                return;
            }
            saveAnnotation({ ...currentAnnotation, content });
        } else {
            saveAnnotation(currentAnnotation);
        }

        setCurrentAnnotation(null);
    };

    const handleCommentClick = (e) => {
        if (activeTool !== 'comment') return;
        const coords = getCoordinates(e);
        const content = prompt('Enter your comment:');
        if (content) {
            saveAnnotation({
                drawingId: drawing._id,
                versionId: version._id,
                type: 'comment',
                pageNumber: currentPage,
                coordinates: { x: coords.x, y: coords.y },
                content
            });
        }
    };

    const saveAnnotation = async (data) => {
        try {
            const res = await api.post(`/drawings/${drawing._id}/annotations`, data);
            setAnnotations([...annotations, res.data]);
        } catch (err) {
            console.error('Error saving annotation:', err);
        }
    };

    const handleDeleteAnnotation = async (id, e) => {
        e?.stopPropagation();
        try {
            await api.delete(`/drawings/annotations/${id}`);
            setAnnotations(annotations.filter(a => a._id !== id));
            if (selectedAnnotationId === id) setSelectedAnnotationId(null);
        } catch (err) {
            console.error('Error deleting annotation:', err);
        }
    };
    const handleExportPDF = async () => {
        if (!pdf) return;
        try {
            setLoading(true);
            setExportProgress(1); // Start at 1 to show activity

            // Dynamic scale adjustment for high-page count drawings
            const exportScale = numPages > 30 ? 1.0 : (numPages > 10 ? 1.2 : 1.5);

            const firstPage = await pdf.getPage(1);
            const firstViewport = firstPage.getViewport({ scale: exportScale });

            const doc = new jsPDF({
                orientation: firstViewport.width > firstViewport.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [firstViewport.width, firstViewport.height],
                compress: true // Enable compression
            });

            // Process one page at a time to keep UI responsive
            for (let i = 1; i <= numPages; i++) {
                setExportProgress(Math.round((i / numPages) * 100));

                // Yield to main thread for UI updates
                await new Promise(resolve => setTimeout(resolve, 0));

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: exportScale });

                if (i > 1) {
                    doc.addPage([viewport.width, viewport.height],
                        viewport.width > viewport.height ? 'landscape' : 'portrait');
                }

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render page
                await page.render({
                    canvasContext: context,
                    viewport,
                    intent: 'print' // Use print intent for better reliability
                }).promise;

                // Draw annotations
                const pageAnns = annotations.filter(a => a.pageNumber === i);
                pageAnns.forEach(ann => {
                    const s = exportScale;
                    const { x1, y1, x2, y2, x, y } = ann.coordinates;
                    context.lineWidth = 2 * s;

                    if (ann.type === 'box') {
                        context.strokeStyle = '#3b82f6';
                        context.strokeRect(Math.min(x1, x2) * s, Math.min(y1, y2) * s, Math.abs(x2 - x1) * s, Math.abs(y2 - y1) * s);
                        context.fillStyle = 'rgba(59, 130, 246, 0.1)';
                        context.fillRect(Math.min(x1, x2) * s, Math.min(y1, y2) * s, Math.abs(x2 - x1) * s, Math.abs(y2 - y1) * s);
                    } else if (ann.type === 'highlight') {
                        context.fillStyle = 'rgba(234, 179, 8, 0.4)';
                        context.fillRect(Math.min(x1, x2) * s, Math.min(y1, y2) * s, Math.abs(x2 - x1) * s, Math.abs(y2 - y1) * s);
                    } else if (ann.type === 'arrow') {
                        context.strokeStyle = '#ef4444';
                        context.beginPath();
                        context.moveTo(x1 * s, y1 * s);
                        context.lineTo(x2 * s, y2 * s);
                        context.stroke();
                        const angle = Math.atan2((y2 - y1) * s, (x2 - x1) * s);
                        context.beginPath();
                        context.moveTo(x2 * s, y2 * s);
                        const arrowSize = 8 * s;
                        context.lineTo(x2 * s - arrowSize * Math.cos(angle - Math.PI / 6), y2 * s - arrowSize * Math.sin(angle - Math.PI / 6));
                        context.lineTo(x2 * s - arrowSize * Math.cos(angle + Math.PI / 6), y2 * s - arrowSize * Math.sin(angle + Math.PI / 6));
                        context.closePath();
                        context.fillStyle = '#ef4444';
                        context.fill();
                    } else if (ann.type === 'text' || ann.type === 'comment') {
                        context.fillStyle = '#3b82f6';
                        context.font = `bold ${12 * s}px Arial`;
                        const text = ann.content || 'Note';
                        context.fillText(text, (x || x1) * s, (y || y1) * s);
                    }
                });

                // Get image as JPEG (faster than PNG)
                const imgData = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed/memory
                doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST');

                // Force cleanup
                canvas.width = 0; canvas.height = 0;
            }

            doc.save(`${drawing.title}_reviewed_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error('Export error:', err);
            alert(`Failed to export PDF: ${err.message}. Try refreshing.`);
        } finally {
            setLoading(false);
            setExportProgress(0);
        }
    };

    const renderAnnotation = (ann) => {
        if (ann.pageNumber !== currentPage) return null;
        const isSelected = selectedAnnotationId === ann._id;
        const baseStyle = {
            position: 'absolute',
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
            zIndex: isSelected ? 30 : 20
        };

        const { x1, y1, x2, y2, x, y } = ann.coordinates;

        switch (ann.type) {
            case 'box':
                return (
                    <div
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        style={{
                            ...baseStyle,
                            left: `${Math.min(x1, x2) * zoom}px`,
                            top: `${Math.min(y1, y2) * zoom}px`,
                            width: `${Math.abs(x2 - x1) * zoom}px`,
                            height: `${Math.abs(y2 - y1) * zoom}px`,
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: `2px solid #3b82f6`
                        }}
                    />
                );
            case 'highlight':
                return (
                    <div
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        style={{
                            ...baseStyle,
                            left: `${Math.min(x1, x2) * zoom}px`,
                            top: `${Math.min(y1, y2) * zoom}px`,
                            width: `${Math.abs(x2 - x1) * zoom}px`,
                            height: `${Math.abs(y2 - y1) * zoom}px`,
                            background: 'rgba(234, 179, 8, 0.3)',
                            border: 'none'
                        }}
                    />
                );
            case 'arrow':
                return (
                    <svg
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        style={{
                            position: 'absolute',
                            left: 0, top: 0,
                            width: '100%', height: '100%',
                            overflow: 'visible',
                            pointerEvents: 'none'
                        }}
                    >
                        <defs>
                            <marker id={`arrowhead-${ann._id}`} markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                            </marker>
                        </defs>
                        <line
                            x1={x1 * zoom} y1={y1 * zoom}
                            x2={x2 * zoom} y2={y2 * zoom}
                            stroke="#ef4444" strokeWidth="2"
                            markerEnd={`url(#arrowhead-${ann._id})`}
                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        />
                    </svg>
                );
            case 'comment':
                return (
                    <div
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        className="group"
                        style={{
                            ...baseStyle,
                            left: `${x * zoom}px`,
                            top: `${y * zoom}px`,
                            transform: 'translate(-50%, -100%)',
                            border: 'none'
                        }}
                    >
                        <div className={`p-1.5 rounded-full shadow-lg border-2 ${isSelected ? 'bg-blue-600 border-white text-white' : 'bg-white border-blue-600 text-blue-600'} transition-all`}>
                            <MessageSquare size={16} />
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        style={{
                            ...baseStyle,
                            left: `${x1 * zoom}px`,
                            top: `${y1 * zoom}px`,
                            color: '#3b82f6',
                            fontWeight: 'bold',
                            fontSize: `${12 * zoom}px`,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {ann.content}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col animate-fade-in text-white overflow-hidden">
            {/* Toolbar */}
            <div className="h-16 bg-slate-800 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <X size={20} />
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                        <h2 className="text-sm font-bold truncate max-w-[200px]">{drawing.title}</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Version {version.versionNumber}.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                    {[
                        { id: 'highlight', icon: Highlighter, label: 'Highlight' },
                        { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
                        { id: 'box', icon: Square, label: 'Box' },
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'comment', icon: MessageSquare, label: 'Comment' },
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                            className={`p-2.5 rounded-lg transition flex items-center gap-2 group relative
                                ${activeTool === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`}
                            title={tool.label}
                        >
                            <tool.icon size={18} />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            alert('All changes saved to cloud.');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                    >
                        <Save size={16} /> Save Changes
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-blue-500/20"
                    >
                        <Download size={16} /> Export PDF
                    </button>

                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 hover:text-blue-400 transition"><ZoomOut size={16} /></button>
                        <span className="text-xs font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1 hover:text-blue-400 transition"><ZoomIn size={16} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-bold">{currentPage} / {numPages}</span>
                        <button
                            disabled={currentPage >= numPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* PDF Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-slate-950 flex justify-center p-12 custom-scrollbar relative"
                    onClick={handleCommentClick}
                >
                    <div className="relative shadow-2xl h-fit">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
                                <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                                    {exportProgress > 0 ? `Exporting: ${exportProgress}%` : 'Rendering PDF...'}
                                </span>
                                {exportProgress > 0 && (
                                    <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${exportProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <canvas ref={canvasRef} className="rounded-sm" />
                        <div
                            ref={overlayRef}
                            className={`absolute inset-0 z-40 ${activeTool ? 'cursor-crosshair' : 'cursor-default'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            {/* Render saved annotations */}
                            {annotations.map(ann => renderAnnotation(ann))}

                            {/* Render temporary drawing annotation */}
                            {currentAnnotation && currentAnnotation.pageNumber === currentPage && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${Math.min(currentAnnotation.coordinates.x1, currentAnnotation.coordinates.x2) * zoom}px`,
                                    top: `${Math.min(currentAnnotation.coordinates.y1, currentAnnotation.coordinates.y2) * zoom}px`,
                                    width: `${Math.abs(currentAnnotation.coordinates.x2 - currentAnnotation.coordinates.x1) * zoom}px`,
                                    height: `${Math.abs(currentAnnotation.coordinates.y2 - currentAnnotation.coordinates.y1) * zoom}px`,
                                    border: `2px dashed ${activeTool === 'highlight' ? '#eab308' : '#3b82f6'}`,
                                    background: activeTool === 'highlight' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                                }} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`w-80 bg-slate-800 border-l border-white/10 flex flex-col transition-all overflow-hidden ${showComments ? '' : 'w-0 border-l-0'}`}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Review Notes ({annotations.length})</span>
                        <button onClick={() => setShowComments(false)} className="text-slate-400 hover:text-white transition"><X size={16} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {annotations.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <MessageSquare className="mx-auto mb-2 opacity-20" size={32} />
                                <p className="text-xs font-bold uppercase tracking-widest">No markups yet</p>
                            </div>
                        ) : (
                            annotations.map(ann => (
                                <div
                                    key={ann._id}
                                    onClick={() => {
                                        setCurrentPage(ann.pageNumber);
                                        setSelectedAnnotationId(ann._id);
                                    }}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group
                                        ${selectedAnnotationId === ann._id ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' : 'bg-slate-900/30 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-100/10 flex items-center justify-center">
                                                {ann.type === 'highlight' && <Highlighter size={12} className="text-yellow-400" />}
                                                {ann.type === 'arrow' && <ArrowUpRight size={12} className="text-red-400" />}
                                                {ann.type === 'box' && <Square size={12} className="text-blue-400" />}
                                                {ann.type === 'comment' && <MessageSquare size={12} className="text-blue-400" />}
                                                {ann.type === 'text' && <Type size={12} className="text-blue-400" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {ann.pageNumber}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteAnnotation(ann._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-sm font-medium text-slate-200 line-clamp-3">
                                        {ann.content || `A ${ann.type} markup was added.`}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                                        <span className="font-bold uppercase tracking-widest text-blue-400">@{ann.userId?.fullName.split(' ')[0]}</span>
                                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrawingViewer;
