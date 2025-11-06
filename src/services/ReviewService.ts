import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  title?: string;
  approved?: boolean;
  bookingId?: string;
  images?: string[];
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
      if (useSupabase) {
        // Map to Supabase schema
        const supabaseReviewData: any = {
          listing_id: reviewData.listingId,
          reviewer_id: reviewData.reviewerId,
          booking_id: reviewData.bookingId || null,
          rating: reviewData.rating,
          title: reviewData.title || null,
          comment: reviewData.comment || null,
          approved: reviewData.approved || false,
        };

        // Add images if provided
        if ((reviewData as any).images && Array.isArray((reviewData as any).images)) {
          supabaseReviewData.images = (reviewData as any).images;
        }

        const created = await APIService.create<any>('reviews', supabaseReviewData);
        
        // Normalize response
        const row: any = created;
        return {
          id: row.id,
          listingId: row.listing_id || row.listingId,
          reviewerId: row.reviewer_id || row.reviewerId,
          reviewerName: reviewData.reviewerName,
          rating: row.rating,
          comment: row.comment || '',
          title: row.title || undefined,
          approved: row.approved || false,
          bookingId: row.booking_id || row.bookingId,
          images: row.images || [],
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
        };
      } else {
        // Fallback to localStorage
        const review: Review = {
          ...reviewData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await LocalStorageService.save('reviews', review);
        return review;
      }
    } catch (error: any) {
      console.error('Error creating review:', error);
      // Handle unique constraint: one review per (listing_id, reviewer_id)
      if (error?.code === '23505') {
        throw new Error('You have already submitted a review for this listing.');
      }
      throw new Error('Failed to create review');
    }
  }

  /**
   * Get all reviews for a listing
   */
  static async getListingReviews(listingId: string): Promise<Review[]> {
    try {
      if (useSupabase) {
        // Fetch reviews for this listing (only approved ones for public, all for admin)
        const reviews = await APIService.get<any>('reviews', {
          filter: { column: 'listing_id', operator: 'eq', value: listingId },
          orderBy: { column: 'created_at', ascending: false }
        });

        // Batch fetch reviewer names from profiles
        const reviewerIdSet = new Set<string>();
        (reviews || []).forEach((r: any) => {
          const rid = r.reviewer_id || r.reviewerId;
          if (rid) reviewerIdSet.add(rid);
        });

        const idList = Array.from(reviewerIdSet);
        const idToName: Record<string, string> = {};
        if (idList.length > 0) {
          try {
            const profiles = await APIService.query(async (client) => {
              const { data, error } = await client
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', idList);
              if (error) throw error;
              return data as any[];
            });
            for (const p of profiles || []) {
              const fn = p.first_name || '';
              const ln = p.last_name || '';
              idToName[p.id] = `${fn} ${ln}`.trim() || 'Anonymous';
            }
          } catch (e) {
            // Ignore; fallback to Anonymous below
          }
        }

        // Normalize to Review interface including reviewer names; fallback to per-row fetch if missing
        const normalized: Review[] = [];
        for (const review of (reviews || [])) {
          const rid = review.reviewer_id || review.reviewerId;
          let name = idToName[rid] || review.reviewer_name || review.reviewerName || '';
          const reviewImages = review.images || [];
          if (!name) {
            try {
              const prof = await APIService.getById<any>('profiles', rid);
              const fn = prof?.first_name || prof?.firstName || '';
              const ln = prof?.last_name || prof?.lastName || '';
              name = `${fn} ${ln}`.trim();
            } catch {}
          }
          normalized.push({
            id: review.id,
            listingId: review.listing_id || review.listingId,
            reviewerId: rid,
            reviewerName: name || 'Anonymous',
            rating: review.rating,
            comment: review.comment || '',
            title: review.title || undefined,
            approved: review.approved || false,
            bookingId: review.booking_id || review.bookingId,
            images: reviewImages.length > 0 ? reviewImages : undefined,
            createdAt: review.created_at || review.createdAt || '',
            updatedAt: review.updated_at || review.updatedAt || '',
          });
        }
        return normalized;
      } else {
        const allReviews = await LocalStorageService.getAll('reviews');
        return allReviews.filter((review: Review) => review.listingId === listingId);
      }
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
      if (useSupabase) {
        const reviews = await APIService.get('reviews', {
          filter: { column: 'listing_id', operator: 'eq', value: listingId }
        });
        return reviews.some((review: any) => 
          (review.reviewer_id || review.reviewerId) === userId
        );
      } else {
        const allReviews = await LocalStorageService.getAll('reviews');
        return allReviews.some((review: Review) => 
          review.listingId === listingId && review.reviewerId === userId
        );
      }
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
      if (useSupabase) {
        const reviews = await APIService.get('reviews', {
          filter: { column: 'reviewer_id', operator: 'eq', value: userId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        return reviews.map((review: any) => ({
          id: review.id,
          listingId: review.listing_id || review.listingId,
          reviewerId: review.reviewer_id || review.reviewerId,
          reviewerName: review.reviewer_name || review.reviewerName || 'Anonymous',
          rating: review.rating,
          comment: review.comment || '',
          title: review.title || undefined,
          approved: review.approved || false,
          bookingId: review.booking_id || review.bookingId,
          createdAt: review.created_at || review.createdAt || '',
          updatedAt: review.updated_at || review.updatedAt || '',
        }));
      } else {
        const allReviews = await LocalStorageService.getAll('reviews');
        return allReviews.filter((review: Review) => review.reviewerId === userId);
      }
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw new Error('Failed to get user reviews');
    }
  }

  /**
   * Get all reviews (admin function)
   */
  static async getAllReviews(): Promise<Review[]> {
    try {
      if (useSupabase) {
        const reviews = await APIService.get('reviews', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        return reviews.map((review: any) => ({
          id: review.id,
          listingId: review.listing_id || review.listingId,
          reviewerId: review.reviewer_id || review.reviewerId,
          reviewerName: review.reviewer_name || review.reviewerName || 'Anonymous',
          rating: review.rating,
          comment: review.comment || '',
          title: review.title || undefined,
          approved: review.approved || false,
          bookingId: review.booking_id || review.bookingId,
          createdAt: review.created_at || review.createdAt || '',
          updatedAt: review.updated_at || review.updatedAt || '',
        }));
      } else {
        return await LocalStorageService.getAll('reviews');
      }
    } catch (error) {
      console.error('Error getting all reviews:', error);
      throw new Error('Failed to get all reviews');
    }
  }

  /**
   * Get approved reviews for a listing (public view)
   */
  static async getApprovedReviews(listingId: string): Promise<Review[]> {
    try {
      if (useSupabase) {
        const reviews = await APIService.get('reviews', {
          filter: { column: 'listing_id', operator: 'eq', value: listingId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Filter to only approved reviews
        const approved = reviews.filter((review: any) => review.approved === true);
        
        return approved.map((review: any) => ({
          id: review.id,
          listingId: review.listing_id || review.listingId,
          reviewerId: review.reviewer_id || review.reviewerId,
          reviewerName: review.reviewer_name || review.reviewerName || 'Anonymous',
          rating: review.rating,
          comment: review.comment || '',
          title: review.title || undefined,
          approved: true,
          bookingId: review.booking_id || review.bookingId,
          createdAt: review.created_at || review.createdAt || '',
          updatedAt: review.updated_at || review.updatedAt || '',
        }));
      } else {
        const allReviews = await LocalStorageService.getAll('reviews');
        return allReviews.filter((review: Review) => 
          review.listingId === listingId
        );
      }
    } catch (error) {
      console.error('Error getting approved reviews:', error);
      throw new Error('Failed to get approved reviews');
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      if (useSupabase) {
        await APIService.delete('reviews', reviewId);
      } else {
        await LocalStorageService.delete('reviews', reviewId);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }
}


