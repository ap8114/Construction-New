import { useState, useRef } from 'react';
import {
  Camera, MapPin, Upload, X, Check,
  Image as ImageIcon, RefreshCw, Layers,
  AlertCircle, ArrowRight, Trash2
} from 'lucide-react';

const UploadPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentUploads, setRecentUploads] = useState([
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=300',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=300',
    'https://images.unsplash.com/photo-1503387762-592dee58c460?q=80&w=300',
    'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=300'
  ]);
  const fileInputRef = useRef(null);

  const [metadata, setMetadata] = useState({
    description: '',
    project: 'Skyline Tower',
    category: 'Inspection'
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setRecentUploads([selectedImage, ...recentUploads]);
          setIsUploading(false);
          setShowSuccess(true);
        }, 500);
      }
    }, 200);
  };

  const reset = () => {
    setSelectedImage(null);
    setShowSuccess(false);
    setUploadProgress(0);
    setMetadata({ description: '', project: 'Skyline Tower', category: 'Inspection' });
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
          <Check size={48} strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Upload Successful!</h2>
        <p className="text-slate-500 max-w-sm mb-8">Your photo has been synced with the project team and is now visible in the master gallery.</p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition"
          >
            Upload Another
          </button>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition"
          >
            View Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Left: Uploader Interface */}
        <div className="flex-1 space-y-6">
          <div
            className={`relative group rounded-3xl overflow-hidden border-2 border-dashed transition-all
              ${selectedImage
                ? 'border-blue-600 bg-white'
                : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
              }
              ${isUploading ? 'pointer-events-none opacity-80' : ''}
            `}
          >
            {selectedImage ? (
              <div className="aspect-[4/3] relative">
                <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/90 rounded-full text-blue-600 shadow-xl hover:scale-110 transition"
                  >
                    <RefreshCw size={24} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-3 bg-white/90 rounded-full text-red-600 shadow-xl hover:scale-110 transition"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                {/* GPS Overlay */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <MapPin size={12} className="text-blue-400" />
                  40.7128° N, 74.0060° W • Verified Location
                </div>

                {/* Uploading Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="w-64 space-y-4">
                      <h4 className="text-center font-black text-slate-800 uppercase tracking-widest">Syncing to Cloud</h4>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-center text-xs font-bold text-blue-600">{uploadProgress}% Complete</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="aspect-[4/3] flex flex-col items-center justify-center p-12 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Camera size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Capture Site Progress</h3>
                <p className="text-slate-500 text-sm text-center max-w-xs">
                  Upload a high-resolution photo from your device or take one directly with your camera.
                </p>
                <div className="mt-8 flex items-center gap-3 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm group-hover:border-blue-400 transition-colors">
                  <Upload size={18} /> Select File
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>

        {/* Right: Metadata Form */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> Photo Details
            </h3>

            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                <textarea
                  rows={4}
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 resize-none"
                  placeholder="What's happening in this photo?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Project</label>
                <select
                  value={metadata.project}
                  onChange={(e) => setMetadata({ ...metadata, project: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 appearance-none cursor-pointer"
                >
                  <option>Skyline Tower</option>
                  <option>Riverfront Park</option>
                  <option>City Center Mall</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Inspection', 'Progress', 'Safety', 'Delivery'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMetadata({ ...metadata, category: cat })}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all
                        ${metadata.category === cat
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={!selectedImage || isUploading}
              onClick={handleUpload}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all
                ${selectedImage && !isUploading
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              Upload Photo <ArrowRight size={18} />
            </button>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              All site photos are automatically tagged with GPS coordinates and timestamps to ensure audit compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 pl-1">Recent Uploads</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentUploads.map((url, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 hover:ring-4 ring-blue-50 transition-all cursor-pointer relative group shadow-sm bg-white p-1">
              <img src={url} className="w-full h-full object-cover rounded-xl" alt="Recent" />
              <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon size={24} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
