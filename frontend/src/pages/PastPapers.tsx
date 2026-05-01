import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pastPapersAPI, reviewsAPI, setAuthErrorHandler } from '../lib/api';
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
import { FileText, Upload, Search, Eye, Download, Trash2, Loader2, File, Plus, Image, ArrowLeft, Users, ChevronDown, RefreshCw, Camera, Star } from 'lucide-react';
import { NotesListSkeleton, DocumentViewSkeleton } from '../components/PageSkeletons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import DocumentViewer from '../components/DocumentViewer';
import ErrorBoundary from '../components/ErrorBoundary';
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

interface PastPaper {
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

function buildPaperPayload(formData: any, fileUrl: string, thumbnailUrl: string) {
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

const PastPapers: React.FC = () => {
  useGroups();
  return (
    <Routes>
      <Route path="/" element={<PastPapersMain />} />
      <Route path="/upload" element={<ErrorBoundary><PastPapersUpload /></ErrorBoundary>} />
      <Route path="/:id" element={<PaperView />} />
    </Routes>
  );
};

const PastPapersMain: React.FC = () => {
  const { user } = useAuth();
  const { groups, contentSpecializations, getSpecializationsForGroup } = useGroups();
  const [papers, setPapers] = useState<PastPaper[]>([]);
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
  const [myUploads, setMyUploads] = useState<PastPaper[]>([]);
  const [isLoadingMyUploads, setIsLoadingMyUploads] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasNext: false });

  useEffect(() => {
    fetchPapers();
  }, [filters, currentPage, activeYear]);

  useEffect(() => {
    if (mainTab === 'my-uploads') fetchMyUploads();
  }, [mainTab]);

  const fetchMyUploads = async () => {
    setIsLoadingMyUploads(true);
    try {
      const response = await pastPapersAPI.getMyPapers({ limit: 50 });
      setMyUploads(response.data?.data || response.data || []);
    } catch {
    } finally {
      setIsLoadingMyUploads(false);
    }
  };

