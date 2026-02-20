import { Save, Lock, Camera, Shield, CheckCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    role: user?.role || '',
    avatar: null
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.fullName || '',
        email: user.email || '',
        role: user.role || '',
        avatar: user.avatar || null
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/auth/profile', { fullName: profile.name, email: profile.email });
      alert("Profile details updated successfully.");
    } catch (error) {
      console.error('Error updating profile:', error);
      alert("Failed to update profile.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      alert("New passwords do not match.");
      return;
    }
    try {
      await api.patch('/auth/updatepassword', { currentPassword: password.current, newPassword: password.new });
      alert("Password reset successfully.");
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.message || "Failed to reset password.");
    }
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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-500 text-sm">Update your personal information and security credentials.</p>
      </div>

      <div className="space-y-6">
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

        {/* Role Management Section - Only for Company Admin */}
        {user?.role === 'COMPANY_OWNER' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" /> Role Management
            </h3>

            <RoleSettings />
          </div>
        )}
      </div>
    </div>
  );
};

const RoleSettings = () => {
  const [activeRole, setActiveRole] = useState('PM');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState({});

  const roleDisplayNames = {
    'PM': 'Project Manager',
    'FOREMAN': 'Site Foreman',
    'WORKER': 'Worker',

    'CLIENT': 'Client',
    'COMPANY_OWNER': 'Company Owner'
  };

  const permissionLabels = {
    'VIEW_DASHBOARD': 'View Dashboard',
    'VIEW_PROJECTS': 'View Projects',
    'VIEW_SCHEDULE': 'View Schedule',
    'VIEW_TASKS': 'View All Tasks',
    'VIEW_MY_TASKS': 'View My Tasks',
    'VIEW_TIMESHEETS': 'View Timesheets',
    'CLOCK_IN_OUT': 'Clock In/Out',
    'VIEW_GPS': 'View GPS Tracking',
    'VIEW_DRAWINGS': 'View Drawings',
    'VIEW_PHOTOS': 'View Photos',
    'VIEW_DAILY_LOGS': 'View Daily Logs',
    'VIEW_ISSUES': 'View Issues',
    'VIEW_ESTIMATES': 'View Estimates',
    'VIEW_INVOICES': 'View Invoices',
    'VIEW_PO': 'View Purchase Orders',
    'VIEW_CLIENTS': 'View Clients',
    'VIEW_TEAM': 'View Team Members',
    'VIEW_CHAT': 'Access Chat',
    'VIEW_REPORTS': 'View Reports',
    'VIEW_PAYROLL': 'View Payroll',
    'VIEW_EQUIPMENT': 'View Equipment',
    'VIEW_PROFILE': 'View My Profile',
    'ACCESS_SETTINGS': 'Access Settings',
    'CLOCK_IN_CREW': 'Clock In Crew',
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      const permissionsMap = {};
      response.data.forEach(r => {
        permissionsMap[r.role] = r.permissions;
      });
      setAllPermissions(permissionsMap);
      setRoles(response.data.map(r => r.role).filter(r => r !== 'SUPER_ADMIN' && r !== 'COMPANY_OWNER'));
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggle = (perm) => {
    const currentPerms = allPermissions[activeRole] || [];
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];

    setAllPermissions({
      ...allPermissions,
      [activeRole]: newPerms
    });
  };

  const handleSaveRoles = async () => {
    try {
      await api.put(`/roles/${activeRole}`, { permissions: allPermissions[activeRole] });
      alert(`Permissions for ${roleDisplayNames[activeRole] || activeRole} updated successfully.`);
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert("Failed to save permissions.");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Role Selector */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeRole === role
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
          >
            {roleDisplayNames[role] || role}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(permissionLabels).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${allPermissions[activeRole]?.includes(key)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-slate-300 group-hover:border-blue-400'
              }`}>
              {allPermissions[activeRole]?.includes(key) && <CheckCircle size={14} />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={allPermissions[activeRole]?.includes(key) || false}
              onChange={() => handleToggle(key)}
            />
            <span className="text-sm text-slate-700">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveRoles}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-medium transition shadow-lg"
        >
          <Save size={18} /> Save Permissions
        </button>
      </div>
    </div>
  );
};

export default Settings;
