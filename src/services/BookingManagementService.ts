import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

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
      if (useSupabase) {
        const booking = await APIService.getById('bookings', bookingId);
        if (!booking) {
          return { success: false, message: 'Booking not found.' };
        }

        // Check if booking can be cancelled
        if (booking.status === 'completed') {
          return { success: false, message: 'Cannot cancel a completed booking.' };
        }

        if (booking.status === 'cancelled') {
          return { success: false, message: 'Booking is already cancelled.' };
        }

        // Update booking status to cancelled
        await APIService.update('bookings', bookingId, {
          status: 'cancelled'
        });

        return { success: true, message: 'Booking cancelled successfully.' };
      } else {
        const booking = await LocalStorageService.getById('bookings', bookingId);
        
        if (!booking) {
          return { success: false, message: 'Booking not found.' };
        }

        if (booking.status === 'completed') {
          return { success: false, message: 'Cannot cancel a completed booking.' };
        }

        if (booking.status === 'cancelled') {
          return { success: false, message: 'Booking is already cancelled.' };
        }

        const updatedBooking = { 
          ...booking,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        };
        await LocalStorageService.save('bookings', updatedBooking);

        return { success: true, message: 'Booking cancelled successfully.' };
      }
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
      let totalPrice = booking.totalPrice || booking.total_price;
      if (updates.startDate || updates.endDate || updates.guests) {
        const listingId = booking.listingId || booking.listing_id;
        const listing = useSupabase
          ? await APIService.getById('listings', listingId)
          : await LocalStorageService.getById('listings', listingId);
        
        if (listing) {
          const startDate = updates.startDate ? new Date(updates.startDate) : new Date(booking.startDate || booking.start_date);
          const endDate = updates.endDate ? new Date(updates.endDate) : new Date(booking.endDate || booking.end_date);
          const guests = updates.guests || booking.guests;
          
          const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const basePrice = (listing.price || listing.price_per_night || 0) * nights * guests;
          totalPrice = basePrice * 1.1; // Add 10% service fee
        }
      }

      // Update booking
      if (useSupabase) {
        const updatePayload: any = {};
        if (updates.startDate) updatePayload.start_date = updates.startDate;
        if (updates.endDate) updatePayload.end_date = updates.endDate;
        if (updates.guests !== undefined) updatePayload.guests = updates.guests;
        if (updates.specialRequests) updatePayload.special_requests = updates.specialRequests;
        if (totalPrice !== booking.totalPrice) updatePayload.total_price = totalPrice;
        if (updates.status) updatePayload.status = updates.status;

        await APIService.update('bookings', bookingId, updatePayload);
        
        // Fetch updated booking
        const updatedBooking = await APIService.getById('bookings', bookingId);
        
        return { 
          success: true, 
          message: 'Booking updated successfully.',
          booking: {
            ...updatedBooking,
            camperId: updatedBooking.camper_id || updatedBooking.camperId,
            farmerId: updatedBooking.farmer_id || updatedBooking.farmerId,
            listingId: updatedBooking.listing_id || updatedBooking.listingId,
            startDate: updatedBooking.start_date || updatedBooking.startDate,
            endDate: updatedBooking.end_date || updatedBooking.endDate,
            specialRequests: updatedBooking.special_requests || updatedBooking.specialRequests,
            totalPrice: updatedBooking.total_price || updatedBooking.totalPrice,
          } as BookingDetails
        };
      } else {
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
      }
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
      const booking = useSupabase
        ? await APIService.getById('bookings', bookingId)
        : await LocalStorageService.getById('bookings', bookingId);
      
      if (!booking) return null;

      // Normalize booking fields
      const normalizedBooking = {
        ...booking,
        camperId: booking.camper_id || booking.camperId,
        farmerId: booking.farmer_id || booking.farmerId,
        listingId: booking.listing_id || booking.listingId,
        startDate: booking.start_date || booking.startDate,
        endDate: booking.end_date || booking.endDate,
        totalPrice: booking.total_price || booking.totalPrice,
        specialRequests: booking.special_requests || booking.specialRequests,
      };

      const listingId = normalizedBooking.listingId;
      const farmerId = normalizedBooking.farmerId;
      const camperId = normalizedBooking.camperId;

      // Fetch related data
      let listing: any = null;
      let farmer: any = null;
      let camper: any = null;

      if (useSupabase) {
        listing = listingId ? await APIService.getById('listings', listingId).catch(() => null) : null;
        farmer = farmerId ? await APIService.getById('profiles', farmerId).catch(() => null) : null;
        camper = camperId ? await APIService.getById('profiles', camperId).catch(() => null) : null;
      } else {
        listing = listingId ? await LocalStorageService.getById('listings', listingId) : null;
        farmer = farmerId ? await LocalStorageService.getById('users', farmerId) : null;
        camper = camperId ? await LocalStorageService.getById('users', camperId) : null;
      }

      const farmerFirstName = farmer?.first_name || farmer?.firstName || '';
      const farmerLastName = farmer?.last_name || farmer?.lastName || '';
      const camperFirstName = camper?.first_name || camper?.firstName || '';
      const camperLastName = camper?.last_name || camper?.lastName || '';
      
      return {
        ...normalizedBooking,
        listingTitle: listing?.title || 'Unknown Listing',
        listingLocation: listing?.location || 'Unknown Location',
        farmerName: farmer ? `${farmerFirstName} ${farmerLastName}`.trim() || 'Unknown Farmer' : 'Unknown Farmer',
        camperName: camper ? `${camperFirstName} ${camperLastName}`.trim() || 'Unknown Camper' : 'Unknown Camper',
      } as BookingDetails;
    } catch (error) {
      console.error('Error getting booking details:', error);
      return null;
    }
  },

  /**
   * Confirm a booking
   */
  confirmBooking: async (bookingId: string): Promise<{success: boolean, message: string}> => {
    try {
      if (useSupabase) {
        await APIService.update('bookings', bookingId, { status: 'confirmed' });
        return { success: true, message: 'Booking confirmed successfully.' };
      } else {
        const booking = await LocalStorageService.getById('bookings', bookingId);
        if (!booking) {
          return { success: false, message: 'Booking not found.' };
        }
        booking.status = 'confirmed';
        await LocalStorageService.save('bookings', booking);
        return { success: true, message: 'Booking confirmed successfully.' };
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      return { success: false, message: 'Failed to confirm booking. Please try again.' };
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



