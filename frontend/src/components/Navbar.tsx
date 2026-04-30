import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Newspaper,
  Shield,
  Bell,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { blogAPI } from '../lib/api';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);

  useEffect(() => {
    const checkNewAnnouncements = async () => {
      try {
        const response = await blogAPI.getBlogs({ limit: 20 });
        const blogs = response.data?.blogs || response.data || [];
        
        if (blogs.length > 0) {
          const lastSeenTime = localStorage.getItem('lastAnnouncementSeen');
          const lastSeen = lastSeenTime ? new Date(lastSeenTime) : new Date(0);
          
          const newCount = blogs.filter((blog: { created_at: string }) => 
            new Date(blog.created_at) > lastSeen
          ).length;
          setNewAnnouncementsCount(newCount);
        }
      } catch (error) {
        console.error('Failed to check announcements:', error);
      }
    };

    if (user) {
      checkNewAnnouncements();
    }
  }, [user]);

  // Mark announcements as seen when visiting blog page
  useEffect(() => {
    if (location.pathname === '/blog') {
      localStorage.setItem('lastAnnouncementSeen', new Date().toISOString());
      setNewAnnouncementsCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: BookOpen,
    },
    {
      name: 'Past Papers',
      href: '/past-papers',
      icon: FileText,
    },
    {
      name: 'Announcements',
      href: '/blog',
      icon: Newspaper,
    },
  ];

  if (user?.is_admin) {
    navItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Shield,
    });
  }

  const NavLinks = ({ mobile = false }) => (
    <div className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-6"}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-card rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <img 
                src="/android-chrome-512x512.png" 
                alt="BBM Annex Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate uppercase">
              BBM ANNEX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavLinks />

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {newAnnouncementsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {newAnnouncementsCount > 9 ? '9+' : newAnnouncementsCount}
                      </span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Year {user?.year_of_study}, Semester {user?.semester_of_study}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden relative">
                  <Menu className="h-5 w-5" />
                  {newAnnouncementsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {newAnnouncementsCount > 9 ? '9+' : newAnnouncementsCount}
                      </span>
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[300px] rounded-l-2xl">
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="flex items-center space-x-3 pb-6 border-b border-border">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user?.profile_picture} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Year {user?.year_of_study}, Sem {user?.semester_of_study}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <NavLinks mobile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;