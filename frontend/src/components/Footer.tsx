import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/android-chrome-192x192.png"
              alt="SBE Annex Logo"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-bold text-foreground">SBE Annex</span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/notes" className="hover:text-primary transition-colors">Notes</Link>
            <Link to="/past-papers" className="hover:text-primary transition-colors">Past Papers</Link>
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            <Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © 2024–{currentYear} SBE Annex. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
