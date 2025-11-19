import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { BookingService } from '../services/BookingService';
import { ReviewService } from '../services/ReviewService';
import { FavoritesService } from '../services/FavoritesService';
import { useSupabase } from '../lib/supabase';
import FarmerHomeScreen from './FarmerHomeScreen';

interface HomeScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps = {}) {
  const { currentUser, logout, isAdmin } = useAuth();
  const [recentStays, setRecentStays] = useState([]);
  const [upcomingStays, setUpcomingStays] = useState([]);
  const [favoriteFarms, setFavoriteFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewedListingIds, setReviewedListingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Redirect admins to admin dashboard
    if (isAdmin()) {
      onNavigate?.('admin-dashboard');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Normalize booking status based on dates
      const normalizeBookingStatus = (booking: any): string => {
        // If already cancelled, keep it cancelled
        if (booking.status === 'cancelled') {
          return 'cancelled';
        }

        // Check if end date has passed
        const endDateStr = booking.endDate || booking.end_date;
        if (endDateStr) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const endDate = new Date(endDateStr);
          endDate.setHours(0, 0, 0, 0);
          
          // If end date has passed and not cancelled, mark as completed
          if (endDate < today) {
            return 'completed';
          }
        }

        // Otherwise, return existing status (or default to pending)
        return booking.status || 'pending';
      };

      // Load bookings from Supabase when enabled; otherwise fallback to localStorage
      let userBookings: any[] = [];
      if (useSupabase && currentUser?.id) {
        userBookings = await BookingService.getUserBookings(currentUser.id, 'camper');
        // Status is already normalized in BookingService.getUserBookings
        // Load user's reviews to hide the Write Review CTA for already reviewed listings
        try {
          const userReviews = await ReviewService.getUserReviews(currentUser.id);
          const reviewedIds = new Set<string>(
            (userReviews || []).map((r: any) => r.listingId || r.listing_id)
          );
          setReviewedListingIds(reviewedIds);
        } catch (e) {
          // Non-fatal; if fails, we simply show the CTA
          setReviewedListingIds(new Set());
        }
      } else {
        const allBookings = await LocalStorageService.getAll('bookings');
        userBookings = allBookings
          .filter((booking: any) => 
            booking.camperId === currentUser?.id || booking.camperId === '1'
          )
          .map((booking: any) => ({
            ...booking,
            status: normalizeBookingStatus(booking),
          }));
      }

      // Filter based on user role
      if (currentUser?.role === 'camper') {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        // Separate bookings into upcoming and recent based on end date
        const upcoming: any[] = [];
        const recent: any[] = [];
        
        userBookings.forEach((b: any) => {
          // Skip cancelled bookings
          if (b.status === 'cancelled') return;
          
          // Get end date (handle both snake_case and camelCase)
          const endDateStr = b.endDate || b.end_date;
          if (!endDateStr) {
            // If no end date, use status as fallback
            if (b.status === 'completed') {
              recent.push(b);
            } else {
              upcoming.push(b);
            }
            return;
          }
          
          const endDate = new Date(endDateStr);
          endDate.setHours(0, 0, 0, 0);
          
          // If end date has passed, it's a recent stay
          if (endDate < today) {
            recent.push(b);
          } else {
            // If end date is today or in the future, it's upcoming
            upcoming.push(b);
          }
        });
        
        setUpcomingStays(upcoming);
        setRecentStays(recent);
        try {
          // Load favorites from backend (or service fallback)
          const favListings = await FavoritesService.getFavoriteListingsWithDetails(currentUser.id);
          const favDisplay = (favListings || []).map((l: any) => ({
            id: l.listing?.id || l.id || l.listingId,
            listing: l.listing || l, // Preserve full listing object for navigation
            farmName: l.listing?.title || l.title || l.farmName || 'Farm',
            location: l.listing?.location || l.location || '',
            price: l.listing?.price_per_night || l.listing?.price || l.price || l.price_per_night || 0,
            rating: l.listing?.rating || l.rating || 0,
          }));
          setFavoriteFarms(favDisplay);
        } catch (e) {
          setFavoriteFarms([]);
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleViewBooking = (booking: any) => {
    // Navigate to booking details screen with the booking data
    onNavigate?.('booking-details', booking);
  };

  // If user is a farmer, show the farmer home screen
  if (currentUser?.role === 'farmer') {
    return <FarmerHomeScreen onNavigate={onNavigate} />;
  }

  // Camper view
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>
          Welcome back, {currentUser?.name || currentUser?.email.split('@')[0]}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Ready for your next wild adventure?
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => onNavigate?.('search')}
          >
            <Text style={styles.primaryButtonText}>Search Map</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => onNavigate?.('listings')}
          >
            <Text style={styles.secondaryButtonText}>Browse Farms</Text>
          </TouchableOpacity>
        </View>
      </View>

      {upcomingStays.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Stays</Text>
          {upcomingStays.map((stay: any) => (
            <TouchableOpacity 
              key={stay.id} 
              style={styles.stayItem}
              onPress={() => handleViewBooking(stay)}
            >
              <View style={styles.stayIcon}>
                <Text style={styles.stayIconText}>📅</Text>
              </View>
              <View style={styles.stayDetails}>
                <Text style={styles.stayTitle}>{stay.listingTitle || stay.title || 'Farm Stay'}</Text>
                <Text style={styles.stayDate}>
                  {formatDate(stay.startDate)} - {formatDate(stay.endDate)}
                </Text>
                <View style={styles.stayFooter}>
                  <View style={[
                    styles.statusChip,
                    stay.status === 'confirmed' ? styles.confirmedChip :
                    stay.status === 'completed' ? styles.completedChip :
                    stay.status === 'cancelled' ? styles.cancelledChip :
                    styles.pendingChip
                  ]}>
                    <Text style={[
                      styles.statusText,
                      stay.status === 'confirmed' ? styles.confirmedText :
                      stay.status === 'completed' ? styles.completedText :
                      stay.status === 'cancelled' ? styles.cancelledText :
                      styles.pendingText
                    ]}>
                      {stay.status}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>£{(stay.totalPrice || stay.price || 0).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.arrowIcon}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {recentStays.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Stays</Text>
          {recentStays.map((stay: any) => {
            const stayListingId = stay.listingId || stay.listing_id;
            const hasReviewed = reviewedListingIds.has(stayListingId);
            return (
            <TouchableOpacity
              key={stay.id}
              style={styles.stayItem}
              onPress={() => {
                if (hasReviewed) return; // Disable navigation if already reviewed
                onNavigate?.('review', {
                  booking: stay,
                  listing: {
                    id: stayListingId,
                    title: stay.listingTitle || stay.title || 'Farm Stay',
                  },
                });
              }}
            >
              <View style={styles.stayIcon}>
                <Text style={styles.stayIconText}>🏠</Text>
              </View>
              <View style={styles.stayDetails}>
                <Text style={styles.stayTitle}>{stay.listingTitle || stay.title || 'Farm Stay'}</Text>
                <Text style={styles.stayDate}>
                  {formatDate(stay.startDate)} - {formatDate(stay.endDate)}
                </Text>
                <View style={styles.stayFooter}>
                  <View style={[
                    styles.statusChip,
                    stay.status === 'confirmed' ? styles.confirmedChip :
                    stay.status === 'completed' ? styles.completedChip :
                    stay.status === 'cancelled' ? styles.cancelledChip :
                    styles.pendingChip
                  ]}>
                    <Text style={[
                      styles.statusText,
                      stay.status === 'confirmed' ? styles.confirmedText :
                      stay.status === 'completed' ? styles.completedText :
                      stay.status === 'cancelled' ? styles.cancelledText :
                      styles.pendingText
                    ]}>
                      {stay.status}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>£{(stay.totalPrice || stay.price || 0).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.ctaContainer}>
                <Text style={[styles.ctaText, hasReviewed && styles.ctaTextDisabled]}>
                  {hasReviewed ? 'Reviewed' : 'Write Review →'}
                </Text>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>
      )}

      {favoriteFarms.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Favorite Farms</Text>
          {favoriteFarms.map((farm: any) => (
            <View key={farm.id} style={styles.farmItem}>
              <View style={styles.farmIcon}>
                <Text style={styles.farmIconText}>🌾</Text>
              </View>
              <View style={styles.farmDetails}>
                <Text style={styles.farmTitle}>{farm.farmName}</Text>
                <Text style={styles.farmLocation}>{farm.location}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ {farm.rating}</Text>
                  <Text style={styles.price}>£{farm.price}/night</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookAgainButton}
                onPress={() => {
                  // Navigate to booking screen with the full listing object
                  const listingToBook = farm.listing || farm;
                  onNavigate?.('booking', listingToBook);
                }}
              >
                <Text style={styles.bookAgainButtonText}>Book Again</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {upcomingStays.length === 0 && recentStays.length === 0 && favoriteFarms.length === 0 && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Stays</Text>
            <Text style={styles.emptyText}>
              No recent stays yet. Start exploring farms!
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('search')}
            >
              <Text style={styles.actionButtonText}>Search Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Favorite Farms</Text>
            <Text style={styles.emptyText}>
              No favorite farms yet. Add some farms you love!
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('listings')}
            >
              <Text style={styles.actionButtonText}>Discover Farms</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  stayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stayIconText: {
    fontSize: 20,
  },
  stayDetails: {
    flex: 1,
  },
  stayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  stayDate: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
    color: '#666',
  },
  stayFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  confirmedChip: {
    backgroundColor: '#E8F5E8',
  },
  completedChip: {
    backgroundColor: '#E3F2FD',
  },
  cancelledChip: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingText: {
    color: '#FF9800',
  },
  confirmedText: {
    color: '#2E7D32',
  },
  completedText: {
    color: '#2196F3',
  },
  cancelledText: {
    color: '#F44336',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  farmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmIconText: {
    fontSize: 20,
  },
  farmDetails: {
    flex: 1,
  },
  farmTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  farmLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  bookAgainButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  bookAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  arrowIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  ctaContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ctaTextDisabled: {
    color: '#9E9E9E',
  },
});
