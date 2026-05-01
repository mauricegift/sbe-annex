import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesAPI, reviewsAPI, setAuthErrorHandler } from '../lib/api';
import { useGroups } from '../hooks/useGroups';
import { uploadToGithubCdn } from '../lib/githubCdn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from '../lib/toast';
import { SpecializationFilter, ContentSpecializationSelect } from '../components/SpecializationFilter';
import { BookOpen, Upload, Search, Eye, Download, Trash2, Loader2, File, Plus, Image, ArrowLeft, Users, ChevronDown, RefreshCw, Camera, Star, X } from 'lucide-react';
import { NotesListSkeleton, DocumentViewSkeleton } from '../components/PageSkeletons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import DocumentViewer from '../components/DocumentViewer';
import { isMobileDevice, isIOSDevice, logMobileUploadDebug } from '../utils/mobileUploadFix';
import { compressThumbnail } from '../lib/imageCompression';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import ReviewSection from '../components/ReviewSection';
import { secureDownload } from '../lib/secureDownload';

interface Review {
  id: string;
  content: string;
  rating: number;
  reviewed_by: string;
  reviewed_by_name: string;
  reviewed_by_username?: string;
  reviewed_by_profile_picture?: string;
  created_at: string;
}

interface Note {
  id: string;
  course_title: string;
  course_code: string;
  year_of_study: number;
  semester_of_study: number;
  specialization?: string;
  file_url: string;
  thumbnail_url?: string;
  description?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_by_username?: string;
  uploaded_by_profile_picture?: string;
  status: 'pending' | 'approved' | 'rejected';
  views: number;
  viewers?: string[];
  created_at: string;
  feedback?: string;
  file_name?: string;
  reviews?: Review[];
  review_count?: number;
  average_rating?: number;
}

