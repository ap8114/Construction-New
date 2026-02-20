import { useState, useEffect } from 'react';
import { Image, MoreVertical, Filter, Download, Plus, X, Trash2, Maximize2, UploadCloud, Loader } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Lightbox = ({ photo, onClose, onDelete }) => {
    if (!photo) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition bg-black/50 p-2 rounded-full">
                <X size={24} />
            </button>
            <div className="max-w-4xl w-full flex flex-col items-center">
                <img src={getServerUrl(photo.imageUrl)} alt={photo.description} className="max-h-[80vh] w-auto rounded-lg shadow-2xl object-contain border border-white/10" />
                <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 w-full max-w-lg text-white border border-white/20 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{photo.description || 'No Description'}</h3>
                        <p className="text-sm text-white/70">{photo.projectId?.name || 'General'} • {new Date(photo.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-white/50 mt-1">Uploaded by {photo.uploadedBy?.fullName || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white" title="Download">
                            <Download size={20} />
                        </button>
                        <button onClick={() => onDelete(photo._id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-red-100 rounded-lg transition" title="Delete Photo">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Photos = () => {
    const [photos, setPhotos] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [filterProject, setFilterProject] = useState('All');

    const [uploadData, setUploadData] = useState({ description: '', projectId: '', imageUrl: '', file: null });
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [photoRes, projectRes] = await Promise.all([
                api.get('/photos'),
                api.get('/projects')
            ]);
            setPhotos(photoRes.data);
            setProjects(projectRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPhotos = filterProject === 'All'
        ? photos
        : photos.filter(p => p.projectId?._id === filterProject);

    const handleUpload = async () => {
        if (!uploadData.file && !uploadData.imageUrl) return;
        try {
            setUploading(true);
            const formData = new FormData();
            if (uploadData.file) {
                formData.append('image', uploadData.file);
            } else {
                formData.append('imageUrl', uploadData.imageUrl);
            }
            formData.append('description', uploadData.description);
            if (uploadData.projectId) {
                formData.append('projectId', uploadData.projectId);
            }

            await api.post('/photos/upload', formData);

            fetchData();
            setUploadData({ description: '', projectId: '', imageUrl: '', file: null });
            setIsUploadOpen(false);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this photo?')) {
            try {
                await api.delete(`/photos/${id}`);
                setPhotos(photos.filter(p => p._id !== id));
                setSelectedPhoto(null);
            } catch (error) {
                console.error('Error deleting photo:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Site Photos</h1>
                    <p className="text-slate-500 text-sm">Centralized gallery for all project documentation.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-slate-500" size={18} />
                        <select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-50 transition min-w-[150px]"
                        >
                            <option value="All">All Projects</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition font-medium"
                    >
                        <UploadCloud size={18} /> Upload New
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="animate-spin text-blue-600" size={48} />
                </div>
            ) : (
                <>
                    {filteredPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredPhotos.map((photo) => (
                                <div key={photo._id} className="group relative bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
                                    <div className="aspect-square relative overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                                        <img src={getServerUrl(photo.imageUrl)} alt={photo.description} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white/90 p-2 rounded-full text-slate-800 hover:text-blue-600 font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition">
                                                <Maximize2 size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">{photo.description || 'Untitled'}</h4>
                                            <button onClick={() => handleDelete(photo._id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-50 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-600 font-medium">{photo.projectId?.name || 'General'}</p>
                                        <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                                            <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                                            <span>by {photo.uploadedBy?.fullName || '---'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                            <Image size={48} className="mb-2 opacity-20" />
                            <p>No photos found in this gallery.</p>
                        </div>
                    )}
                </>
            )}

            {/* Upload Modal */}
            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Photo">
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:bg-blue-50/50 transition cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            name="image"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setUploadData({ ...uploadData, file: file, imageUrl: '' });
                                }
                            }}
                        />
                        <UploadCloud size={48} className="mb-2" />
                        {uploadData.file ? (
                            <p className="text-sm font-bold text-blue-600 truncate px-4">{uploadData.file.name}</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs">SVG, PNG, JPG or GIF (max. 5MB)</p>
                            </>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Or Image URL (External)</label>
                        <input
                            type="text"
                            value={uploadData.imageUrl}
                            disabled={!!uploadData.file}
                            onChange={e => setUploadData({ ...uploadData, imageUrl: e.target.value, file: null })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition disabled:opacity-50"
                            placeholder="https://images.unsplash.com/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={uploadData.description}
                            onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
                            placeholder="e.g. Site Visit Day 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                        <select
                            value={uploadData.projectId}
                            onChange={e => setUploadData({ ...uploadData, projectId: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
                        >
                            <option value="">General / None</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleUpload}
                            disabled={uploading || (!uploadData.file && !uploadData.imageUrl)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? <Loader className="animate-spin" size={18} /> : <Plus size={18} />}
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Lightbox */}
            <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} onDelete={handleDelete} />

        </div>
    );
};

export default Photos;
