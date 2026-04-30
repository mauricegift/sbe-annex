import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { blogAPI, reviewsAPI } from '../lib/api';
import { toast } from '../lib/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Loader2, Calendar, Eye, User, BookOpen, Search, Share2, Copy, Check, RefreshCw } from 'lucide-react';
import ReviewSection, { Review } from '../components/ReviewSection';
import { BlogListSkeleton } from '../components/PageSkeletons';

const Blog: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BlogMain />} />
      <Route path="/:id" element={<BlogView />} />
    </Routes>
  );
};

const BlogMain: React.FC = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasNext: false });

  useEffect(() => {
    fetchBlogs();
  }, [searchQuery]);

  const fetchBlogs = async (page = 1) => {
    try {
      const params: any = { page, limit: 10 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const response = await blogAPI.getBlogs(params);
      if (response.data.data) {
        setBlogs(response.data.data);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          hasNext: response.data.has_next
        });
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBlogs(pagination.page);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <BlogListSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Latest updates and announcements from BBM Annex</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {blogs.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog: any) => (
              <Card key={blog.id} className="group hover:shadow-hover transition-all duration-300">
                {blog.thumbnail_url && (
                  <div className="aspect-video w-full bg-muted rounded-t-lg overflow-hidden">
                    <img 
                      src={blog.thumbnail_url} 
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{blog.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{blog.author_name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{blog.views} views</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/blog/${blog.id}`}>
                      Read More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.total > 10 && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => fetchBlogs(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {Math.ceil(pagination.total / 10)} ({pagination.total} total)
              </span>
              <Button
                variant="outline"
                onClick={() => fetchBlogs(pagination.page + 1)}
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
            <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground">Check back later for updates and announcements</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const BlogView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [blog, setBlog] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchBlog(id);
    }
  }, [id]);

  const fetchBlog = async (blogId: string) => {
    try {
      const response = await blogAPI.getBlog(blogId);
      console.log('Blog API response:', response);
      
      // Handle different response structures
      let blogData = null;
      if (response.data?.data) {
        blogData = response.data.data;
      } else if (response.data) {
        blogData = response.data;
      }
      
      if (blogData) {
        setBlog(blogData);
        // Extract reviews from blog data
        if (blogData.reviews && Array.isArray(blogData.reviews)) {
          setReviews(blogData.reviews);
          // Calculate average rating
          if (blogData.reviews.length > 0) {
            const total = blogData.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0);
            setAverageRating(total / blogData.reviews.length);
          }
        }
      } else {
        console.error('No blog data found in response');
        setBlog(null);
      }
    } catch (error) {
      console.error('Failed to fetch blog:', error);
      setBlog(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = async (content: string, rating: number) => {
    if (!id) return;
    await reviewsAPI.addBlogReview(id, { content, rating });
    // Refresh blog to get updated reviews
    await fetchBlog(id);
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: blog.title,
      text: blog.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      url: currentUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Blog post has been shared",
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy link to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Blog post link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Blog post not found</h3>
            <p className="text-muted-foreground">The requested blog post could not be found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <article className="space-y-6">
        {blog.thumbnail_url && (
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
            <img 
              src={blog.thumbnail_url} 
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <h1 className="text-4xl font-bold">{blog.title}</h1>
            
            {/* Share Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>
          
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* Author with avatar */}
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={blog.author_profile_picture} alt={blog.author_name} />
                <AvatarFallback className="text-xs">
                  {blog.author_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-foreground font-medium text-sm">{blog.author_name}</span>
                {blog.author_username && (
                  <span className="text-xs text-muted-foreground">@{blog.author_username}</span>
                )}
              </div>
            </div>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(blog.created_at).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{blog.views} views</span>
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div 
              className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <ReviewSection
          reviews={reviews}
          averageRating={averageRating}
          onAddReview={handleAddReview}
          canReview={!!user}
          title="Reviews"
        />
      </article>
    </div>
  );
};

export default Blog;