import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

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
  // Waiver fields
  waiverAccepted: boolean;
  waiverType?: 'republic-ireland' | 'northern-ireland';
  waiverAcceptedAt?: string;
  // Permanent copy of the waiver content agreed to at booking time
  waiverTextSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

export class BookingService {
  /**
   * Check if a listing is available for the given date range
   */
  static async checkAvailability(listingId: string, checkInDate: string, checkOutDate: string): Promise<{available: boolean, conflictingBookings: Booking[]}> {
    try {
      if (useSupabase) {
        // Fetch bookings for this listing from Supabase and filter overlaps in JS (simple and reliable for now)
        const supaRows: any[] = await APIService.get<any>('bookings', {
          select: '*',
          filter: { column: 'listing_id', operator: 'eq', value: listingId },
        });

        const listingBookings: Booking[] = supaRows
          .filter((r) => r.status !== 'cancelled')
          .map((r) => ({
            id: r.id,
            listingId: r.listing_id,
            listingTitle: r.listing_title,
            camperId: r.camper_id,
            camperName: r.camper_name,
            farmerId: r.farmer_id,
            startDate: r.start_date,
            endDate: r.end_date,
            totalPrice: Number(r.total_price),
            status: r.status,
            waiverAccepted: !!r.waiver_accepted,
            waiverType: r.waiver_type || undefined,
            waiverAcceptedAt: r.waiver_accepted_at || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));

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

        return { available: conflictingBookings.length === 0, conflictingBookings };
      }

      // Fallback: localStorage
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

      return { available: conflictingBookings.length === 0, conflictingBookings };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Check if a camper has overlapping bookings (regardless of listing)
   */
  static async checkCamperHasConflictingBookings(camperId: string, checkInDate: string, checkOutDate: string): Promise<{hasConflict: boolean, conflictingBookings: Booking[]}> {
    try {
      let camperBookings: Booking[] = [];
      if (useSupabase) {
        const supaRows: any[] = await APIService.get<any>('bookings', {
          select: '*',
          filter: { column: 'camper_id', operator: 'eq', value: camperId },
        });
        camperBookings = supaRows
          .filter((r) => r.status !== 'cancelled')
          .map((r) => ({
            id: r.id,
            listingId: r.listing_id,
            listingTitle: r.listing_title,
            camperId: r.camper_id,
            camperName: r.camper_name,
            farmerId: r.farmer_id,
            startDate: r.start_date,
            endDate: r.end_date,
            totalPrice: Number(r.total_price),
            status: r.status,
            waiverAccepted: !!r.waiver_accepted,
            waiverType: r.waiver_type || undefined,
            waiverAcceptedAt: r.waiver_accepted_at || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
      } else {
        const allBookings = await LocalStorageService.getAll('bookings');
        camperBookings = allBookings.filter((booking: Booking) => 
          booking.camperId === camperId &&
          booking.status !== 'cancelled'
        );
      }

      const requestedCheckIn = new Date(checkInDate);
      const requestedCheckOut = new Date(checkOutDate);

      const conflictingBookings = camperBookings.filter((booking: Booking) => {
        const existingCheckIn = new Date(booking.startDate);
        const existingCheckOut = new Date(booking.endDate);

        return (
          (requestedCheckIn >= existingCheckIn && requestedCheckIn < existingCheckOut) ||
          (requestedCheckOut > existingCheckIn && requestedCheckOut <= existingCheckOut) ||
          (requestedCheckIn <= existingCheckIn && requestedCheckOut >= existingCheckOut)
        );
      });

      return {
        hasConflict: conflictingBookings.length > 0,
        conflictingBookings: conflictingBookings
      };
    } catch (error) {
      console.error('Error checking camper bookings:', error);
      throw new Error('Failed to check camper bookings');
    }
  }

  /**
   * Create a new booking
   */
  static async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    try {
      // Check if camper already has a booking for these dates (across all listings)
      const camperConflict = await this.checkCamperHasConflictingBookings(
        bookingData.camperId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (camperConflict.hasConflict) {
        throw new Error('You already have a booking for these dates');
      }

      // Check if this specific listing is available for these dates
      const availability = await this.checkAvailability(
        bookingData.listingId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!availability.available) {
        throw new Error('This listing is not available for the selected dates');
      }

      if (useSupabase) {
        const payload = {
          listing_id: bookingData.listingId,
          listing_title: bookingData.listingTitle,
          camper_id: bookingData.camperId,
          camper_name: bookingData.camperName,
          farmer_id: bookingData.farmerId,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          total_price: bookingData.totalPrice,
          status: bookingData.status,
          waiver_accepted: bookingData.waiverAccepted,
          waiver_type: bookingData.waiverType ?? null,
          waiver_accepted_at: bookingData.waiverAcceptedAt ?? null,
          waiver_text_snapshot: (bookingData as any).waiverTextSnapshot ?? null,
        } as any;

        const created = await APIService.create<any>('bookings', payload);
        const mapped: Booking = {
          id: created.id,
          listingId: created.listing_id,
          listingTitle: created.listing_title,
          camperId: created.camper_id,
          camperName: created.camper_name,
          farmerId: created.farmer_id,
          startDate: created.start_date,
          endDate: created.end_date,
          totalPrice: Number(created.total_price),
          status: created.status,
          waiverAccepted: !!created.waiver_accepted,
          waiverType: created.waiver_type || undefined,
          waiverAcceptedAt: created.waiver_accepted_at || undefined,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        };
        return mapped;
      }

      // Fallback: localStorage
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
      throw error;
    }
  }

  /**
   * Get all bookings for a user (camper or farmer)
   */
  static async getUserBookings(userId: string, userRole: 'camper' | 'farmer'): Promise<Booking[]> {
    try {
      if (useSupabase) {
        const filterColumn = userRole === 'camper' ? 'camper_id' : 'farmer_id';
        const supaRows: any[] = await APIService.get<any>('bookings', {
          select: '*',
          filter: { column: filterColumn, operator: 'eq', value: userId },
          orderBy: { column: 'created_at', ascending: false },
        });

        return supaRows.map((r) => ({
          id: r.id,
          listingId: r.listing_id,
          listingTitle: r.listing_title,
          camperId: r.camper_id,
          camperName: r.camper_name,
          farmerId: r.farmer_id,
          startDate: r.start_date,
          endDate: r.end_date,
          totalPrice: Number(r.total_price),
          status: r.status,
          waiverAccepted: !!r.waiver_accepted,
          waiverType: r.waiver_type || undefined,
          waiverAcceptedAt: r.waiver_accepted_at || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }

      const allBookings = await LocalStorageService.getAll('bookings');
      return userRole === 'camper'
        ? allBookings.filter((booking: Booking) => booking.camperId === userId)
        : allBookings.filter((booking: Booking) => booking.farmerId === userId);
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
      if (useSupabase) {
        await APIService.update('bookings', bookingId, { status } as any);
        return;
      }

      const booking = await LocalStorageService.getById('bookings', bookingId);
      if (!booking) throw new Error('Booking not found');
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



