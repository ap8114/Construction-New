import { Save, Lock, Camera, Briefcase, RefreshCw, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john@constructos.com',
        role: 'Project Manager',
        avatar: null
    });

    const [workHistory] = useState([
        { id: 1, role: 'Senior Foreman', company: 'BuildRight Inc.', period: '2020 - 2023', description: 'Led a team of 40 workers on high-rise residential projects.' },
        { id: 2, role: 'Site Supervisor', company: 'ConstructOS', period: '2023 - Present', description: 'Overseeing site safety and daily operations for Skyline Tower.' },
    ]);

    const [syncStatus] = useState({
        lastSync: 'Just now',
        status: 'Synced',
        offlineChanges: 0,
        version: 'v2.4.1'
    });

    // Sync with auth user if available
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || 'John Doe',
                email: user.email || 'john@constructos.com',
                role: user.role || 'Project Manager',
                avatar: null
            });
        }
    }, [user]);

    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleProfileSave = (e) => {
        e.preventDefault();
        alert("Profile details updated successfully.");
    };

    const handlePasswordReset = (e) => {
        e.preventDefault();
        if (password.new !== password.confirm) {
            alert("New passwords do not match.");
            return;
        }
        alert("Password reset successfully.");
        setPassword({ current: '', new: '', confirm: '' });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: UserCircle },
        // { id: 'work', label: 'Work History', icon: Briefcase },
        // { id: 'sync', label: 'Sync Status', icon: RefreshCw },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
                <p className="text-slate-500 text-sm">Manage your account settings, view work history, and check sync status.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                }
                            `}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Personal Details</h3>
                                <form onSubmit={handleProfileSave} className="space-y-4">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden border-4 border-slate-50">
                                                {profile.avatar ? (
                                                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    profile.name.split(' ').map(n => n[0]).join('')
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-slate-100 text-blue-600 hover:scale-110 transition cursor-pointer">
                                                <Camera size={16} />
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                            </label>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{profile.name}</h4>
                                            <p className="text-slate-500 text-sm">{profile.role}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                disabled
                                                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-200">
                                            <Save size={18} /> Update Details
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                                    <Lock size={20} className="text-blue-600" /> Security
                                </h3>
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={password.current}
                                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                            <input
                                                type="password"
                                                value={password.new}
                                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={password.confirm}
                                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-medium transition shadow-lg">
                                            Change Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'work' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Work History</h3>
                                <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    {workHistory.map((job) => (
                                        <div key={job.id} className="relative pl-10">
                                            <div className="absolute left-0 top-1.5 w-7 h-7 bg-blue-100 rounded-full border-4 border-white flex items-center justify-center">
                                                <Briefcase size={12} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{job.role}</h4>
                                                <p className="text-sm font-semibold text-blue-600 mb-1">{job.company}</p>
                                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mb-3">
                                                    {job.period}
                                                </span>
                                                <p className="text-sm text-slate-500 leading-relaxed">{job.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sync' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Sync Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-center">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <RefreshCw size={32} />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-lg">Fully Synced</h4>
                                        <p className="text-emerald-600 text-sm font-medium mt-1">Last synced: {syncStatus.lastSync}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">App Version</span>
                                            <span className="text-sm font-bold text-slate-800">{syncStatus.version}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-sm font-medium text-slate-600">Pending Changes</span>
                                            <span className="text-sm font-bold text-slate-800">{syncStatus.offlineChanges} items</span>
                                        </div>
                                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                            <RefreshCw size={18} /> Force Sync Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
