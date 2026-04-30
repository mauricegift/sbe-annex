import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Menu, User, LogIn, UserPlus, Home, ChevronRight } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const navLinks = [
  { name: 'About', href: '/about' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

// Route labels for breadcrumbs
const routeLabels: Record<string, string> = {
  'about': 'About Us',
  'faq': 'FAQ',
  'contact': 'Contact Us',
  'terms': 'Terms of Service',
  'privacy': 'Privacy Policy',
  'login': 'Login',
  'register': 'Register',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'verify': 'Verify Email',
};

const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Generate breadcrumbs for public pages
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isHomePage = location.pathname === '/';

  return (
    <>
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                <img 
                  src="/android-chrome-512x512.png" 
                  alt="BBM Annex Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
                BBM Annex
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/login" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/register" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4 flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs for public pages (not on home page) */}
      {!isHomePage && pathSegments.length > 0 && (
        <div className="container mx-auto max-w-6xl px-4 pt-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              to="/" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            {pathSegments.map((segment, index) => {
              const path = '/' + pathSegments.slice(0, index + 1).join('/');
              const isLast = index === pathSegments.length - 1;
              const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

              return (
                <React.Fragment key={path}>
                  <ChevronRight className="h-4 w-4" />
                  {isLast ? (
                    <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">
                      {label}
                    </span>
                  ) : (
                    <Link 
                      to={path}
                      className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-none"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
};

export default PublicHeader;
