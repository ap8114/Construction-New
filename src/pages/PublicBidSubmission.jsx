import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { FileText, Download, Send, CheckCircle, Loader, DollarSign, MessageSquare } from 'lucide-react';
import api, { getServerUrl } from '../utils/api';

const PublicBidSubmission = () => {
    const { drawingId } = useParams();
    const [searchParams] = useSearchParams();
    const vendorId = searchParams.get('vendorId');

    const [drawing, setDrawing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        bidAmount: '',
        notes: ''
    });

    useEffect(() => {
        const fetchDrawing = async () => {
            try {
                const res = await api.get(`/vendors/public/drawing/${drawingId}`);
                setDrawing(res.data);
            } catch (err) {
                console.error('Error fetching drawing:', err);
            } finally {
                setLoading(false);
            }
        };
        if (drawingId) fetchDrawing();
    }, [drawingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vendorId) return alert('Invalid Vendor Link');

        try {
            setSubmitting(true);
            await api.post('/vendors/public/submit-bid', {
                drawingId,
                vendorId,
                bidAmount: formData.bidAmount,
                notes: formData.notes,
                companyId: drawing.companyId
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting bid:', err);
            alert('Failed to submit bid. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader className="animate-spin text-blue-600" size={40} />
        </div>
    );

    if (!drawing) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                <h2 className="text-2xl font-bold text-slate-800">Drawing Not Found</h2>
                <p className="text-slate-500 mt-2">This link may have expired or is incorrect.</p>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md animate-scale-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Bid Submitted!</h2>
                <p className="text-slate-500 mt-4 font-medium">Your proposal has been successfully sent to the project management team.</p>
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">KAAL Construction Management</p>
                </div>
            </div>
        </div>
    );

    const latestVersion = drawing.versions?.[drawing.versions.length - 1];

    return (
        <div className="min-h-screen bg-[#f3f4f7] py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-[#2e3647] p-8 rounded-2xl shadow-2xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">New Invitation to Bid</span>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none mb-4">{drawing.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm font-bold opacity-80">
                            <span className="bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Project: {drawing.projectId?.name}</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Trade: {drawing.category}</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Rev: v{drawing.versions.length}.0</span>
                        </div>
                    </div>
                    {/* Abstract background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left: Drawing Details */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FileText className="text-blue-600" size={20} />
                                Drawing Documentation
                            </h3>

                            <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-6 overflow-hidden border border-slate-200 flex items-center justify-center group relative">
                                {latestVersion?.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <img src={getServerUrl(latestVersion.fileUrl)} alt="Blueprint" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <FileText size={48} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase">PDF Blueprint</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <a
                                        href={getServerUrl(latestVersion?.fileUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest flex items-center gap-2"
                                    >
                                        <Download size={16} /> Open Full PDF
                                    </a>
                                </div>
                            </div>

                            <a
                                href={getServerUrl(latestVersion?.fileUrl)}
                                download
                                className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 hover:bg-slate-200 transition"
                            >
                                <Download size={18} /> Download for Offline Review
                            </a>
                        </div>
                    </div>

                    {/* Right: Submission Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                        <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight flex items-center gap-2">
                            <DollarSign className="text-emerald-500" />
                            Submit Your Quotation
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Bid Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        value={formData.bidAmount}
                                        onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-8 text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">Include all labor, materials, and equipment cost.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Terms</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition"
                                    placeholder="Briefly describe your scope of work..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader className="animate-spin" size={20} /> : <><Send size={20} /> Submit Formal Bid</>}
                            </button>
                        </form>

                        <div className="mt-8 flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl">
                            <MessageSquare className="text-blue-400 shrink-0" size={18} />
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                Once submitted, the project manager will review your proposal. You will be notified via email of the decision.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicBidSubmission;
