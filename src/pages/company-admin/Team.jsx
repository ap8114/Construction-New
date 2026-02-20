import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, MoreHorizontal, Shield, User, X, Save, Trash2, Edit, CheckCircle, AlertTriangle, Eye, Loader, Lock } from 'lucide-react';
import api from '../../utils/api';

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

const MemberForm = ({ data, setData, onSubmit, submitLabel, isEdit = false }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
      <div className="relative">
        <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={data.fullName}
          onChange={e => setData({ ...data, fullName: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
          placeholder="John Doe"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
      <div className="relative">
        <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="email"
          value={data.email}
          onChange={e => setData({ ...data, email: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
          placeholder="john@example.com"
        />
      </div>
    </div>
    {!isEdit && (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="password"
              value={data.password}
              onChange={e => setData({ ...data, password: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              placeholder="******"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="password"
              value={data.confirmPassword}
              onChange={e => setData({ ...data, confirmPassword: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              placeholder="******"
            />
          </div>
        </div>
      </div>
    )}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
        <div className="relative">
          <Phone size={18} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={data.phone}
            onChange={e => setData({ ...data, phone: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
            placeholder="+1 (555)..."
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <div className="relative">
          <Shield size={18} className="absolute left-3 top-2.5 text-slate-400" />
          <select
            value={data.role}
            onChange={e => setData({ ...data, role: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition appearance-none"
          >
            <option value="PM">Project Manager</option>
            <option value="FOREMAN">Site Foreman</option>

            <option value="WORKER">Worker</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
      <select
        value={data.status}
        onChange={e => setData({ ...data, status: e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition"
      >
        <option>Active</option>
        <option>On Site</option>
        <option>Offline</option>
      </select>
    </div>
    <div className="flex justify-end pt-4">
      <button
        onClick={onSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-200 flex items-center gap-2"
      >
        <Save size={18} /> {submitLabel}
      </button>
    </div>
  </div>
);

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All Roles');

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', role: 'WORKER', email: '', phone: '', status: 'Active', password: '', confirmPassword: ''
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter Logic
  const filteredMembers = members.filter(member => {
    // Exclude Company Owner from the list
    if (member.role === 'COMPANY_OWNER') return false;

    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All Roles' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Handlers
  const handleInviteClick = () => {
    setFormData({ fullName: '', role: 'WORKER', email: '', phone: '', status: 'Active', password: '', confirmPassword: '' });
    setIsInviteOpen(true);
  };

  const handleSaveInvite = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/auth/register', {
        ...formData,
        companyId: members[0]?.companyId // Inherit companyId from context or first member
      });
      fetchMembers();
      setIsInviteOpen(false);
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (member) => {
    setSelectedMember(member);
    setIsViewOpen(true);
  };

  const handleEdit = (member) => {
    const target = member && member._id ? member : selectedMember;
    setSelectedMember(target);
    setFormData({ ...target, password: '', confirmPassword: '' });
    setIsEditOpen(true);
    setIsViewOpen(false);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      await api.patch(`/auth/users/${selectedMember._id}`, formData);
      fetchMembers();
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (member) => {
    const target = member && member._id ? member : selectedMember;
    setSelectedMember(target);
    setIsDeleteOpen(true);
    setIsViewOpen(false);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/auth/users/${selectedMember._id}`);
      fetchMembers();
      setIsDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
          <p className="text-slate-500 text-sm">Manage your team access and roles.</p>
        </div>
        <button
          onClick={handleInviteClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-200 transition"
        >
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-blue-500 transition"
            >
              <option>All Roles</option>
              <option value="PM">Project Manager</option>
              <option value="FOREMAN">Site Foreman</option>

              <option value="WORKER">Worker</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Role</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Contact</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-slate-200 shadow-sm">
                          {member.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-slate-400" />
                        <span className="font-medium text-xs uppercase">{member.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1
                        ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          member.status === 'On Site' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' :
                          member.status === 'On Site' ? 'bg-blue-500' :
                            'bg-slate-400'
                          }`}></span>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-sm">{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(member)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleEdit(member)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Edit Member">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(member)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Member">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">No team members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Add Team Member">
        <MemberForm data={formData} setData={setFormData} onSubmit={handleSaveInvite} submitLabel="Send Invitation" />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Member Details">
        <MemberForm data={formData} setData={setFormData} onSubmit={handleSaveEdit} submitLabel="Save Changes" isEdit={true} />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Member Profile">
        {selectedMember && (
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-slate-100 shadow-md mb-3">
                {selectedMember.fullName?.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{selectedMember.fullName}</h3>
              <p className="text-slate-500 text-sm uppercase font-bold">{selectedMember.role}</p>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block
                        ${selectedMember.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                  selectedMember.status === 'On Site' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'}`}>
                {selectedMember.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Email</p>
                <p className="text-sm font-medium text-slate-800 break-all">{selectedMember.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Phone</p>
                <p className="text-sm font-medium text-slate-800">{selectedMember.phone}</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button onClick={handleEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex justify-center items-center gap-2">
                <Edit size={16} /> Edit Profile
              </button>
              <button onClick={handleDelete} className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition font-medium flex justify-center items-center gap-2">
                <Trash2 size={16} /> Remove
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Team Member">
        <div className="text-center space-y-4">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <div>
            <p className="font-medium text-slate-800">Remove from team?</p>
            <p className="text-sm text-slate-500 mt-1">
              Are you sure you want to remove <b>{selectedMember?.fullName}</b>?<br />
              Their access to the platform will be revoked immediately.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium">
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium shadow-lg shadow-red-200">
              Remove Access
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Team;
