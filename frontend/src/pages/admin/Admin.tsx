import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI, blogAPI, notesAPI, pastPapersAPI, reviewsAPI } from '../../lib/api';
import { uploadToGithubCdn } from '../../lib/githubCdn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../lib/toast';
import RichTextEditor from '../../components/RichTextEditor';
import { SpecializationSelect, ContentSpecializationSelect } from '../../components/SpecializationFilter';
import { useGroups } from '../../hooks/useGroups';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Progress } from '../../components/ui/progress';
import { Users, FileText, Upload, Settings, Loader2, Check, X, PenTool, Image, Eye, Calendar, ChevronLeft, ChevronRight, Search, Edit, FileUp, Trash2, CheckSquare, Square, RefreshCw, BookOpen, GraduationCap, MessageSquare, Star, Clock, BookMarked } from 'lucide-react';
import DocumentViewer from '../../components/DocumentViewer';
import { AdminSkeleton } from '../../components/PageSkeletons';
import ReviewsDialog, { Review } from '../../components/ReviewsDialog';

function makeId(length = 3) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Please log in</h3>
            <p className="text-muted-foreground">You need to be logged in to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don&apos;t have permission to access this page</p>
            <p className="text-xs text-muted-foreground mt-2">User admin status: {String(user.is_admin)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to 'pending'
  const validTabs = ['pending', 'notes', 'papers', 'users', 'blog', 'groups', 'testimonials'];
  const urlTab = searchParams.get('tab');
  const initialTab = urlTab && validTabs.includes(urlTab) ? urlTab : 'pending';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  
  // Pending approvals state
  const [pendingNotes, setPendingNotes] = useState<any[]>([]);
  const [pendingPapers, setPendingPapers] = useState<any[]>([]);
  const [notesPagination, setNotesPagination] = useState({ page: 1, total: 0, hasNext: false });
  const [papersPagination, setPapersPagination] = useState({ page: 1, total: 0, hasNext: false });
  
  // All notes and papers state
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [allNotesPagination, setAllNotesPagination] = useState({ page: 1, total: 0, hasNext: false });
  const [allPapersPagination, setAllPapersPagination] = useState({ page: 1, total: 0, hasNext: false });
  const [notesSearch, setNotesSearch] = useState('');
  const [papersSearch, setPapersSearch] = useState('');
  const [editingNote, setEditingNote] = useState<any>(null);
  const [editingPaper, setEditingPaper] = useState<any>(null);
  
  // Filter states for notes/papers/users
  const [notesYearFilter, setNotesYearFilter] = useState<string>('all');
  const [notesSemesterFilter, setNotesSemesterFilter] = useState<string>('all');
  const [notesGroupFilter, setNotesGroupFilter] = useState<string>('all');
  const [notesSpecFilter, setNotesSpecFilter] = useState<string>('all');
  const [papersYearFilter, setPapersYearFilter] = useState<string>('all');
  const [papersSemesterFilter, setPapersSemesterFilter] = useState<string>('all');
  const [papersGroupFilter, setPapersGroupFilter] = useState<string>('all');
  const [papersSpecFilter, setPapersSpecFilter] = useState<string>('all');
  const [usersYearFilter, setUsersYearFilter] = useState<string>('all');
  const [usersSemesterFilter, setUsersSemesterFilter] = useState<string>('all');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [usersGroupFilter, setUsersGroupFilter] = useState<string>('all');
  const [usersSpecFilter, setUsersSpecFilter] = useState<string>('all');
  const { groups: dynamicGroups, contentSpecializations, allSpecializations, getSpecializationsForGroup } = useGroups();
  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSpecs, setNewGroupSpecs] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [newSpecInputs, setNewSpecInputs] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, total: 0, hasNext: false });
  const [usersSearch, setUsersSearch] = useState('');
  
  // Blogs state
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsPagination, setBlogsPagination] = useState({ page: 1, total: 0, hasNext: false });
  const [blogsSearch, setBlogsSearch] = useState('');
  const [blogsGroupFilter, setBlogsGroupFilter] = useState('all');
  const [blogsSpecFilter, setBlogsSpecFilter] = useState('all');
  const [editingBlog, setEditingBlog] = useState<any>(null);

    // Testimonials state
    const [adminTestimonials, setAdminTestimonials] = useState<any[]>([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(false);
    const [testimonialsFilter, setTestimonialsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Testimonials admin helpers
    const fetchAdminTestimonials = async () => {
      setTestimonialsLoading(true);
      try {
        const res = await fetch('/api/testimonials/admin/all', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        const data = await res.json();
        setAdminTestimonials(data.data || []);
      } catch (e) {
        console.error('Failed to fetch testimonials', e);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    const updateTestimonialStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
      const res = await fetch(`/api/testimonials/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { toast({ title: 'Failed to update status', variant: 'destructive' }); return; }
      toast({ title: `Testimonial ${newStatus}` });
      setAdminTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const deleteTestimonial = async (id: string) => {
      setConfirmDialog({
        open: true,
        title: 'Delete Testimonial',
        description: 'Are you sure you want to permanently delete this testimonial? This cannot be undone.',
        variant: 'destructive',
        action: async () => {
          const res = await fetch(`/api/testimonials/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });
          if (!res.ok) { toast({ title: 'Failed to delete', variant: 'destructive' }); return; }
          toast({ title: 'Testimonial deleted' });
          setAdminTestimonials(prev => prev.filter(t => t.id !== id));
        },
      });
    };

    // Document viewer state
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  
  // Pending tab switcher state
  const [pendingTabView, setPendingTabView] = useState<'notes' | 'papers'>('notes');
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: (remarks?: string) => void;
    variant?: 'default' | 'destructive';
    showRemarks?: boolean;
    remarksLabel?: string;
  }>({ open: false, title: '', description: '', action: () => {} });
  const [confirmRemarks, setConfirmRemarks] = useState('');
  
  // Bulk selection states
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [selectedPendingNotes, setSelectedPendingNotes] = useState<Set<string>>(new Set());
  const [selectedPendingPapers, setSelectedPendingPapers] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Reviews dialog state
  const [reviewsDialog, setReviewsDialog] = useState<{
    isOpen: boolean;
    type: 'note' | 'paper' | 'blog';
    itemId: string;
    title: string;
    reviews: Review[];
    averageRating: number;
    isLoading: boolean;
  }>({
    isOpen: false,
    type: 'note',
    itemId: '',
    title: '',
    reviews: [],
    averageRating: 0,
    isLoading: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'testimonials') {
      fetchAdminTestimonials();
    }
  }, [activeTab]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchPendingNotes(),
        fetchPendingPapers(),
        fetchAllNotes(),
        fetchAllPapers(),
        fetchUsers(),
        fetchGroups(),
        fetchBlogs()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
      toast({
        title: "Data refreshed",
        description: "All data has been refreshed successfully",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPendingNotes = async (page = 1) => {
    try {
      const response = await adminAPI.getPendingNotes({ page, limit: 10 });
      if (response.data.data) {
        setPendingNotes(response.data.data);
        setNotesPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch pending notes:', error);
    }
  };

  const fetchPendingPapers = async (page = 1) => {
    try {
      const response = await adminAPI.getPendingPapers({ page, limit: 10 });
      if (response.data.data) {
        setPendingPapers(response.data.data);
        setPapersPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch pending papers:', error);
    }
  };

  const fetchGroups = async () => {
    setGroupsLoading(true);
    try {
      const r = await adminAPI.getGroups();
      setGroups(r.data || []);
    } catch (e) {
      console.error('Failed to fetch groups:', e);
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      
      const response = await adminAPI.getUsers(params);
      if (response.data.data) {
        setUsers(response.data.data);
        setUsersPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchBlogs = async (page = 1, search = '', group = 'all', spec = 'all') => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (group && group !== 'all') params.group = group;
      if (spec && spec !== 'all') params.specialization = spec;
      
      const response = await blogAPI.getBlogs(params);
      if (response.data.data) {
        setBlogs(response.data.data);
        setBlogsPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    }
  };

  const fetchAllNotes = async (page = 1, search = '') => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      
      const response = await adminAPI.getAllNotes(params);
      if (response.data.data) {
        setAllNotes(response.data.data);
        setAllNotesPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch all notes:', error);
      // Fallback to empty array if endpoint doesn't exist yet
      setAllNotes([]);
    }
  };

  const fetchAllPapers = async (page = 1, search = '') => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      
      const response = await adminAPI.getAllPapers(params);
      if (response.data.data) {
        setAllPapers(response.data.data);
        setAllPapersPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch all papers:', error);
      // Fallback to empty array if endpoint doesn't exist yet
      setAllPapers([]);
    }
  };

  const handleNoteStatusUpdate = async (noteId: string, status: string, feedback?: string) => {
    try {
      await adminAPI.updateNoteStatus(noteId, { status, feedback });
      await fetchPendingNotes(notesPagination.page);
      toast({
        title: "Status updated",
        description: `Note ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const confirmNoteAction = (noteId: string, status: 'approved' | 'rejected', noteTitle: string) => {
    setConfirmRemarks('');
    setConfirmDialog({
      open: true,
      title: status === 'rejected' ? 'Reject Note' : 'Approve Note',
      description: status === 'rejected'
        ? `Reject "${noteTitle}"? The uploader will be notified.`
        : `Approve "${noteTitle}"? The uploader will be notified.`,
      action: (remarks?: string) => {
        handleNoteStatusUpdate(noteId, status, remarks || undefined);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
      variant: status === 'rejected' ? 'destructive' : 'default',
      showRemarks: true,
      remarksLabel: 'Admin Remarks (optional)',
    });
  };

  const handlePaperStatusUpdate = async (paperId: string, status: string, feedback?: string) => {
    try {
      await adminAPI.updatePaperStatus(paperId, { status, feedback });
      await fetchPendingPapers(papersPagination.page);
      toast({
        title: "Status updated",
        description: `Paper ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const confirmPaperAction = (paperId: string, status: 'approved' | 'rejected', paperTitle: string) => {
    setConfirmRemarks('');
    setConfirmDialog({
      open: true,
      title: status === 'rejected' ? 'Reject Past Paper' : 'Approve Past Paper',
      description: status === 'rejected'
        ? `Reject "${paperTitle}"? The uploader will be notified.`
        : `Approve "${paperTitle}"? The uploader will be notified.`,
      action: (remarks?: string) => {
        handlePaperStatusUpdate(paperId, status, remarks || undefined);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
      variant: status === 'rejected' ? 'destructive' : 'default',
      showRemarks: true,
      remarksLabel: 'Admin Remarks (optional)',
    });
  };

  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isUpdatingPaper, setIsUpdatingPaper] = useState(false);
  const [isUpdatingBlog, setIsUpdatingBlog] = useState(false);

  const handleUserUpdate = async (userId: string, data: any) => {
    setIsUpdatingUser(true);
    try {
      await adminAPI.updateUser(userId, data);
      await fetchUsers(usersPagination.page, usersSearch);
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "User updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      
      await fetchUsers(usersPagination.page, usersSearch);
      toast({
        title: "User deleted",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.detail || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleBlogUpdate = async (blogId: string, data: any) => {
    setIsUpdatingBlog(true);
    try {
      await adminAPI.updateBlog(blogId, data);
      await fetchBlogs(blogsPagination.page, blogsSearch, blogsGroupFilter, blogsSpecFilter);
      setEditingBlog(null);
      toast({
        title: "Blog updated",
        description: "Blog post updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update blog",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBlog(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await adminAPI.deleteBlog(blogId);
      
      await fetchBlogs(blogsPagination.page, blogsSearch, blogsGroupFilter, blogsSpecFilter);
      toast({
        title: "Blog deleted",
        description: "Blog post deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.detail || "Failed to delete blog",
        variant: "destructive",
      });
    }
  };

  const handleUsersSearch = () => {
    fetchUsers(1, usersSearch);
  };

  const handleBlogsSearch = () => {
    fetchBlogs(1, blogsSearch, blogsGroupFilter, blogsSpecFilter);
  };

  const handleNotesSearch = () => {
    fetchAllNotes(1, notesSearch);
  };

  const handlePapersSearch = () => {
    fetchAllPapers(1, papersSearch);
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setIsDocumentViewerOpen(true);
  };

  // Reviews functions
  const openReviewsDialog = async (type: 'note' | 'paper' | 'blog', item: any) => {
    setReviewsDialog({
      isOpen: true,
      type,
      itemId: item.id,
      title: item.course_title || item.title,
      reviews: item.reviews || [],
      averageRating: item.average_rating || 0,
      isLoading: true,
    });

    try {
      let response;
      if (type === 'note') {
        response = await reviewsAPI.getNoteReviews(item.id);
      } else if (type === 'paper') {
        response = await reviewsAPI.getPaperReviews(item.id);
      } else {
        response = await reviewsAPI.getBlogReviews(item.id);
      }
      
      setReviewsDialog(prev => ({
        ...prev,
        reviews: response.data.reviews || response.data.data || [],
        averageRating: response.data.average_rating || prev.averageRating,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviewsDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { type, itemId } = reviewsDialog;
    
    if (type === 'note') {
      await reviewsAPI.deleteNoteReview(itemId, reviewId);
    } else if (type === 'paper') {
      await reviewsAPI.deletePaperReview(itemId, reviewId);
    } else {
      await reviewsAPI.deleteBlogReview(itemId, reviewId);
    }
    
    // Remove from local state
    setReviewsDialog(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== reviewId),
    }));
    
    // Refresh the list to update review counts
    if (type === 'note') {
      await fetchAllNotes(allNotesPagination.page, notesSearch);
    } else if (type === 'paper') {
      await fetchAllPapers(allPapersPagination.page, papersSearch);
    } else {
      await fetchBlogs(blogsPagination.page, blogsSearch, blogsGroupFilter, blogsSpecFilter);
    }
  };

  const handleReplyToReview = async (reviewId: string, reply: string) => {
    const { type, itemId } = reviewsDialog;
    
    if (type === 'note') {
      await reviewsAPI.replyToNoteReview(itemId, reviewId, reply);
    } else if (type === 'paper') {
      await reviewsAPI.replyToPaperReview(itemId, reviewId, reply);
    } else {
      await reviewsAPI.replyToBlogReview(itemId, reviewId, reply);
    }
    
    // Update local state with reply
    setReviewsDialog(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => 
        r.id === reviewId 
          ? { ...r, admin_reply: reply, admin_reply_at: new Date().toISOString() }
          : r
      ),
    }));
  };

  const handleFlagReview = async (reviewId: string) => {
    const { type, itemId } = reviewsDialog;
    
    if (type === 'note') {
      await reviewsAPI.flagNoteReview(itemId, reviewId);
    } else if (type === 'paper') {
      await reviewsAPI.flagPaperReview(itemId, reviewId);
    } else {
      await reviewsAPI.flagBlogReview(itemId, reviewId);
    }
    
    // Update local state
    setReviewsDialog(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => 
        r.id === reviewId ? { ...r, status: 'flagged' as const } : r
      ),
    }));
  };

  const handleApproveReview = async (reviewId: string) => {
    const { type, itemId } = reviewsDialog;
    
    if (type === 'note') {
      await reviewsAPI.approveNoteReview(itemId, reviewId);
    } else if (type === 'paper') {
      await reviewsAPI.approvePaperReview(itemId, reviewId);
    } else {
      await reviewsAPI.approveBlogReview(itemId, reviewId);
    }
    
    // Update local state
    setReviewsDialog(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => 
        r.id === reviewId ? { ...r, status: 'approved' as const } : r
      ),
    }));
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await adminAPI.deleteNote(noteId);
      
      await fetchAllNotes(allNotesPagination.page, notesSearch);
      toast({
        title: "Note deleted",
        description: "Note deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.detail || "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this past paper?')) return;
    
    try {
      await adminAPI.deletePaper(paperId);
      
      await fetchAllPapers(allPapersPagination.page, papersSearch);
      toast({
        title: "Paper deleted",
        description: "Past paper deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.detail || "Failed to delete paper",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNoteStatus = async (noteId: string, status: string, feedback?: string) => {
    try {
      await adminAPI.updateNoteStatus(noteId, { status, feedback });
      await fetchAllNotes(allNotesPagination.page, notesSearch);
      toast({
        title: "Status updated",
        description: `Note ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaperStatus = async (paperId: string, status: string, feedback?: string) => {
    try {
      await adminAPI.updatePaperStatus(paperId, { status, feedback });
      await fetchAllPapers(allPapersPagination.page, papersSearch);
      toast({
        title: "Status updated",
        description: `Paper ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = async (noteId: string, data: any) => {
    try {
      console.log('Updating note with data:', data);
      
      // Use the backend's admin edit endpoint - include file_url and thumbnail_url
      await adminAPI.updateNote(noteId, {
        course_title: data.course_title,
        course_code: data.course_code,
        year_of_study: data.year_of_study,
        semester_of_study: data.semester_of_study,
        group: data.group || '',
        specialization: data.specialization,
        file_url: data.file_url,
        thumbnail_url: data.thumbnail_url,
        description: data.description,
        status: data.status,
        feedback: data.feedback
      });
      
      await fetchAllNotes(allNotesPagination.page, notesSearch);
      setEditingNote(null);
      toast({
        title: "Note updated",
        description: "All note details updated successfully",
      });
    } catch (error: any) {
      console.error('Note update error:', error);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = "Failed to update note";
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (errorDetail && typeof errorDetail === 'object') {
        errorMessage = errorDetail.msg || errorDetail.message || JSON.stringify(errorDetail);
      }
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditPaper = async (paperId: string, data: any) => {
    try {
      console.log('Updating paper with data:', data);
      
      // Use the backend's admin edit endpoint - include file_url and thumbnail_url
      await adminAPI.updatePaper(paperId, {
        course_title: data.course_title,
        course_code: data.course_code,
        year_of_study: data.year_of_study,
        semester_of_study: data.semester_of_study,
        group: data.group || '',
        specialization: data.specialization,
        file_url: data.file_url,
        thumbnail_url: data.thumbnail_url,
        description: data.description,
        status: data.status,
        feedback: data.feedback
      });
      
      await fetchAllPapers(allPapersPagination.page, papersSearch);
      setEditingPaper(null);
      toast({
        title: "Paper updated",
        description: "All paper details updated successfully",
      });
    } catch (error: any) {
      console.error('Paper update error:', error);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = "Failed to update paper";
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (errorDetail && typeof errorDetail === 'object') {
        errorMessage = errorDetail.msg || errorDetail.message || JSON.stringify(errorDetail);
      }
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Bulk action handlers
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllNotes = (notes: any[]) => {
    if (selectedNotes.size === notes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(notes.map(n => n.id)));
    }
  };

  const selectAllPapers = (papers: any[]) => {
    if (selectedPapers.size === papers.length) {
      setSelectedPapers(new Set());
    } else {
      setSelectedPapers(new Set(papers.map(p => p.id)));
    }
  };

  const selectAllUsers = (users: any[]) => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Pending bulk selection handlers
  const togglePendingNoteSelection = (noteId: string) => {
    setSelectedPendingNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const togglePendingPaperSelection = (paperId: string) => {
    setSelectedPendingPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const selectAllPendingNotes = () => {
    if (selectedPendingNotes.size === pendingNotes.length) {
      setSelectedPendingNotes(new Set());
    } else {
      setSelectedPendingNotes(new Set(pendingNotes.map(n => n.id)));
    }
  };

  const selectAllPendingPapers = () => {
    if (selectedPendingPapers.size === pendingPapers.length) {
      setSelectedPendingPapers(new Set());
    } else {
      setSelectedPendingPapers(new Set(pendingPapers.map(p => p.id)));
    }
  };

  const handleBulkPendingNotesAction = async (action: 'approve' | 'reject') => {
    if (selectedPendingNotes.size === 0) return;
    
    const actionText = action === 'approve' ? 'approve' : 'reject';
    setConfirmDialog({
      open: true,
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Pending Notes`,
      description: `Are you sure you want to ${actionText} ${selectedPendingNotes.size} pending note(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedPendingNotes).map(id => 
            adminAPI.updateNoteStatus(id, { status: action === 'approve' ? 'approved' : 'rejected' })
          );
          await Promise.all(promises);
          await fetchPendingNotes(notesPagination.page);
          setSelectedPendingNotes(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully ${actionText}d ${selectedPendingNotes.size} pending note(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || `Failed to ${actionText} some notes`,
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: action === 'reject' ? 'destructive' : 'default'
    });
  };

  const handleBulkPendingPapersAction = async (action: 'approve' | 'reject') => {
    if (selectedPendingPapers.size === 0) return;
    
    const actionText = action === 'approve' ? 'approve' : 'reject';
    setConfirmDialog({
      open: true,
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Pending Papers`,
      description: `Are you sure you want to ${actionText} ${selectedPendingPapers.size} pending paper(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedPendingPapers).map(id => 
            adminAPI.updatePaperStatus(id, { status: action === 'approve' ? 'approved' : 'rejected' })
          );
          await Promise.all(promises);
          await fetchPendingPapers(papersPagination.page);
          setSelectedPendingPapers(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully ${actionText}d ${selectedPendingPapers.size} pending paper(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || `Failed to ${actionText} some papers`,
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: action === 'reject' ? 'destructive' : 'default'
    });
  };

  const handleBulkNotesAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedNotes.size === 0) return;
    
    const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'delete';
    setConfirmDialog({
      open: true,
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Notes`,
      description: `Are you sure you want to ${actionText} ${selectedNotes.size} selected note(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedNotes).map(id => {
            if (action === 'delete') {
              return adminAPI.deleteNote(id);
            } else {
              return adminAPI.updateNoteStatus(id, { status: action === 'approve' ? 'approved' : 'rejected' });
            }
          });
          await Promise.all(promises);
          await fetchAllNotes(allNotesPagination.page, notesSearch);
          setSelectedNotes(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully ${actionText}d ${selectedNotes.size} note(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || `Failed to ${actionText} some notes`,
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: action === 'delete' || action === 'reject' ? 'destructive' : 'default'
    });
  };

  const handleBulkPapersAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedPapers.size === 0) return;
    
    const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'delete';
    setConfirmDialog({
      open: true,
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Papers`,
      description: `Are you sure you want to ${actionText} ${selectedPapers.size} selected paper(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedPapers).map(id => {
            if (action === 'delete') {
              return adminAPI.deletePaper(id);
            } else {
              return adminAPI.updatePaperStatus(id, { status: action === 'approve' ? 'approved' : 'rejected' });
            }
          });
          await Promise.all(promises);
          await fetchAllPapers(allPapersPagination.page, papersSearch);
          setSelectedPapers(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully ${actionText}d ${selectedPapers.size} paper(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || `Failed to ${actionText} some papers`,
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: action === 'delete' || action === 'reject' ? 'destructive' : 'default'
    });
  };

  const handleBulkUsersAction = async (action: 'verify' | 'unverify' | 'disable' | 'enable' | 'delete') => {
    if (selectedUsers.size === 0) return;
    
    const actionText = action;
    setConfirmDialog({
      open: true,
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Users`,
      description: `Are you sure you want to ${actionText} ${selectedUsers.size} selected user(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedUsers).map(id => {
            if (action === 'delete') {
              return adminAPI.deleteUser(id);
            } else {
              const updateData: any = {};
              if (action === 'verify') updateData.is_verified = true;
              if (action === 'unverify') updateData.is_verified = false;
              if (action === 'disable') updateData.is_disabled = true;
              if (action === 'enable') updateData.is_disabled = false;
              return adminAPI.updateUser(id, updateData);
            }
          });
          await Promise.all(promises);
          await fetchUsers(usersPagination.page, usersSearch);
          setSelectedUsers(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully processed ${selectedUsers.size} user(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || `Failed to ${actionText} some users`,
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: action === 'delete' || action === 'disable' ? 'destructive' : 'default'
    });
  };

  // Bulk blog selection handlers
  const toggleBlogSelection = (blogId: string) => {
    const newSelected = new Set(selectedBlogs);
    if (newSelected.has(blogId)) {
      newSelected.delete(blogId);
    } else {
      newSelected.add(blogId);
    }
    setSelectedBlogs(newSelected);
  };

  const selectAllBlogs = () => {
    if (selectedBlogs.size === blogs.length) {
      setSelectedBlogs(new Set());
    } else {
      setSelectedBlogs(new Set(blogs.map(b => b.id)));
    }
  };

  const handleBulkBlogsAction = async (action: 'delete') => {
    if (selectedBlogs.size === 0) return;
    
    setConfirmDialog({
      open: true,
      title: `Bulk Delete Blogs`,
      description: `Are you sure you want to delete ${selectedBlogs.size} selected blog(s)?`,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setIsBulkProcessing(true);
        try {
          const promises = Array.from(selectedBlogs).map(id => adminAPI.deleteBlog(id));
          await Promise.all(promises);
          await fetchBlogs(blogsPagination.page, blogsSearch, blogsGroupFilter, blogsSpecFilter);
          setSelectedBlogs(new Set());
          toast({
            title: "Bulk action completed",
            description: `Successfully deleted ${selectedBlogs.size} blog(s)`,
          });
        } catch (error: any) {
          toast({
            title: "Bulk action failed",
            description: error.response?.data?.detail || "Failed to delete some blogs",
            variant: "destructive",
          });
        } finally {
          setIsBulkProcessing(false);
        }
      },
      variant: 'destructive'
    });
  };

  if (isLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage users, content, and platform settings</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="shrink-0 mt-1">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Admin Profile Info Card */}
      {user && (
        <Card className="border border-border/60 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
                    {user.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-lg text-foreground">{user.name}</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    Verified
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-0.5"></span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">@{user.username} · {user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Year {user.year_of_study}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Semester {user.semester_of_study}
              </span>
              {user.specialization && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-background border border-border/60 text-foreground">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  {user.specialization}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar" style={{ touchAction: 'pan-x' }}>
          <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-7 h-auto gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50">
            <TabsTrigger value="pending" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4" />
                <span>Pending</span>
                {(notesPagination.total + papersPagination.total) > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-xs bg-amber-500 text-white border-0">{notesPagination.total + papersPagination.total}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <BookOpen className="w-4 h-4" />
                <span>Notes</span>
                {allNotesPagination.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{allNotesPagination.total}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="papers" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="w-4 h-4" />
                <span>Papers</span>
                {allPapersPagination.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{allPapersPagination.total}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Users className="w-4 h-4" />
                <span>Users</span>
                {usersPagination.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{usersPagination.total}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <BookMarked className="w-4 h-4" />
                <span>Blog</span>
                {blogsPagination.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{blogsPagination.total}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Settings className="w-4 h-4" />
                <span>Groups</span>
                {groups.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">{groups.length}</Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="text-sm px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
              <div className="flex items-center gap-2 font-medium">
                <MessageSquare className="w-4 h-4" />
                <span>Reviews</span>
                {adminTestimonials.filter(t => t.status === 'pending').length > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-xs bg-amber-500 text-white border-0">{adminTestimonials.filter(t => t.status === 'pending').length}</Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-4 sm:space-y-6">
          {/* Mobile Switcher */}
          <div className="flex xl:hidden">
            <div className="inline-flex rounded-lg border p-1 w-full">
              <button
                onClick={() => setPendingTabView('notes')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pendingTabView === 'notes'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <FileText className="w-4 h-4" />
                Notes
                <Badge variant="secondary" className="ml-1">{notesPagination.total}</Badge>
              </button>
              <button
                onClick={() => setPendingTabView('papers')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pendingTabView === 'papers'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Upload className="w-4 h-4" />
                Papers
                <Badge variant="secondary" className="ml-1">{papersPagination.total}</Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Pending Notes - show on desktop always, on mobile only when selected */}
            <Card className={`${pendingTabView !== 'notes' ? 'hidden xl:block' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Pending Notes</span>
                  </div>
                  <Badge variant="outline">{notesPagination.total}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bulk Actions Bar for Pending Notes */}
                {selectedPendingNotes.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{selectedPendingNotes.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleBulkPendingNotesAction('approve')} disabled={isBulkProcessing}>
                        <Check className="w-4 h-4 mr-1" />Approve All
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkPendingNotesAction('reject')} disabled={isBulkProcessing}>
                        <X className="w-4 h-4 mr-1" />Reject All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPendingNotes(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Select All for Pending Notes */}
                {pendingNotes.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPendingNotes}
                      className="p-1 h-auto"
                    >
                      {selectedPendingNotes.size === pendingNotes.length ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedPendingNotes.size === pendingNotes.length ? 'Deselect all' : 'Select all'}
                    </span>
                  </div>
                )}
                
                {pendingNotes.map((note: any) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePendingNoteSelection(note.id)}
                        className="p-1 h-auto shrink-0"
                      >
                        {selectedPendingNotes.has(note.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{note.course_title}</h3>
                        <p className="text-sm text-muted-foreground">{note.course_code}</p>
                        <p className="text-xs text-muted-foreground">By {note.uploaded_by_name}</p>
                        {note.description && (
                          <p className="text-xs text-muted-foreground mt-1">{note.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => confirmNoteAction(note.id, 'approved', note.course_title)}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmNoteAction(note.id, 'rejected', note.course_title)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDocument(note)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview File
                    </Button>
                  </div>
                ))}
                {pendingNotes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending notes</p>
                )}
                
                {/* Pagination for notes */}
                {notesPagination.total > 10 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPendingNotes(notesPagination.page - 1)}
                      disabled={notesPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {notesPagination.page} of {Math.ceil(notesPagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPendingNotes(notesPagination.page + 1)}
                      disabled={!notesPagination.hasNext}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Papers - show on desktop always, on mobile only when selected */}
            <Card className={`${pendingTabView !== 'papers' ? 'hidden xl:block' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Pending Papers</span>
                  </div>
                  <Badge variant="outline">{papersPagination.total}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bulk Actions Bar for Pending Papers */}
                {selectedPendingPapers.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{selectedPendingPapers.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleBulkPendingPapersAction('approve')} disabled={isBulkProcessing}>
                        <Check className="w-4 h-4 mr-1" />Approve All
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkPendingPapersAction('reject')} disabled={isBulkProcessing}>
                        <X className="w-4 h-4 mr-1" />Reject All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPendingPapers(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Select All for Pending Papers */}
                {pendingPapers.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPendingPapers}
                      className="p-1 h-auto"
                    >
                      {selectedPendingPapers.size === pendingPapers.length ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedPendingPapers.size === pendingPapers.length ? 'Deselect all' : 'Select all'}
                    </span>
                  </div>
                )}
                
                {pendingPapers.map((paper: any) => (
                  <div key={paper.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePendingPaperSelection(paper.id)}
                        className="p-1 h-auto shrink-0"
                      >
                        {selectedPendingPapers.has(paper.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{paper.course_title}</h3>
                        <p className="text-sm text-muted-foreground">{paper.course_code}</p>
                        <p className="text-xs text-muted-foreground">By {paper.uploaded_by_name}</p>
                        {paper.description && (
                          <p className="text-xs text-muted-foreground mt-1">{paper.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => confirmPaperAction(paper.id, 'approved', paper.course_title)}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmPaperAction(paper.id, 'rejected', paper.course_title)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDocument(paper)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview File
                    </Button>
                  </div>
                ))}
                {pendingPapers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending papers</p>
                )}
                
                {/* Pagination for papers */}
                {papersPagination.total > 10 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPendingPapers(papersPagination.page - 1)}
                      disabled={papersPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {papersPagination.page} of {Math.ceil(papersPagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPendingPapers(papersPagination.page + 1)}
                      disabled={!papersPagination.hasNext}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:gap-2">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>All Notes</span>
                    <Badge variant="outline">{allNotesPagination.total}</Badge>
                  </CardTitle>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Input
                      placeholder="Search notes..."
                      value={notesSearch}
                      onChange={(e) => setNotesSearch(e.target.value)}
                      className="w-full sm:w-48"
                    />
                    <Button onClick={handleNotesSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-2">
                  <Select value={notesYearFilter} onValueChange={setNotesYearFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={notesSemesterFilter} onValueChange={setNotesSemesterFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={notesGroupFilter} onValueChange={(v) => { setNotesGroupFilter(v); setNotesSpecFilter('all'); }}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={notesSpecFilter} onValueChange={setNotesSpecFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specs</SelectItem>
                      {(notesGroupFilter !== 'all'
                        ? (groups.find(g => g.code === notesGroupFilter)?.specializations || [])
                        : contentSpecializations
                      ).map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Bulk Actions Bar */}
                {selectedNotes.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{selectedNotes.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleBulkNotesAction('approve')} disabled={isBulkProcessing}>
                        <Check className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkNotesAction('reject')} disabled={isBulkProcessing}>
                        <X className="w-4 h-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkNotesAction('delete')} disabled={isBulkProcessing}>
                        <Trash2 className="w-4 h-4 mr-1" />Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedNotes(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Notes Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{allNotesPagination.total}</p>
                  <p className="text-xs text-muted-foreground">Total Notes</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{allNotes.filter(n => n.status === 'approved').length}+</p>
                  <p className="text-xs text-muted-foreground">Approved (on this page)</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{notesPagination.total}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{allNotes.filter(n => n.status === 'rejected').length}+</p>
                  <p className="text-xs text-muted-foreground">Rejected (on this page)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Select All */}
                {allNotes.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <button
                      onClick={() => selectAllNotes(allNotes.filter(note => 
                        (notesYearFilter === 'all' || note.year_of_study?.toString() === notesYearFilter) &&
                        (notesSemesterFilter === 'all' || note.semester_of_study?.toString() === notesSemesterFilter)
                      ))}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedNotes.size === allNotes.filter(note => 
                        (notesYearFilter === 'all' || note.year_of_study?.toString() === notesYearFilter) &&
                        (notesSemesterFilter === 'all' || note.semester_of_study?.toString() === notesSemesterFilter)
                      ).length && allNotes.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                  </div>
                )}
                {allNotes
                  .filter(note => notesYearFilter === 'all' || note.year_of_study?.toString() === notesYearFilter)
                  .filter(note => notesSemesterFilter === 'all' || note.semester_of_study?.toString() === notesSemesterFilter)
                  .filter(note => notesGroupFilter === 'all' || note.group === notesGroupFilter)
                  .filter(note => notesSpecFilter === 'all' || note.specialization === notesSpecFilter)
                  .map((note: any) => (
                  <div key={note.id} className={`border rounded-lg p-4 space-y-3 ${selectedNotes.has(note.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                    <div className="flex flex-col space-y-3 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
                      <div className="flex gap-3 flex-1">
                        <button
                          onClick={() => toggleNoteSelection(note.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {selectedNotes.has(note.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        <div className="space-y-2">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base">{note.course_title}</h3>
                          <p className="text-sm text-muted-foreground">{note.course_code}</p>
                          <p className="text-xs text-muted-foreground">
                            By {note.uploaded_by_name} • Year {note.year_of_study}, Sem {note.semester_of_study}
                          </p>
                          {note.specialization && (
                            <p className="text-xs text-muted-foreground">
                              Specialization: {note.specialization}
                            </p>
                          )}
                          {note.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={
                            note.status === 'approved' ? 'default' :
                            note.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {note.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{note.views} views</span>
                          <button
                            onClick={() => openReviewsDialog('note', note)}
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {(note.average_rating || 0).toFixed(1)}
                            <MessageSquare className="w-3 h-3 ml-1" />
                            {note.reviews_count || note.total_reviews || 0}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {note.feedback && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                            <strong>Feedback:</strong> {note.feedback}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2 w-full lg:w-auto">
                        <Select 
                          value={note.status} 
                          onValueChange={(status) => handleUpdateNoteStatus(note.id, status)}
                        >
                          <SelectTrigger className="w-full lg:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingNote(note)}
                            className="flex-1 min-w-[70px]"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="ml-1">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(note)}
                            className="flex-1 min-w-[70px]"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="ml-1">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteNote(note.id)}
                            className="flex-1 min-w-[70px]"
                          >
                            <X className="w-4 h-4" />
                            <span className="ml-1">Delete</span>
                          </Button>
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {allNotes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No notes found</p>
                )}
                
                {/* Pagination for notes */}
                {allNotesPagination.total > 10 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAllNotes(allNotesPagination.page - 1, notesSearch)}
                      disabled={allNotesPagination.page === 1}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground text-center">
                      Page {allNotesPagination.page} of {Math.ceil(allNotesPagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAllNotes(allNotesPagination.page + 1, notesSearch)}
                      disabled={!allNotesPagination.hasNext}
                      className="w-full sm:w-auto"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="papers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:gap-2">
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>All Past Papers</span>
                    <Badge variant="outline">{allPapersPagination.total}</Badge>
                  </CardTitle>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Input
                      placeholder="Search papers..."
                      value={papersSearch}
                      onChange={(e) => setPapersSearch(e.target.value)}
                      className="w-full sm:w-48"
                    />
                    <Button onClick={handlePapersSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-2">
                  <Select value={papersYearFilter} onValueChange={setPapersYearFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={papersSemesterFilter} onValueChange={setPapersSemesterFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={papersGroupFilter} onValueChange={(v) => { setPapersGroupFilter(v); setPapersSpecFilter('all'); }}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={papersSpecFilter} onValueChange={setPapersSpecFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specs</SelectItem>
                      {(papersGroupFilter !== 'all'
                        ? (groups.find(g => g.code === papersGroupFilter)?.specializations || [])
                        : contentSpecializations
                      ).map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Bulk Actions Bar */}
                {selectedPapers.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{selectedPapers.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleBulkPapersAction('approve')} disabled={isBulkProcessing}>
                        <Check className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkPapersAction('reject')} disabled={isBulkProcessing}>
                        <X className="w-4 h-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkPapersAction('delete')} disabled={isBulkProcessing}>
                        <Trash2 className="w-4 h-4 mr-1" />Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPapers(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Papers Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{allPapersPagination.total}</p>
                  <p className="text-xs text-muted-foreground">Total Papers</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{allPapers.filter(p => p.status === 'approved').length}+</p>
                  <p className="text-xs text-muted-foreground">Approved (on this page)</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{papersPagination.total}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{allPapers.filter(p => p.status === 'rejected').length}+</p>
                  <p className="text-xs text-muted-foreground">Rejected (on this page)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Select All */}
                {allPapers.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <button
                      onClick={() => selectAllPapers(allPapers.filter(paper => 
                        (papersYearFilter === 'all' || paper.year_of_study?.toString() === papersYearFilter) &&
                        (papersSemesterFilter === 'all' || paper.semester_of_study?.toString() === papersSemesterFilter)
                      ))}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedPapers.size === allPapers.filter(paper => 
                        (papersYearFilter === 'all' || paper.year_of_study?.toString() === papersYearFilter) &&
                        (papersSemesterFilter === 'all' || paper.semester_of_study?.toString() === papersSemesterFilter)
                      ).length && allPapers.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                  </div>
                )}
                {allPapers
                  .filter(paper => papersYearFilter === 'all' || paper.year_of_study?.toString() === papersYearFilter)
                  .filter(paper => papersSemesterFilter === 'all' || paper.semester_of_study?.toString() === papersSemesterFilter)
                  .filter(paper => papersGroupFilter === 'all' || paper.group === papersGroupFilter)
                  .filter(paper => papersSpecFilter === 'all' || paper.specialization === papersSpecFilter)
                  .map((paper: any) => (
                  <div key={paper.id} className={`border rounded-lg p-4 space-y-3 ${selectedPapers.has(paper.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                    <div className="flex flex-col space-y-3 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
                      <div className="flex gap-3 flex-1">
                        <button
                          onClick={() => togglePaperSelection(paper.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {selectedPapers.has(paper.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        <div className="space-y-2">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base">{paper.course_title}</h3>
                          <p className="text-sm text-muted-foreground">{paper.course_code}</p>
                          <p className="text-xs text-muted-foreground">
                            By {paper.uploaded_by_name} • Year {paper.year_of_study}, Sem {paper.semester_of_study}
                          </p>
                          {paper.specialization && (
                            <p className="text-xs text-muted-foreground">
                              Specialization: {paper.specialization}
                            </p>
                          )}
                          {paper.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{paper.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={
                            paper.status === 'approved' ? 'default' :
                            paper.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {paper.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{paper.views} views</span>
                          <button
                            onClick={() => openReviewsDialog('paper', paper)}
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {(paper.average_rating || 0).toFixed(1)}
                            <MessageSquare className="w-3 h-3 ml-1" />
                            {paper.reviews_count || paper.total_reviews || 0}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {new Date(paper.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {paper.feedback && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                            <strong>Feedback:</strong> {paper.feedback}
                          </p>
                        )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 w-full lg:w-auto">
                        <Select 
                          value={paper.status} 
                          onValueChange={(status) => handleUpdatePaperStatus(paper.id, status)}
                        >
                          <SelectTrigger className="w-full lg:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPaper(paper)}
                            className="flex-1 min-w-[70px]"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="ml-1">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(paper)}
                            className="flex-1 min-w-[70px]"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="ml-1">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePaper(paper.id)}
                            className="flex-1 min-w-[70px]"
                          >
                            <X className="w-4 h-4" />
                            <span className="ml-1">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {allPapers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No past papers found</p>
                )}
                
                {/* Pagination for papers */}
                {allPapersPagination.total > 10 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAllPapers(allPapersPagination.page - 1, papersSearch)}
                      disabled={allPapersPagination.page === 1}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground text-center">
                      Page {allPapersPagination.page} of {Math.ceil(allPapersPagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAllPapers(allPapersPagination.page + 1, papersSearch)}
                      disabled={!allPapersPagination.hasNext}
                      className="w-full sm:w-auto"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-2">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>User Management</span>
                    <Badge variant="outline">{usersPagination.total}</Badge>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Input
                      placeholder="Search users..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="w-full sm:w-64"
                    />
                    <Button onClick={handleUsersSearch} size="sm" className="w-full sm:w-auto">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-2">
                  <Select value={usersStatusFilter} onValueChange={setUsersStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="super_admins">Super Admins</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="not_verified">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersYearFilter} onValueChange={setUsersYearFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersSemesterFilter} onValueChange={setUsersSemesterFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersGroupFilter} onValueChange={(v) => { setUsersGroupFilter(v); setUsersSpecFilter('all'); }}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={usersSpecFilter} onValueChange={setUsersSpecFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specs</SelectItem>
                      {(usersGroupFilter !== 'all'
                        ? (groups.find(g => g.code === usersGroupFilter)?.specializations || [])
                        : allSpecializations
                      ).map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{selectedUsers.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleBulkUsersAction('verify')} disabled={isBulkProcessing}>
                        <Check className="w-4 h-4 mr-1" />Verify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkUsersAction('enable')} disabled={isBulkProcessing}>
                        Enable
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkUsersAction('disable')} disabled={isBulkProcessing}>
                        Disable
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkUsersAction('delete')} disabled={isBulkProcessing}>
                        <Trash2 className="w-4 h-4 mr-1" />Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* User Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{usersPagination.total}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{users.filter(u => u.is_admin).length}+</p>
                  <p className="text-xs text-muted-foreground">Admins (on this page)</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_verified).length}+</p>
                  <p className="text-xs text-muted-foreground">Verified (on this page)</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{users.filter(u => u.is_disabled).length}+</p>
                  <p className="text-xs text-muted-foreground">Disabled (on this page)</p>
                </div>
              </div>
              <div className="space-y-4">
                {/* Select All */}
                {users.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <button
                      onClick={() => selectAllUsers(users.filter(user => {
                        let matches = true;
                        if (usersStatusFilter === 'super_admins') matches = user.role === 'super_admin';
                        else if (usersStatusFilter === 'admins') matches = user.role === 'admin' || user.is_admin;
                        else if (usersStatusFilter === 'students') matches = !user.is_admin && user.role !== 'super_admin';
                        else if (usersStatusFilter === 'active') matches = !user.is_disabled;
                        else if (usersStatusFilter === 'disabled') matches = user.is_disabled;
                        else if (usersStatusFilter === 'verified') matches = user.is_verified;
                        else if (usersStatusFilter === 'not_verified') matches = !user.is_verified;
                        return matches &&
                          (usersYearFilter === 'all' || user.year_of_study?.toString() === usersYearFilter) &&
                          (usersSemesterFilter === 'all' || user.semester_of_study?.toString() === usersSemesterFilter);
                      }))}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedUsers.size > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users
                  .filter(user => {
                    if (usersStatusFilter === 'all') return true;
                    if (usersStatusFilter === 'super_admins') return user.role === 'super_admin';
                    if (usersStatusFilter === 'admins') return user.role === 'admin' || user.is_admin;
                    if (usersStatusFilter === 'students') return !user.is_admin && user.role !== 'super_admin';
                    if (usersStatusFilter === 'active') return !user.is_disabled;
                    if (usersStatusFilter === 'disabled') return user.is_disabled;
                    if (usersStatusFilter === 'verified') return user.is_verified;
                    if (usersStatusFilter === 'not_verified') return !user.is_verified;
                    return true;
                  })
                  .filter(user => usersYearFilter === 'all' || user.year_of_study?.toString() === usersYearFilter)
                  .filter(user => usersSemesterFilter === 'all' || user.semester_of_study?.toString() === usersSemesterFilter)
                  .filter(user => usersGroupFilter === 'all' || user.group === usersGroupFilter)
                  .filter(user => usersSpecFilter === 'all' || user.specialization === usersSpecFilter)
                  .map((user: any) => (
                  <div key={user.id} className={`flex flex-col p-4 border rounded-lg bg-card space-y-3 ${selectedUsers.has(user.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                    <div className="flex gap-3 flex-1">
                      <button
                        onClick={() => toggleUserSelection(user.id)}
                        className="flex-shrink-0 mt-1"
                      >
                        {selectedUsers.has(user.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                      {/* User Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border">
                        {(user.profile_picture || user.profile_picture_url || user.avatar_url) ? (
                          <img 
                            src={user.profile_picture || user.profile_picture_url || user.avatar_url} 
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Year {user.year_of_study}, Semester {user.semester_of_study}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant="secondary"
                            className={user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                          >
                            {user.role === 'super_admin' ? '⭐ Super Admin' : user.role === 'admin' ? 'Admin' : 'Student'}
                          </Badge>
                          <Badge variant={user.is_verified ? 'default' : 'destructive'}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge variant={user.is_disabled ? 'destructive' : 'default'}>
                            {user.is_disabled ? 'Disabled' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUserDelete(user.id)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
                
                {users.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
                
                {/* Pagination for users */}
                {usersPagination.total > 10 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(usersPagination.page - 1, usersSearch)}
                      disabled={usersPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {usersPagination.page} of {Math.ceil(usersPagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(usersPagination.page + 1, usersSearch)}
                      disabled={!usersPagination.hasNext}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <div className="space-y-6">
            <BlogManagementModal onBlogCreated={() => fetchBlogs(1, blogsSearch, blogsGroupFilter, blogsSpecFilter)} />
            
            {/* Existing Blogs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <CardTitle className="flex items-center space-x-2">
                    <PenTool className="w-5 h-5" />
                    <span>Blog Posts</span>
                    <Badge variant="outline">{blogsPagination.total}</Badge>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Search blogs..."
                      value={blogsSearch}
                      onChange={(e) => setBlogsSearch(e.target.value)}
                      className="w-40"
                    />
                    <Select value={blogsGroupFilter} onValueChange={(v) => { setBlogsGroupFilter(v); setBlogsSpecFilter('all'); fetchBlogs(1, blogsSearch, v, 'all'); }}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All groups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All groups</SelectItem>
                        {dynamicGroups.map(g => (
                          <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={blogsSpecFilter} onValueChange={(v) => { setBlogsSpecFilter(v); fetchBlogs(1, blogsSearch, blogsGroupFilter, v); }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All specs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All specializations</SelectItem>
                        {(blogsGroupFilter && blogsGroupFilter !== 'all' ? (dynamicGroups.find(g => g.code === blogsGroupFilter)?.specializations || []) : contentSpecializations).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBlogsSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Blogs Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{blogsPagination.total}</p>
                    <p className="text-xs text-muted-foreground">Total Blogs</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{blogs.reduce((sum: number, b: any) => sum + (b.views || 0), 0)}+</p>
                    <p className="text-xs text-muted-foreground">Views (on this page)</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-green-600">{blogs.filter((b: any) => {
                      const createdAt = new Date(b.created_at);
                      const now = new Date();
                      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }).length}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
                {/* Bulk Actions Bar for Blogs */}
                {selectedBlogs.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 mb-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{selectedBlogs.size} selected</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleBulkBlogsAction('delete')} disabled={isBulkProcessing}>
                        <Trash2 className="w-4 h-4 mr-1" />Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedBlogs(new Set())} disabled={isBulkProcessing}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Select All for Blogs */}
                  {blogs.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllBlogs}
                        className="p-1 h-auto"
                      >
                        {selectedBlogs.size === blogs.length ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedBlogs.size === blogs.length ? 'Deselect all' : 'Select all'}
                      </span>
                    </div>
                  )}
                  
                  {blogs.map((blog: any) => (
                    <div key={blog.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border rounded-lg gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBlogSelection(blog.id)}
                          className="p-1 h-auto shrink-0 mt-1"
                        >
                          {selectedBlogs.has(blog.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </Button>
                        <div className="space-y-2 flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base line-clamp-2">{blog.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {blog.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{blog.views} views</span>
                            </span>
                            <button
                              onClick={() => openReviewsDialog('blog', blog)}
                              className="flex items-center space-x-1 hover:text-foreground transition-colors"
                            >
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{(blog.average_rating || 0).toFixed(1)}</span>
                              <MessageSquare className="w-3 h-3 ml-1" />
                              <span>{blog.reviews_count || blog.total_reviews || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingBlog(blog)}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBlog(blog.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {blogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No blog posts found</p>
                  )}
                  
                  {/* Pagination for blogs */}
                  {blogsPagination.total > 10 && (
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBlogs(blogsPagination.page - 1, blogsSearch)}
                        disabled={blogsPagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {blogsPagination.page} of {Math.ceil(blogsPagination.total / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchBlogs(blogsPagination.page + 1, blogsSearch)}
                        disabled={!blogsPagination.hasNext}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                <span>Study Groups & Specializations</span>
                <Badge variant="outline">{groups.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage academic programme groups and their specializations. Changes apply site-wide immediately.</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manage" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="manage" className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Manage Groups
                  </TabsTrigger>
                  <TabsTrigger value="add" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Add New Group
                  </TabsTrigger>
                </TabsList>

                {/* Sub-tab 1: Manage existing groups */}
                <TabsContent value="manage" className="mt-0">
                  {groupsLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading groups...
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>No groups yet. Switch to "Add New Group" to create one.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groups.map(group => (
                        <div key={group.id} className="border rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between p-4 bg-muted/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">{group.code}</Badge>
                                <span className="font-semibold text-foreground">{group.name}</span>
                              </div>
                              {group.description && <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{group.specializations?.length || 0} specialization(s)</p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (!confirm(`Delete group "${group.name}"? Existing users and content won't be affected.`)) return;
                                try {
                                  await adminAPI.deleteGroup(group.id);
                                  toast({ title: 'Group deleted' });
                                  fetchGroups();
                                } catch (e: any) {
                                  toast({ title: 'Failed', description: e.response?.data?.detail || 'Failed to delete', variant: 'destructive' });
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="p-4 space-y-3">
                            {/* Specializations list */}
                            <div className="flex flex-wrap gap-2">
                              {(group.specializations || []).map((spec: string) => (
                                <div key={spec} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  <span>{spec}</span>
                                  <button
                                    className="ml-1 text-primary/60 hover:text-destructive transition-colors"
                                    onClick={async () => {
                                      if (!confirm(`Remove specialization "${spec}" from ${group.name}?`)) return;
                                      try {
                                        await adminAPI.removeSpecialization(group.id, spec);
                                        toast({ title: 'Removed', description: `${spec} removed from ${group.name}` });
                                        fetchGroups();
                                      } catch (e: any) {
                                        toast({ title: 'Failed', description: e.response?.data?.detail || 'Failed', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(group.specializations || []).length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No specializations yet</p>
                              )}
                            </div>
                            {/* Add specialization inline */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add specialization (e.g. MARKETING)"
                                value={newSpecInputs[group.id] || ''}
                                onChange={e => setNewSpecInputs(prev => ({ ...prev, [group.id]: e.target.value.toUpperCase() }))}
                                className="h-8 text-xs uppercase"
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const specName = newSpecInputs[group.id]?.trim();
                                    if (!specName) return;
                                    try {
                                      await adminAPI.addSpecialization(group.id, specName);
                                      toast({ title: 'Added', description: `${specName} added to ${group.name}` });
                                      setNewSpecInputs(prev => ({ ...prev, [group.id]: '' }));
                                      fetchGroups();
                                    } catch (e: any) {
                                      toast({ title: 'Failed', description: e.response?.data?.detail || 'Failed', variant: 'destructive' });
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={async () => {
                                  const specName = newSpecInputs[group.id]?.trim();
                                  if (!specName) return;
                                  try {
                                    await adminAPI.addSpecialization(group.id, specName);
                                    toast({ title: 'Added', description: `${specName} added to ${group.name}` });
                                    setNewSpecInputs(prev => ({ ...prev, [group.id]: '' }));
                                    fetchGroups();
                                  } catch (e: any) {
                                    toast({ title: 'Failed', description: e.response?.data?.detail || 'Failed', variant: 'destructive' });
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Sub-tab 2: Add new group */}
                <TabsContent value="add" className="mt-0">
                  <div className="p-5 border border-dashed border-primary/30 rounded-xl bg-primary/5 space-y-4">
                    <div>
                      <p className="font-semibold text-sm text-foreground mb-0.5">Create a New Group</p>
                      <p className="text-xs text-muted-foreground">Fill in the details below to add a new study group and its specializations.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Programme Name *</Label>
                        <Input placeholder="e.g. Bachelor of Commerce" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Code * (e.g. SBE)</Label>
                        <Input placeholder="e.g. SBE" value={newGroupCode} onChange={e => setNewGroupCode(e.target.value.toUpperCase())} className="h-9 text-sm uppercase" maxLength={10} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input placeholder="Short description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Specializations (comma-separated)</Label>
                      <Input placeholder="e.g. MARKETING, ACCOUNTING, FINANCE" value={newGroupSpecs} onChange={e => setNewGroupSpecs(e.target.value)} className="h-9 text-sm" />
                      <p className="text-xs text-muted-foreground">Enter specialization names separated by commas. They will be stored in uppercase.</p>
                    </div>
                    <Button
                      disabled={addingGroup || !newGroupName.trim() || !newGroupCode.trim()}
                      onClick={async () => {
                        setAddingGroup(true);
                        try {
                          const specs = newGroupSpecs.split(',').map(s => s.trim()).filter(Boolean);
                          await adminAPI.createGroup({ name: newGroupName, code: newGroupCode, description: newGroupDesc, specializations: specs });
                          toast({ title: 'Group created!', description: `${newGroupCode} group has been created.` });
                          setNewGroupName(''); setNewGroupCode(''); setNewGroupDesc(''); setNewGroupSpecs('');
                          fetchGroups();
                        } catch (e: any) {
                          toast({ title: 'Failed', description: e.response?.data?.detail || 'Failed to create group', variant: 'destructive' });
                        } finally {
                          setAddingGroup(false);
                        }
                      }}
                    >
                      {addingGroup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GraduationCap className="w-4 h-4 mr-2" />}
                      Create Group
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>


          <TabsContent value="testimonials" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Testimonials</h3>
                    <p className="text-sm text-muted-foreground">Approve, reject, or delete student testimonials</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setTestimonialsFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${testimonialsFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                    <button
                      onClick={fetchAdminTestimonials}
                      className="p-1.5 rounded-md border border-border hover:bg-muted transition"
                      title="Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {testimonialsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (() => {
                  const filtered = adminTestimonials.filter(t => testimonialsFilter === 'all' || t.status === testimonialsFilter);
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No testimonials found</p>
                        <p className="text-sm mt-1">
                          {testimonialsFilter !== 'all' ? `No ${testimonialsFilter} testimonials.` : 'No testimonials have been submitted yet.'}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filtered.map((t: any) => (
                        <div key={t.id} className="border border-border rounded-xl p-4 flex flex-col gap-3 bg-card">
                          <div className="flex items-start gap-3">
                            {t.profile_picture ? (
                              <img src={t.profile_picture} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                                {t.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{t.role || '—'}</p>
                              <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= (t.rating || 5) ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                                ))}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              t.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              t.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>{t.status}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 italic">"{t.message}"</p>
                          <p className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</p>
                          <div className="flex gap-2 flex-wrap pt-1 border-t border-border mt-auto">
                            {t.status !== 'approved' && (
                              <button
                                onClick={() => updateTestimonialStatus(t.id, 'approved')}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 font-medium transition"
                              >
                                <Check className="w-3.5 h-3.5" />Approve
                              </button>
                            )}
                            {t.status !== 'rejected' && (
                              <button
                                onClick={() => updateTestimonialStatus(t.id, 'rejected')}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 font-medium transition"
                              >
                                <X className="w-3.5 h-3.5" />Reject
                              </button>
                            )}
                            <button
                              onClick={() => deleteTestimonial(t.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 font-medium transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          </Tabs>

        {/* Place DocumentViewer here */}
        {viewingDocument && (
          <DocumentViewer
            fileUrl={viewingDocument.file_url}
            title={viewingDocument.course_title || viewingDocument.title || 'Document Preview'}
            fileName={viewingDocument.file_name || viewingDocument.course_title}
            isOpen={isDocumentViewerOpen}
            onClose={() => {
              setIsDocumentViewerOpen(false);
              setViewingDocument(null);
            }}
          />
        )}

        {/* Reviews Dialog */}
        <ReviewsDialog
          isOpen={reviewsDialog.isOpen}
          onClose={() => setReviewsDialog(prev => ({ ...prev, isOpen: false }))}
          title={`Reviews for "${reviewsDialog.title}"`}
          reviews={reviewsDialog.reviews}
          averageRating={reviewsDialog.averageRating}
          onDeleteReview={handleDeleteReview}
          onReplyToReview={handleReplyToReview}
          onFlagReview={handleFlagReview}
          onApproveReview={handleApproveReview}
          isLoading={reviewsDialog.isLoading}
        />

        {/* Edit Note Dialog */}
        {editingNote && (
          <EditNoteDialog
            note={editingNote}
            onClose={() => setEditingNote(null)}
            onSave={handleEditNote}
          />
        )}

        {/* Edit Paper Dialog */}
        {editingPaper && (
          <EditPaperDialog
            paper={editingPaper}
            onClose={() => setEditingPaper(null)}
            onSave={handleEditPaper}
          />
        )}

        {/* Edit User Dialog */}
        {editingUser && (
          <EditUserDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleUserUpdate}
            isUpdating={isUpdatingUser}
          />
        )}

        {/* Edit Blog Dialog */}
        {editingBlog && (
          <EditBlogDialog
            blog={editingBlog}
            onClose={() => setEditingBlog(null)}
            onSave={handleBlogUpdate}
            isUpdating={isUpdatingBlog}
          />
        )}

        {/* Confirm Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => { setConfirmDialog(prev => ({ ...prev, open })); if (!open) setConfirmRemarks(''); }}>
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {confirmDialog.showRemarks && (
              <div className="space-y-1.5 py-1">
                <Label className="text-sm">{confirmDialog.remarksLabel || 'Remarks (optional)'}</Label>
                <Textarea
                  value={confirmRemarks}
                  onChange={(e) => setConfirmRemarks(e.target.value)}
                  placeholder="Add a note for the uploader..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmRemarks('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDialog.action(confirmRemarks || undefined)}
                className={confirmDialog.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  // Edit User Dialog Component
  const EditUserDialog: React.FC<{
    user: any;
    onClose: () => void;
    onSave: (userId: string, data: any) => void;
    isUpdating: boolean;
  }> = ({ user, onClose, onSave, isUpdating }) => {
    const { groups: allGroups, getSpecializationsForGroup, allSpecializations } = useGroups();
    const [formData, setFormData] = useState({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      year_of_study: user.year_of_study || 1,
      semester_of_study: user.semester_of_study || 1,
      group: user.group || '',
      specialization: user.specialization || '',
      is_admin: user.is_admin || false,
      is_verified: user.is_verified || false,
      is_disabled: user.is_disabled || false,
    });
    const userSpecializations = formData.group
      ? getSpecializationsForGroup(formData.group)
      : allSpecializations;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(user.id, formData);
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year of Study</Label>
                <Select
                  value={formData.year_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={formData.semester_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Select
                value={formData.group || '__none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, group: v === '__none' ? '' : v, specialization: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No group</SelectItem>
                  {allGroups.map(g => (
                    <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.year_of_study >= 3 && (
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Select
                  value={formData.specialization || '__none'}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, specialization: v === '__none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No specialization</SelectItem>
                    {userSpecializations.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Admin</Label>
                <Switch
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_admin: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Verified</Label>
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Disabled</Label>
                <Switch
                  checked={formData.is_disabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_disabled: checked }))}
                />
              </div>
            </div>
            <div className="flex space-x-4 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="flex-1">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Edit Note Dialog Component
  const EditNoteDialog: React.FC<{
    note: any;
    onClose: () => void;
    onSave: (noteId: string, data: any) => void;
  }> = ({ note, onClose, onSave }) => {
    const { groups: noteGroups, getSpecializationsForGroup, contentSpecializations } = useGroups();
    const [formData, setFormData] = useState({
      course_title: note.course_title || '',
      course_code: note.course_code || '',
      year_of_study: note.year_of_study || 1,
      semester_of_study: note.semester_of_study || 1,
      group: note.group || '',
      specializations: note.specialization ? (Array.isArray(note.specialization) ? note.specialization : [note.specialization]) : ['COMMON'],
      description: note.description || '',
      status: note.status || 'pending',
      feedback: note.feedback || '',
      file_url: note.file_url || '',
      thumbnail_url: note.thumbnail_url || '',
    });
    const noteSpecializations = formData.group
      ? getSpecializationsForGroup(formData.group).filter(s => s !== 'COMMON').concat(['COMMON'])
      : contentSpecializations.filter(s => s !== 'COMMON').concat(['COMMON']);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [fileProgress, setFileProgress] = useState(0);
    const [thumbnailProgress, setThumbnailProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingFile(true);
      setFileProgress(0);
      try {
        const ext = file.name.split('.').pop();
        const base = file.name.replace(/\.[^/.]+$/, '');
        const randomStr = makeId(3);
        const uniqueName = `${base}${randomStr}.${ext}`;
        const fileUrl = await uploadToGithubCdn(file, uniqueName, (progress) => {
          setFileProgress(progress);
        });
        setFormData(prev => ({ ...prev, file_url: fileUrl }));
        toast({
          title: "File uploaded",
          description: "New file uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploadingFile(false);
        setFileProgress(0);
      }
    };

    const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setIsUploadingThumbnail(true);
      setThumbnailProgress(0);
      try {
        const ext = file.name.split('.').pop();
        const base = file.name.replace(/\.[^/.]+$/, '');
        const randomStr = makeId(3);
        const uniqueName = `${base}${randomStr}.${ext}`;
        const imageUrl = await uploadToGithubCdn(file, uniqueName, (progress) => {
          setThumbnailProgress(progress);
        });
        setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
        toast({
          title: "Thumbnail uploaded",
          description: "Thumbnail uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload thumbnail",
          variant: "destructive",
        });
      } finally {
        setIsUploadingThumbnail(false);
        setThumbnailProgress(0);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        await onSave(note.id, { ...formData, group: formData.group, specialization: formData.specializations });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Note</DialogTitle>
            <DialogDescription className="text-sm">
              Update the note information, files, and status
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_title">Course Title</Label>
                <Input
                  id="course_title"
                  value={formData.course_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_title: e.target.value }))}
                  placeholder="e.g., Database Management Systems"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={formData.course_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CS101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Select
                  value={formData.year_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Group</Label>
              <Select
                value={formData.group || '__none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, group: v === '__none' ? '' : v, specializations: ['COMMON'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No group / Common</SelectItem>
                  {noteGroups.map(g => (
                    <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.year_of_study >= 3 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Specialization</label>
                <ContentSpecializationMulti
                  specializations={noteSpecializations}
                  value={formData.specializations || []}
                  onChange={(vals) => setFormData(prev => ({ ...prev, specializations: vals }))}
                />
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-2 border rounded-lg p-3">
              <Label>Document File</Label>
              <p className="text-xs text-muted-foreground truncate">{formData.file_url ? formData.file_url.split('/').pop() : 'No file'}</p>
              {isUploadingFile && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{fileProgress}%</span>
                  </div>
                  <Progress value={fileProgress} className="h-2" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><FileUp className="mr-2 h-4 w-4" />Replace File</>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Thumbnail Upload Section */}
            <div className="space-y-2 border rounded-lg p-3">
              <Label>Thumbnail (Optional)</Label>
              {formData.thumbnail_url && (
                <div className="w-24 h-24 bg-muted rounded overflow-hidden">
                  <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}
              {isUploadingThumbnail && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{thumbnailProgress}%</span>
                  </div>
                  <Progress value={thumbnailProgress} className="h-2" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploadingThumbnail}
              >
                {isUploadingThumbnail ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><Image className="mr-2 h-4 w-4" />{formData.thumbnail_url ? 'Replace' : 'Upload'} Thumbnail</>
                )}
              </Button>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the notes content..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Admin Feedback</Label>
                <Input
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Feedback for user..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading || isUploadingFile || isUploadingThumbnail}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isUploadingFile || isUploadingThumbnail}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Note'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Edit Paper Dialog Component
  const EditPaperDialog: React.FC<{
    paper: any;
    onClose: () => void;
    onSave: (paperId: string, data: any) => void;
  }> = ({ paper, onClose, onSave }) => {
    const { groups: paperGroups, getSpecializationsForGroup, contentSpecializations } = useGroups();
    const [formData, setFormData] = useState({
      course_title: paper.course_title || '',
      course_code: paper.course_code || '',
      year_of_study: paper.year_of_study || 1,
      semester_of_study: paper.semester_of_study || 1,
      group: paper.group || '',
      specializations: paper.specialization ? (Array.isArray(paper.specialization) ? paper.specialization : [paper.specialization]) : ['COMMON'],
      description: paper.description || '',
      status: paper.status || 'pending',
      feedback: paper.feedback || '',
      file_url: paper.file_url || '',
      thumbnail_url: paper.thumbnail_url || '',
    });
    const paperSpecializations = formData.group
      ? getSpecializationsForGroup(formData.group).filter(s => s !== 'COMMON').concat(['COMMON'])
      : contentSpecializations.filter(s => s !== 'COMMON').concat(['COMMON']);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [fileProgress, setFileProgress] = useState(0);
    const [thumbnailProgress, setThumbnailProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingFile(true);
      setFileProgress(0);
      try {
        const ext = file.name.split('.').pop();
        const base = file.name.replace(/\.[^/.]+$/, '');
        const randomStr = makeId(3);
        const uniqueName = `${base}${randomStr}.${ext}`;
        const fileUrl = await uploadToGithubCdn(file, uniqueName, (progress) => {
          setFileProgress(progress);
        });
        setFormData(prev => ({ ...prev, file_url: fileUrl }));
        toast({
          title: "File uploaded",
          description: "New file uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploadingFile(false);
        setFileProgress(0);
      }
    };

    const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setIsUploadingThumbnail(true);
      setThumbnailProgress(0);
      try {
        const ext = file.name.split('.').pop();
        const base = file.name.replace(/\.[^/.]+$/, '');
        const randomStr = makeId(3);
        const uniqueName = `${base}${randomStr}.${ext}`;
        const imageUrl = await uploadToGithubCdn(file, uniqueName, (progress) => {
          setThumbnailProgress(progress);
        });
        setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
        toast({
          title: "Thumbnail uploaded",
          description: "Thumbnail uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload thumbnail",
          variant: "destructive",
        });
      } finally {
        setIsUploadingThumbnail(false);
        setThumbnailProgress(0);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        await onSave(paper.id, { ...formData, group: formData.group, specialization: formData.specializations });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Past Paper</DialogTitle>
            <DialogDescription className="text-sm">
              Update the past paper information, files, and status
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_title">Course Title</Label>
                <Input
                  id="course_title"
                  value={formData.course_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_title: e.target.value }))}
                  placeholder="e.g., Database Management Systems"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={formData.course_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CS101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Select
                  value={formData.year_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester_of_study.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester_of_study: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Group</Label>
              <Select
                value={formData.group || '__none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, group: v === '__none' ? '' : v, specializations: ['COMMON'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No group / Common</SelectItem>
                  {paperGroups.map(g => (
                    <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.year_of_study >= 3 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Specialization</label>
                <ContentSpecializationMulti
                  specializations={paperSpecializations}
                  value={formData.specializations || []}
                  onChange={(vals) => setFormData(prev => ({ ...prev, specializations: vals }))}
                />
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-2 border rounded-lg p-3">
              <Label>Document File</Label>
              <p className="text-xs text-muted-foreground truncate">{formData.file_url ? formData.file_url.split('/').pop() : 'No file'}</p>
              {isUploadingFile && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{fileProgress}%</span>
                  </div>
                  <Progress value={fileProgress} className="h-2" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><FileUp className="mr-2 h-4 w-4" />Replace File</>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Thumbnail Upload Section */}
            <div className="space-y-2 border rounded-lg p-3">
              <Label>Thumbnail (Optional)</Label>
              {formData.thumbnail_url && (
                <div className="w-24 h-24 bg-muted rounded overflow-hidden">
                  <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}
              {isUploadingThumbnail && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{thumbnailProgress}%</span>
                  </div>
                  <Progress value={thumbnailProgress} className="h-2" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploadingThumbnail}
              >
                {isUploadingThumbnail ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><Image className="mr-2 h-4 w-4" />{formData.thumbnail_url ? 'Replace' : 'Upload'} Thumbnail</>
                )}
              </Button>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the past paper..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Admin Feedback</Label>
                <Input
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Feedback for user..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading || isUploadingFile || isUploadingThumbnail}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isUploadingFile || isUploadingThumbnail}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Paper'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

// Edit Blog Dialog Component
const EditBlogDialog: React.FC<{
  blog: any;
  onClose: () => void;
  onSave: (blogId: string, data: any) => void;
  isUpdating: boolean;
}> = ({ blog, onClose, onSave, isUpdating }) => {
  const { groups: blogGroups, getSpecializationsForGroup, contentSpecializations: blogContentSpecs } = useGroups();
  const [formData, setFormData] = useState({
    title: blog.title || '',
    content: blog.content || '',
    thumbnail_url: blog.thumbnail_url || '',
    target_group: blog.target_group || '__none',
    target_specialization: blog.target_specialization || '__none',
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);
    try {
      const ext = file.name.split('.').pop();
      const base = file.name.replace(/\.[^/.]+$/, '');
      const randomStr = makeId(3);
      const uniqueName = `${base}${randomStr}.${ext}`;
      const imageUrl = await uploadToGithubCdn(file, uniqueName, (progress) => {
        setUploadProgress(progress);
      });
      setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
      toast({
        title: "Image uploaded",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      target_group: formData.target_group === '__none' ? '' : formData.target_group,
      target_specialization: formData.target_specialization === '__none' ? '' : formData.target_specialization,
    };
    onSave(blog.id, payload);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Edit Blog Post</DialogTitle>
          <DialogDescription className="text-sm">
            Update the blog post title, thumbnail, and content
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Blog post title..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Target Group</Label>
              <Select value={formData.target_group} onValueChange={(v) => setFormData(prev => ({...prev, target_group: v, target_specialization: '__none'}))} >
                <SelectTrigger>
                  <SelectValue placeholder="All groups (general)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">All groups (general)</SelectItem>
                  {blogGroups.map(g => (
                    <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Specialization</Label>
              <Select value={formData.target_specialization} onValueChange={(v) => setFormData(prev => ({...prev, target_specialization: v}))}>
                <SelectTrigger>
                  <SelectValue placeholder="All specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">All specializations</SelectItem>
                  {(formData.target_group && formData.target_group !== '__none' ? getSpecializationsForGroup(formData.target_group) : blogContentSpecs).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-3">
            <Label>Thumbnail</Label>
            {formData.thumbnail_url && (
              <div className="aspect-video w-full max-w-xs bg-muted rounded-lg overflow-hidden">
                <img 
                  src={formData.thumbnail_url} 
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {isUploadingImage && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingImage}
                onClick={() => document.getElementById(`blog-thumbnail-${blog.id}`)?.click()}
              >
                {isUploadingImage ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                ) : (
                  <><Image className="mr-2 h-4 w-4" />{formData.thumbnail_url ? 'Replace' : 'Upload'} Thumbnail</>
                )}
              </Button>
              {formData.thumbnail_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              id={`blog-thumbnail-${blog.id}`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              placeholder="Write your blog content..."
            />
          </div>
          
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUpdating || isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || isUploadingImage}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Blog'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BlogManagementModal: React.FC<{ onBlogCreated: () => void }> = ({ onBlogCreated }) => {
  const { groups: blogGroups, getSpecializationsForGroup, contentSpecializations: blogContentSpecs } = useGroups();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thumbnail_url: '',
    target_group: '__none',
    target_specialization: '__none',
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const base = file.name.replace(/\.[^/.]+$/, '');
      const randomStr = makeId(3);
      const uniqueName = `${base}${randomStr}.${ext}`;
      const imageUrl = await uploadToGithubCdn(file, uniqueName);
      setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
      toast({
        title: "Image uploaded",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        target_group: formData.target_group === '__none' ? '' : formData.target_group,
        target_specialization: formData.target_specialization === '__none' ? '' : formData.target_specialization,
      };
      await adminAPI.createBlog(payload);
      toast({
        title: "Blog created",
        description: "Blog post created successfully",
      });
      setFormData({ title: '', content: '', thumbnail_url: '', target_group: '__none', target_specialization: '__none' });
      setIsOpen(false);
      onBlogCreated();
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.response?.data?.detail || "Failed to create blog",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        <PenTool className="w-4 h-4 mr-2" />
        Create Blog Post
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Blog Post</DialogTitle>
            <DialogDescription>Write a new blog post or announcement</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter blog title..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target Group</Label>
                <Select value={formData.target_group} onValueChange={(v) => setFormData(prev => ({...prev, target_group: v, target_specialization: '__none'}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All groups (general)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">All groups (general)</SelectItem>
                    {blogGroups.map(g => (
                      <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Specialization</Label>
                <Select value={formData.target_specialization} onValueChange={(v) => setFormData(prev => ({...prev, target_specialization: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">All specializations</SelectItem>
                    {(formData.target_group && formData.target_group !== '__none' ? getSpecializationsForGroup(formData.target_group) : blogContentSpecs).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <div className="space-y-2">
                {formData.thumbnail_url && (
                  <div className="aspect-video w-full max-w-sm bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('modal-thumbnail-upload')?.click()}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Upload Thumbnail
                      </>
                    )}
                  </Button>
                  {formData.thumbnail_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  id="modal-thumbnail-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Write your blog content..."
              />
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isLoading || isUploadingImage}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploadingImage} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Blog Post'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};


const ContentSpecializationMulti: React.FC<{
  specializations: string[];
  value: string[];
  onChange: (vals: string[]) => void;
}> = ({ specializations, value, onChange }) => (
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground">Select all that apply</p>
    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[44px]">
      {specializations.map(s => {
        const sel = value.includes(s);
        return (
          <button key={s} type="button"
            onClick={() => onChange(sel ? value.filter(x => x !== s) : [...value, s])}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary/50'}`}
          >{s === 'COMMON' ? 'COMMON (all)' : s}</button>
        );
      })}
    </div>
    {value.length === 0 && <p className="text-xs text-destructive">Select at least one</p>}
  </div>
);

export default Admin;
