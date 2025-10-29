import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { BookingManagementService } from '../services/BookingManagementService';
import { useSupabase } from '../lib/supabase';

interface BookingManagementProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function BookingManagement({ onNavigate }: BookingManagementProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, sortBy]);

  const loadBookings = async () => {
    try {
      let allBookings: any[] = [];
      
      if (useSupabase) {
        allBookings = await APIService.get('bookings', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize bookings and fetch related data
        allBookings = await Promise.all(
          allBookings.map(async (booking: any) => {
            const normalized = {
              ...booking,
              camperId: booking.camper_id || booking.camperId,
              farmerId: booking.farmer_id || booking.farmerId,
              listingId: booking.listing_id || booking.listingId,
              startDate: booking.start_date || booking.startDate,
              endDate: booking.end_date || booking.endDate,
              totalPrice: booking.total_price || booking.totalPrice,
              createdAt: booking.created_at || booking.createdAt,
              listingTitle: booking.listing_title || booking.listingTitle,
              camperName: booking.camper_name || booking.camperName,
            };
            
            // Fetch listing and camper names if not already present
            if (!normalized.listingTitle && normalized.listingId) {
              try {
                const listing = await APIService.getById('listings', normalized.listingId);
                normalized.listingTitle = listing?.title || 'Unknown Listing';
              } catch (e) {
                normalized.listingTitle = 'Unknown Listing';
              }
            }
            
            if (!normalized.camperName && normalized.camperId) {
              try {
                const camper = await APIService.getById('profiles', normalized.camperId);
                const firstName = camper?.first_name || camper?.firstName || '';
                const lastName = camper?.last_name || camper?.lastName || '';
                normalized.camperName = `${firstName} ${lastName}`.trim() || 'Unknown Camper';
              } catch (e) {
                normalized.camperName = 'Unknown Camper';
              }
            }
            
            return normalized;
          })
        );
      } else {
        allBookings = await LocalStorageService.getAll('bookings');
      }
      
      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const applyFilters = async () => {
    try {
      let allBookings: any[] = [];
      
      if (useSupabase) {
        allBookings = await APIService.get('bookings', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize bookings
        allBookings = allBookings.map((b: any) => ({
          ...b,
          camperId: b.camper_id || b.camperId,
          listingTitle: b.listing_title || b.listingTitle,
          camperName: b.camper_name || b.camperName,
          startDate: b.start_date || b.startDate,
          endDate: b.end_date || b.endDate,
          totalPrice: b.total_price || b.totalPrice,
          createdAt: b.created_at || b.createdAt,
        }));
      } else {
        allBookings = await LocalStorageService.getAll('bookings');
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allBookings = allBookings.filter((b: any) =>
          b.listingTitle?.toLowerCase().includes(query) ||
          b.camperName?.toLowerCase().includes(query) ||
          b.id === query
        );
      }

      // Filter by status
      if (filterStatus !== 'all') {
        allBookings = allBookings.filter((b: any) => b.status === filterStatus);
      }

      // Sort
      switch (sortBy) {
        case 'recent':
          allBookings.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'oldest':
          allBookings.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateA.getTime() - dateB.getTime();
          });
          break;
        case 'price-high':
          allBookings.sort((a: any, b: any) => (b.totalPrice || b.total_price || 0) - (a.totalPrice || a.total_price || 0));
          break;
        case 'price-low':
          allBookings.sort((a: any, b: any) => (a.totalPrice || a.total_price || 0) - (b.totalPrice || b.total_price || 0));
          break;
      }

      setBookings(allBookings);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const result = await BookingManagementService.confirmBooking(bookingId);
              if (result.success) {
                Alert.alert('Success', result.message);
                loadBookings();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm booking');
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = async (bookingId: string, refundAmount?: number) => {
    Alert.alert(
      'Cancel Booking',
      refundAmount ? `Cancel this booking and issue £${refundAmount} refund?` : 'Cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BookingManagementService.cancelBooking(bookingId);
              if (result.success) {
                Alert.alert('Success', refundAmount 
                  ? `Booking cancelled and £${refundAmount} refunded` 
                  : result.message);
                loadBookings();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking Management</Text>
        <Text style={styles.subtitle}>Manage all booking requests</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Filter by Status:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'confirmed' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('confirmed')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'confirmed' && styles.filterButtonTextActive]}>
                Confirmed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('completed')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'completed' && styles.filterButtonTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'cancelled' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('cancelled')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'cancelled' && styles.filterButtonTextActive]}>
                Cancelled
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'recent' && styles.filterButtonActive]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'recent' && styles.filterButtonTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'oldest' && styles.filterButtonActive]}
              onPress={() => setSortBy('oldest')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'oldest' && styles.filterButtonTextActive]}>
                Oldest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'price-high' && styles.filterButtonActive]}
              onPress={() => setSortBy('price-high')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'price-high' && styles.filterButtonTextActive]}>
                Price High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'price-low' && styles.filterButtonActive]}
              onPress={() => setSortBy('price-low')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'price-low' && styles.filterButtonTextActive]}>
                Price Low
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bookings List */}
      <View style={styles.content}>
        <Text style={styles.resultsText}>{bookings.length} bookings found</Text>
        
        {bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.bookingCard}
            onPress={() => onNavigate?.('admin-booking-details', booking)}
          >
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle}>{booking.listingTitle || 'Unnamed Listing'}</Text>
              <Text style={styles.bookingCustomer}>Customer: {booking.camperName}</Text>
              <Text style={styles.bookingDates}>
                📅 {booking.startDate} - {booking.endDate}
              </Text>
              <View style={styles.bookingMeta}>
                <Text style={styles.bookingPrice}>£{booking.totalPrice || booking.total_price || 0}</Text>
                <View style={[styles.statusBadge, booking.status === 'confirmed' && styles.statusBadgeConfirmed, booking.status === 'pending' && styles.statusBadgePending, booking.status === 'cancelled' && styles.statusBadgeCancelled]}>
                  <Text style={[styles.statusText, booking.status === 'confirmed' && styles.statusTextConfirmed, booking.status === 'pending' && styles.statusTextPending, booking.status === 'cancelled' && styles.statusTextCancelled]}>
                    {booking.status || 'unknown'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.bookingActions}>
              {booking.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => handleConfirmBooking(booking.id)}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(booking.id, booking.totalPrice)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  controls: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  filters: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingInfo: {
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#E8F5E8',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  statusTextConfirmed: {
    color: '#2E7D32',
  },
  statusTextPending: {
    color: '#F57C00',
  },
  statusTextCancelled: {
    color: '#D32F2F',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2E7D32',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
});

