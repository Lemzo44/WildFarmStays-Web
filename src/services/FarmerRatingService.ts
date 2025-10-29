import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

export interface FarmerRating {
  id: string;
  farmerId: string;
  camperId: string; // Maps to reviewer_id in schema
  bookingId?: string; // Not in schema, will be handled separately if needed
  rating: number;
  comment: string;
  createdAt: string;
}

export class FarmerRatingService {
  // Submit a farmer rating for a camper
  static async submitFarmerRating(ratingData: Omit<FarmerRating, 'id' | 'createdAt'>): Promise<FarmerRating> {
    try {
      if (useSupabase) {
        // Map to Supabase schema (note: bookingId is not in schema)
        const supabaseRatingData = {
          farmer_id: ratingData.farmerId,
          reviewer_id: ratingData.camperId,
          rating: ratingData.rating,
          comment: ratingData.comment || null,
        };

        const created = await APIService.create('farmer_ratings', supabaseRatingData);
        
        return {
          id: created.id,
          farmerId: created.farmer_id || created.farmerId,
          camperId: created.reviewer_id || created.reviewerId,
          bookingId: ratingData.bookingId, // Keep from input even if not in DB
          rating: created.rating,
          comment: created.comment || '',
          createdAt: created.created_at || created.createdAt || new Date().toISOString(),
        };
      } else {
        const rating: FarmerRating = {
          ...ratingData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };

        await LocalStorageService.save('farmerRatings', rating);
        return rating;
      }
    } catch (error) {
      console.error('Error submitting farmer rating:', error);
      throw error;
    }
  }

  // Create a farmer rating (alias for submitFarmerRating)
  static async createFarmerRating(ratingData: Omit<FarmerRating, 'id' | 'createdAt'>): Promise<{success: boolean, rating?: FarmerRating, message?: string}> {
    try {
      const rating = await this.submitFarmerRating(ratingData);
      return { success: true, rating };
    } catch (error) {
      console.error('Error creating farmer rating:', error);
      return { success: false, message: 'Failed to create rating' };
    }
  }

