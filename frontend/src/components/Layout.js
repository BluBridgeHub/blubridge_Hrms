import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CalendarDays, 
  Star, 
  Users, 
  FileText, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
  Wallet,
  User,
  KeyRound,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: UserCog },
  { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/leave', label: 'Leave', icon: CalendarDays },
  { path: '/star-reward', label: 'Star Reward', icon: Star },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/payroll', label: 'Payroll', icon: Wallet },
  { path: '/reports', label: 'Report', icon: FileText },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#efede5]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#fffdf7]/90 backdrop-blur-xl border-r border-black/5 z-50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-black/5">
          <div className="flex items-center gap-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_25d72bd1-2848-402d-8255-1f5e67431c0e/artifacts/o66msiwa_logo-main2.png" 
              alt="BluBridge" 
              className="w-auto"
            />
          </div>
          <button 
            className="ml-auto lg:hidden p-1 hover:bg-black/5 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive 
                  ? 'bg-[#0b1f3b] text-white shadow-lg shadow-[#0b1f3b]/20' 
                  : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 bg-[#fffdf7]/60 backdrop-blur-md border-b border-black/5 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            <button 
              className="lg:hidden p-2 hover:bg-black/5 rounded-lg"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0b1f3b] flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
