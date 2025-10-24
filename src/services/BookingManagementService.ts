import { LocalStorageService } from './LocalStorageService';

export interface BookingDetails {
  id: string;
  camperId: string;
  listingId: string;
  farmerId: string;
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  listingTitle?: string;
  listingLocation?: string;
  farmerName?: string;
  camperName?: string;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
}

export const BookingManagementService = {
  /**
   * Cancels a booking
   */
  cancelBooking: async (bookingId: string): Promise<{success: boolean, message: string}> => {
    try {
      const booking = await LocalStorageService.getById('bookings', bookingId);
      
      if (!booking) {
        return { success: false, message: 'Booking not found.' };
      }

      // Check if booking can be cancelled (e.g., not already completed or cancelled)
      if (booking.status === 'completed') {
        return { success: false, message: 'Cannot cancel a completed booking.' };
      }

      if (booking.status === 'cancelled') {
        return { success: false, message: 'Booking is already cancelled.' };
      }

      // Update booking status to cancelled
      const updatedBooking = { 
        ...booking,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };
      await LocalStorageService.save('bookings', updatedBooking);

      return { success: true, message: 'Booking cancelled successfully.' };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, message: 'Failed to cancel booking. Please try again.' };
    }
  },

  /**
   * Updates a booking (dates, guests, special requests)
   */
  updateBooking: async (bookingId: string, updates: Partial<BookingDetails>): Promise<{success: boolean, message: string, booking?: BookingDetails}> => {
    try {
      const booking = await LocalStorageService.getById('bookings', bookingId);
      
      if (!booking) {
        return { success: false, message: 'Booking not found.' };
      }

      // Check if booking can be updated
      if (booking.status === 'completed') {
        return { success: false, message: 'Cannot update a completed booking.' };
      }

      if (booking.status === 'cancelled') {
        return { success: false, message: 'Cannot update a cancelled booking.' };
      }

      // Validate dates if provided
      if (updates.startDate && updates.endDate) {
        const startDate = new Date(updates.startDate);
        const endDate = new Date(updates.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          return { success: false, message: 'Start date cannot be in the past.' };
        }

        if (endDate <= startDate) {
          return { success: false, message: 'End date must be after start date.' };
        }
      }

      // Calculate new total price if dates or guests changed
      let totalPrice = booking.totalPrice;
      if (updates.startDate || updates.endDate || updates.guests) {
        const listing = await LocalStorageService.getById('listings', booking.listingId);
        if (listing) {
          const startDate = updates.startDate ? new Date(updates.startDate) : new Date(booking.startDate);
          const endDate = updates.endDate ? new Date(updates.endDate) : new Date(booking.endDate);
          const guests = updates.guests || booking.guests;
          
          const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const basePrice = listing.price * nights * guests;
          totalPrice = basePrice * 1.1; // Add 10% service fee
        }
      }

      // Update booking
      const updatedBooking = {
        ...booking,
        ...updates,
        totalPrice,
        updatedAt: new Date().toISOString()
      };
      await LocalStorageService.save('bookings', updatedBooking);

      return { 
        success: true, 
        message: 'Booking updated successfully.',
        booking: updatedBooking
      };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, message: 'Failed to update booking. Please try again.' };
    }
  },

  /**
   * Gets booking details for management
   */
  getBookingDetails: async (bookingId: string): Promise<BookingDetails | null> => {
    try {
      const booking = await LocalStorageService.getById('bookings', bookingId);
      if (!booking) return null;

      const listing = await LocalStorageService.getById('listings', booking.listingId);
      const farmer = await LocalStorageService.getById('users', booking.farmerId);
      const camper = await LocalStorageService.getById('users', booking.camperId);
      
      return {
        ...booking,
        listingTitle: listing?.title || 'Unknown Listing',
        listingLocation: listing?.location || 'Unknown Location',
        farmerName: farmer ? `${farmer.firstName} ${farmer.lastName}` : 'Unknown Farmer',
        camperName: camper ? `${camper.firstName} ${camper.lastName}` : 'Unknown Camper',
      };
    } catch (error) {
      console.error('Error getting booking details:', error);
      return null;
    }
  },

  /**
   * Checks if a booking can be modified
   */
  canModifyBooking: (booking: BookingDetails): boolean => {
    if (!booking) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);

    return booking.status === 'upcoming' || 
           (booking.status === 'confirmed' && startDate > today);
  },

  /**
   * Gets cancellation policy message
   */
  getCancellationPolicy: (booking: BookingDetails): string => {
    if (!booking) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);
    const daysUntilStay = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilStay > 7) {
      return 'Free cancellation up to 7 days before check-in.';
    } else if (daysUntilStay > 3) {
      return '50% refund if cancelled 3-7 days before check-in.';
    } else if (daysUntilStay > 1) {
      return '25% refund if cancelled 1-3 days before check-in.';
    } else {
      return 'No refund for same-day or last-minute cancellations.';
    }
  }
};