  const handleDeleteMyPaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this past paper?')) return;
    setDeletingIds(prev => new Set(prev).add(paperId));
    try {
      await pastPapersAPI.deletePaper(paperId);
      setMyUploads(prev => prev.filter(p => p.id !== paperId));
      toast({ title: 'Paper deleted', description: 'Your past paper has been deleted.' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.response?.data?.detail || 'Could not delete paper.', variant: 'destructive' });
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(paperId); return s; });
    }
  };

  const fetchPapers = async (page = 1) => {
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

      const response = await pastPapersAPI.getPastPapers(params);
      
      if (response.data.data) {
        setPapers(response.data.data);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error);
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
      await fetchPapers(currentPage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleListDownload = async (paper: PastPaper) => {
    const paperId = paper.id;
    setDownloadingIds(prev => new Set(prev).add(paperId));
    try {
      const fileName = paper.file_name || `${paper.course_code}_${paper.course_title}.pdf`;
      await secureDownload(paper.file_url, fileName);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
    }
  };

  const PapersGrid = ({ papers }: { papers: PastPaper[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {papers.map((paper) => (
        <Card key={paper.id} className="group hover:shadow-hover transition-all duration-300 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail on left */}
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden bg-muted">
                {paper.thumbnail_url ? (
                  <img 
                    src={paper.thumbnail_url} 
                    alt={`Thumbnail for ${paper.course_title}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Content on right */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2">{paper.course_title}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">{paper.course_code}</Badge>
                      {paper.specialization && (
                        <Badge variant="default" className="text-xs">{paper.specialization}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <div>Year {paper.year_of_study}, Sem {paper.semester_of_study}</div>
                    <div>By: {paper.uploaded_by_name}</div>
                    <div className="flex items-center gap-2">
                      <span>{paper.views} views</span>
                      <span>•</span>
                      <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                      {paper.viewers && paper.viewers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {paper.viewers.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {paper.description && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{paper.description}</p>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button asChild size="sm" className="text-xs md:text-sm px-2 md:px-3">
                      <Link to={`/past-papers/${paper.id}`}>
                        <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs md:text-sm px-2 md:px-3"
                      onClick={() => handleListDownload(paper)}
                      disabled={downloadingIds.has(paper.id)}
                    >
                      {downloadingIds.has(paper.id) ? (
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Past Papers</h1>
          <p className="text-muted-foreground">Access and share exam papers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link to="/past-papers/upload">
              <Plus className="w-4 h-4 mr-2" />
              Upload Papers
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
          {isLoadingMyUploads ? (
            <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : myUploads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No past papers uploaded</h3>
                <p className="text-muted-foreground mb-4">Upload past papers to see them here</p>
                <Button asChild><Link to="/past-papers/upload">Upload Paper</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myUploads.map(paper => (
                <Card key={paper.id} className={`border ${paper.status === 'rejected' ? 'border-destructive/40 bg-destructive/5' : paper.status === 'pending' ? 'border-yellow-400/40 bg-yellow-50/30 dark:bg-yellow-900/10' : 'border-border/60'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{paper.course_title}</h3>
                          <Badge variant="secondary" className="text-xs">{paper.course_code}</Badge>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            paper.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            paper.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {paper.status === 'approved' ? '✓ Approved' : paper.status === 'rejected' ? '✗ Rejected' : '⏳ Pending review'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Year {paper.year_of_study}, Sem {paper.semester_of_study}{paper.exam_year ? ` • ${paper.exam_year}` : ''} • {new Date(paper.created_at).toLocaleDateString()}</p>
                        {paper.feedback && (
                          <div className={`mt-2 p-2.5 rounded-lg text-xs ${paper.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-muted border border-border/60 text-muted-foreground'}`}>
                            <span className="font-semibold">Admin feedback:</span> {paper.feedback}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={paper.status === 'rejected' ? 'destructive' : 'outline'}
                          onClick={() => handleDeleteMyPaper(paper.id)}
                          disabled={deletingIds.has(paper.id)}
                        >
                          {deletingIds.has(paper.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const selectedGroup = groups.find(g => g.code === filters.group);
                const groupSpecs = filters.group !== 'all' ? (selectedGroup?.specializations || []) : contentSpecializations;
                return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search papers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={!searchTerm.trim()}
                      className="px-4"
                    >
                      Search
                    </Button>
                    {filters.search && (
                      <Button
                        variant="outline"
                        onClick={handleClearSearch}
                        className="px-4"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={filters.group} onValueChange={(value) => {
                    setFilters(prev => ({ ...prev, group: value, specialization: 'all' }));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All groups</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={filters.semester} onValueChange={(value) => setFilters(prev => ({ ...prev, semester: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SpecializationFilter
                  specializations={groupSpecs}
                  value={filters.specialization}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, specialization: value }));
                    setCurrentPage(1);
                  }}
                />

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ group: 'all', semester: 'all', specialization: 'all', search: '' });
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
                );
              })()}            </CardContent>
          </Card>

          {/* Papers Grid */}
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating results...</span>
            </div>
          )}
          {papers.length > 0 ? (
            <div className={`space-y-6 transition-opacity duration-200 ${isRefreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <PapersGrid papers={papers} />
              
              {/* Pagination */}
              {pagination.total > 10 && (
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchPapers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {Math.ceil(pagination.total / 10)} ({pagination.total} total)
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchPapers(pagination.page + 1)}
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
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No papers found for Year {activeYear}</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                <Button asChild>
                  <Link to="/past-papers/upload">Upload Paper</Link>
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

const PastPapersUpload: React.FC = () => {
  const navigate = useNavigate();
  const { groups, getSpecializationsForGroup, contentSpecializations, loading: groupsLoading } = useGroups();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
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
    // Validate file type — use extension fallback for mobile browsers
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
      const extension = getFileExtension(file.name);
      setFormData(prev => ({ 
        ...prev, 
        course_title: `${fileName}.${extension}`,
        file_name: file.name 
      }));
    } else {
      // Add extension to existing title
      const extension = getFileExtension(file.name);
      const titleWithoutExt = formData.course_title.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ 
        ...prev, 
        course_title: `${titleWithoutExt}.${extension}`,
        file_name: file.name 
      }));
    }
    
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
      const fileUrl = await uploadToGithubCdn(selectedFile, uniqueName, (progress) => {
        setUploadProgress(progress);
      });
      setFormData(prev => ({ ...prev, file_url: fileUrl }));
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
      return fileUrl;
    } catch (error: any) {
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
    setIsThumbnailUploading(true);
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
      setIsThumbnailUploading(false);
      setIsCompressing(false);
      setThumbnailUploadProgress(0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, starting upload process...');
    
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file before submitting",
        variant: "destructive",
      });
      return;
    }

    if (formData.year_of_study >= 3 && !formData.specialization) {
      toast({
        title: "Specialization required",
        description: "Please select your specialization for Year 3 and above",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload files to Supabase first
      console.log('Starting file upload to Supabase...', selectedFile.name);
      const fileUrl = await uploadFileToStorage();
      console.log('File uploaded successfully:', fileUrl);
      
      let thumbnailUrl = '';
      if (selectedThumbnail) {
          try {
            thumbnailUrl = await uploadThumbnailToStorage();
            console.log('Thumbnail uploaded successfully:', thumbnailUrl);
          } catch (thumbErr: any) {
            console.warn('Thumbnail upload failed, continuing without thumbnail:', thumbErr?.message);
            toast({
              title: "Note: Thumbnail skipped",
              description: "Thumbnail upload failed but your paper will still be submitted.",
            });
          }
        }

      // Submit to backend
      console.log('Submitting to backend API...');
      const payload = buildPaperPayload(formData, fileUrl, thumbnailUrl);
      console.log('Payload:', payload);
      
      const response = await pastPapersAPI.uploadPaper(payload);
      console.log('Backend API response:', response);
      
      toast({
        title: "Paper uploaded successfully",
        description: "Your paper has been submitted for review",
      });
      
      // Use setTimeout to ensure proper navigation on mobile
      setTimeout(() => {
        console.log('Navigating back to past papers page...');
        navigate('/past-papers', { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let detail = 'Failed to upload paper.';
      if (error?.response?.data?.detail) {
        detail = error.response.data.detail;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/past-papers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Past Papers
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Upload Past Paper</h1>
          <p className="text-muted-foreground">Share your exam papers with others</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paper Details</CardTitle>
            <CardDescription>Fill in the information about your past paper</CardDescription>
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
                    placeholder="e.g., CS101"
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

              {formData.year_of_study >= 3 && (
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

                {(() => {
                  const availableSpecs = formData.group && formData.group !== '__none'
                    ? getSpecializationsForGroup(formData.group)
                    : contentSpecializations;
                  return (formData.year_of_study >= 3 || (formData.group && formData.group !== '__none')) ? (
                    <ContentSpecializationSelect
                      specializations={availableSpecs}
                      value={formData.specialization}
                      onChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                      label={formData.year_of_study >= 3 ? "Specialization *" : "Specialization"}
                      placeholder="Select specialization"
                    />
                  ) : null;
                })()}
              </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the exam paper..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File *</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={(e) => handleDrag(e, setDragActive)}
                  onDragLeave={(e) => handleDrag(e, setDragActive)}
                  onDragOver={(e) => handleDrag(e, setDragActive)}
                  onDrop={(e) => handleDrop(e, handleFileSelect, setDragActive)}
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      {/* File Preview */}
                      <div className="flex items-center justify-center p-4 bg-muted rounded-md">
                        {selectedFile.type.startsWith('image/') && filePreviewUrl ? (
                          <img 
                            src={filePreviewUrl} 
                            alt="File preview"
                            className="max-h-32 max-w-full object-contain rounded"
                          />
                        ) : (
                          <File className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setFormData(prev => ({ ...prev, file_url: '', file_name: '' }));
                          }}
                        >
                          Select Different File
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {isMobile ? 'Tap to select a file' : 'Drag and drop a file here, or click to browse'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFileInputClick}
                        className="touch-manipulation"
                      >
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, Images (Max 20MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Upload Preview (Optional)</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    thumbnailDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={(e) => handleDrag(e, setThumbnailDragActive)}
                  onDragLeave={(e) => handleDrag(e, setThumbnailDragActive)}
                  onDragOver={(e) => handleDrag(e, setThumbnailDragActive)}
                  onDrop={(e) => handleDrop(e, handleThumbnailSelect, setThumbnailDragActive)}
                >
                  {selectedThumbnail ? (
                    <div className="space-y-3">
                      {/* Thumbnail Preview */}
                      <div className="relative aspect-video w-full max-w-xs mx-auto rounded-md overflow-hidden bg-muted">
                        {thumbnailPreviewUrl ? (
                          <img 
                            src={thumbnailPreviewUrl} 
                            alt="Thumbnail preview"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{selectedThumbnail.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedThumbnail.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {(isThumbnailUploading || isCompressing) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isCompressing ? 'Compressing...' : 'Uploading...'}
                            </span>
                            {!isCompressing && <span className="font-medium">{thumbnailUploadProgress}%</span>}
                          </div>
                          {!isCompressing && (
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${thumbnailUploadProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {!isThumbnailUploading && !isCompressing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedThumbnail(null);
                            setFormData(prev => ({ ...prev, thumbnail_url: '' }));
                          }}
                        >
                          Select Different Thumbnail
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {isMobile ? 'Tap to select or take a photo' : 'Drag and drop an image here, or click to browse'}
                      </p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleThumbnailInputClick}
                          className="touch-manipulation"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Gallery
                        </Button>
                        {isMobile && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCameraClick}
                            className="touch-manipulation"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Camera
                          </Button>
                        )}
                      </div>
                      <input
                        ref={thumbnailInputRef}
                        id="thumbnail-upload"
                        type="file"
                        onChange={handleThumbnailUpload}
                        accept="image/jpeg,image/png,image/webp,image/*"
                        className="hidden"
                      />
                      {isMobile && (
                        <input
                          ref={cameraInputRef}
                          id="camera-capture"
                          type="file"
                          onChange={handleCameraCapture}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPEG, PNG, WEBP (Max 5MB, auto-compressed)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/past-papers')}
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
  );
};

const PaperView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile] = useState(() => window.innerWidth < 768);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPaper(id);
    }
  }, [id]);

  const fetchPaper = async (paperId: string) => {
    try {
      const response = await pastPapersAPI.getPastPaper(paperId);
      
      if (response.data?.data) {
        setPaper(response.data.data);
      } else if (response.data) {
        setPaper(response.data);
      } else {
        console.error('No paper data found in response');
        setPaper(null);
      }
    } catch (error) {
      console.error('Failed to fetch paper:', error);
      setPaper(null);
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
    if (!paper) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      const fileName = paper.file_name || `${paper.course_code}_${paper.course_title}.pdf`;
      await secureDownload(paper.file_url, fileName, (progress) => {
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

  if (!paper) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Paper not found</h3>
            <p className="text-muted-foreground">The requested paper could not be found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleDownload} disabled={isDownloading} className="min-w-[140px]">
          {isDownloading ? (
            <>
              <img 
                src="/android-chrome-512x512.png" 
                alt="" 
                className="w-4 h-4 mr-2 rounded-full animate-spin"
              />
              {downloadProgress > 0 ? `${downloadProgress}%` : 'Starting...'}
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </div>

      {/* Main Content - Preview on left, Info on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Section - Left */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {paper.thumbnail_url ? (
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                <img 
                  src={paper.thumbnail_url} 
                  alt={`Preview for ${paper.course_title}`}
                  className="object-contain w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section - Right */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{paper.course_code}</Badge>
                <Badge variant="outline">Year {paper.year_of_study}</Badge>
                <Badge variant="outline">Semester {paper.semester_of_study}</Badge>
                {paper.specialization && (
                  <Badge variant="default">{paper.specialization}</Badge>
                )}
              </div>
              <CardTitle className="text-xl sm:text-2xl">{paper.course_title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={paper.uploaded_by_profile_picture} alt={paper.uploaded_by_name} />
                    <AvatarFallback className="text-xs">{paper.uploaded_by_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>By {paper.uploaded_by_name}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span>{paper.views} views</span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                {paper.average_rating !== undefined && paper.average_rating > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{paper.average_rating.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Viewers Dropdown */}
              {paper.viewers && paper.viewers.length > 0 && (
                <Collapsible className="mt-3">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Users className="w-4 h-4" />
                    <span>{paper.viewers.length} viewer{paper.viewers.length > 1 ? 's' : ''}</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-muted/50 rounded-md p-3 space-y-1">
                      {paper.viewers.map((viewer, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          @{viewer}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardHeader>
          {paper.description && (
            <CardContent>
              <p className="text-muted-foreground text-sm sm:text-base">{paper.description}</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Document Viewer Section */}
      <DocumentViewer
        fileUrl={paper.file_url}
        title={paper.course_title}
        fileName={paper.file_name}
        className="w-full"
      />

      {/* Reviews Section - Last */}
      <ReviewSection
        reviews={paper.reviews || []}
        averageRating={paper.average_rating || 0}
        onAddReview={async (content, rating) => {
          await reviewsAPI.addPaperReview(paper.id, { content, rating });
          if (id) {
            const response = await pastPapersAPI.getPastPaper(id);
            setPaper(response.data?.data || response.data);
          }
        }}
      />
    </div>
  );
};

export default PastPapers;