import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { blogAPI, reviewsAPI } from '../lib/api';
import { useGroups } from '../hooks/useGroups';
import { toast } from '../lib/toast';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Loader2, Calendar, Eye, BookOpen, Search, Share2, Copy, Check, RefreshCw, Clock, ArrowLeft, ArrowRight, Megaphone, Tag } from 'lucide-react';
import ReviewSection, { Review } from '../components/ReviewSection';
import { BlogListSkeleton } from '../components/PageSkeletons';

const Blog: React.FC = () => (
  <Routes>
    <Route path="/" element={<BlogMain />} />
    <Route path="/:id" element={<BlogView />} />
  </Routes>
);

const readingTime = (html: string) =>
  Math.max(1, Math.ceil(html.replace(/<[^>]*>/g, '').split(/\s+/).length / 200));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ─────────────────────────────── BLOG MAIN ────────────────────────────────
const BlogMain: React.FC = () => {
  const { groups, getSpecializationsForGroup, contentSpecializations } = useGroups();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasNext: false });

  useEffect(() => { fetchBlogs(1); }, [searchQuery, groupFilter, specFilter]);

  const fetchBlogs = async (page = 1) => {
    try {
      const params: any = { page, limit: 12 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (groupFilter !== 'all') params.group = groupFilter;
      if (specFilter !== 'all') params.specialization = specFilter;
      const res = await blogAPI.getBlogs(params);
      if (res.data.data) {
        setBlogs(res.data.data);
        setPagination({ page: res.data.page, total: res.data.total, hasNext: res.data.has_next });
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const handleSearch = () => { setSearchQuery(searchInput); setPagination(p => ({ ...p, page: 1 })); };
  const handleClear = () => {
    setSearchInput(''); setSearchQuery('');
    setGroupFilter('all'); setSpecFilter('all');
    setPagination(p => ({ ...p, page: 1 }));
  };
  const handleRefresh = () => { setIsRefreshing(true); fetchBlogs(pagination.page); };

  const hasFilter = !!(searchQuery || groupFilter !== 'all' || specFilter !== 'all');
  const filteredSpecs = groupFilter !== 'all' ? getSpecializationsForGroup(groupFilter) : contentSpecializations;

  if (isLoading) return <BlogListSkeleton />;

  const [featured, ...rest] = blogs;

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/40">
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">SBE Annex</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Announcements</h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">
                Stay informed with the latest updates and news.
              </p>
              {pagination.total > 0 && (
                <p className="text-xs text-muted-foreground">{pagination.total} post{pagination.total !== 1 ? 's' : ''} published</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="shrink-0">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-7">
        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-2 items-center bg-muted/40 border border-border/50 rounded-xl p-2.5">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8 h-8 text-xs bg-background border-border/60 rounded-lg"
            />
          </div>
          {searchInput.trim() && (
            <Button onClick={handleSearch} size="sm" className="h-8 px-3 text-xs rounded-lg shrink-0">Search</Button>
          )}
          <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setSpecFilter('all'); }}>
            <SelectTrigger className="h-8 text-xs w-[130px] rounded-lg shrink-0">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(g => <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {filteredSpecs.length > 0 && (
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="h-8 text-xs w-[145px] rounded-lg shrink-0">
                <SelectValue placeholder="All Specs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specs</SelectItem>
                {filteredSpecs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hasFilter && (
            <Button variant="outline" size="sm" onClick={handleClear}
              className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 rounded-lg shrink-0">
              Clear
            </Button>
          )}
        </div>

        {/* ── Empty state ── */}
        {blogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="p-5 bg-muted rounded-2xl"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold">No announcements found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {hasFilter ? 'Try adjusting your filters.' : 'Check back later for updates.'}
            </p>
            {hasFilter && <Button variant="outline" size="sm" onClick={handleClear}>Clear Filters</Button>}
          </div>
        )}

        {/* ── Content ── */}
        {blogs.length > 0 && (
          <div className="space-y-7">
            {/* Featured */}
            {featured && (
              <Link to={`/blog/${featured.id}`} className="group block">
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                  <div className="grid md:grid-cols-5 gap-0">
                    {featured.thumbnail_url ? (
                      <div className="md:col-span-3 aspect-video md:aspect-auto md:min-h-[260px] bg-muted overflow-hidden">
                        <img src={featured.thumbnail_url} alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="hidden md:flex md:col-span-3 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 min-h-[260px]">
                        <Megaphone className="w-20 h-20 text-primary/20" />
                      </div>
                    )}
                    <div className="md:col-span-2 p-5 md:p-7 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs font-semibold">Featured</Badge>
                        <h2 className="text-lg md:text-xl font-bold leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                          {featured.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {featured.content.replace(/<[^>]*>/g, '').substring(0, 180)}...
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={featured.author_profile_picture} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{featured.author_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{featured.author_name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{formatDate(featured.created_at)}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{readingTime(featured.content)} min</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{featured.views}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                          Read post <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((blog: any) => (
                  <Link key={blog.id} to={`/blog/${blog.id}`} className="group block">
                    <div className="h-full rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-md hover:border-primary/30 transition-all duration-300">
                      {blog.thumbnail_url ? (
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img src={blog.thumbnail_url} alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Megaphone className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="p-4 space-y-2.5">
                        {blog.group && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-primary/50" />
                            <span className="text-[11px] text-primary/70 font-medium">{blog.group}</span>
                          </div>
                        )}
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {blog.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={blog.author_profile_picture} />
                              <AvatarFallback className="text-[9px]">{blog.author_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[75px]">{blog.author_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
                            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{blog.views}</span>
                            <span>·</span>
                            <span>{formatDate(blog.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total > 12 && (
              <div className="flex justify-center items-center gap-4 pt-2">
                <Button variant="outline" size="sm" onClick={() => fetchBlogs(pagination.page - 1)}
                  disabled={pagination.page === 1} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} / {Math.ceil(pagination.total / 12)}
                </span>
                <Button variant="outline" size="sm" onClick={() => fetchBlogs(pagination.page + 1)}
                  disabled={!pagination.hasNext} className="gap-1.5 text-xs">
                  Next<ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────── BLOG VIEW ────────────────────────────────
const BlogView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [blog, setBlog] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => { if (id) fetchBlog(id); }, [id]);

  const fetchBlog = async (blogId: string) => {
    try {
      const res = await blogAPI.getBlog(blogId);
      const data = res.data?.data || res.data || null;
      if (data) {
        setBlog(data);
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
          setAverageRating(data.reviews.reduce((s: number, r: Review) => s + r.rating, 0) / data.reviews.length);
        }
      }
    } catch { setBlog(null); }
    finally { setIsLoading(false); }
  };

  const handleAddReview = async (content: string, rating: number) => {
    if (!id) return;
    await reviewsAPI.addBlogReview(id, { content, rating });
    await fetchBlog(id);
  };

  const handleShare = async () => {
    const shareData = { title: blog.title, text: blog.content.replace(/<[^>]*>/g, '').substring(0, 200), url: window.location.href };
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); } catch { handleCopyLink(); }
    } else { handleCopyLink(); }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Link copied', description: 'Post link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!blog) return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center space-y-4">
      <div className="p-5 bg-muted rounded-2xl inline-flex"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>
      <h2 className="text-xl font-semibold">Post not found</h2>
      <p className="text-muted-foreground text-sm">This announcement could not be found.</p>
      <Button asChild variant="outline"><Link to="/blog">Back to Announcements</Link></Button>
    </div>
  );

  return (
    <div className="min-h-screen pb-12">
      {/* ── Hero image or gradient banner ── */}
      {blog.thumbnail_url ? (
        <div className="relative w-full aspect-[21/7] md:aspect-[21/6] bg-muted overflow-hidden">
          <img src={blog.thumbnail_url} alt={blog.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
            <div className="container mx-auto max-w-4xl space-y-1.5">
              {blog.group && <Badge className="bg-primary/80 text-white border-0 text-xs mb-1">{blog.group}</Badge>}
              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-lg line-clamp-3">{blog.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/40 py-10 md:py-14">
          <div className="container mx-auto max-w-4xl px-4 space-y-3">
            {blog.group && <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">{blog.group}</Badge>}
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{blog.title}</h1>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Back */}
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/blog"><ArrowLeft className="w-3.5 h-3.5" />All Announcements</Link>
        </Button>

        {/* ── Author + actions bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-border/60">
              <AvatarImage src={blog.author_profile_picture} alt={blog.author_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {blog.author_name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none mb-1">{blog.author_name}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {blog.author_username && <span className="text-primary/70">@{blog.author_username}</span>}
                <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{formatDate(blog.created_at)}</span>
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{readingTime(blog.content)} min read</span>
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{blog.views} views</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 h-8 text-xs rounded-lg">
              <Share2 className="w-3.5 h-3.5" />Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 h-8 text-xs rounded-lg">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* ── Article body ── */}
        <article className="bg-card border border-border/40 rounded-2xl p-5 md:p-8 shadow-sm">
          <div
            className="prose max-w-none dark:prose-invert prose-sm md:prose-base prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* ── Tags ── */}
        {(blog.group || (blog.specialization && blog.specialization !== 'COMMON')) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {blog.group && <Badge variant="secondary" className="text-xs">{blog.group}</Badge>}
            {blog.specialization && blog.specialization !== 'COMMON' && (
              <Badge variant="secondary" className="text-xs">{blog.specialization}</Badge>
            )}
          </div>
        )}

        {/* ── Reviews ── */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 md:p-8 shadow-sm">
          <ReviewSection
            reviews={reviews}
            averageRating={averageRating}
            onAddReview={handleAddReview}
            canReview={!!user}
            title="Reviews & Reactions"
          />
        </div>
      </div>
    </div>
  );
};

export default Blog;
