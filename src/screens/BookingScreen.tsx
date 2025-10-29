import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { BookingService } from '../services/BookingService';
import { FavoritesService } from '../services/FavoritesService';
import { ReviewService } from '../services/ReviewService';
import { detectWaiverType, WaiverType, getWaiverText } from '../utils/Waiver';
import { MessageService } from '../services/MessageService';

interface BookingFormState {
  checkInDate?: string; // ISO date yyyy-mm-dd
  checkOutDate?: string; // ISO date yyyy-mm-dd
  guests?: number;
  specialRequests?: string;
}

interface BookingScreenProps {
  listing?: any;
  form?: BookingFormState;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function BookingScreen({ listing, form, onNavigate }: BookingScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviewerNames, setReviewerNames] = useState({});

  // Booking form state
  const initialCheckIn = form?.checkInDate ? new Date(form.checkInDate) : new Date();
  const initialCheckOut = form?.checkOutDate
    ? new Date(form.checkOutDate)
    : (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      })();
  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [guests, setGuests] = useState(form?.guests ?? 1);
  const [specialRequests, setSpecialRequests] = useState(form?.specialRequests ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverType, setWaiverType] = useState<WaiverType>(() => detectWaiverType({ county: (listing as any)?.county, location: (listing as any)?.location }));

  // Mock listing data if not provided
  const mockListing = {
    id: '1',
    title: 'Green Valley Farm',
    description: 'A beautiful farm in the heart of Yorkshire with stunning views and peaceful surroundings.',
    location: 'Yorkshire, UK',
    price: 25,
    wildnessRating: 3,
    rating: 4.8,
    amenities: ['Parking', 'Toilets', 'Shower', 'Fire Pit', 'BBQ', 'WiFi', 'Electric Hookup'],
    images: ['https://example.com/farm1.jpg'],
    farmerId: '2',
  };

  const currentListing = listing || mockListing;

  useEffect(() => {
    checkFavoriteStatus();
    loadReviews();
    setWaiverType(detectWaiverType({ county: (currentListing as any)?.county, location: currentListing?.location }));
  }, []);

  const checkFavoriteStatus = async () => {
    if (currentUser?.role === 'camper' && currentUser) {
      const favoriteStatus = await FavoritesService.isFavorite(currentUser.id, currentListing.id);
      setIsFavorite(favoriteStatus);
    }
  };

  const handleToggleFavorite = async () => {
    if (currentUser?.role !== 'camper' || !currentUser) return;
    
    try {
      const result = await FavoritesService.toggleFavorite(currentUser.id, currentListing);
      if (result.success) {
        setIsFavorite(!isFavorite);
      } else {
        setError(result.message || 'Failed to update favorites');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorites');
      setShowError(true);
    }
  };

  const handleMessageFarmer = async () => {
    if (currentUser?.role !== 'camper' || !currentUser) return;
    
    try {
      console.log('💬 Starting conversation with farmer:', currentListing.farmerId);
      
      // Create or get conversation
      const result = await MessageService.createOrGetConversation(
        currentUser.id,
        currentListing.farmerId,
        currentListing.id
      );
      
      if (result.success) {
        console.log('✅ Conversation ready');
        onNavigate?.('messages');
      } else {
        setError(result.message || 'Failed to start conversation');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
      setShowError(true);
    }
  };

  const loadReviews = async () => {
    try {
      const [listingReviews, stats] = await Promise.all([
        ReviewService.getListingReviews(currentListing.id),
        ReviewService.getListingReviewStats(currentListing.id)
      ]);
      
      setReviews(listingReviews.slice(0, 3)); // Show only first 3 reviews
      setReviewStats(stats);
      
      // Load reviewer names
      const names: any = {};
      for (const review of listingReviews.slice(0, 3)) {
        try {
          const reviewer = await LocalStorageService.getById('users', review.reviewerId);
          if (reviewer) {
            names[review.id] = `${reviewer.firstName} ${reviewer.lastName}`;
          } else {
            names[review.id] = 'Anonymous';
          }
        } catch (error) {
          names[review.id] = 'Anonymous';
        }
      }
      setReviewerNames(names);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateTotal = () => {
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return currentListing.price * days;
  };

  const handleCheckInDateChange = (date: Date) => {
    setCheckInDate(date);
    // Automatically set check-out to the next day
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    setCheckOutDate(nextDay);
    // Reset availability check when dates change
    setAvailabilityChecked(false);
  };

  const checkAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const availability = await BookingService.checkAvailability(
        currentListing.id,
        checkInDate.toISOString().split('T')[0],
        checkOutDate.toISOString().split('T')[0]
      );
      
      setIsAvailable(availability.available);
      setAvailabilityChecked(true);
      
      if (!availability.available) {
        setError('Selected dates are not available. Please choose different dates.');
        setShowError(true);
      }
    } catch (error) {
      setError('Failed to check availability: ' + (error as Error).message);
      setShowError(true);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async () => {
    if (!currentUser) {
      setError('You must be logged in to make a booking.');
      setShowError(true);
      return;
    }

    if (checkInDate >= checkOutDate) {
      setError('Check-out date must be after check-in date');
      setShowError(true);
      return;
    }

    if (checkInDate < new Date()) {
      setError('Check-in date cannot be in the past');
      setShowError(true);
      return;
    }

    if (!availabilityChecked) {
      setError('Please check availability first');
      setShowError(true);
      return;
    }

    if (!isAvailable) {
      setError('Selected dates are not available');
      setShowError(true);
      return;
    }

    if (!waiverAccepted) {
      setError('You must read and accept the waiver to proceed');
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        listingId: currentListing.id,
        listingTitle: currentListing.title,
        camperId: currentUser.id,
        camperName: currentUser.name || currentUser.email.split('@')[0],
        farmerId: currentListing.farmerId,
        startDate: checkInDate.toISOString().split('T')[0],
        endDate: checkOutDate.toISOString().split('T')[0],
        totalPrice: calculateTotal(),
        status: 'pending' as const,
        waiverAccepted: true,
        waiverType: waiverType,
        waiverAcceptedAt: new Date().toISOString(),
        waiverTextSnapshot: getWaiverText(waiverType),
      };

      const result = await BookingService.createBooking(bookingData);
      
      // Show success message and navigate
      alert('✅ Booking request sent successfully!');
      onNavigate?.('home');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // Show specific error message
      const errorMessage = error.message || 'Failed to create booking';
      setError(errorMessage);
      setShowError(true);
      
      // Display error in alert as well for better UX
      alert(`Booking Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <ScrollView style={styles.container}>
      {/* Header with image and basic info */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          <Text style={styles.imagePlaceholder}>🖼️</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{currentListing.title}</Text>
            {currentUser?.role === 'camper' && (
              <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
                <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.location}>📍 {currentListing.location}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {currentListing.rating}</Text>
            <Text style={styles.wildness}>🍃 Wildness: {currentListing.wildnessRating}/5</Text>
          </View>
          <Text style={styles.price}>£{currentListing.price}/night</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About this farm</Text>
        <Text style={styles.description}>{currentListing.description}</Text>
      </View>

      {/* Amenities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amenities</Text>
        <View style={styles.amenitiesContainer}>
          {currentListing.amenities.map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityChip}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews */}
      {reviewStats.totalReviews > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reviews ({reviewStats.totalReviews})</Text>
          <View style={styles.reviewStats}>
            <Text style={styles.averageRating}>⭐ {reviewStats.averageRating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>{reviewStats.totalReviews} reviews</Text>
          </View>
          {reviews.map((review: any) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{reviewerNames[review.id] || 'Anonymous'}</Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{formatDate(new Date(review.createdAt))}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Booking Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book your stay</Text>
        
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Check-in</Text>
            <input
              type="date"
              value={formatDateForInput(checkInDate)}
              onChange={(e) => {
                if (e.target.value) {
                  handleCheckInDateChange(new Date(e.target.value));
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                backgroundColor: '#F5F5F5',
                marginBottom: '8px'
              }}
            />
          </View>
          
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Check-out</Text>
            <input
              type="date"
              value={formatDateForInput(checkOutDate)}
              min={formatDateForInput(checkInDate)}
              onChange={(e) => {
                if (e.target.value) {
                  setCheckOutDate(new Date(e.target.value));
                  setAvailabilityChecked(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                backgroundColor: '#F5F5F5',
                marginBottom: '8px'
              }}
            />
          </View>
        </View>

        <View style={styles.guestsInput}>
          <Text style={styles.inputLabel}>Guests</Text>
          <View style={styles.guestsRow}>
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => setGuests(Math.max(1, guests - 1))}
            >
              <Text style={styles.guestButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.guestCount}>{guests}</Text>
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => setGuests(guests + 1)}
            >
              <Text style={styles.guestButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Waiver */}
        <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="checkbox"
            checked={waiverAccepted}
            onChange={(e) => setWaiverAccepted(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 14, color: '#333' }}>I have read and agree to the</Text>
          <TouchableOpacity
            onPress={() =>
              onNavigate?.('waiver', {
                listing: currentListing,
                waiverType,
                form: {
                  checkInDate: formatDateForInput(checkInDate),
                  checkOutDate: formatDateForInput(checkOutDate),
                  guests,
                  specialRequests,
                },
              })
            }
          >
            <Text style={{ fontSize: 14, color: '#2E7D32', fontWeight: '600' }}> Camper Waiver ({waiverType === 'northern-ireland' ? 'Northern Ireland' : 'Republic of Ireland'})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.specialRequestsInput}>
          <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder="Any special requests or questions..."
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity 
          style={styles.checkAvailabilityButton}
          onPress={checkAvailability}
          disabled={checkingAvailability}
        >
          <Text style={styles.checkAvailabilityButtonText}>
            {checkingAvailability ? 'Checking...' : 'Check Availability'}
          </Text>
        </TouchableOpacity>

        {availabilityChecked && (
          <View style={styles.availabilityStatus}>
            <Text style={[styles.availabilityText, isAvailable ? styles.available : styles.unavailable]}>
              {isAvailable ? '✅ Available' : '❌ Not Available'}
            </Text>
          </View>
        )}
      </View>

      {/* Booking Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>£{currentListing.price} × {days} nights</Text>
          <Text style={styles.summaryValue}>£{calculateTotal()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Guests</Text>
          <Text style={styles.summaryValue}>{guests}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>£{calculateTotal()}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {currentUser?.role === 'camper' && (
          <TouchableOpacity style={styles.messageButton} onPress={handleMessageFarmer}>
            <Text style={styles.messageButtonText}>💬 Message Farmer</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.bookButton, (!isAvailable || !availabilityChecked) && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading || !isAvailable || !availabilityChecked}
        >
          <Text style={styles.bookButtonText}>
            {loading ? 'Booking...' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Snackbar */}
      {showError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setShowError(false)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  imageContainer: {
    width: 120,
    height: 90,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  imagePlaceholder: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#333',
  },
  wildness: {
    fontSize: 14,
    color: '#2E7D32',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
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
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  reviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  averageRating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
    color: '#333',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateTextInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 12,
  },
  guestsInput: {
    marginBottom: 16,
  },
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  guestCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  specialRequestsInput: {
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#333',
  },
  checkAvailabilityButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkAvailabilityButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  availabilityStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  available: {
    color: '#2E7D32',
  },
  unavailable: {
    color: '#D32F2F',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    flexWrap: 'wrap',
  },
  messageButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    color: '#D32F2F',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
