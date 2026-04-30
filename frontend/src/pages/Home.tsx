import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import ScrollToTop from '../components/ScrollToTop';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  Star, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Menu,
  Mail,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Quote,
  UserPlus,
  Search,
  Download,
  User,
  LogIn,
  Shield,
  Zap,
  Award
} from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

// Count up animation component - optimized for smooth performance
const CountUpStat: React.FC<{ 
  stat: { value: number; suffix: string; label: string; icon: React.ElementType }; 
  index: number 
}> = ({ stat, index }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (hasAnimated) {
      const duration = 2000;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOut * stat.value);
        
        setCount(currentCount);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(stat.value);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [hasAnimated, stat.value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      viewport={{ once: false }}
      className="text-center group"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
        <stat.icon className="w-6 h-6 text-primary" />
      </div>
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {count}{stat.suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
    </motion.div>
  );
};

// Loading skeleton for homepage
const HomePageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar skeleton */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-28 h-6 hidden sm:block" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="w-24 h-10 rounded-lg hidden sm:block" />
            <Skeleton className="w-28 h-10 rounded-lg hidden sm:block" />
          </div>
        </div>
      </div>
    </header>

    {/* Hero skeleton */}
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <Skeleton className="w-56 h-10 rounded-full mx-auto lg:mx-0" />
            <div className="space-y-3">
              <Skeleton className="w-full h-14 max-w-lg mx-auto lg:mx-0" />
              <Skeleton className="w-4/5 h-14 max-w-md mx-auto lg:mx-0" />
            </div>
            <Skeleton className="w-full h-24 max-w-xl mx-auto lg:mx-0" />
            <div className="flex gap-4 justify-center lg:justify-start">
              <Skeleton className="w-40 h-14 rounded-xl" />
              <Skeleton className="w-32 h-14 rounded-xl" />
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-72 h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  </div>
);

