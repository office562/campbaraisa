import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Columns3,
  MessageSquare,
  BedDouble,
  TrendingUp,
  Database,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Search,
  FolderTree,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Sidebar = function(props) {
  var onClose = props.onClose;
  var auth = useAuth();
  var admin = auth.admin;
  var logout = auth.logout;
  var navigate = useNavigate();
  var location = useLocation();
  var [roomsOpen, setRoomsOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  var isRoomsActive = location.pathname === '/rooms' || location.pathname === '/groups';

  return (
    <div className="flex flex-col h-full bg-[#2D241E] text-white">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/of4shzam_IMG_3441%202.jpg" alt="Camp Baraisa" className="w-12 h-12 object-contain rounded-lg bg-white p-1" />
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">CAMP BARAISA</h1>
            <p className="text-xs text-white/70">The Ultimate Bein Hazmanim Experience</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          <NavLink to="/" end onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-overview">
            <LayoutDashboard className="w-5 h-5" /><span className="font-medium">Overview</span>
          </NavLink>
          <NavLink to="/campers" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-campers">
            <Users className="w-5 h-5" /><span className="font-medium">Campers</span>
          </NavLink>
          <NavLink to="/billing" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-billing">
            <Receipt className="w-5 h-5" /><span className="font-medium">Billing</span>
          </NavLink>
          <NavLink to="/kanban" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-kanban">
            <Columns3 className="w-5 h-5" /><span className="font-medium">Kanban</span>
          </NavLink>
          <NavLink to="/communications" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-communications">
            <MessageSquare className="w-5 h-5" /><span className="font-medium">Communications</span>
          </NavLink>
          
          <div>
            <button onClick={function() { setRoomsOpen(!roomsOpen); }} className={'sidebar-link w-full justify-between ' + (isRoomsActive ? 'sidebar-link-active' : '')} data-testid="nav-rooms-groups">
              <div className="flex items-center gap-3"><Home className="w-5 h-5" /><span className="font-medium">Rooms & Groups</span></div>
              {roomsOpen || isRoomsActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {(roomsOpen || isRoomsActive) && (
              <div className="ml-6 mt-1 space-y-1">
                <NavLink to="/rooms" onClick={onClose} className={function(p) { return 'sidebar-link text-sm py-2 ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-rooms">
                  <BedDouble className="w-4 h-4" /><span className="font-medium">Rooms</span>
                </NavLink>
                <NavLink to="/groups" onClick={onClose} className={function(p) { return 'sidebar-link text-sm py-2 ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-groups">
                  <FolderTree className="w-4 h-4" /><span className="font-medium">Groups</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/financial" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-financial">
            <TrendingUp className="w-5 h-5" /><span className="font-medium">Financial</span>
          </NavLink>
          <NavLink to="/data-center" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-data-center">
            <Database className="w-5 h-5" /><span className="font-medium">Data Center</span>
          </NavLink>
          <NavLink to="/settings" onClick={onClose} className={function(p) { return 'sidebar-link ' + (p.isActive ? 'sidebar-link-active' : ''); }} data-testid="nav-settings">
            <Settings className="w-5 h-5" /><span className="font-medium">Settings</span>
          </NavLink>
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-[#E85D04] flex items-center justify-center font-bold text-white">
            {admin && admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{admin ? admin.name : 'Admin'}</p>
            <p className="text-xs text-white/60 truncate">{admin ? admin.email : ''}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10" onClick={handleLogout} data-testid="logout-btn">
          <LogOut className="w-5 h-5 mr-3" />Sign Out
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
        {/* Top Bar with Search */}
        <div className="sticky top-0 z-40 bg-[#F8F5F2]/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search campers, parents..."
                className="pl-10 h-10 bg-white/90 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="lg:hidden px-4 py-3 bg-[#F8F5F2] border-b border-gray-200 mt-16">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 h-10"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
