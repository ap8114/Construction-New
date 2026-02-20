import { useState, useEffect } from 'react';
import { Image, X, Loader, Calendar } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';

const Photos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const res = await api.get('/photos');
        setPhotos(res.data);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Project Photos</h1>
        <p className="text-slate-500 text-sm">Visual progress of your ongoing construction.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo._id}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={getServerUrl(photo.imageUrl)}
                alt={photo.description || 'Project Photo'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {photo.projectId?.name || 'Project Photo'}
              </h3>
              <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase">
                <Calendar size={12} /> {new Date(photo.createdAt).toLocaleDateString()}
              </p>
              {photo.description && (
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{photo.description}</p>
              )}
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Image size={48} className="mx-auto mb-2 opacity-20" />
            <p>No photos uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300 animate-fade-in" onClick={() => setSelectedPhoto(null)}>
          <button
            className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={32} />
          </button>
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={getServerUrl(selectedPhoto.imageUrl)}
              alt={selectedPhoto.description}
              className="max-h-[85vh] w-auto object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-xl font-bold">{selectedPhoto.projectId?.name}</h3>
              <p className="text-sm opacity-80">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
              {selectedPhoto.description && <p className="mt-2 text-sm">{selectedPhoto.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Photos;
