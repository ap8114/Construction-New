import React, { useState, useEffect } from 'react';
import {
    X, AlertTriangle, Save, Loader, Hammer,
    ShieldAlert, Layers, User, Calendar, Image as ImageIcon
} from 'lucide-react';
import Modal from '../Modal';

const DeficiencyModal = ({
    isOpen,
    onClose,
    onSave,
    initialData = null,
    users = [],
    isSubmitting = false
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'work',
        priority: 'medium',
        assignedTo: '',
        status: 'open',
        dueDate: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || 'work',
                priority: initialData.priority || 'medium',
                assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
                status: initialData.status || 'open',
                dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                category: 'work',
                priority: 'medium',
                assignedTo: '',
                status: 'open',
                dueDate: ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const categories = [
        { value: 'safety', label: 'Safety Issue', icon: ShieldAlert, color: 'text-red-500' },
        { value: 'work', label: 'Workmanship / Quality', icon: Hammer, color: 'text-blue-500' },
        { value: 'material', label: 'Material Missing', icon: Layers, color: 'text-orange-500' },
        { value: 'other', label: 'Other', icon: AlertTriangle, color: 'text-slate-500' }
    ];

    const priorities = [
        { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
        { value: 'medium', label: 'Medium', color: 'bg-blue-50 text-blue-600' },
        { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-600' },
        { value: 'critical', label: 'Critical', color: 'bg-red-600 text-white' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Deficiency" : "Add New Deficiency"}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all text-sm"
                        placeholder="e.g. Incomplete wiring in Unit 4"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Category
                        </label>
                        <div className="relative">
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none custom-select-appearance"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 font-bold outline-none transition-all text-sm appearance-none custom-select-appearance
                        ${formData.priority === 'critical' ? 'border-red-400 text-red-700 bg-red-50' : 'border-slate-200 text-slate-800'}`}
                        >
                            {priorities.map(p => (
                                <option key={p.value} value={p.value}>{p.label} Priority</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Assign To
                        </label>
                        <select
                            value={formData.assignedTo}
                            onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none custom-select-appearance"
                        >
                            <option value="">Select Worker</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm appearance-none custom-select-appearance"
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="fixed">Fixed</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Resolution Deadline
                    </label>
                    <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all h-32 resize-none text-sm"
                        placeholder="Provide technical details for the fix..."
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                        {initialData ? "Update Deficiency" : "Save Deficiency"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DeficiencyModal;
