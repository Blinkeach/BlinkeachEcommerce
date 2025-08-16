import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, StarHalf, User, ThumbsUp, CalendarDays, Edit, Trash2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  title: string;
  isVerifiedPurchase: boolean;
  createdAt: string; // Date as ISO string
  updatedAt: string | null;
  userName: string; // joined from users table
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    title: "",
    rating: 5,
    comment: "",
  });

  // Fetch reviews for this product
  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/products", productId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return res.json();
    },
    enabled: !!productId,
  });

  // Check if user can review this product
  const { data: canReviewData, isLoading: isCheckingReviewEligibility } = useQuery({
    queryKey: ["/api/products", productId, "can-review"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/can-review`);
      if (!res.ok) {
        throw new Error("Failed to check review eligibility");
      }
      return res.json();
    },
    enabled: !!productId && !!user,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: typeof reviewForm & { productId: number }) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setIsReviewDialogOpen(false);
      setReviewForm({ title: "", rating: 5, comment: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "can-review"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; rating: number; comment: string }) => {
      const res = await apiRequest("PUT", `/api/reviews/${data.id}`, {
        title: data.title,
        rating: data.rating,
        comment: data.comment,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedReview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest("DELETE", `/api/reviews/${reviewId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "can-review"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle rating change
  const handleRatingChange = (value: number[]) => {
    setReviewForm((prev) => ({ ...prev, rating: value[0] }));
  };

  // Handle review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    submitReviewMutation.mutate({
      ...reviewForm,
      productId,
    });
  };

  // Handle review update
  const handleUpdateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    
    updateReviewMutation.mutate({
      id: selectedReview.id,
      title: reviewForm.title,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
  };

  // Open edit dialog with review data
  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setReviewForm({
      title: review.title,
      rating: review.rating,
      comment: review.comment,
    });
    setIsEditDialogOpen(true);
  };

  // Confirm and delete review
  const handleDeleteReview = (reviewId: number) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  // Filter reviews based on active tab
  const filteredReviews = reviews.filter((review: Review) => {
    if (activeTab === "all") return true;
    if (activeTab === "positive") return review.rating >= 4;
    if (activeTab === "neutral") return review.rating === 3;
    if (activeTab === "negative") return review.rating <= 2;
    if (activeTab === "verified") return review.isVerifiedPurchase;
    return true;
  });

  // Get product info to get default rating when no reviews
  const { data: productInfo } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  // Calculate average rating and counts
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : (productInfo?.rating || 0);
  
  const ratingCounts = {
    5: reviews.filter((r: Review) => r.rating === 5).length,
    4: reviews.filter((r: Review) => r.rating === 4).length,
    3: reviews.filter((r: Review) => r.rating === 3).length,
    2: reviews.filter((r: Review) => r.rating === 2).length,
    1: reviews.filter((r: Review) => r.rating === 1).length,
  };

  // Check if user has already reviewed this product
  const userReview = user ? reviews.find((review: Review) => review.userId === user.id) : null;

  // Can user review based on API response
  const canReview = canReviewData?.canReview && !userReview;

  // Render rating stars
  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="fill-green-500 text-green-500 h-4 w-4" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} className="fill-green-500 text-green-500 h-4 w-4" />);
      } else {
        stars.push(<Star key={i} className="text-green-500 h-4 w-4" />);
      }
    }
    return stars;
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading reviews...</div>;
  }

  if (isError) {
    return <div className="p-6 text-center text-red-500">Failed to load reviews</div>;
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      
      {/* Review summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <div className="text-4xl font-bold mr-2">{averageRating.toFixed(1)}</div>
            <div>
              <div className="flex">{renderRatingStars(averageRating)}</div>
              <div className="text-sm text-gray-500">
                {reviews.length} reviews
                {reviews.length === 0 && averageRating > 0 && 
                 <span className="text-xs block">(Default rating set by admin)</span>}
              </div>
            </div>
          </div>
          
          {/* Rating breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="w-12 text-sm">{rating} star</div>
                <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${reviews.length ? (ratingCounts[rating] / reviews.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="w-10 text-xs text-gray-500">{ratingCounts[rating]}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <p className="text-center mb-4">Share your thoughts with other customers</p>
            {!user ? (
              <Button variant="outline" onClick={() => window.location.href = "/auth"}>
                Login to write a review
              </Button>
            ) : (
              <>
                {userReview ? (
                  <div className="flex flex-col items-center justify-center">
                    <ThumbsUp className="h-8 w-8 text-green-500 mb-2" />
                    <p className="text-center mb-2">You've already reviewed this product</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleEditReview(userReview)}>
                        Edit Your Review
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeleteReview(userReview.id)}>
                        Delete Review
                      </Button>
                    </div>
                  </div>
                ) : isCheckingReviewEligibility ? (
                  <div className="text-center p-2">Checking eligibility...</div>
                ) : canReview ? (
                  <Button onClick={() => setIsReviewDialogOpen(true)}>
                    Write a review
                  </Button>
                ) : (
                  <div className="text-center p-2">
                    <p className="text-sm text-muted-foreground">
                      {canReviewData?.reason === "already_reviewed" 
                        ? "You've already reviewed this product." 
                        : "You've already reviewed this product or aren't eligible to review."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Review filters */}
      <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
          <TabsTrigger value="negative">Negative</TabsTrigger>
          <TabsTrigger value="verified">Verified Purchases</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredReviews.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                No reviews in this category yet
                {activeTab === "all" && reviews.length === 0 && averageRating > 0 && (
                  <span className="block mt-2 text-sm text-amber-600">
                    This product has a default rating of {averageRating.toFixed(1)} set by the admin
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review: Review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">{renderRatingStars(review.rating)}</div>
                          <CardTitle>{review.title}</CardTitle>
                        </div>
                        <CardDescription>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" /> 
                            <span>{review.userName}</span>
                            <CalendarDays className="h-3 w-3 ml-2" /> 
                            <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                            {review.isVerifiedPurchase && (
                              <Badge variant="secondary" className="ml-2">Verified Purchase</Badge>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      
                      {user && review.userId === user.id && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Write review dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmitReview}>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with this product
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="rating" className="text-center mb-2">Overall Rating</Label>
                <div className="flex items-center gap-1 mb-2">
                  {renderRatingStars(reviewForm.rating)}
                </div>
                <Slider
                  id="rating"
                  min={1}
                  max={5}
                  step={1}
                  value={[reviewForm.rating]}
                  onValueChange={handleRatingChange}
                  className="w-3/4"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="title">Add a headline</Label>
                <input
                  id="title"
                  name="title"
                  className="w-full p-2 border rounded-md"
                  placeholder="What's most important to know?"
                  value={reviewForm.title}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="comment">Write your review</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="What did you like or dislike? What did you use this product for?"
                  value={reviewForm.comment}
                  onChange={handleInputChange}
                  className="resize-none h-32"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit review dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateReview}>
            <DialogHeader>
              <DialogTitle>Edit Your Review</DialogTitle>
              <DialogDescription>
                Update your review for this product
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="edit-rating" className="text-center mb-2">Overall Rating</Label>
                <div className="flex items-center gap-1 mb-2">
                  {renderRatingStars(reviewForm.rating)}
                </div>
                <Slider
                  id="edit-rating"
                  min={1}
                  max={5}
                  step={1}
                  value={[reviewForm.rating]}
                  onValueChange={handleRatingChange}
                  className="w-3/4"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Headline</Label>
                <input
                  id="edit-title"
                  name="title"
                  className="w-full p-2 border rounded-md"
                  placeholder="What's most important to know?"
                  value={reviewForm.title}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-comment">Review</Label>
                <Textarea
                  id="edit-comment"
                  name="comment"
                  placeholder="What did you like or dislike? What did you use this product for?"
                  value={reviewForm.comment}
                  onChange={handleInputChange}
                  className="resize-none h-32"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateReviewMutation.isPending}
              >
                {updateReviewMutation.isPending ? "Updating..." : "Update Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}