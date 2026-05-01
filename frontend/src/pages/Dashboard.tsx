import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, FileText, Upload, TrendingUp, Clock, Calendar, Sparkles, GraduationCap, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import { DashboardSkeleton } from '../components/PageSkeletons';
import { Link } from 'react-router-dom';

const getTimeBasedGreeting = () => {
  const now = new Date();
  const nairobiTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const hour = nairobiTime.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
};

const getRoleLabel = (role: string) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'Student';
};

const getRoleBadgeClass = (role: string) => {
  if (role === 'super_admin') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (role === 'admin') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
};

interface DashboardStats {
  available_notes: number;
  available_papers: number;
  my_uploads: number;
  my_papers: number;
  my_notes: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setStats(response.data?.stats || response.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await fetchDashboardData(); } finally { setIsRefreshing(false); }
  };

  if (isLoading) return <DashboardSkeleton />;

  const statCards = [
    { title: 'Available Notes', value: stats?.available_notes ?? 0, icon: BookOpen, link: '/notes', color: 'from-emerald-500 to-green-600' },
    { title: 'Available Papers', value: stats?.available_papers ?? 0, icon: FileText, link: '/past-papers', color: 'from-blue-500 to-cyan-600' },
    { title: 'My Notes', value: stats?.my_notes ?? stats?.my_uploads ?? 0, icon: Upload, link: '/notes?tab=my-uploads', color: 'from-violet-500 to-purple-600' },
    { title: 'My Papers', value: stats?.my_papers ?? 0, icon: TrendingUp, link: '/past-papers?tab=my-uploads', color: 'from-orange-500 to-amber-600' },
  ];

  const quickActions = [
    { title: 'Upload Notes', description: 'Share study materials', icon: BookOpen, link: '/notes/upload', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Upload Past Paper', description: 'Add exam papers', icon: FileText, link: '/past-papers/upload', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Latest Updates', description: 'News & announcements', icon: Clock, link: '/blog', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            {getTimeBasedGreeting()}, {user?.name?.split(' ')[0]}
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-sm">Ready to continue your academic journey?</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="shrink-0 mt-1">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Academic Info Card */}
      <Card className="border border-border/60 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Academic Info</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Year {user?.year_of_study}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Semester {user?.semester_of_study}
            </span>
            {user?.group && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                {user.group}
              </span>
            )}
            {user?.specialization && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                {user.specialization}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeClass(user?.role || 'user')}`}>
              <Shield className="w-3.5 h-3.5" />
              {getRoleLabel(user?.role || 'user')}
            </span>
          </div>
          {(!user?.group || !user?.specialization) && user?.year_of_study && user.year_of_study >= 3 && (
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                ⚠️ You haven't set your study group and specialization.{' '}
                <Link to="/profile" className="font-medium underline">Update in profile</Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link to={stat.link} key={index} className="group">
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-5 text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-0.5">{stat.value}</div>
                    <div className="text-sm font-medium text-white/90">{stat.title}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link to={action.link} key={index} className="group">
                <Card className="border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 h-full">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform mt-1" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Admin</h2>
          <Link to="/admin">
            <Card className="border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">Admin Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage users, content, groups, and site settings</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
