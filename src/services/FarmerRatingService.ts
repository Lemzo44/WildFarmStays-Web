import { LocalStorageService } from './LocalStorageService';

export interface FarmerRating {
  id: string;
  farmerId: string;
  camperId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export class FarmerRatingService {
  // Submit a farmer rating for a camper
  static async submitFarmerRating(ratingData: Omit<FarmerRating, 'id' | 'createdAt'>): Promise<FarmerRating> {
    try {
      const rating: FarmerRating = {
        ...ratingData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      await LocalStorageService.save('farmerRatings', rating);
      return rating;
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
      const ratings = await LocalStorageService.getAll('farmerRatings');
      return ratings.filter((rating: FarmerRating) => rating.camperId === camperId);
    } catch (error) {
      console.error('Error getting camper farmer ratings:', error);
      return [];
    }
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

  // Get all farmer ratings submitted by a specific farmer
  static async getFarmerSubmittedRatings(farmerId: string): Promise<FarmerRating[]> {
    try {
      const ratings = await LocalStorageService.getAll('farmerRatings');
      return ratings.filter((rating: FarmerRating) => rating.farmerId === farmerId);
    } catch (error) {
      console.error('Error getting farmer submitted ratings:', error);
      return [];
    }
  }

  // Check if a farmer has already rated a specific camper for a specific booking
  static async hasFarmerRatedCamper(farmerId: string, camperId: string, bookingId: string): Promise<boolean> {
    try {
      const ratings = await LocalStorageService.getAll('farmerRatings');
      return ratings.some((rating: FarmerRating) => 
        rating.farmerId === farmerId && 
        rating.camperId === camperId && 
        rating.bookingId === bookingId
      );
    } catch (error) {
      console.error('Error checking if farmer has rated camper:', error);
      return false;
    }
  }

  // Get farmer rating for a specific booking
  static async getFarmerRatingForBooking(bookingId: string): Promise<FarmerRating | null> {
    try {
      const ratings = await LocalStorageService.getAll('farmerRatings');
      return ratings.find((rating: FarmerRating) => rating.bookingId === bookingId) || null;
    } catch (error) {
      console.error('Error getting farmer rating for booking:', error);
      return null;
    }
  }

  // Get all bookings that a farmer can rate (completed stays)
  static async getBookingsToRate(farmerId: string): Promise<any[]> {
    try {
      const bookings = await LocalStorageService.getAll('bookings');
      const ratings = await LocalStorageService.getAll('farmerRatings');
      
      // Get bookings for farmer's listings that are completed
      const farmerBookings = bookings.filter((booking: any) => {
        // We need to check if this booking is for one of the farmer's listings
        // This will be handled by the calling function
        return booking.status === 'completed';
      });

      // Filter out bookings that have already been rated
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
      const existingRating = await LocalStorageService.getById('farmerRatings', ratingId);
      if (!existingRating) {
        return null;
      }

      const updatedRating = { ...existingRating, ...updatedData };
      await LocalStorageService.save('farmerRatings', updatedRating);
      return updatedRating;
    } catch (error) {
      console.error('Error updating farmer rating:', error);
      throw error;
    }
  }

  // Delete a farmer rating
  static async deleteFarmerRating(ratingId: string): Promise<boolean> {
    try {
      await LocalStorageService.delete('farmerRatings', ratingId);
      return true;
    } catch (error) {
      console.error('Error deleting farmer rating:', error);
      return false;
    }
  }
}

export default FarmerRatingService;



