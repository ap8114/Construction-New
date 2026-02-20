import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import Logo from '../assets/images/Logo.png';
import {
  Building2, Home, ClipboardList, Camera,
  MessageSquare, User, Settings, LogOut, Menu, X,
  LayoutDashboard, Bell
} from 'lucide-react';

const ProjectTeamLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // keydown esc to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/project-team', roles: ['project_manager', 'foreman', 'worker'] },
    { icon: ClipboardList, label: 'My Tasks', path: '/project-team/tasks', roles: ['project_manager', 'foreman', 'worker'] },
    { icon: Camera, label: 'Photo Upload', path: '/project-team/upload', roles: ['project_manager', 'foreman'] },
    { icon: MessageSquare, label: 'Team Chat', path: '/project-team/chat', roles: ['project_manager', 'foreman', 'worker'] },
    { icon: User, label: 'My Profile', path: '/project-team/profile', roles: ['project_manager', 'foreman', 'worker'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || 'worker')
  );

  const getHeaderTitle = () => {
    const currentItem = filteredNavItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Project View';
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
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <img src={Logo} alt="KAAL Constructions" className="h-12 w-auto opacity-90 mb-1" />
            <p className="text-xs text-slate-400 mt-1 capitalize">{user?.role?.replace('_', ' ') || 'Project Team'}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
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

          <div className="flex items-center gap-2 md:gap-4 relative" ref={profileMenuRef}>
            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{user?.name || 'Team Member'}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Worker'}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {(user?.name || 'T M').split(' ').map(n => n[0]).join('')}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute top-16 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-medium text-slate-900">{user?.name || 'Team Member'}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Worker'}</p>
                </div>
                <button
                  onClick={() => { navigate('/project-team/profile'); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User size={16} /> My Profile
                </button>
                <button
                  onClick={() => { navigate('/project-team/tasks'); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ClipboardList size={16} /> My Tasks
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
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 scroll-smooth">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default ProjectTeamLayout;

