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

const DrawingPage = React.memo(({ 
    pdf, 
    pageNumber, 
    zoom, 
    annotations, 
    activeTool, 
    onSaveAnnotation, 
    onDeleteAnnotation,
    selectedAnnotationId,
    setSelectedAnnotationId,
    drawingId,
    versionId,
    onVisible
}) => {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const containerRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible(pageNumber);
                }
            },
            { threshold: 0.5 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [pageNumber, onVisible]);

    useEffect(() => {
        const renderPage = async () => {
            if (!pdf) return;
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: zoom });
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (overlayRef.current) {
                overlayRef.current.style.width = `${viewport.width}px`;
                overlayRef.current.style.height = `${viewport.height}px`;
            }

            if (renderTaskRef.current) renderTaskRef.current.cancel();
            renderTaskRef.current = page.render({ canvasContext: context, viewport });
            try {
                await renderTaskRef.current.promise;
            } catch (err) {
                if (err.name !== 'RenderingCancelledException') console.error(err);
            }
        };

        renderPage();
    }, [pdf, pageNumber, zoom]);

    const getCoordinates = (e) => {
        const rect = overlayRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    };

    const handleMouseDown = (e) => {
        if (!activeTool || activeTool === 'comment') return;
        const coords = getCoordinates(e);
        setIsDrawing(true);
        setCurrentAnnotation({
            type: activeTool,
            pageNumber,
            coordinates: { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y },
            drawingId,
            versionId
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
        const { x1, y1, x2, y2 } = currentAnnotation.coordinates;
        if (Math.abs(x2 - x1) < 2 && Math.abs(y2 - y1) < 2) {
            setCurrentAnnotation(null);
            return;
        }

        if (activeTool === 'text') {
            const content = prompt('Enter your note:');
            if (content) onSaveAnnotation({ ...currentAnnotation, content });
        } else {
            onSaveAnnotation(currentAnnotation);
        }
        setCurrentAnnotation(null);
    };

    const handleCommentClick = (e) => {
        if (activeTool !== 'comment') return;
        const coords = getCoordinates(e);
        const content = prompt('Enter your comment:');
        if (content) {
            onSaveAnnotation({
                drawingId,
                versionId,
                type: 'comment',
                pageNumber,
                coordinates: { x: coords.x, y: coords.y },
                content
            });
        }
    };

    const renderAnnotation = (ann) => {
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
                            position: 'absolute', left: 0, top: 0,
                            width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none'
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
                        style={{
                            ...baseStyle, left: `${x * zoom}px`, top: `${y * zoom}px`,
                            transform: 'translate(-50%, -100%)', border: 'none'
                        }}
                    >
                        <div className={`p-1.5 rounded-full shadow-lg border-2 ${isSelected ? 'bg-blue-600 border-white text-white' : 'bg-white border-blue-600 text-blue-600'}`}>
                            <MessageSquare size={16} />
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div
                        key={ann._id}
                        onClick={() => setSelectedAnnotationId(ann._id)}
                        style={{ ...baseStyle, left: `${x1 * zoom}px`, top: `${y1 * zoom}px`, color: '#3b82f6', fontWeight: 'bold', fontSize: `${12 * zoom}px`, whiteSpace: 'nowrap' }}
                    >
                        {ann.content}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div ref={containerRef} className="relative mb-8 shadow-2xl bg-white rounded-sm h-fit">
            <canvas ref={canvasRef} className="rounded-sm" />
            <div
                ref={overlayRef}
                className={`absolute inset-0 z-40 ${activeTool ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCommentClick}
            >
                {annotations.filter(a => a.pageNumber === pageNumber).map(renderAnnotation)}
                {currentAnnotation && (
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
    );
});

const DrawingViewer = ({ drawing, version, onClose }) => {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTool, setActiveTool] = useState(null);
    const [annotations, setAnnotations] = useState([]);
    const [showComments, setShowComments] = useState(true);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [exportProgress, setExportProgress] = useState(0);

    const containerRef = useRef(null);
    const pageRefs = useRef({});

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                const url = getServerUrl(version.fileUrl);
                const loadingTask = pdfjsLib.getDocument(url);
                const pdfInstance = await loadingTask.promise;
                setPdf(pdfInstance);
                setNumPages(pdfInstance.numPages);

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
        if (version?.fileUrl) loadPdf();
    }, [drawing._id, version]);

    const handleSaveAnnotation = async (data) => {
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

    const scrollToPage = (pageNum) => {
        const pageEl = pageRefs.current[pageNum];
        if (pageEl) {
            pageEl.scrollIntoView({ behavior: 'smooth' });
            setCurrentPage(pageNum);
        }
    };

    const handleExportPDF = async () => {
        if (!pdf) return;
        try {
            setLoading(true);
            const exportScale = 1.5;
            const firstPage = await pdf.getPage(1);
            const firstViewport = firstPage.getViewport({ scale: exportScale });

            const doc = new jsPDF({
                orientation: firstViewport.width > firstViewport.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [firstViewport.width, firstViewport.height],
                compress: true
            });

            for (let i = 1; i <= numPages; i++) {
                setExportProgress(Math.round((i / numPages) * 100));
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: exportScale });
                if (i > 1) doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'landscape' : 'portrait');
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height; canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport }).promise;

                const pageAnns = annotations.filter(a => a.pageNumber === i);
                pageAnns.forEach(ann => {
                    const s = exportScale;
                    const { x1, y1, x2, y2, x, y } = ann.coordinates;
                    context.lineWidth = 2 * s;
                    if (ann.type === 'box') {
                        context.strokeStyle = '#3b82f6';
                        context.strokeRect(Math.min(x1, x2) * s, Math.min(y1, y2) * s, Math.abs(x2 - x1) * s, Math.abs(y2 - y1) * s);
                    } else if (ann.type === 'highlight') {
                        context.fillStyle = 'rgba(234, 179, 8, 0.4)';
                        context.fillRect(Math.min(x1, x2) * s, Math.min(y1, y2) * s, Math.abs(x2 - x1) * s, Math.abs(y2 - y1) * s);
                    } else if (ann.type === 'arrow') {
                        context.strokeStyle = '#ef4444'; context.beginPath();
                        context.moveTo(x1 * s, y1 * s); context.lineTo(x2 * s, y2 * s); context.stroke();
                        const angle = Math.atan2((y2 - y1) * s, (x2 - x1) * s);
                        context.beginPath(); context.moveTo(x2 * s, y2 * s);
                        const arrowSize = 8 * s;
                        context.lineTo(x2 * s - arrowSize * Math.cos(angle - Math.PI / 6), y2 * s - arrowSize * Math.sin(angle - Math.PI / 6));
                        context.lineTo(x2 * s - arrowSize * Math.cos(angle + Math.PI / 6), y2 * s - arrowSize * Math.sin(angle + Math.PI / 6));
                        context.closePath(); context.fillStyle = '#ef4444'; context.fill();
                    } else if (ann.type === 'text' || ann.type === 'comment') {
                        context.fillStyle = '#3b82f6'; context.font = `bold ${12 * s}px Arial`;
                        const text = ann.content || 'Note';
                        context.fillText(text, (x || x1) * s, (y || y1) * s);
                    }
                });

                doc.addImage(canvas.toDataURL('image/jpeg', 0.5), 'JPEG', 0, 0, viewport.width, viewport.height, undefined, 'FAST');
            }
            doc.save(`${drawing.title}_reviewed_${Date.now()}.pdf`);
        } catch (err) {
            console.error('Export error:', err);
            alert(`Failed to export PDF: ${err.message}`);
        } finally {
            setLoading(false); setExportProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col text-white overflow-hidden animate-fade-in">
            {/* Toolbar */}
            <div className="h-16 bg-slate-800 border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition"><X size={20} /></button>
                    <button onClick={() => setShowThumbnails(!showThumbnails)} className={`p-2 rounded-lg transition ${showThumbnails ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400'}`} title="Toggle Thumbnails">
                        <Maximize2 size={20} />
                    </button>
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
                            className={`p-2.5 rounded-lg transition ${activeTool === tool.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                            title={tool.label}
                        >
                            <tool.icon size={18} />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition"><Download size={16} /> Export PDF</button>

                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 hover:text-blue-400"><ZoomOut size={16} /></button>
                        <span className="text-xs font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1 hover:text-blue-400"><ZoomIn size={16} /></button>
                    </div>

                    <div className="flex items-center gap-2 min-w-[80px] justify-center">
                        <span className="text-xs font-bold">{currentPage} / {numPages}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Thumbnail Sidebar */}
                {showThumbnails && (
                    <div className="w-56 bg-slate-800/50 border-r border-white/10 overflow-y-auto custom-scrollbar p-4 space-y-4 shrink-0 transition-all">
                        {Array.from({ length: numPages }, (_, i) => (
                            <div 
                                key={i + 1} 
                                onClick={() => scrollToPage(i + 1)}
                                className={`aspect-[3/4] rounded-lg border-2 cursor-pointer transition-all hover:border-blue-400 relative group overflow-hidden
                                    ${currentPage === i + 1 ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-white/5 bg-slate-900/50'}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-500 opacity-20 group-hover:opacity-40 transition">PAGE {i + 1}</div>
                                <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[8px] font-black text-white">{i + 1}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PDF Scroll Area */}
                <div 
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-slate-950 flex flex-col items-center p-8 custom-scrollbar relative scroll-smooth"
                >
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                            <span className="text-xs font-black text-white uppercase tracking-widest">{exportProgress > 0 ? `Exporting: ${exportProgress}%` : 'Loading PDF...'}</span>
                        </div>
                    )}
                    
                    {Array.from({ length: numPages }, (_, i) => (
                        <div key={i + 1} ref={el => pageRefs.current[i + 1] = el}>
                            <DrawingPage 
                                pdf={pdf}
                                pageNumber={i + 1}
                                zoom={zoom}
                                annotations={annotations}
                                activeTool={activeTool}
                                onSaveAnnotation={handleSaveAnnotation}
                                onDeleteAnnotation={handleDeleteAnnotation}
                                selectedAnnotationId={selectedAnnotationId}
                                setSelectedAnnotationId={setSelectedAnnotationId}
                                drawingId={drawing._id}
                                versionId={version._id}
                                onVisible={setCurrentPage}
                            />
                        </div>
                    ))}
                </div>

                {/* Annotation Sidebar */}
                <div className={`w-80 bg-slate-800 border-l border-white/10 flex flex-col transition-all overflow-hidden ${showComments ? '' : 'w-0 border-l-0'}`}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Review Notes ({annotations.length})</span>
                        <button onClick={() => setShowComments(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
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
                                        scrollToPage(ann.pageNumber);
                                        setSelectedAnnotationId(ann._id);
                                    }}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${selectedAnnotationId === ann._id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/30 border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {ann.pageNumber}</span>
                                        </div>
                                        <button onClick={(e) => handleDeleteAnnotation(ann._id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"><Trash2 size={12} /></button>
                                    </div>
                                    <p className="text-sm font-medium text-slate-200 line-clamp-3">{ann.content || `A ${ann.type} markup added.`}</p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                                        <span className="font-bold text-blue-400">@{ann.userId?.fullName?.split(' ')[0]}</span>
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
