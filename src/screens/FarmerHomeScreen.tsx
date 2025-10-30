import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface FarmerHomeScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function FarmerHomeScreen({ onNavigate }: FarmerHomeScreenProps = {}) {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    pendingListings: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
    unreadMessages: 0,
    totalReviews: 0,
    averageRating: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const useSupabaseBackend = useSupabase;
      
      // Load listings
      let allListings: any[] = [];
      if (useSupabaseBackend) {
        allListings = await APIService.get('listings', {
          orderBy: { column: 'created_at', ascending: false }
        });
        // Normalize field names
        allListings = allListings.map((listing: any) => ({
          ...listing,
          farmerId: listing.farmer_id || listing.farmerId,
          availability: listing.status === 'approved' || listing.status === 'live' 
            ? 'available' 
            : listing.availability || 'pending',
        }));
      } else {
        allListings = await LocalStorageService.getAll('listings');
      }
      
      const farmerListings = allListings.filter((listing: any) => 
        (listing.farmerId || listing.farmer_id) === currentUser?.id
      );
      
      const totalListings = farmerListings.length;
      const activeListings = farmerListings.filter((listing: any) => 
        listing.status === 'approved' || listing.status === 'live' || 
        (listing.status !== 'rejected' && listing.availability === 'available')
      ).length;
      const pendingListings = farmerListings.filter((listing: any) => 
        listing.status === 'pending'
      ).length;
      
      // Load bookings (BookingService already handles Supabase)
      const allBookings = useSupabaseBackend 
        ? await APIService.get('bookings', {
            orderBy: { column: 'created_at', ascending: false }
          })
        : await LocalStorageService.getAll('bookings');
      
      // Normalize booking field names
      const normalizedBookings = allBookings.map((booking: any) => ({
        ...booking,
        farmerId: booking.farmer_id || booking.farmerId,
        camperId: booking.camper_id || booking.camperId,
        listingId: booking.listing_id || booking.listingId,
      }));
      
      const farmerBookings = normalizedBookings.filter((booking: any) => 
        (booking.farmerId || booking.farmer_id) === currentUser?.id
      );
      
      const totalBookings = farmerBookings.length;
      const upcomingBookings = farmerBookings.filter((booking: any) => 
        ['pending', 'confirmed', 'upcoming'].includes(booking.status)
      ).length;
      
      const totalEarnings = farmerBookings
        .filter((b: any) => b.status !== 'cancelled')
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
      
      const mockStats = {
        totalListings,
        activeListings,
        pendingListings,
        totalBookings,
        upcomingBookings,
        totalEarnings: Math.round(totalEarnings),
        unreadMessages: 0, // TODO: Load actual unread messages
        totalReviews: 0, // TODO: Load actual reviews
        averageRating: 0, // TODO: Load actual average rating
      };

      // Build recent bookings from real data
      const recentFromData = [...farmerBookings]
        .sort((a: any, b: any) => {
          const ad = new Date(a.created_at || a.createdAt || a.endDate || a.end_date || 0).getTime();
          const bd = new Date(b.created_at || b.createdAt || b.endDate || b.end_date || 0).getTime();
          return bd - ad;
        })
        .slice(0, 5)
        .map((b: any) => ({
          id: b.id,
          camperName: b.camper_name || b.camperName || 'Camper',
          listingTitle: b.listing_title || b.listingTitle || 'Farm Stay',
          startDate: b.start_date || b.startDate,
          endDate: b.end_date || b.endDate,
          status: b.status,
          totalPrice: Number(b.total_price ?? b.totalPrice ?? 0),
          raw: b,
        }));

      const mockRecentMessages = [
        {
          id: '1',
          senderName: 'John Smith',
          lastMessage: 'Hi, I\'m interested in your farm...',
          timestamp: '2 hours ago',
          unread: true,
        },
        {
          id: '2',
          senderName: 'Sarah Johnson',
          lastMessage: 'Thank you for the great stay!',
          timestamp: '1 day ago',
          unread: false,
        },
      ];

      // Compute rating from real reviews for farmer's listings
      let avgRating = 0;
      let totalReviews = 0;
      try {
        const allReviews = useSupabaseBackend
          ? await APIService.get<any>('reviews', { select: '*' })
          : await LocalStorageService.getAll('reviews');
        const listingIdSet = new Set(farmerListings.map((l: any) => l.id));
        const relevant = (allReviews || []).filter((r: any) => listingIdSet.has(r.listing_id || r.listingId));
        totalReviews = relevant.length;
        if (totalReviews > 0) {
          const sum = relevant.reduce((s: number, r: any) => s + Number(r.rating || 0), 0);
          avgRating = sum / totalReviews;
        }
      } catch {
        avgRating = 0; totalReviews = 0;
      }

      setStats({
        ...mockStats,
        totalReviews,
        averageRating: avgRating,
      });
      setRecentBookings(recentFromData);
      setRecentMessages(mockRecentMessages);
    } catch (error) {
      console.error('Error loading farmer data:', error);
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

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>
          Welcome back, {currentUser?.name || currentUser?.email.split('@')[0]}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Manage your farm listings and connect with campers
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Notification for pending listings */}
      {stats.pendingListings > 0 && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>
            ⏳ You have {stats.pendingListings} listing{stats.pendingListings > 1 ? 's' : ''} pending admin approval
          </Text>
        </View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalListings}</Text>
          <Text style={styles.statLabel}>Total Listings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeListings}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingListings}</Text>
          <Text style={styles.statLabel}>Pending Approval</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>£{stats.totalEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => onNavigate?.('listings')}
          >
            <Text style={styles.primaryButtonText}>My Listings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => onNavigate?.('create-listing')}
          >
            <Text style={styles.secondaryButtonText}>Add Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => onNavigate?.('messages')}
          >
            <Text style={styles.secondaryButtonText}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Bookings</Text>
        {recentBookings.length > 0 ? (
          recentBookings.map((booking: any) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingIcon}>
                <Text style={styles.bookingIconText}>📅</Text>
              </View>
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingTitle}>{booking.listingTitle}</Text>
                <Text style={styles.bookingCamper}>by {booking.camperName}</Text>
                <Text style={styles.bookingDate}>
                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                </Text>
                <View style={styles.bookingFooter}>
                  <View style={[styles.statusChip, booking.status === 'confirmed' ? styles.confirmedChip : styles.pendingChip]}>
                    <Text style={[styles.statusText, booking.status === 'confirmed' ? styles.confirmedText : styles.pendingText]}>
                      {booking.status}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>£{booking.totalPrice.toFixed(2)}</Text>
                </View>
              </View>
              {booking.status === 'completed' && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() => onNavigate?.('farmer-rating')}
                >
                  <Text style={styles.rateButtonText}>Rate Camper →</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent bookings</Text>
        )}
      </View>

      {/* Recent Messages */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Messages</Text>
        {recentMessages.length > 0 ? (
          recentMessages.map((message: any) => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageIcon}>
                <Text style={styles.messageIconText}>💬</Text>
              </View>
              <View style={styles.messageDetails}>
                <Text style={styles.messageSender}>{message.senderName}</Text>
                <Text style={styles.messageText}>{message.lastMessage}</Text>
                <Text style={styles.messageTime}>{message.timestamp}</Text>
              </View>
              {message.unread && <View style={styles.unreadDot} />}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent messages</Text>
        )}
      </View>

      {/* Rating Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Rating</Text>
        <View style={styles.ratingContainer}>
          {renderStars(Math.round(stats.averageRating))}
          <Text style={styles.ratingText}>
            {stats.averageRating.toFixed(1)} ({stats.totalReviews} reviews)
          </Text>
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  notificationBanner: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
  },
  notificationText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
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
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 6,
    flex: 1,
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
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingIconText: {
    fontSize: 20,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  bookingCamper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  confirmedChip: {
    backgroundColor: '#E8F5E8',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  confirmedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#FF9800',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  rateButton: {
    marginLeft: 8,
    alignSelf: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rateButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 12,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageIconText: {
    fontSize: 20,
  },
  messageDetails: {
    flex: 1,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
    color: '#666',
  },
});
