import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, Trash2, Loader2, MessageSquare, Flag, CheckCircle, XCircle, Send } from 'lucide-react';
import { toast } from '../lib/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export interface Review {
  id: string;
  content: string;
  rating: number;
  reviewed_by: string;
  reviewed_by_name: string;
  reviewed_by_username?: string;
  reviewed_by_profile_picture?: string;
  created_at: string;
  status?: 'pending' | 'approved' | 'flagged';
  admin_reply?: string;
  admin_reply_at?: string;
}

interface ReviewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reviews: Review[];
  averageRating: number;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  onReplyToReview?: (reviewId: string, reply: string) => Promise<void>;
  onFlagReview?: (reviewId: string) => Promise<void>;
  onApproveReview?: (reviewId: string) => Promise<void>;
  isLoading?: boolean;
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{
  review: Review;
  onDelete?: () => void;
  onReply?: (reply: string) => void;
  onFlag?: () => void;
  onApprove?: () => void;
  isDeleting: boolean;
  isReplying: boolean;
  isFlagging: boolean;
  isApproving: boolean;
}> = ({ review, onDelete, onReply, onFlag, onApprove, isDeleting, isReplying, isFlagging, isApproving }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState(review.admin_reply || '');

  const handleSubmitReply = () => {
    if (replyText.trim() && onReply) {
      onReply(replyText.trim());
      setShowReplyInput(false);
    }
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={review.reviewed_by_profile_picture} alt={review.reviewed_by_name} />
          <AvatarFallback className="text-xs">
            {review.reviewed_by_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{review.reviewed_by_name}</span>
              {review.reviewed_by_username && (
                <span className="text-xs text-muted-foreground">@{review.reviewed_by_username}</span>
              )}
              {review.status === 'flagged' && (
                <Badge variant="destructive" className="text-xs py-0">Flagged</Badge>
              )}
              {review.status === 'pending' && (
                <Badge variant="secondary" className="text-xs py-0">Pending</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onApprove && review.status !== 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-600 hover:bg-green-500/10"
                  onClick={onApprove}
                  disabled={isApproving}
                  title="Approve review"
                >
                  {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                </Button>
              )}
              {onFlag && review.status !== 'flagged' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-yellow-600 hover:text-yellow-600 hover:bg-yellow-500/10"
                  onClick={onFlag}
                  disabled={isFlagging}
                  title="Flag review"
                >
                  {isFlagging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                </Button>
              )}
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  title="Reply to review"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                  disabled={isDeleting}
                  title="Delete review"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} />
            <span className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
          
          {/* Admin Reply Display */}
          {review.admin_reply && !showReplyInput && (
            <div className="mt-2 p-2 bg-primary/10 rounded border-l-2 border-primary">
              <p className="text-xs font-medium text-primary">Admin Reply:</p>
              <p className="text-sm text-foreground">{review.admin_reply}</p>
              {review.admin_reply_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(review.admin_reply_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyInput(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || isReplying}
            >
              {isReplying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReviewsDialog: React.FC<ReviewsDialogProps> = ({
  isOpen,
  onClose,
  title,
  reviews,
  averageRating,
  onDeleteReview,
  onReplyToReview,
  onFlagReview,
  onApproveReview,
  isLoading = false,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleDelete = async (reviewId: string) => {
    if (!onDeleteReview) return;
    
    setDeletingId(reviewId);
    try {
      await onDeleteReview(reviewId);
      toast({
        title: 'Review deleted',
        description: 'The review has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.detail || 'Failed to delete review',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleReply = async (reviewId: string, reply: string) => {
    if (!onReplyToReview) return;
    
    setReplyingId(reviewId);
    try {
      await onReplyToReview(reviewId, reply);
      toast({
        title: 'Reply sent',
        description: 'Your reply has been posted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Reply failed',
        description: error.response?.data?.detail || 'Failed to post reply',
        variant: 'destructive',
      });
    } finally {
      setReplyingId(null);
    }
  };

  const handleFlag = async (reviewId: string) => {
    if (!onFlagReview) return;
    
    setFlaggingId(reviewId);
    try {
      await onFlagReview(reviewId);
      toast({
        title: 'Review flagged',
        description: 'The review has been flagged for moderation',
      });
    } catch (error: any) {
      toast({
        title: 'Flag failed',
        description: error.response?.data?.detail || 'Failed to flag review',
        variant: 'destructive',
      });
    } finally {
      setFlaggingId(null);
    }
  };

  const handleApprove = async (reviewId: string) => {
    if (!onApproveReview) return;
    
    setApprovingId(reviewId);
    try {
      await onApproveReview(reviewId);
      toast({
        title: 'Review approved',
        description: 'The review has been approved',
      });
    } catch (error: any) {
      toast({
        title: 'Approve failed',
        description: error.response?.data?.detail || 'Failed to approve review',
        variant: 'destructive',
      });
    } finally {
      setApprovingId(null);
    }
  };

  // Filter reviews based on tab
  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return review.status === 'pending';
    if (activeTab === 'flagged') return review.status === 'flagged';
    if (activeTab === 'approved') return review.status === 'approved' || !review.status;
    return true;
  });

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const flaggedCount = reviews.filter(r => r.status === 'flagged').length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <StarRating rating={Math.round(averageRating)} size="md" />
              <span>
                {averageRating.toFixed(1)} average • {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {/* Moderation Tabs */}
          {(onFlagReview || onApproveReview) && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs relative">
                  Pending
                  {pendingCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="flagged" className="text-xs relative">
                  Flagged
                  {flaggedCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                      {flaggedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onDelete={onDeleteReview ? () => setConfirmDelete(review.id) : undefined}
                  onReply={onReplyToReview ? (reply) => handleReply(review.id, reply) : undefined}
                  onFlag={onFlagReview ? () => handleFlag(review.id) : undefined}
                  onApprove={onApproveReview ? () => handleApprove(review.id) : undefined}
                  isDeleting={deletingId === review.id}
                  isReplying={replyingId === review.id}
                  isFlagging={flaggingId === review.id}
                  isApproving={approvingId === review.id}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {activeTab === 'all' ? 'No reviews yet' : `No ${activeTab} reviews`}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReviewsDialog;
