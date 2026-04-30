import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Star, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../lib/toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export interface Review {
  id: string;
  content: string;
  rating: number;
  reviewed_by: string;
  reviewed_by_name: string;
  reviewed_by_username?: string;
  reviewed_by_profile_picture?: string;
  created_at: string;
}

interface ReviewSectionProps {
  reviews: Review[];
  averageRating: number;
  onAddReview: (content: string, rating: number) => Promise<void>;
  canReview?: boolean;
  title?: string;
}

const StarRating: React.FC<{
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}> = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  averageRating,
  onAddReview,
  canReview = true,
  title = 'Reviews',
}) => {
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!newReview.trim()) {
      toast({
        title: 'Review required',
        description: 'Please write a review before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddReview(newReview, newRating);
      setNewReview('');
      setNewRating(5);
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit review',
        description: error.response?.data?.detail || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{title}</CardTitle>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({averageRating.toFixed(1)}) • {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Add Review Form */}
            {canReview && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Your rating:</span>
                  <StarRating rating={newRating} onRatingChange={setNewRating} />
                </div>
                <Textarea
                  placeholder="Write your review..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newReview.trim()}
                  size="sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Review
                </Button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3 p-3 bg-background rounded-lg border">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={review.reviewed_by_profile_picture} alt={review.reviewed_by_name} />
                      <AvatarFallback className="text-xs">
                        {review.reviewed_by_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{review.reviewed_by_name}</span>
                        {review.reviewed_by_username && (
                          <span className="text-xs text-muted-foreground">@{review.reviewed_by_username}</span>
                        )}
                        <StarRating rating={review.rating} readonly size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reviews yet. Be the first to leave a review!
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ReviewSection;