  // Get all farmer ratings for a specific camper
  static async getCamperFarmerRatings(camperId: string): Promise<FarmerRating[]> {
    try {
      if (useSupabase) {
        // Get ratings where this camper is the reviewer
        const ratings = await APIService.get('farmer_ratings', {
          filter: { column: 'reviewer_id', operator: 'eq', value: camperId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        return ratings.map((rating: any) => ({
          id: rating.id,
          farmerId: rating.farmer_id || rating.farmerId,
          camperId: rating.reviewer_id || rating.reviewerId,
          bookingId: undefined, // Not stored in schema
          rating: rating.rating,
          comment: rating.comment || '',
          createdAt: rating.created_at || rating.createdAt || '',
        }));
      } else {
        const ratings = await LocalStorageService.getAll('farmerRatings');
        return ratings.filter((rating: FarmerRating) => rating.camperId === camperId);
      }
    } catch (error) {
      console.error('Error getting camper farmer ratings:', error);
      return [];
    }
  }

  // Get ratings for a specific farmer (ratings OF the farmer)
  static async getRatingsByFarmerForStats(farmerId: string): Promise<FarmerRating[]> {
    return this.getRatingsByFarmer(farmerId);
  }

  // Get farmer rating statistics for a camper
  static async getCamperFarmerRatingStats(camperId: string): Promise<{
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    try {
      const ratings = await this.getCamperFarmerRatings(camperId);
      
      if (ratings.length === 0) {
        return {
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
      
      const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        ratingDistribution[rating.rating]++;
      });

      return {
        totalRatings,
        averageRating,
        ratingDistribution
      };
    } catch (error) {
      console.error('Error getting camper farmer rating stats:', error);
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }

  // Get all farmer ratings for a specific farmer (ratings OF the farmer, not BY the farmer)
  static async getRatingsByFarmer(farmerId: string): Promise<FarmerRating[]> {
    try {
      if (useSupabase) {
        const ratings = await APIService.get('farmer_ratings', {
          filter: { column: 'farmer_id', operator: 'eq', value: farmerId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        return ratings.map((rating: any) => ({
          id: rating.id,
          farmerId: rating.farmer_id || rating.farmerId,
          camperId: rating.reviewer_id || rating.reviewerId,
          bookingId: undefined,
          rating: rating.rating,
          comment: rating.comment || '',
          createdAt: rating.created_at || rating.createdAt || '',
        }));
      } else {
        const ratings = await LocalStorageService.getAll('farmerRatings');
        return ratings.filter((rating: FarmerRating) => rating.farmerId === farmerId);
      }
    } catch (error) {
      console.error('Error getting farmer ratings:', error);
      return [];
    }
  }

  // Get all farmer ratings submitted by a specific farmer (alias for compatibility)
  static async getFarmerSubmittedRatings(farmerId: string): Promise<FarmerRating[]> {
    return this.getRatingsByFarmer(farmerId);
  }

  // Check if a farmer has already rated a specific camper
  static async hasFarmerRatedCamper(farmerId: string, camperId: string, bookingId?: string): Promise<boolean> {
    try {
      if (useSupabase) {
        // Schema has UNIQUE constraint on (farmer_id, reviewer_id), so check for existing rating
        const ratings = await APIService.get('farmer_ratings', {
          filter: { column: 'farmer_id', operator: 'eq', value: farmerId }
        });
        return ratings.some((rating: any) => 
          (rating.reviewer_id || rating.reviewerId) === camperId
        );
      } else {
        const ratings = await LocalStorageService.getAll('farmerRatings');
        return ratings.some((rating: FarmerRating) => 
          rating.farmerId === farmerId && 
          rating.camperId === camperId &&
          (!bookingId || rating.bookingId === bookingId)
        );
      }
    } catch (error) {
      console.error('Error checking if farmer has rated camper:', error);
      return false;
    }
  }

  // Get farmer rating for a specific booking
  // Note: bookingId not in schema, so this may not work exactly as before
  static async getFarmerRatingForBooking(bookingId: string): Promise<FarmerRating | null> {
    try {
      if (useSupabase) {
        // Can't query by bookingId since it's not in schema
        // Return null - this functionality would need schema update
        console.warn('getFarmerRatingForBooking: bookingId not stored in farmer_ratings schema');
        return null;
      } else {
        const ratings = await LocalStorageService.getAll('farmerRatings');
        return ratings.find((rating: FarmerRating) => rating.bookingId === bookingId) || null;
      }
    } catch (error) {
      console.error('Error getting farmer rating for booking:', error);
      return null;
    }
  }

  // Get all bookings that a farmer can rate (completed stays)
  static async getBookingsToRate(farmerId: string): Promise<any[]> {
    try {
      const useSupabaseBackend = useSupabase;
      let bookings: any[] = [];
      let ratings: FarmerRating[] = [];
      
      if (useSupabaseBackend) {
        // Note: This method relies on bookingId which isn't in farmer_ratings schema
        // For now, return empty array - functionality would need redesign
        console.warn('getBookingsToRate: requires bookingId in farmer_ratings schema');
        return [];
      } else {
        bookings = await LocalStorageService.getAll('bookings');
        const allRatings = await LocalStorageService.getAll('farmerRatings');
        ratings = allRatings;
      }
      
      // Get bookings for farmer's listings that are completed
      const farmerBookings = bookings.filter((booking: any) => {
        return booking.status === 'completed';
      });

      // Filter out bookings that have already been rated (if bookingId available)
      const bookingsToRate = farmerBookings.filter((booking: any) => {
        const hasRated = ratings.some((rating: FarmerRating) => 
          rating.farmerId === farmerId && 
          rating.bookingId === booking.id
        );
        return !hasRated;
      });

      return bookingsToRate;
    } catch (error) {
      console.error('Error getting bookings to rate:', error);
      return [];
    }
  }

  // Update a farmer rating
  static async updateFarmerRating(ratingId: string, updatedData: Partial<FarmerRating>): Promise<FarmerRating | null> {
    try {
      if (useSupabase) {
        const updatePayload: any = {};
        if (updatedData.rating !== undefined) updatePayload.rating = updatedData.rating;
        if (updatedData.comment !== undefined) updatePayload.comment = updatedData.comment;
        
        await APIService.update('farmer_ratings', ratingId, updatePayload);
        
        // Fetch updated rating
        const updated = await APIService.getById('farmer_ratings', ratingId);
        if (!updated) return null;
        
        return {
          id: updated.id,
          farmerId: updated.farmer_id || updated.farmerId,
          camperId: updated.reviewer_id || updated.reviewerId,
          bookingId: undefined,
          rating: updated.rating,
          comment: updated.comment || '',
          createdAt: updated.created_at || updated.createdAt || '',
        };
      } else {
        const existingRating = await LocalStorageService.getById('farmerRatings', ratingId);
        if (!existingRating) {
          return null;
        }

        const updatedRating = { ...existingRating, ...updatedData };
        await LocalStorageService.save('farmerRatings', updatedRating);
        return updatedRating;
      }
    } catch (error) {
      console.error('Error updating farmer rating:', error);
      throw error;
    }
  }

  // Delete a farmer rating
  static async deleteFarmerRating(ratingId: string): Promise<boolean> {
    try {
      if (useSupabase) {
        await APIService.delete('farmer_ratings', ratingId);
        return true;
      } else {
        await LocalStorageService.delete('farmerRatings', ratingId);
        return true;
      }
    } catch (error) {
      console.error('Error deleting farmer rating:', error);
      return false;
    }
  }
}

export default FarmerRatingService;



