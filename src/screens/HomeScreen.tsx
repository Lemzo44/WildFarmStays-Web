import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import FarmerHomeScreen from './FarmerHomeScreen';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps = {}) {
  const { currentUser, logout, isAdmin } = useAuth();
  const [recentStays, setRecentStays] = useState([]);
  const [upcomingStays, setUpcomingStays] = useState([]);
  const [favoriteFarms, setFavoriteFarms] = useState([]);
  const [loading, setLoading] = useState(true);

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
      
      // Load actual booking data from localStorage
      const allBookings = await LocalStorageService.getAll('bookings');
      const userBookings = allBookings.filter((booking: any) => 
        booking.camperId === currentUser?.id || booking.camperId === '1' // Include mock bookings for testing
      );

      const mockFavorites = [
        {
          id: '1',
          farmName: 'Green Valley Farm',
          location: 'Yorkshire, UK',
          price: 25,
          rating: 4.8
        },
        {
          id: '2',
          farmName: 'Sunset Meadows',
          location: 'Devon, UK',
          price: 30,
          rating: 4.9
        }
      ];

      // Filter based on user role
      if (currentUser?.role === 'camper') {
        setUpcomingStays(userBookings.filter((b: any) => b.status === 'upcoming' || b.status === 'confirmed' || b.status === 'pending'));
        setRecentStays(userBookings.filter((b: any) => b.status === 'completed'));
        setFavoriteFarms(mockFavorites);
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
                  <View style={styles.statusChip}>
                    <Text style={styles.statusText}>{stay.status}</Text>
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
          {recentStays.map((stay: any) => (
            <View key={stay.id} style={styles.stayItem}>
              <View style={styles.stayIcon}>
                <Text style={styles.stayIconText}>🏠</Text>
              </View>
              <View style={styles.stayDetails}>
                <Text style={styles.stayTitle}>{stay.listingTitle || stay.title || 'Farm Stay'}</Text>
                <Text style={styles.stayDate}>
                  {formatDate(stay.startDate)} - {formatDate(stay.endDate)}
                </Text>
                <View style={styles.stayFooter}>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusText}>{stay.status}</Text>
                  </View>
                  <Text style={styles.priceText}>£{(stay.totalPrice || stay.price || 0).toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
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
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Search Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Favorite Farms</Text>
            <Text style={styles.emptyText}>
              No favorite farms yet. Add some farms you love!
            </Text>
            <TouchableOpacity style={styles.actionButton}>
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
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
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
});
