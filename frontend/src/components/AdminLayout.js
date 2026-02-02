import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Columns3,
  MessageSquare,
  BedDouble,
  TrendingUp,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/campers', icon: Users, label: 'Campers' },
  { path: '/billing', icon: Receipt, label: 'Billing' },
  { path: '/kanban', icon: Columns3, label: 'Kanban' },
  { path: '/communications', icon: MessageSquare, label: 'Communications' },
  { path: '/rooms', icon: BedDouble, label: 'Rooms' },
  { path: '/financial', icon: TrendingUp, label: 'Financial' },
  { path: '/exports', icon: Download, label: 'Exports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ onClose }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-[#2D241E] text-white">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/of4shzam_IMG_3441%202.jpg" 
            alt="Camp Baraisa" 
            className="w-12 h-12 object-contain rounded-lg bg-white p-1"
          />
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">CAMP BARAISA</h1>
            <p className="text-xs text-white/70">The Ultimate Bein Hazmanim Experience</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-[#E85D04] flex items-center justify-center font-bold text-white">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-white/60 truncate">{admin?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#2D241E] text-white h-16 flex items-center px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white" data-testid="mobile-menu-btn">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-[#2D241E]">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-3 ml-4">
          <img 
            src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/of4shzam_IMG_3441%202.jpg" 
            alt="Camp Baraisa" 
            className="w-8 h-8 object-contain rounded bg-white p-0.5"
          />
          <span className="font-heading font-bold">CAMP BARAISA</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
