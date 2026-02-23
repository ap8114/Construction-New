import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Logo from '../assets/images/Logo.png';
import sidebarlogo from '../assets/images/sidebarlogo.png';
import {
  PieChart, Clock, Image, FileCheck, DollarSign,
  MessageCircle, LogOut, Menu, X, Bell, User,
  Building2, LayoutDashboard, FileText, ClipboardList, Briefcase
} from 'lucide-react';

const ClientPortalLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client-portal', permission: 'VIEW_DASHBOARD' },
    { icon: Briefcase, label: 'Jobs', path: '/client-portal/projects', permission: 'VIEW_PROJECTS' },
    { icon: Image, label: 'Photos', path: '/client-portal/photos', permission: 'VIEW_PHOTOS' },
    { icon: FileText, label: 'Drawings', path: '/client-portal/drawings', permission: 'VIEW_DRAWINGS' },
    { icon: ClipboardList, label: 'Daily Logs', path: '/client-portal/daily-logs', permission: 'VIEW_DAILY_LOGS' },
    { icon: DollarSign, label: 'Invoices', path: '/client-portal/invoices', permission: 'VIEW_INVOICES' },
    { icon: MessageCircle, label: 'Chat', path: '/client-portal/messages', permission: 'VIEW_CHAT' },
    { icon: User, label: 'My Profile', path: '/client-portal/profile', permission: 'VIEW_PROFILE' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'COMPANY_OWNER') return true;
    // Always show My Profile
    if (item.permission === 'VIEW_PROFILE') return true;
    return user?.permissions?.includes(item.permission);
  });

  const getHeaderTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Client Portal';
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-8 flex flex-col items-center justify-center border-b border-slate-700/50 space-y-3 bg-slate-800/20">
          <img
            src={sidebarlogo}
            alt="KAAL Logo"
            className="h-12 w-auto opacity-100"
          />
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Client Portal</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">{getHeaderTitle()}</h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4 relative" ref={profileMenuRef}>
            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{user?.name || 'Client User'}</div>
                <div className="text-xs text-slate-500">Project Stakeholder</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {(user?.name || 'C U').split(' ').map(n => n[0]).join('')}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute top-16 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-medium text-slate-900">{user?.name || 'Client User'}</p>
                </div>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User size={16} /> My Account
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientPortalLayout;

