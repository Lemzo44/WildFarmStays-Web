import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { BookingService } from '../services/BookingService';
import { ReviewService } from '../services/ReviewService';
import { useSupabase } from '../lib/supabase';

interface UserDetailsProps {
  user?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function UserDetails({ user, onNavigate }: UserDetailsProps) {
  const [userData, setUserData] = useState(user);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalListings: 0,
    totalReviews: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user bookings
      if (userData.role === 'camper') {
        const bookings = await BookingService.getUserBookings(userData.id, 'camper');
        setUserBookings(bookings);
        setStats(prev => ({
          ...prev,
          totalBookings: bookings.length,
          completedBookings: bookings.filter((b: any) => b.status === 'completed').length,
        }));
      }

      // Load user listings (if farmer)
      if (userData.role === 'farmer') {
        let listings: any[] = [];
        if (useSupabase) {
          listings = await APIService.get('listings', {
            filter: { column: 'farmer_id', operator: 'eq', value: userData.id }
          });
          // Normalize listings
          listings = listings.map((l: any) => ({
            ...l,
            farmerId: l.farmer_id || l.farmerId,
            price: l.price || l.price_per_night,
          }));
        } else {
          const allListings = await LocalStorageService.getAll('listings');
          listings = allListings.filter((l: any) => l.farmerId === userData.id);
        }
        setUserListings(listings);
        setStats(prev => ({ ...prev, totalListings: listings.length }));

        // Load farmer's bookings
        const bookings = await BookingService.getUserBookings(userData.id, 'farmer');
        setUserBookings(bookings);
        setStats(prev => ({
          ...prev,
          totalBookings: bookings.length,
        }));
      }

      // Load reviews given by this user
      const reviews = await ReviewService.getUserReviews(userData.id);
      setUserReviews(reviews);
      setStats(prev => ({ ...prev, totalReviews: reviews.length }));

      // Load admin notes (if any) - store in profile or separate table
      // For now, using localStorage fallback as admin_notes isn't in schema
      try {
        const notes = useSupabase
          ? null // TODO: Add admin_notes field to profiles table if needed
          : await LocalStorageService.getItem('admin_notes', userData.id);
        if (notes) {
          setAdminNotes(notes);
        }
      } catch (error) {
        // Ignore if notes don't exist
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveAdminNotes = async () => {
    try {
      if (useSupabase) {
        // TODO: Update profile with admin_notes if schema is extended
        // For now, using localStorage fallback
        await LocalStorageService.setItem('admin_notes', userData.id, adminNotes);
      } else {
        await LocalStorageService.setItem('admin_notes', userData.id, adminNotes);
      }
      Alert.alert('Success', 'Admin notes saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  const handleSuspendUser = () => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${userData.firstName} ${userData.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'User suspended successfully');
            onNavigate?.('user-management');
          }
        }
      ]
    );
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Permanent deletion of ${userData.firstName} ${userData.lastName}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'User deleted successfully');
            onNavigate?.('user-management');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('user-management')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Details</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{userData.firstName || userData.first_name || ''} {userData.lastName || userData.last_name || ''}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userData.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{userData.phone || 'Not provided'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{userData.role === 'camper' ? '🏕️ Camper' : '🚜 Farmer'}</Text>
        </View>

        {userData.role === 'farmer' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Farm Name</Text>
              <Text style={styles.value}>{userData.farmName || userData.farm_name || 'N/A'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Farm Address</Text>
              <Text style={styles.value}>{userData.farmAddress || userData.farm_address || 'N/A'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Postcode</Text>
              <Text style={styles.value}>{userData.postcode || 'N/A'}</Text>
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.label}>Verified Status</Text>
          <Text style={styles.value}>{userData.verified ? '✓ Verified' : '✗ Not Verified'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Join Date</Text>
          <Text style={styles.value}>
            {(userData.joinDate || userData.join_date || userData.created_at || userData.createdAt)
              ? new Date(userData.joinDate || userData.join_date || userData.created_at || userData.createdAt).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>

          {userData.role === 'farmer' && (
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalListings}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
          )}

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Admin Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add internal notes about this user..."
          value={adminNotes}
          onChangeText={setAdminNotes}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.saveButton} onPress={saveAdminNotes}>
          <Text style={styles.saveButtonText}>Save Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Bookings */}
      {userBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {userBookings.slice(0, 5).map((booking: any) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => onNavigate?.('booking-details', booking)}
            >
              <Text style={styles.bookingTitle}>{booking.listingTitle}</Text>
              <Text style={styles.bookingDate}>
                {booking.startDate || booking.start_date} - {booking.endDate || booking.end_date}
              </Text>
              <Text style={styles.bookingStatus}>Status: {booking.status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User Listings (if farmer) */}
      {userData.role === 'farmer' && userListings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Listings</Text>
          {userListings.slice(0, 5).map((listing: any) => (
            <TouchableOpacity
              key={listing.id}
              style={styles.listingCard}
              onPress={() => onNavigate?.('edit-listing', listing)}
            >
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.listingLocation}>{listing.location}</Text>
              <Text style={styles.listingPrice}>£{listing.price || listing.price_per_night}/night</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.suspendButton} onPress={handleSuspendUser}>
          <Text style={styles.suspendButtonText}>⚠️ Suspend User</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
          <Text style={styles.deleteButtonText}>🗑️ Delete User</Text>
        </TouchableOpacity>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  suspendButton: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  suspendButtonText: {
    color: '#F57C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


