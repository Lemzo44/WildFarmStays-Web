import { LocalStorageService } from './LocalStorageService';

export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    try {
      const review: Review = {
        ...reviewData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await LocalStorageService.save('reviews', review);
      return review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw new Error('Failed to create review');
    }
  }

  /**
   * Get all reviews for a listing
   */
  static async getListingReviews(listingId: string): Promise<Review[]> {
    try {
      const allReviews = await LocalStorageService.getAll('reviews');
      return allReviews.filter((review: Review) => review.listingId === listingId);
    } catch (error) {
      console.error('Error getting listing reviews:', error);
      throw new Error('Failed to get listing reviews');
    }
  }

  /**
   * Get review statistics for a listing
   */
  static async getListingReviewStats(listingId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.getListingReviews(listingId);
      
      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return {
        totalReviews: reviews.length,
        averageRating,
        ratingDistribution
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      throw new Error('Failed to get review statistics');
    }
  }

  /**
   * Check if a user has already reviewed a listing
   */
  static async hasUserReviewed(listingId: string, userId: string): Promise<boolean> {
    try {
      const allReviews = await LocalStorageService.getAll('reviews');
      return allReviews.some((review: Review) => 
        review.listingId === listingId && review.reviewerId === userId
      );
    } catch (error) {
      console.error('Error checking if user reviewed:', error);
      return false;
    }
  }

  /**
   * Get all reviews by a user
   */
  static async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const allReviews = await LocalStorageService.getAll('reviews');
      return allReviews.filter((review: Review) => review.reviewerId === userId);
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw new Error('Failed to get user reviews');
    }
  }
}



