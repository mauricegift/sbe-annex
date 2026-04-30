import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
    {/* Welcome section skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Quick actions skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Notes/Papers list skeleton
export const NotesListSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
    {/* Header skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Filters skeleton */}
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>

    {/* Notes grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <Skeleton className="h-40 rounded-t-lg" />
          <CardContent className="pt-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Blog list skeleton
export const BlogListSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
    {/* Header skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-10" />
    </div>

    {/* Search skeleton */}
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-10 w-10" />
    </div>

    {/* Blog posts skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse overflow-hidden">
          <Skeleton className="h-48" />
          <CardContent className="pt-4 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-10" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full max-w-md" />
        
        {/* Form fields skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Admin skeleton
export const AdminSkeleton = () => (
  <div className="container mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in">
    {/* Header skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Tabs skeleton */}
    <Skeleton className="h-12 w-full" />

    {/* Content skeleton */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Generic table skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 animate-fade-in">
    {/* Table header */}
    <div className="flex gap-4 p-4 bg-muted rounded-lg">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border rounded-lg">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    ))}
  </div>
);

// Card grid skeleton
export const CardGridSkeleton = ({ cards = 6 }: { cards?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
    {Array.from({ length: cards }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <Skeleton className="h-40 rounded-t-lg" />
        <CardContent className="pt-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Document view skeleton (for note/paper detail pages)
export const DocumentViewSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
    {/* Centered logo spinner */}
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <img 
          src="/android-chrome-512x512.png" 
          alt="Loading" 
          className="w-full h-full rounded-full object-cover p-1"
        />
      </div>
      <p className="mt-4 text-muted-foreground">Loading document...</p>
    </div>
  </div>
);

// About page skeleton
export const AboutSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col animate-fade-in">
    {/* Hero Section skeleton */}
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-5 w-full max-w-xl mx-auto" />
          <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>
      </div>
    </section>

    <div className="container mx-auto px-4 pb-16 space-y-16 flex-1">
      {/* Mission Section skeleton */}
      <section className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardContent>
        </Card>
      </section>

      {/* Stats Section skeleton */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm text-center p-6 animate-pulse">
              <Skeleton className="h-8 w-8 mx-auto mb-3 rounded-full" />
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </Card>
          ))}
        </div>
      </section>

      {/* Values Section skeleton */}
      <section className="max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm animate-pulse">
              <CardContent className="pt-6 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story Section skeleton */}
      <section className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </section>

      {/* Team Section skeleton */}
      <section className="max-w-5xl mx-auto">
        <Skeleton className="h-8 w-40 mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm animate-pulse">
              <CardContent className="pt-6 text-center">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  </div>
);
