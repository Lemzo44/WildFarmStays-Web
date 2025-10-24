import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { FarmerRatingService } from '../services/FarmerRatingService';

interface FarmerRatingScreenProps {
  bookingId?: string;
  onNavigate?: (screen: string) => void;
}

export default function FarmerRatingScreen({ bookingId, onNavigate }: FarmerRatingScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [camperName, setCamperName] = useState('');

  useEffect(() => {
    loadBookingsToRate();
  }, []);

  const loadBookingsToRate = async () => {
    try {
      setLoading(true);
      
      // Get all bookings
      const allBookings = await LocalStorageService.getAll('bookings');
      
      // Get farmer's listings
      const allListings = await LocalStorageService.getAll('listings');
      const farmerListings = allListings.filter((listing: any) => listing.farmerId === currentUser?.id);
      
      // Get bookings for farmer's listings that are completed
      const farmerBookings = allBookings.filter((booking: any) => {
        const isFarmerListing = farmerListings.some((listing: any) => listing.id === booking.listingId);
        return isFarmerListing && booking.status === 'completed';
      });

      // Filter out bookings that have already been rated
      const bookingsToRate = [];
      for (const booking of farmerBookings) {
        const hasRated = await FarmerRatingService.hasFarmerRatedCamper(
          currentUser?.id || '1', 
          booking.camperId, 
          booking.id
        );
        if (!hasRated) {
          // Load camper name
          const camper = await LocalStorageService.getById('users', booking.camperId);
          const listing = await LocalStorageService.getById('listings', booking.listingId);
          
          bookingsToRate.push({
            ...booking,
            camperName: camper ? `${camper.firstName} ${camper.lastName}` : 'Unknown',
            listingTitle: listing ? listing.title : 'Unknown Listing',
          });
        }
      }

      setBookings(bookingsToRate);
      
      // If a specific booking was passed, select it
      if (bookingId) {
        const booking = bookingsToRate.find((b: any) => b.id === bookingId);
        if (booking) {
          setSelectedBooking(booking);
          setCamperName(booking.camperName);
        }
      }
    } catch (error) {
      console.error('Error loading bookings to rate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingPress(star)}
            style={styles.starButton}
          >
            <Text style={styles.starIcon}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSubmitRating = async () => {
    if (!selectedBooking) {
      alert('Please select a booking to rate.');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a comment about the camper.');
      return;
    }

    try {
      setSubmitting(true);
      
      const ratingData = {
        id: Date.now().toString(),
        farmerId: currentUser?.id || '1',
        camperId: selectedBooking.camperId,
        bookingId: selectedBooking.id,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      const result = await FarmerRatingService.createFarmerRating(ratingData);
      
      if (result.success) {
        alert('Rating submitted successfully!');
        // Remove the rated booking from the list
        setBookings(prev => prev.filter((b: any) => b.id !== selectedBooking.id));
        setSelectedBooking(null);
        setRating(0);
        setComment('');
        setCamperName('');
      } else {
        alert(result.message || 'Failed to submit rating.');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.bookingCard,
        selectedBooking?.id === item.id && styles.bookingCardSelected
      ]}
      onPress={() => {
        setSelectedBooking(item);
        setCamperName(item.camperName);
        setRating(0);
        setComment('');
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle}>{item.listingTitle}</Text>
          <Text style={styles.camperName}>Camper: {item.camperName}</Text>
          <Text style={styles.bookingDate}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        <View style={styles.bookingStatus}>
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your Guests</Text>
        <Text style={styles.subtitle}>
          Share your experience with campers who stayed at your farm
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.card}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No bookings to rate</Text>
            <Text style={styles.emptyText}>
              You don't have any completed bookings that need rating yet.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select a Booking to Rate</Text>
            <FlatList
              data={bookings}
              renderItem={renderBookingItem}
              keyExtractor={(item: any) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {selectedBooking && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rate {camperName}</Text>
              
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>How would you rate this camper?</Text>
                {renderStars()}
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating} out of 5 stars
                  </Text>
                )}
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Your Review</Text>
                <Text style={styles.commentDescription}>
                  Share your experience with this camper. This helps other farmers make informed decisions.
                </Text>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="How was the camper? Were they respectful, clean, and followed your farm rules?"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmitRating}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setSelectedBooking(null);
                    setRating(0);
                    setComment('');
                    setCamperName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
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
    marginBottom: 16,
    color: '#333',
  },
  bookingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bookingCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E8',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  camperName: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  bookingStatus: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  starIcon: {
    fontSize: 40,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  commentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});