const Home: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Page colors for the book animation
  const pageColors = [
    'linear-gradient(145deg, #22c55e, #16a34a)', // Green
    'linear-gradient(145deg, #3b82f6, #2563eb)', // Blue
    'linear-gradient(145deg, #ef4444, #dc2626)', // Red
    'linear-gradient(145deg, #a855f7, #9333ea)', // Purple
    'linear-gradient(145deg, #1a1a1a, #0a0a0a)', // Black
  ];

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Book page flip animation - cycles through colors endlessly
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % pageColors.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [pageColors.length]);

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  const currentYear = new Date().getFullYear();

  const features = [
    {
      icon: FileText,
      title: 'Study Notes',
      description: 'Access comprehensive, peer-reviewed notes from top students',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: BookOpen,
      title: 'Past Papers',
      description: 'Practice with verified examination papers from previous years',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect and collaborate with students across all years',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: GraduationCap,
      title: 'All Specializations',
      description: 'Curated resources for every BBM specialization track',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  const stats = [
    { value: 100, suffix: '+', label: 'Study Notes', icon: FileText },
    { value: 80, suffix: '+', label: 'Past Papers', icon: BookOpen },
    { value: 200, suffix: '+', label: 'Active Students', icon: Users },
    { value: 10, suffix: '+', label: 'Specializations', icon: Award },
  ];

  const testimonials = [
    {
      quote: "BBM Annex has been a game-changer for my studies. The notes and past papers helped me improve my grades significantly!",
      name: "Dantech Securenet",
      role: "Year 3, Accounting",
      rating: 5,
      profilePhoto: "/testimonials/dantech-securenet.jpg",
    },
    {
      quote: "I found all the past papers I needed for my exams. The platform is easy to use and has helped me prepare better than ever.",
      name: "Spencer Grace",
      role: "Year 2",
      rating: 5,
      profilePhoto: "/testimonials/spencer-onyango.jpg",
    },
    {
      quote: "As a student, BBM Annex helped me understand what to expect. The community is supportive and resources are top-notch.",
      name: "CBS Rolland",
      role: "Year 4, Finance & Banking",
      rating: 5,
      profilePhoto: "/testimonials/cbs-rolland.jpg",
    },
    {
      quote: "The notes here are well-organized and comprehensive. It's become my go-to resource for exam preparation.",
      name: "Faustina Joel",
      role: "Year 4, Finance & Banking",
      rating: 5,
      profilePhoto: "/testimonials/regina-joel.jpg",
    },
    {
      quote: "I love how I can contribute notes and help other students. BBM Annex creates a true learning community.",
      name: "Faith N.",
      role: "Year 3, Human Resource",
      rating: 5,
      profilePhoto: "",
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  const trustBadges = [
    { icon: Shield, text: 'Verified Content' },
    { icon: Zap, text: 'Instant Access' },
    { icon: Users, text: 'Active Community' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden flex flex-col">
      {/* Fixed Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md group-hover:border-primary/50 transition-all duration-300">
                <img 
                  src="/android-chrome-512x512.png" 
                  alt="BBM Annex Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wide">
                BBM Annex
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild className="font-medium">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold shadow-lg shadow-primary/25">
                  <Link to="/register">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Mobile User Menu */}
              <div className="sm:hidden">
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
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-8 mt-8">
                    <div className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                      <Button variant="outline" asChild className="w-full h-12 text-base">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button asChild className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent font-semibold">
                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 pt-32 pb-20 min-h-screen will-change-scroll overflow-hidden">
        {/* Enhanced parallax background elements - hidden on mobile for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          {/* Large gradient orbs with enhanced parallax */}
          <motion.div 
            className="absolute top-20 right-10 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[100px]"
            style={{ willChange: 'transform' }}
            animate={{ 
              y: [0, -30, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px]"
            style={{ willChange: 'transform' }}
            animate={{ 
              y: [0, 40, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1 
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-[120px]"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          
          {/* Floating geometric shapes with enhanced parallax */}
          <motion.div 
            className="absolute top-32 left-[15%] w-16 h-16 border-2 border-primary/20 rounded-2xl"
            style={{ willChange: 'transform' }}
            animate={{ 
              y: [-20, 20, -20], 
              rotate: [0, 15, 0],
              x: [-5, 5, -5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-40 right-[20%] w-12 h-12 bg-accent/10 rounded-full"
            style={{ willChange: 'transform' }}
            animate={{ 
              y: [0, -25, 0], 
              scale: [1, 1.15, 1],
              x: [0, 10, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.div 
            className="absolute top-[40%] right-[10%] w-8 h-8 border-2 border-accent/20 rounded-lg rotate-45"
            style={{ willChange: 'transform' }}
            animate={{ 
              y: [-15, 15, -15], 
              rotate: [45, 60, 45],
              x: [-8, 8, -8]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          {/* Additional floating elements */}
          <motion.div 
            className="absolute top-[60%] left-[8%] w-6 h-6 bg-primary/15 rounded-full"
            animate={{ 
              y: [0, -20, 0], 
              x: [0, 15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-[25%] right-[25%] w-10 h-10 border border-primary/15 rounded-full"
            animate={{ 
              y: [0, 25, 0], 
              scale: [1, 0.9, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </div>
        
        {/* Simplified mobile background with subtle animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden">
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-[80px]"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10 px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left space-y-8"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                <span>The #1 Student Resource Platform</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-foreground">
                  Your Gateway to
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                  Academic Excellence
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Access premium study notes, verified past papers, and connect with a thriving community of BBM students. 
                Everything you need to excel, all in one place.
              </p>

              <div className="flex flex-row gap-4 justify-center lg:justify-start items-center">
                {/* Primary CTA with gradient border animation */}
                <Button 
                  size="lg" 
                  asChild
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-xl"
                >
                  <Link to="/register">
                    Start Free
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Link>
                </Button>
                {/* Secondary CTA with subtle gradient border */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild
                    className="relative h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold border-2 bg-background hover:bg-muted/50"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              </div>

              {/* Scroll Down Indicator - below buttons */}
              <motion.div 
                className="flex flex-col items-center gap-2 cursor-pointer pt-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                <span className="text-xs text-muted-foreground font-medium">Scroll Down</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-8 h-8 rounded-full border-2 border-primary/50 flex items-center justify-center bg-background/50 backdrop-blur-sm hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-primary" />
                </motion.div>
              </motion.div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4">
                {trustBadges.map((badge, index) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <badge.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{badge.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - 3D Book Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full flex justify-center items-center"
            >
              <div className="relative flex justify-center items-center">
                {/* Glow effect behind book */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-[80px] scale-110" />
                
                {/* 3D Book Container */}
                <div className="book-scene">
                  <div className="book-3d open">
                    {/* Book spine */}
                    <div className="book-spine-3d" />
                    
                    {/* Back cover */}
                    <div className="book-back-3d" />
                    
                    {/* Animated colorful pages */}
                    <div className="book-pages-3d">
                      {pageColors.map((color, i) => (
                        <div 
                          key={i} 
                          className="book-page-3d colored-page"
                          style={{ 
                            background: color,
                            transform: `translateZ(${(pageColors.length - i) * 2}px) rotateY(${currentPage === i ? -160 : currentPage > i ? -170 : -5 - i * 2}deg)`,
                            opacity: currentPage >= i ? 1 : 0.9,
                            zIndex: currentPage === i ? 10 : pageColors.length - i,
                            transitionDelay: `${i * 0.08}s`
                          }}
                        >
                          <div className="page-content-colored">
                            <div className="page-text">
                              <span className="text-white font-bold text-lg">BBM ANNEX</span>
                            </div>
                            <div className="page-logo">
                              <img 
                                src="/android-chrome-512x512.png" 
                                alt="BBM Annex Logo" 
                                className="w-12 h-12 rounded-full border-2 border-white/30 shadow-lg"
                              />
                            </div>
                            <div className="page-powered">
                              <span className="text-white/60 text-[10px] font-medium">Powered by</span>
                              <span className="text-white/80 text-xs font-semibold">Gifted Tech</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Front cover */}
                    <div className="book-front-3d">
                      <div className="book-cover-content">
                        <div className="book-logo-container">
                          <GraduationCap className="w-12 h-12 text-primary-foreground" />
                        </div>
                        <div className="book-title">
                          <span className="book-title-main">BBM ANNEX</span>
                          <span className="book-title-sub">Study Resources</span>
                        </div>
                        <div className="book-decoration" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements around book */}
                <motion.div 
                  className="absolute -top-6 -right-6 bg-card rounded-xl p-2 md:p-3 shadow-xl border border-border/50 scale-75 md:scale-100"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-success" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium">Verified Content</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-4 -left-4 bg-card rounded-xl p-2 md:p-3 shadow-xl border border-border/50 scale-75 md:scale-100"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[8px] md:text-[10px] font-bold text-primary">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] md:text-xs font-medium">200+ Students</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-muted/30 border-y border-border/50"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <CountUpStat key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our platform provides all the resources you need to excel in your BBM studies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                viewport={{ once: false }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardContent className="p-8 text-center relative">
                    <motion.div 
                      className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4 bg-muted/30"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Minutes
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Four simple steps to academic success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
            
            {[
              { icon: UserPlus, title: 'Sign Up', description: 'Create your free account in seconds', step: 1 },
              { icon: Search, title: 'Browse', description: 'Find notes and papers for your courses', step: 2 },
              { icon: Download, title: 'Download', description: 'Access resources anytime, anywhere', step: 3 },
              { icon: Users, title: 'Contribute', description: 'Share your notes and help others', step: 4 },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                viewport={{ once: false }}
                className="relative text-center"
              >
                <motion.div 
                  className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-10 h-10 text-primary-foreground" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-sm font-bold text-primary shadow-lg">
                    {item.step}
                  </span>
                </motion.div>
                
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonial Carousel Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4"
      >
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Loved by{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Students
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Join hundreds of satisfied students who've transformed their academic journey
            </p>
          </motion.div>

          {/* Carousel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border border-border/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                <Quote className="w-12 h-12 text-primary/20 mb-6" />
                
                <div className="flex justify-center gap-1 mb-8">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-warning fill-warning" />
                  ))}
                </div>
                
                <blockquote className="text-xl md:text-2xl font-medium text-foreground/90 text-center mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                
                <div className="flex flex-col items-center">
                  {testimonials[currentTestimonial].profilePhoto ? (
                    <img 
                      src={testimonials[currentTestimonial].profilePhoto} 
                      alt={testimonials[currentTestimonial].name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mb-4 border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                      <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
                        {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <p className="font-bold text-lg text-foreground">{testimonials[currentTestimonial].name}</p>
                  <p className="text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-14 w-12 h-12 rounded-full bg-card border border-border shadow-xl flex items-center justify-center hover:bg-muted hover:scale-110 transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-14 w-12 h-12 rounded-full bg-card border border-border shadow-xl flex items-center justify-center hover:bg-muted hover:scale-110 transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30 w-2.5 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="relative bg-gradient-to-br from-primary to-accent rounded-3xl p-12 md:p-16 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                Ready to Excel in Your Studies?
              </h2>
              <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                Join hundreds of students already using BBM Annex to ace their exams and succeed academically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  asChild
                  className="bg-white text-primary hover:bg-white/90 transition-all h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <Link to="/register">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-2 border-white text-white bg-white/10 hover:bg-white/20 h-14 px-10 text-lg font-semibold backdrop-blur-sm"
                >
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-24 px-4 bg-muted/30"
      >
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Got questions? We've got answers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  question: "Is BBM Annex free to use?",
                  answer: "Yes! BBM Annex is completely free for all students. You can access notes, past papers, and other resources without any subscription fees."
                },
                {
                  question: "How do I upload my notes?",
                  answer: "After creating an account, go to the Notes page and click the 'Upload Notes' button. Fill in the course details, upload your file, and submit. Your notes will be reviewed and published within 24 hours."
                },
                {
                  question: "What file formats are supported?",
                  answer: "We support PDF, DOC, DOCX, and image files (JPG, PNG) for notes and past papers. PDF is recommended for the best viewing experience."
                },
                {
                  question: "Are the past papers verified?",
                  answer: "Yes, all past papers are reviewed by our team before being published. We verify the authenticity and quality to ensure you get accurate study materials."
                },
                {
                  question: "Can I access resources on mobile?",
                  answer: "Absolutely! BBM Annex is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. You can study anywhere, anytime."
                },
                {
                  question: "How do I report incorrect content?",
                  answer: "If you find any errors or inappropriate content, please use the Contact page to report it. Our team will review and take appropriate action promptly."
                }
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-2xl px-6 data-[state=open]:shadow-lg transition-all"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="font-semibold text-lg">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10"
          >
            <p className="text-muted-foreground text-lg">
              Still have questions?{' '}
              <Link to="/contact" className="text-primary hover:underline font-semibold">
                Contact us
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 mt-auto">
        <div className="container mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/android-chrome-192x192.png" 
                  alt="BBM Annex Logo" 
                  className="w-12 h-12 rounded-xl shadow-md"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BBM Annex
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your comprehensive academic resource hub for BBM students. Learn, share, and succeed together.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Resources</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Legal</h3>
              <ul className="space-y-3">
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Connect</h3>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:bbm@giftedtech.co.ke" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                </li>
                <li>
                  <a href="https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024-{currentYear} BBM Annex. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> for students
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <ScrollToTop />

      {/* Book Animation Styles */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .book-scene {
          perspective: 1200px;
          width: 260px;
          height: 340px;
          position: relative;
          margin: 0 auto;
        }

        .book-3d {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: bookFloat 5s ease-in-out infinite;
          transform: rotateY(-25deg) rotateX(5deg);
        }

        .book-3d.open {
          animation: bookFloat 5s ease-in-out infinite, bookOpenClose 0.8s ease-out forwards;
        }

        .book-3d:not(.open) {
          animation: bookFloat 5s ease-in-out infinite, bookClose 0.8s ease-out forwards;
        }

        @keyframes bookFloat {
          0%, 100% {
            transform: rotateY(-25deg) rotateX(5deg) translateY(0);
          }
          50% {
            transform: rotateY(-25deg) rotateX(5deg) translateY(-12px);
          }
        }

        @keyframes bookOpenClose {
          from { --book-open: 0deg; }
          to { --book-open: -140deg; }
        }

        @keyframes bookClose {
          from { --book-open: -140deg; }
          to { --book-open: 0deg; }
        }

        .book-front-3d {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, hsl(var(--primary)), hsl(var(--accent)));
          border-radius: 4px 16px 16px 4px;
          transform-origin: left center;
          transform: rotateY(var(--book-open, 0deg));
          backface-visibility: hidden;
          box-shadow: 
            5px 5px 20px rgba(0, 0, 0, 0.3),
            inset -2px 0 5px rgba(255, 255, 255, 0.1);
          transition: transform 0.8s ease-out;
          overflow: hidden;
        }

        .book-3d.open .book-front-3d {
          transform: rotateY(-140deg);
        }

        .book-cover-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%);
        }

        .book-logo-container {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .book-title {
          text-align: center;
        }

        .book-title-main {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .book-title-sub {
          display: block;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 8px;
          font-weight: 500;
        }

        .book-decoration {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .book-spine-3d {
          position: absolute;
          left: 0;
          width: 30px;
          height: 100%;
          background: linear-gradient(90deg, 
            hsl(var(--primary) / 0.7) 0%, 
            hsl(var(--primary)) 50%,
            hsl(var(--primary) / 0.9) 100%
          );
          transform: rotateY(-90deg) translateX(-15px);
          transform-origin: right center;
          border-radius: 4px 0 0 4px;
        }

        .book-spine-3d::after {
          content: '';
          position: absolute;
          top: 20px;
          bottom: 20px;
          left: 50%;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-50%);
        }

        .book-pages-3d {
          position: absolute;
          width: calc(100% - 20px);
          height: calc(100% - 16px);
          top: 8px;
          left: 20px;
          transform-style: preserve-3d;
        }

        .book-page-3d {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 2px 8px 8px 2px;
          transform-origin: left center;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
          box-shadow: -2px 0 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1);
        }

        .book-page-3d.colored-page {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .book-page-3d.colored-page::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to right, rgba(0,0,0,0.2), transparent);
          border-radius: 2px 0 0 2px;
        }

        .page-content-colored {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
        }

        .page-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .page-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px 0;
        }

        .page-powered {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 4px;
        }

        .book-back-3d {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, hsl(var(--primary) / 0.85), hsl(var(--accent) / 0.85));
          border-radius: 16px 4px 4px 16px;
          transform: translateZ(-30px);
          box-shadow: -5px 5px 15px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .book-scene {
            width: 180px;
            height: 240px;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            left: 60px;
          }
          
          .book-logo-container {
            width: 50px;
            height: 50px;
            border-radius: 14px;
          }
          
          .book-logo-container svg {
            width: 28px;
            height: 28px;
          }
          
          .book-title-main {
            font-size: 1.1rem;
          }
          
          .book-title-sub {
            font-size: 0.7rem;
          }

          .page-content-colored {
            gap: 4px;
            padding: 12px;
          }

          .page-text span {
            font-size: 0.85rem;
          }

          .page-logo img {
            width: 36px;
            height: 36px;
          }

          .page-powered span:first-child {
            font-size: 8px;
          }

          .page-powered span:last-child {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