function makeId(length = 3) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizePayload(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

function buildNotePayload(formData: any, fileUrl: string, thumbnailUrl: string) {
  const payload: any = {
    course_title: formData.course_title,
    course_code: formData.course_code,
    year_of_study: formData.year_of_study,
    semester_of_study: formData.semester_of_study,
    file_url: fileUrl,
  };
  if (formData.group && formData.group !== '__none') payload.group = formData.group;
  if (formData.specialization) payload.specialization = formData.specialization;
  if (thumbnailUrl) payload.thumbnail_url = thumbnailUrl;
  if (formData.description) payload.description = formData.description;
  return payload;
}

const Notes: React.FC = () => {
  useGroups();
  return (
    <Routes>
      <Route path="/" element={<NotesMain />} />
      <Route path="/upload" element={<NotesUpload />} />
      <Route path="/:id" element={<NoteView />} />
    </Routes>
  );
};

const NotesMain: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { groups, contentSpecializations, getSpecializationsForGroup } = useGroups();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    group: 'all',
    semester: 'all',
    specialization: 'all',
    search: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeYear, setActiveYear] = useState(user?.year_of_study || 1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mainTab, setMainTab] = useState(() => {
    const t = searchParams.get('tab');
    return t === 'my-uploads' ? 'my-uploads' : 'browse';
  });
  const handleMainTabChange = (value: string) => {
    setMainTab(value);
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('tab', value); return p; });
  };
  const [myUploads, setMyUploads] = useState<Note[]>([]);
  const [isLoadingMyUploads, setIsLoadingMyUploads] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasNext: false });

  useEffect(() => {
    fetchNotes();
  }, [filters, currentPage, activeYear]);

  useEffect(() => {
    if (mainTab === 'my-uploads') fetchMyUploads();
  }, [mainTab]);

  const fetchMyUploads = async () => {
    setIsLoadingMyUploads(true);
    try {
      const response = await notesAPI.getMyUploads({ limit: 50 });
      setMyUploads(response.data?.data || response.data || []);
    } catch {
    } finally {
      setIsLoadingMyUploads(false);
    }
  };

  const handleDeleteMyNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setDeletingIds(prev => new Set(prev).add(noteId));
    try {
      await notesAPI.deleteNote(noteId);
      setMyUploads(prev => prev.filter(n => n.id !== noteId));
      toast({ title: 'Note deleted', description: 'Your note has been deleted.' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.response?.data?.detail || 'Could not delete note.', variant: 'destructive' });
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(noteId); return s; });
    }
  };

  const fetchNotes = async (page = 1) => {
    try {
      if (!hasLoadedOnce.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const params: any = {
        page,
        limit: 10,
        year: activeYear, // Always use the active year
      };

      if (filters.group !== 'all') params.group = filters.group;
      if (filters.semester !== 'all') params.semester = parseInt(filters.semester);
      if (filters.specialization !== 'all') params.specialization = filters.specialization;
      if (filters.search.trim()) params.search = filters.search.trim();

      const response = await notesAPI.getNotes(params);
      
      if (response.data.data) {
        setNotes(response.data.data);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters(prev => ({ ...prev, search: '' }));
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNotes(currentPage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewNote = async (noteId: string) => {
    try {
      const response = await notesAPI.viewNote(noteId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to view note:', error);
    }
  };

  const handleListDownload = async (note: Note) => {
    const noteId = note.id;
    setDownloadingIds(prev => new Set(prev).add(noteId));
    try {
      const fileName = note.file_name || `${note.course_code}_${note.course_title}.pdf`;
      await secureDownload(note.file_url, fileName);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  const NotesGrid = ({ notes }: { notes: Note[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="group hover:shadow-hover transition-all duration-300 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail on left */}
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden bg-muted">
                {note.thumbnail_url ? (
                  <img 
                    src={note.thumbnail_url} 
                    alt={`Thumbnail for ${note.course_title}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Content on right */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2">{note.course_title}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">{note.course_code}</Badge>
                      {note.specialization && (
                        <Badge variant="default" className="text-xs">{note.specialization}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <div>Year {note.year_of_study}, Sem {note.semester_of_study}</div>
                    <div>By: {note.uploaded_by_name}</div>
                    <div className="flex items-center gap-2">
                      <span>{note.views} views</span>
                      <span>•</span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      {note.viewers && note.viewers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {note.viewers.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {note.description && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{note.description}</p>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button asChild size="sm" className="text-xs md:text-sm px-2 md:px-3">
                      <Link to={`/notes/${note.id}`}>
                        <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs md:text-sm px-2 md:px-3"
                      onClick={() => handleListDownload(note)}
                      disabled={downloadingIds.has(note.id)}
                    >
                      {downloadingIds.has(note.id) ? (
                        <img 
                          src="/android-chrome-512x512.png" 
                          alt="" 
                          className="w-3 h-3 md:w-4 md:h-4 rounded-full animate-spin"
                        />
                      ) : (
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return <NotesListSkeleton />;
  }

  const MyUploadsTab = () => {
    if (isLoadingMyUploads) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    if (myUploads.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
            <p className="text-muted-foreground mb-4">Upload notes to see them here</p>
            <Button asChild><Link to="/notes/upload">Upload Notes</Link></Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {myUploads.map(note => (
          <Card key={note.id} className={`border ${note.status === 'rejected' ? 'border-destructive/40 bg-destructive/5' : note.status === 'pending' ? 'border-yellow-400/40 bg-yellow-50/30 dark:bg-yellow-900/10' : 'border-border/60'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{note.course_title}</h3>
                    <Badge variant="secondary" className="text-xs">{note.course_code}</Badge>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      note.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      note.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {note.status === 'approved' ? '✓ Approved' : note.status === 'rejected' ? '✗ Rejected' : '⏳ Pending review'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Year {note.year_of_study}, Sem {note.semester_of_study} • {new Date(note.created_at).toLocaleDateString()}</p>
                  {note.feedback && (
                    <div className={`mt-2 p-2.5 rounded-lg text-xs ${note.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-muted border border-border/60 text-muted-foreground'}`}>
                      <span className="font-semibold">Admin feedback:</span> {note.feedback}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {note.status === 'approved' && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/notes/${note.id}`}><Eye className="w-3 h-3" /></Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={note.status === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => handleDeleteMyNote(note.id)}
                    disabled={deletingIds.has(note.id)}
                  >
                    {deletingIds.has(note.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Access and share study materials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link to="/notes/upload">
              <Plus className="w-4 h-4 mr-2" />
              Upload Notes
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Tabs: Browse / My Uploads */}
      <Tabs value={mainTab} onValueChange={handleMainTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="my-uploads">
          <MyUploadsTab />
        </TabsContent>

        <TabsContent value="browse">

      {/* Year Tabs */}
      <Tabs value={`year-${activeYear}`} onValueChange={(value) => setActiveYear(parseInt(value.replace('year-', '')))} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="year-1">Year 1</TabsTrigger>
          <TabsTrigger value="year-2">Year 2</TabsTrigger>
          <TabsTrigger value="year-3">Year 3</TabsTrigger>
          <TabsTrigger value="year-4">Year 4</TabsTrigger>
        </TabsList>

        <TabsContent value={`year-${activeYear}`} className="space-y-6">
          {/* Filters */}
          {(() => {
            const selectedGroup = groups.find(g => g.code === filters.group);
            const groupSpecs = filters.group !== 'all' ? (selectedGroup?.specializations || []) : contentSpecializations;
            const filteredSpecs = (groupSpecs as string[]).filter(s => s !== 'COMMON');
            return (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 h-9"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={!searchTerm.trim()} size="sm" className="px-4 h-9 shrink-0">Search</Button>
                  {filters.search && (
                    <Button variant="ghost" size="sm" onClick={handleClearSearch} className="px-2 h-9 shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Select value={filters.semester} onValueChange={(value) => { setFilters(prev => ({ ...prev, semester: value })); setCurrentPage(1); }}>
                    <SelectTrigger className="h-8 text-xs min-w-[100px] max-w-[130px] shrink-0 rounded-full">
                      <SelectValue placeholder="All Sems" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sems</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-px bg-border shrink-0 self-stretch mx-0.5" />
                  <Select value={filters.group} onValueChange={(value) => { setFilters(prev => ({ ...prev, group: value, specialization: 'all' })); setCurrentPage(1); }}>
                    <SelectTrigger className="h-8 text-xs min-w-[120px] max-w-[160px] shrink-0 rounded-full">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(g => <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {filters.group !== 'all' && filteredSpecs.length > 0 && (
                    <>
                      <div className="w-px bg-border shrink-0 self-stretch mx-0.5" />
                      <Select value={filters.specialization} onValueChange={(value) => { setFilters(prev => ({ ...prev, specialization: value })); setCurrentPage(1); }}>
                        <SelectTrigger className="h-8 text-xs min-w-[120px] max-w-[170px] shrink-0 rounded-full">
                          <SelectValue placeholder="All Specs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Specs</SelectItem>
                          {filteredSpecs.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {(filters.group !== 'all' || filters.semester !== 'all' || filters.specialization !== 'all') && (
                    <>
                      <div className="w-px bg-border shrink-0 self-stretch mx-0.5" />
                      <button
                        onClick={() => { setFilters({ group: 'all', semester: 'all', specialization: 'all', search: '' }); setSearchTerm(''); setCurrentPage(1); }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                      >Clear All</button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

                    {/* Notes Grid */}
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating results...</span>
            </div>
          )}
          {notes.length > 0 ? (
            <div className={`space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
              <NotesGrid notes={notes} />
              
              {/* Pagination */}
              {pagination.total > 10 && (
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNotes(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {Math.ceil(pagination.total / 10)} ({pagination.total} total)
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchNotes(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notes found for Year {activeYear}</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                <Button asChild>
                  <Link to="/notes/upload">Upload Note</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

        </TabsContent>
      </Tabs>
    </div>
  );
};

const NotesUpload: React.FC = () => {
  const navigate = useNavigate();
  const { groups, getSpecializationsForGroup, contentSpecializations, loading: groupsLoading } = useGroups();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    course_title: '',
    course_code: '',
    year_of_study: 1,
    semester_of_study: 1,
    group: '__none',
    specialization: '',
    description: '',
    file_url: '',
    thumbnail_url: '',
    file_name: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  // File / thumbnail URL input modes
  const [fileInputMode, setFileInputMode] = useState<'upload' | 'url'>('upload');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileUrlVerified, setFileUrlVerified] = useState(false);
  const [fileUrlVerifying, setFileUrlVerifying] = useState(false);
  const [thumbnailInputMode, setThumbnailInputMode] = useState<'upload' | 'url'>('upload');
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');
  const [thumbnailUrlVerified, setThumbnailUrlVerified] = useState(false);
  
  // Mobile-friendly refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();
  const [isCompressing, setIsCompressing] = useState(false);

  // Create stable preview URLs for selected files
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (selectedThumbnail) {
      const url = URL.createObjectURL(selectedThumbnail);
      setThumbnailPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbnailPreviewUrl(null);
    }
  }, [selectedThumbnail]);

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const handleFileSelect = (file: File) => {
    // Defensive: check all file properties
    if (!file || !file.name || !file.type || typeof file.size !== 'number') {
      setFatalError('File is missing required properties. Please try a different file or browser.');
      return false;
    }
    // Validate file type — use extension fallback for mobile browsers (Android reports wrong MIME types)
      const extTypeMap: Record<string, string> = {
        pdf: 'application/pdf', doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      };
      const fileExt = (file.name.split('.').pop() || '').toLowerCase();
      const effectiveMime = (file.type && file.type !== 'application/octet-stream')
        ? file.type : (extTypeMap[fileExt] || file.type);
      const allowedTypes = [
        'application/pdf', 'application/x-pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      ];
      const validExts = Object.keys(extTypeMap);
      if (!allowedTypes.includes(effectiveMime) && !validExts.includes(fileExt)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid file (PDF, DOC, DOCX, JPG, PNG, WEBP)",
          variant: "destructive",
        });
        return false;
      }
    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 20MB",
        variant: "destructive",
      });
      return false;
    }
    setSelectedFile(file);
    // Update title with file extension if title is empty
    if (!formData.course_title.trim()) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      setFormData(prev => ({ 
        ...prev, 
        course_title: `${fileName}.${extension}`,
        file_name: file.name 
      }));
    } else {
      // Add extension to existing title
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const titleWithoutExt = formData.course_title.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ 
        ...prev, 
        course_title: `${titleWithoutExt}.${extension}`,
        file_name: file.name 
      }));
    }
    setFatalError(null);
    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    handleFileSelect(file);
  };

  const handleThumbnailSelect = (file: File) => {
    if (!file || !file.name || !file.type || typeof file.size !== 'number') {
      setFatalError('Thumbnail is missing required properties. Please try a different image or browser.');
      return false;
    }
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid image type",
        description: "Please select a valid image (JPEG, PNG, WEBP)",
        variant: "destructive",
      });
      return false;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }
    setSelectedThumbnail(file);
    setFatalError(null);
    return true;
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleThumbnailSelect(file);
  };

  // Drag and drop handlers - disabled on mobile
  const handleDrag = (e: React.DragEvent, setDragState: (active: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile) return; // Disable drag on mobile
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragState(true);
    } else if (e.type === "dragleave") {
      setDragState(false);
    }
  };

  const handleDrop = (e: React.DragEvent, fileHandler: (file: File) => boolean, setDragState: (active: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(false);
    if (isMobile) return; // Disable drop on mobile
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileHandler(e.dataTransfer.files[0]);
    }
  };

  // Mobile-friendly file input click handler
  const handleFileInputClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logMobileUploadDebug('File input click', { isMobile, isIOS });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      // Small delay for iOS to properly handle the click
      if (isIOS) {
        setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
        fileInputRef.current.click();
      }
    }
  };

  const handleThumbnailInputClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logMobileUploadDebug('Thumbnail input click', { isMobile, isIOS });
    
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
      if (isIOS) {
        setTimeout(() => thumbnailInputRef.current?.click(), 100);
      } else {
        thumbnailInputRef.current.click();
      }
    }
  };

  const uploadFileToStorage = async () => {
    if (!selectedFile) return '';
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const ext = selectedFile.name.split('.').pop();
      const base = selectedFile.name.replace(/\.[^/.]+$/, '');
      const randomStr = makeId(3);
      const uniqueName = `${base}${randomStr}.${ext}`;
      console.log('Uploading file to GitHub CDN:', uniqueName);
      const fileUrl = await uploadToGithubCdn(selectedFile, uniqueName, (progress) => {
        setUploadProgress(progress);
      });
      console.log('File URL received:', fileUrl);
      setFormData(prev => ({ ...prev, file_url: fileUrl }));
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
      return fileUrl;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadThumbnailToStorage = async () => {
    if (!selectedThumbnail) return '';
    setIsUploadingThumbnail(true);
    setThumbnailUploadProgress(0);
    try {
      // Compress thumbnail before upload (especially important for mobile)
      setIsCompressing(true);
      let thumbnailToUpload = selectedThumbnail;
      try {
        thumbnailToUpload = await compressThumbnail(selectedThumbnail);
        console.log('Thumbnail compressed successfully');
      } catch (compressError) {
        console.warn('Compression failed, using original:', compressError);
      }
      setIsCompressing(false);
      
      const ext = 'jpg'; // Always use jpg after compression
      const base = selectedThumbnail.name.replace(/\.[^/.]+$/, '');
      const randomStr = makeId(3);
      const uniqueName = `${base}${randomStr}.${ext}`;
      const thumbnailUrl = await uploadToGithubCdn(thumbnailToUpload, uniqueName, (progress) => {
        setThumbnailUploadProgress(progress);
      });
      setFormData(prev => ({ ...prev, thumbnail_url: thumbnailUrl }));
      toast({
        title: "Thumbnail uploaded",
        description: "Your thumbnail has been uploaded successfully",
      });
      return thumbnailUrl;
    } catch (error: any) {
      console.error('Thumbnail upload error:', error);
      toast({
        title: "Thumbnail upload failed",
        description: error.message || "Failed to upload thumbnail. Try a smaller image.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploadingThumbnail(false);
      setIsCompressing(false);
      setThumbnailUploadProgress(0);
    }
  };

  const verifyFileUrl = async () => {
    const url = fileUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast({ title: 'Invalid URL', description: 'URL must start with http:// or https://', variant: 'destructive' });
      return;
    }
    setFileUrlVerifying(true);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const ct = res.headers.get('content-type') || '';
      const ok = res.ok && (
        ct.includes('pdf') || ct.includes('word') || ct.includes('powerpoint') ||
        ct.includes('spreadsheet') || ct.includes('image') || ct.includes('octet-stream') ||
        ct.includes('document') || ct.includes('text')
      );
      if (ok || res.ok) {
        setFileUrlVerified(true);
        setFormData(prev => ({ ...prev, file_url: url }));
        toast({ title: 'URL verified', description: 'File URL is accessible and ready.' });
      } else {
        toast({ title: 'URL not accessible', description: `Server returned ${res.status}. Check the URL and try again.`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not verify URL', description: 'Make sure the URL is public and correct.', variant: 'destructive' });
    } finally {
      setFileUrlVerifying(false);
    }
  };

  // Camera capture handler for mobile
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    logMobileUploadDebug('Camera capture', { name: file.name, size: file.size, type: file.type });
    handleThumbnailSelect(file);
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logMobileUploadDebug('Camera button click', { isMobile, isIOS });
    
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      if (isIOS) {
        setTimeout(() => cameraInputRef.current?.click(), 100);
      } else {
        cameraInputRef.current.click();
      }
    }
  };

  useEffect(() => {
    setAuthErrorHandler(() => {
      toast({
        title: 'Session expired',
        description: 'Please log in again.',
        variant: 'destructive',
      });
      navigate('/login');
    });
    return () => setAuthErrorHandler(() => {});
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, starting upload process...');
    
    const usingUrlMode = fileInputMode === 'url';
    if (!usingUrlMode && !selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file or provide a direct URL",
        variant: "destructive",
      });
      return;
    }
    if (usingUrlMode && !fileUrlVerified) {
      toast({
        title: "Verify URL first",
        description: "Please click Verify to confirm the file URL is accessible",
        variant: "destructive",
      });
      return;
    }

    // Auto-assign COMMON specialization for Year 1 & 2
    const finalSpecialization = formData.year_of_study < 3 ? 'COMMON' : formData.specialization;

    setIsLoading(true);
    try {
      let fileUrl = '';
      if (usingUrlMode) {
        fileUrl = fileUrlInput.trim();
      } else {
        console.log('Starting file upload...', selectedFile!.name);
        fileUrl = await uploadFileToStorage();
        console.log('File uploaded successfully:', fileUrl);
      }
      
      let thumbnailUrl = '';
      if (thumbnailInputMode === 'url' && thumbnailUrlInput.trim()) {
        thumbnailUrl = thumbnailUrlInput.trim();
      } else if (selectedThumbnail) {
          console.log('Starting thumbnail upload...', selectedThumbnail.name);
          try {
            thumbnailUrl = await uploadThumbnailToStorage();
            console.log('Thumbnail uploaded successfully:', thumbnailUrl);
          } catch (thumbErr: any) {
            console.warn('Thumbnail upload failed, continuing without thumbnail:', thumbErr?.message);
            toast({
              title: "Note: Thumbnail skipped",
              description: "Thumbnail upload failed but your file will still be submitted.",
            });
          }
        }

      // Submit to backend
      console.log('Submitting to backend API...');
      const payload = buildNotePayload({ ...formData, specialization: finalSpecialization }, fileUrl, thumbnailUrl);
      console.log('Payload:', payload);
      
      const response = await notesAPI.uploadNote(payload);
      console.log('Backend API response:', response);
      
      toast({
        title: "File uploaded successfully",
        description: "Your file has been submitted for review",
      });
      
      // Use setTimeout to ensure proper navigation on mobile
      setTimeout(() => {
        console.log('Navigating back to notes page...');
        navigate('/notes', { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let detail = 'Failed to upload file.';
      if (error?.response?.data?.detail) {
        const d = error.response.data.detail;
        detail = Array.isArray(d) ? d.map((e: any) => e.msg || JSON.stringify(e)).join('; ') : String(d);
      } else if (typeof error?.response?.data === 'string') {
        detail = error.response.data;
      } else if (error?.message) {
        detail = error.message;
      }
      
      toast({
        title: "Upload failed",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        {fatalError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center text-lg font-bold">
            {fatalError}
          </div>
        )}
        <div className="space-y-4 sm:space-y-6">
          {/* Back Button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/notes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Notes
            </Button>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Upload File</h1>
            <p className="text-muted-foreground">Share your study materials with others</p>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Notes Details</CardTitle>
            <CardDescription>Fill in the information about your file</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_title">Course Title *</Label>
                  <Input
                    id="course_title"
                    value={formData.course_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, course_title: e.target.value }))}
                    placeholder="e.g., Database Management Systems"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_code">Course Code *</Label>
                  <Input
                    id="course_code"
                    value={formData.course_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SBE358"
                    required
                  />
                </div>
              </div>

              {/* Year and Semester on same line */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study *</Label>
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
                  <Label htmlFor="semester">Semester *</Label>
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

              {/* Group and Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Study Group</Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, group: value, specialization: '' }))}
                    disabled={groupsLoading}
                  >
                    <SelectTrigger>
                      {groupsLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading groups...
                        </span>
                      ) : (
                        <SelectValue placeholder="Select group (optional)" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">All / General</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.year_of_study >= 3 && (() => {
                  const groupSpecs = formData.group && formData.group !== '__none'
                    ? getSpecializationsForGroup(formData.group)
                    : contentSpecializations;
                  const availableSpecs = groupSpecs.filter(s => s !== 'COMMON');
                  const specsWithCommon = [...availableSpecs, 'COMMON'];
                  return (
                    <div className="space-y-2">
                      <Label>Specialization *</Label>
                      <Select
                        value={formData.specialization}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specsWithCommon.map(s => (
                            <SelectItem key={s} value={s}>{s === 'COMMON' ? 'COMMON (for all specializations)' : s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Study Notes, Lecture Notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                {/* File input — Upload or URL */}
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div className="flex gap-2 mb-2">
                    <Button type="button" size="sm" variant={fileInputMode === 'upload' ? 'default' : 'outline'}
                      onClick={() => { setFileInputMode('upload'); setFileUrlVerified(false); setFileUrlInput(''); }}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />Select File
                    </Button>
                    <Button type="button" size="sm" variant={fileInputMode === 'url' ? 'default' : 'outline'}
                      onClick={() => { setFileInputMode('url'); setSelectedFile(null); }}>
                      <File className="h-3.5 w-3.5 mr-1.5" />Provide URL
                    </Button>
                  </div>

                  {fileInputMode === 'upload' ? (
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragEnter={(e) => handleDrag(e, setDragActive)}
                      onDragLeave={(e) => handleDrag(e, setDragActive)}
                      onDragOver={(e) => handleDrag(e, setDragActive)}
                      onDrop={(e) => handleDrop(e, handleFileSelect, setDragActive)}
                    >
                      {selectedFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center p-4 bg-muted rounded-md">
                            {selectedFile.type.startsWith('image/') && filePreviewUrl ? (
                              <img src={filePreviewUrl} alt="File preview" className="max-h-32 max-w-full object-contain rounded" />
                            ) : (
                              <File className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</span>
                                <span className="font-medium">{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          )}
                          {!isUploading && (
                            <Button type="button" variant="outline" size="sm"
                              onClick={() => { setSelectedFile(null); setFormData(prev => ({ ...prev, file_url: '', file_name: '' })); }}>
                              Select Different File
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm font-medium">{isMobile ? 'Tap to select a file' : 'Drag and drop a file here, or click to browse'}</p>
                          <Button type="button" variant="outline" onClick={handleFileInputClick} className="touch-manipulation">Choose File</Button>
                          <input ref={fileInputRef} id="file-upload" type="file" onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,image/*,application/pdf" className="hidden" />
                          <p className="text-xs text-muted-foreground">Supported formats: PDF, DOC, DOCX, Images (Max 20MB)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Paste a direct public link to the file (PDF, DOC, image, etc.)</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/document.pdf"
                          value={fileUrlInput}
                          onChange={(e) => { setFileUrlInput(e.target.value); setFileUrlVerified(false); }}
                        />
                        <Button type="button" variant="outline" onClick={verifyFileUrl} disabled={fileUrlVerifying || !fileUrlInput.trim()} className="shrink-0">
                          {fileUrlVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      </div>
                      {fileUrlVerified && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> URL verified and ready
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail — Upload or URL */}
                <div className="space-y-2">
                  <Label>Preview Image (Optional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Button type="button" size="sm" variant={thumbnailInputMode === 'upload' ? 'default' : 'outline'}
                      onClick={() => { setThumbnailInputMode('upload'); setThumbnailUrlInput(''); setThumbnailUrlVerified(false); }}>
                      <Image className="h-3.5 w-3.5 mr-1.5" />Upload Image
                    </Button>
                    <Button type="button" size="sm" variant={thumbnailInputMode === 'url' ? 'default' : 'outline'}
                      onClick={() => { setThumbnailInputMode('url'); setSelectedThumbnail(null); }}>
                      <File className="h-3.5 w-3.5 mr-1.5" />Provide URL
                    </Button>
                  </div>

                  {thumbnailInputMode === 'upload' ? (
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        thumbnailDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragEnter={(e) => handleDrag(e, setThumbnailDragActive)}
                      onDragLeave={(e) => handleDrag(e, setThumbnailDragActive)}
                      onDragOver={(e) => handleDrag(e, setThumbnailDragActive)}
                      onDrop={(e) => handleDrop(e, handleThumbnailSelect, setThumbnailDragActive)}
                    >
                      {selectedThumbnail ? (
                        <div className="space-y-3">
                          <div className="relative aspect-video w-full max-w-xs mx-auto rounded-md overflow-hidden bg-muted">
                            {thumbnailPreviewUrl ? (
                              <img src={thumbnailPreviewUrl} alt="Thumbnail preview" className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{selectedThumbnail.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedThumbnail.size / 1024 / 1024).toFixed(2)} MB</p>
                          {(isUploadingThumbnail || isCompressing) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{isCompressing ? 'Compressing...' : 'Uploading...'}</span>
                                {!isCompressing && <span className="font-medium">{thumbnailUploadProgress}%</span>}
                              </div>
                              {!isCompressing && <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${thumbnailUploadProgress}%` }} /></div>}
                            </div>
                          )}
                          {!isUploadingThumbnail && !isCompressing && (
                            <Button type="button" variant="outline" size="sm"
                              onClick={() => { setSelectedThumbnail(null); setFormData(prev => ({ ...prev, thumbnail_url: '' })); }}>
                              Select Different Thumbnail
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm font-medium">{isMobile ? 'Tap to select or take a photo' : 'Drag and drop an image here, or click to browse'}</p>
                          <div className="flex gap-2 justify-center flex-wrap">
                            <Button type="button" variant="outline" onClick={handleThumbnailInputClick} className="touch-manipulation">
                              <Image className="h-4 w-4 mr-2" />Gallery
                            </Button>
                            {isMobile && (
                              <Button type="button" variant="outline" onClick={handleCameraClick} className="touch-manipulation">
                                <Camera className="h-4 w-4 mr-2" />Camera
                              </Button>
                            )}
                          </div>
                          <input ref={thumbnailInputRef} id="thumbnail-upload" type="file" onChange={handleThumbnailUpload} accept="image/jpeg,image/png,image/webp,image/*" className="hidden" />
                          {isMobile && <input ref={cameraInputRef} id="camera-capture" type="file" onChange={handleCameraCapture} accept="image/*" capture="environment" className="hidden" />}
                          <p className="text-xs text-muted-foreground">Supported formats: JPEG, PNG, WEBP (Max 5MB, auto-compressed)</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Paste a direct public link to the preview image</p>
                      <Input
                        placeholder="https://example.com/preview.jpg"
                        value={thumbnailUrlInput}
                        onChange={(e) => { setThumbnailUrlInput(e.target.value); setThumbnailUrlVerified(false); }}
                      />
                      {thumbnailUrlInput.trim() && (
                        <div className="relative aspect-video w-full max-w-xs mx-auto rounded-md overflow-hidden bg-muted">
                          <img src={thumbnailUrlInput} alt="Preview" className="object-cover w-full h-full"
                            onLoad={() => setThumbnailUrlVerified(true)}
                            onError={() => setThumbnailUrlVerified(false)} />
                        </div>
                      )}
                      {thumbnailUrlVerified && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Image loaded successfully
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/notes')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

const NoteView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Check if mobile device
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchNote(id);
    }
  }, [id]);

  const fetchNote = async (noteId: string) => {
    try {
      const response = await notesAPI.getNote(noteId);
      
      // Handle different response structures
      if (response.data?.data) {
        setNote(response.data.data);
      } else if (response.data) {
        setNote(response.data);
      } else {
        console.error('No note data found in response');
        setNote(null);
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
      setNote(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isPdfFile = (fileUrl: string) => {
    return fileUrl.toLowerCase().endsWith('.pdf');
  };

  const handleDownload = async () => {
    if (!note) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      const fileName = note.file_name || `${note.course_code}_${note.course_title}.pdf`;
      await secureDownload(note.file_url, fileName, (progress) => {
        setDownloadProgress(progress);
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  if (isLoading) {
    return <DocumentViewSkeleton />;
  }

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Notes not found</h3>
            <p className="text-muted-foreground">The requested note could not be found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Hero Info Card */}
      <Card className="overflow-hidden shadow-md border-border/60">
        <div className="relative">
          {note.thumbnail_url ? (
            <div className="relative h-52 sm:h-64 md:h-72 bg-muted overflow-hidden">
              <img
                src={note.thumbnail_url}
                alt={"Preview for " + note.course_title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            </div>
          ) : (
            <div className="relative h-40 sm:h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
              <BookOpen className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 text-primary/10" />
            </div>
          )}
          <div className={note.thumbnail_url ? 'absolute bottom-0 left-0 right-0 p-5' : 'p-5 pb-2'}>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary text-primary-foreground">
                {note.course_code}
              </span>
              <span className={"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " + (note.thumbnail_url ? 'bg-white/15 backdrop-blur-sm text-white border border-white/20' : 'bg-muted text-muted-foreground')}>
                Year {note.year_of_study} &bull; Sem {note.semester_of_study}
              </span>
              {note.specialization && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-600/90 text-white">
                  {note.specialization}
                </span>
              )}
            </div>
            <h1 className={"text-xl sm:text-2xl font-bold leading-tight " + (note.thumbnail_url ? 'text-white drop-shadow-md' : 'text-foreground')}>
              {note.course_title}
            </h1>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9">
                <AvatarImage src={note.uploaded_by_profile_picture} alt={note.uploaded_by_name} />
                <AvatarFallback className="text-sm">{note.uploaded_by_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-none">{note.uploaded_by_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {note.views}
              </span>
              {note.average_rating !== undefined && note.average_rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {note.average_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {note.description && (
            <p className="text-sm text-muted-foreground border-t border-border/60 pt-4 leading-relaxed">{note.description}</p>
          )}

          {note.viewers && note.viewers.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Users className="w-4 h-4" />
                {note.viewers.length} viewer{note.viewers.length !== 1 ? 's' : ''}
                <ChevronDown className="w-3.5 h-3.5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {note.viewers.map((viewer, index) => (
                    <span key={index} className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                      @{viewer}
                    </span>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="pt-1">
            <Button onClick={handleDownload} disabled={isDownloading} size="lg" className="w-full sm:w-auto gap-2">
              {isDownloading ? (
                <>
                  <img src="/android-chrome-512x512.png" alt="" className="w-4 h-4 rounded-full animate-spin" />
                  {downloadProgress > 0 ? downloadProgress + '%' : 'Starting...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DocumentViewer
        fileUrl={note.file_url}
        title={note.course_title}
        fileName={note.file_name}
        className="w-full"
      />

      <ReviewSection
        reviews={note.reviews || []}
        averageRating={note.average_rating || 0}
        onAddReview={async (content, rating) => {
          await reviewsAPI.addNoteReview(note.id, { content, rating });
          if (id) {
            const response = await notesAPI.getNote(id);
            setNote(response.data?.data || response.data);
          }
        }}
      />
    </div>
  );
};


export default Notes;
