import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Briefcase, Clock, FileText,
  Wrench, ClipboardList, BarChart2, DollarSign,
  Users, Settings, LogOut, Menu, X, Bell, MessageSquare,
  Search, ChevronDown, RefreshCw, MapPin, Building2, PenTool, Camera
} from 'lucide-react';

const CompanyAdminLayout = () => {
  const { user, logout, updateUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isJobSelectorOpen, setIsJobSelectorOpen] = useState(false);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const jobSelectorRef = useRef(null);
  const companySelectorRef = useRef(null);

  const handleCompanySwitch = (companyName) => {
    updateUserData({ company: { name: companyName } });
    setIsCompanySelectorOpen(false);
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Handle clicks outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (jobSelectorRef.current && !jobSelectorRef.current.contains(event.target)) {
        setIsJobSelectorOpen(false);
      }
      if (companySelectorRef.current && !companySelectorRef.current.contains(event.target)) {
        setIsCompanySelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company-admin', permission: 'VIEW_DASHBOARD' },
    { icon: Briefcase, label: 'Jobs', path: '/company-admin/projects', permission: 'VIEW_PROJECTS' },
    // { icon: ClipboardList, label: 'Tasks', path: '/company-admin/tasks', permission: 'VIEW_TASKS' },
    { icon: Clock, label: 'My Clock', path: '/company-admin/clock', permission: 'CLOCK_IN_OUT' },
    { icon: Users, label: 'Clock In Crew', path: '/company-admin/crew-clock', permission: 'CLOCK_IN_OUT' },
    { icon: Clock, label: 'Timesheets', path: '/company-admin/timesheets', permission: 'VIEW_TIMESHEETS' },
    { icon: FileText, label: 'Daily Logs', path: '/company-admin/daily-logs', permission: 'VIEW_DAILY_LOGS' },
    { icon: PenTool, label: 'Drawings', path: '/company-admin/drawings', permission: 'VIEW_DRAWINGS' },
    { icon: Camera, label: 'Photos', path: '/company-admin/photos', permission: 'VIEW_PHOTOS' },
    { icon: MapPin, label: 'GPS Tracking', path: '/company-admin/gps', permission: 'VIEW_GPS' },
    { icon: Wrench, label: 'Equipment', path: '/company-admin/equipment', permission: 'VIEW_EQUIPMENT' },
    { icon: ClipboardList, label: 'Purchase Orders', path: '/company-admin/purchase-orders', permission: 'VIEW_PO' },
    { icon: FileText, label: 'Invoices', path: '/company-admin/invoices', permission: 'VIEW_INVOICES' },
    { icon: MessageSquare, label: 'Chat', path: '/company-admin/chat', permission: 'VIEW_CHAT' },
    { icon: BarChart2, label: 'Reports', path: '/company-admin/reports', permission: 'VIEW_REPORTS' },
    { icon: DollarSign, label: 'Payroll', path: '/company-admin/payroll', permission: 'VIEW_PAYROLL' },
    { icon: Users, label: 'Users', path: '/company-admin/team', permission: 'VIEW_TEAM' },
    { icon: Settings, label: 'Settings', path: '/company-admin/settings', permission: 'ACCESS_SETTINGS' },
  ];

  const filteredNavItems = navItems.filter(item => {
    // Role-specific strict overrides
    if (user?.role === 'COMPANY_OWNER') {
      // Owner sees everything EXCEPT worker-specific tactical tools like "My Clock"
      if (['My Clock'].includes(item.label)) return false;
      return true;
    }

    // For all other roles (PM, FOREMAN, WORKER, CLIENT, etc.), use dynamic permissions stored in DB
    return user?.permissions?.includes(item.permission);
  });

  return (
    <div className="flex h-screen bg-[#f3f4f7] text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#2e3647] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-xl font-black text-white italic">K</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">KAAL</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/company-admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-semibold
                  ${isActive
                    ? 'bg-[#3f4759] text-white'
                    : 'text-slate-400 hover:bg-[#3f4759] hover:text-white'
                  }
                `}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}
        <div className="p-4 border-t border-slate-600/50 space-y-4">
          {/* User Profile Mini */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-500 shadow-md bg-slate-400 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Users className="text-white w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.fullName || 'John Doe'}</p>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 truncate">
                {user?.role?.replace('_', ' ') || 'Owner Demo'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition text-sm font-bold uppercase tracking-tight bg-slate-700/30"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu size={24} />
            </button>

            {/* Job Selector */}
            <div className="relative max-w-sm hidden sm:block" ref={jobSelectorRef}>
              <button
                onClick={() => setIsJobSelectorOpen(!isJobSelectorOpen)}
                className="flex items-center gap-3 bg-[#f8fafc] border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all w-64"
              >
                <Search size={16} className="text-slate-400" />
                <span className="flex-1 text-left truncate">All Jobs</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isJobSelectorOpen ? 'rotate-180' : ''}`} />
              </button>
              {isJobSelectorOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Sites</div>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">North Tower</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">Parkview Condos</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium">Ridgeway Centre</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {/* Company Selector */}
            <div className="relative group" ref={companySelectorRef}>
              <button
                onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition"
              >
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-slate-900 leading-none">
                    {user?.company?.name || 'Kaal Construction Ltd'}
                  </div>
                </div>
                <div className="relative">
                  <Bell size={20} className="text-slate-400" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">2</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCompanySelectorOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCompanySelectorOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Switch Company</div>
                  <button
                    onClick={() => handleCompanySwitch('Kaal Construction Ltd')}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-semibold flex items-center gap-2 ${user?.company?.name === 'Kaal Construction Ltd' ? 'text-blue-600 bg-blue-50/50' : ''}`}
                  >
                    <Building2 size={16} /> Kaal Construction Ltd
                  </button>
                  <button
                    onClick={() => handleCompanySwitch('Skyline Builders')}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-semibold flex items-center gap-2 ${user?.company?.name === 'Skyline Builders' ? 'text-blue-600 bg-blue-50/50' : ''}`}
                  >
                    <Building2 size={16} /> Skyline Builders
                  </button>
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

            {/* User Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full border border-transparent hover:border-slate-200 transition"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                      {(user?.fullName || 'U').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {user?.fullName || 'Owner Demo'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {user?.role?.replace('_', ' ') || 'Company Owner'}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <button
                    onClick={() => { navigate('/company-admin/settings'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Users size={16} /> My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100 mt-1 pt-3"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto bg-[#f3f4f7] scroll-smooth p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyAdminLayout;
