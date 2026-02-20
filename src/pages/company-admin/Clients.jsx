import { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Mail, Phone, MapPin,
    ExternalLink, Building, Plus, Trash2, Loader, Save
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Clients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', address: '', company: '' });

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/users?role=CLIENT');
            setClients(res.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (user?.companyId && isModalOpen) {
            setFormData(prev => ({ ...prev, company: user.companyId }));
        }
    }, [user, isModalOpen]);

    const handleCreate = async () => {
        try {
            await api.post('/auth/users', {
                ...formData,
                role: 'CLIENT',
                password: 'Client@123' // Default password
            });
            fetchClients();
            setIsModalOpen(false);
            setFormData({ fullName: '', email: '', phone: '', address: '', company: user?.companyId || '' });
            alert('Client added successfully!');
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Failed to create client: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await api.delete(`/auth/users/${id}`);
                setClients(clients.filter(c => c._id !== id));
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const stats = {
        total: clients.length,
        active: clients.filter(c => c.isActive !== false).length,
        inactive: clients.filter(c => c.isActive === false).length
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Client Management</h1>
                    <p className="text-slate-500 text-sm">Manage client relationships and contacts.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium"
                >
                    <Plus size={18} /> Add Client
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Clients</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase font-bold">Inactive</p>
                    <p className="text-2xl font-bold text-slate-400 mt-1">{stats.inactive}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader size={48} className="animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.filter(c => c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                        <div key={client._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Building size={24} />
                                    </div>
                                    <button onClick={() => handleDelete(client._id)} className="text-slate-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{client.fullName}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                    <MapPin size={14} /> {client.address || 'No address'}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    {client.company && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building size={16} className="text-slate-400" />
                                            <span className="font-medium text-slate-700">{client.company}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail size={16} className="text-slate-400" />
                                        <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">{client.email}</a>
                                    </div>
                                    {client.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone size={16} className="text-slate-400" />
                                            <span className="text-slate-600">{client.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-sm">
                                <span className={`font-medium ${client.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {client.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {clients.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            No clients found. Add your first client to get started.
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Client">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                                placeholder="Acme Corp"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            placeholder="123 Main St, City, State"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition flex items-center gap-2">
                            <Save size={18} /> Add Client
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
