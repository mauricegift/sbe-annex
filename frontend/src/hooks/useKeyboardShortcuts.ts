import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts (Alt + key)
    { key: 'd', alt: true, description: 'Go to Dashboard', action: () => navigate('/dashboard') },
    { key: 'n', alt: true, description: 'Go to Notes', action: () => navigate('/notes') },
    { key: 'p', alt: true, description: 'Go to Past Papers', action: () => navigate('/past-papers') },
    { key: 'b', alt: true, description: 'Go to Blog/Announcements', action: () => navigate('/blog') },
    { key: 'u', alt: true, description: 'Go to Profile', action: () => navigate('/profile') },
    
    // Action shortcuts
    { key: 'k', ctrl: true, description: 'Focus Search', action: focusSearch },
    { key: '/', ctrl: false, description: 'Focus Search', action: focusSearch },
    
    // Upload shortcuts
    { key: 'u', ctrl: true, shift: true, description: 'Upload Notes', action: () => navigate('/notes/upload') },
    
    // Admin shortcut
    ...(user?.is_admin ? [{ key: 'a', alt: true, description: 'Go to Admin', action: () => navigate('/admin') }] : []),
  ];

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Only allow Escape key to blur from inputs
        if (event.key === 'Escape') {
          target.blur();
        }
        // Allow Ctrl+K even in inputs
        if (!(event.ctrlKey && event.key === 'k')) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          altMatch &&
          shiftMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, shortcuts, user?.is_admin]);

  return shortcuts;
};

export default useKeyboardShortcuts;
