import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeLabels: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'notes': 'Notes',
  'upload': 'Upload',
  'past-papers': 'Past Papers',
  'profile': 'Profile',
  'blog': 'Blog',
  'admin': 'Admin',
  'login': 'Login',
  'register': 'Register',
  'verify': 'Verify Email',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'terms': 'Terms of Service',
  'privacy': 'Privacy Policy',
  'faq': 'FAQ',
  'about': 'About',
  'contact': 'Contact',
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on home page or auth pages
  const hideOnRoutes = ['/', '/login', '/register', '/verify', '/forgot-password', '/reset-password'];
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/dashboard' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Check if segment is a UUID or ID (skip labeling)
    const isId = /^[0-9a-f-]{36}$/i.test(segment) || /^[a-zA-Z0-9]{20,}$/.test(segment);
    
    if (isId) {
      breadcrumbs.push({
        label: 'Details',
        path: isLast ? undefined : currentPath
      });
    } else {
      breadcrumbs.push({
        label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        path: isLast ? undefined : currentPath
      });
    }
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          {crumb.path ? (
            <Link 
              to={crumb.path} 
              className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              <span>{crumb.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium whitespace-nowrap">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;