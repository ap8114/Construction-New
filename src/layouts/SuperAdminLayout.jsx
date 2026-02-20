import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Logo from '../assets/images/Logo.png';
import {
  Shield, LayoutDashboard, Building, Users,
  CreditCard, Settings, Ticket, LogOut, Menu, X,
  Bell, Search, TrendingUp, Bookmark, FileText, ChevronDown
} from 'lucide-react';

const SuperAdminLayout = () => {
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
    { icon: Building, label: 'Companies', path: '/super-admin/companies' },
    { icon: CreditCard, label: 'Subscriptions', path: '/super-admin/subscriptions' },
    { icon: Bookmark, label: 'Plans & Pricing', path: '/super-admin/plans' },
    { icon: TrendingUp, label: 'Revenue', path: '/super-admin/revenue' },
    { icon: Users, label: 'Global Users', path: '/super-admin/users' },
    { icon: Ticket, label: 'Support Tickets', path: '/super-admin/tickets' },
    { icon: FileText, label: 'System Logs', path: '/super-admin/logs' },
    { icon: Settings, label: 'Settings', path: '/super-admin/settings' },
  ];

  const getHeaderTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Super Admin Center';
  };

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
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">KAAL</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
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

        <div className="p-4 border-t border-slate-600/50 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-slate-500 shadow-md font-black">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 truncate">Platform Root</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition text-sm font-bold uppercase tracking-tight bg-slate-700/30"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">{getHeaderTitle()}</h2>
          </div>

          <div className="flex items-center gap-4 relative" ref={profileMenuRef}>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hidden sm:block transition-colors">
              <Search size={20} />
            </button>

            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full border border-transparent hover:border-slate-200 transition"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                SA
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">System Root</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                <button
                  onClick={() => { navigate('/super-admin/settings'); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Settings size={16} /> Admin Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100 mt-1 pt-3"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#f3f4f7] scroll-smooth relative custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;

