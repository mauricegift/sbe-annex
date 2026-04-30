import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import Navbar from './Navbar';
import PublicHeader from './PublicHeader';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';
import ScrollToTop from './ScrollToTop';
import Breadcrumbs from './Breadcrumbs';
import PageTransition from './PageTransition';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const Layout: React.FC = () => {
  const location = useLocation();
  
  // Initialize keyboard shortcuts first (hooks must be called unconditionally)
  useKeyboardShortcuts();
  
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    console.error('Auth error in Layout:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
          <p className="text-muted-foreground">Please refresh the page and try again.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }
  
  const { isAuthenticated, isLoading } = authData;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Public routes that don't require authentication (including home page)
  const publicRoutes = ['/', '/login', '/register', '/verify', '/forgot-password', '/reset-password', '/terms', '/privacy', '/faq', '/about', '/contact'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Routes that should show the public header (not auth pages or home)
  const publicPagesWithHeader = ['/terms', '/privacy', '/faq', '/about', '/contact'];
  const shouldShowPublicHeader = !isAuthenticated && publicPagesWithHeader.includes(location.pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users from auth pages to dashboard (but not from home or info pages)
  const authOnlyRoutes = ['/login', '/register', '/verify', '/forgot-password', '/reset-password'];
  if (isAuthenticated && authOnlyRoutes.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {isAuthenticated && <Navbar />}
      {shouldShowPublicHeader && <PublicHeader />}
      <main className="flex-1">
        {isAuthenticated && (
          <div className="container mx-auto px-4 pt-4">
            <Breadcrumbs />
          </div>
        )}
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      {(isAuthenticated || shouldShowPublicHeader) && <Footer />}
      {(isAuthenticated || shouldShowPublicHeader) && <ScrollToTop />}
    </div>
  );
};

export default Layout;
