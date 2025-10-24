import { LocalStorageService } from './LocalStorageService';

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  camperId: string;
  camperName: string;
  farmerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export class BookingService {
  /**
   * Check if a listing is available for the given date range
   */
  static async checkAvailability(listingId: string, checkInDate: string, checkOutDate: string): Promise<{available: boolean, conflictingBookings: Booking[]}> {
    try {
      const allBookings = await LocalStorageService.getAll('bookings');
      const listingBookings = allBookings.filter((booking: Booking) => 
        booking.listingId === listingId && 
        booking.status !== 'cancelled'
      );

      const conflictingBookings = listingBookings.filter((booking: Booking) => {
        const requestedCheckIn = new Date(checkInDate);
        const requestedCheckOut = new Date(checkOutDate);
        const existingCheckIn = new Date(booking.startDate);
        const existingCheckOut = new Date(booking.endDate);

        return (
          (requestedCheckIn >= existingCheckIn && requestedCheckIn < existingCheckOut) ||
          (requestedCheckOut > existingCheckIn && requestedCheckOut <= existingCheckOut) ||
          (requestedCheckIn <= existingCheckIn && requestedCheckOut >= existingCheckOut)
        );
      });

      return {
        available: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Create a new booking
   */
  static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    try {
      const booking: Booking = {
        ...bookingData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await LocalStorageService.save('bookings', booking);
      return booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Get all bookings for a user (camper or farmer)
   */
  static async getUserBookings(userId: string, userRole: 'camper' | 'farmer'): Promise<Booking[]> {
    try {
      const allBookings = await LocalStorageService.getAll('bookings');
      
      if (userRole === 'camper') {
        return allBookings.filter((booking: Booking) => booking.camperId === userId);
      } else {
        return allBookings.filter((booking: Booking) => booking.farmerId === userId);
      }
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw new Error('Failed to get user bookings');
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    try {
      const booking = await LocalStorageService.getById('bookings', bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      
      await LocalStorageService.save('bookings', booking);
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw new Error('Failed to update booking status');
    }
  }

  /**
   * Calculate total price for a booking
   */
  static calculateTotalPrice(pricePerNight: number, startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return pricePerNight * nights;
  }
}



