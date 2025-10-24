import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { BookingManagementService } from '../services/BookingManagementService';

interface BookingDetailsScreenProps {
  bookingId?: string;
  booking?: any;
  onNavigate?: (screen: string) => void;
}

export default function BookingDetailsScreen({ bookingId, booking: passedBooking, onNavigate }: BookingDetailsScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{available: boolean, message?: string} | null>(null);
  
  // Edit form state
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editGuests, setEditGuests] = useState(1);
  const [editSpecialRequests, setEditSpecialRequests] = useState('');

  // Mock booking data if not provided
  const mockBookingId = bookingId || '1';

  useEffect(() => {
    if (passedBooking) {
      // If booking data is passed directly, use it
      setBooking(passedBooking);
      setEditStartDate(formatDate(passedBooking.startDate));
      setEditEndDate(formatDate(passedBooking.endDate));
      setEditGuests(passedBooking.guests || 1);
      setEditSpecialRequests(passedBooking.specialRequests || '');
      setLoading(false);
    } else {
      // Otherwise load from service
      loadBookingDetails();
    }
  }, [bookingId, passedBooking]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const bookingDetails = await BookingManagementService.getBookingDetails(mockBookingId);
      if (bookingDetails) {
        setBooking(bookingDetails);
        // Initialize edit form
        setEditStartDate(formatDate(bookingDetails.startDate));
        setEditEndDate(formatDate(bookingDetails.endDate));
        setEditGuests(bookingDetails.guests || 1);
        setEditSpecialRequests(bookingDetails.specialRequests || '');
      } else {
        setError('Booking not found');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      setError('Failed to load booking details');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmed = window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.');
    if (!confirmed) {
      setShowCancelModal(false);
      return;
    }

    try {
      setCancelling(true);
      const result = await BookingManagementService.cancelBooking(booking.id);
      
      if (result.success) {
        alert('Booking cancelled successfully!');
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
        setShowCancelModal(false);
      } else {
        alert(result.message || 'Failed to cancel booking.');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!booking || !editStartDate || !editEndDate) {
      setAvailabilityStatus({ available: false, message: 'Please enter both check-in and check-out dates' });
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityStatus(null);

      // Convert dates to proper format
      const startDate = new Date(editStartDate).toISOString().split('T')[0];
      const endDate = new Date(editEndDate).toISOString().split('T')[0];

      // Check if dates are valid
      if (new Date(startDate) >= new Date(endDate)) {
        setAvailabilityStatus({ available: false, message: 'Check-out date must be after check-in date' });
        return;
      }

      // Get the listing to check availability
      const allListings = await LocalStorageService.getAll('listings');
      const listing = allListings.find((l: any) => l.id === booking.listingId);
      
      if (!listing) {
        setAvailabilityStatus({ available: false, message: 'Listing not found' });
        return;
      }

      // Check blackout dates
      const blackoutDates = listing.blackoutDates || [];
      const checkDate = new Date(startDate);
      const endCheckDate = new Date(endDate);
      
      while (checkDate < endCheckDate) {
        const dateString = checkDate.toISOString().split('T')[0];
        if (blackoutDates.includes(dateString)) {
          setAvailabilityStatus({ 
            available: false, 
            message: `Farm is not available on ${dateString} (blackout date)` 
          });
          return;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      // Check for existing bookings (excluding current booking)
      const allBookings = await LocalStorageService.getAll('bookings');
      const conflictingBookings = allBookings.filter((b: any) => {
        if (b.listingId !== booking.listingId || b.id === booking.id || b.status === 'cancelled') {
          return false;
        }
        
        const bookingStart = new Date(b.startDate);
        const bookingEnd = new Date(b.endDate);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);
        
        // Check for overlap
        return (newStart < bookingEnd && newEnd > bookingStart);
      });

      if (conflictingBookings.length > 0) {
        setAvailabilityStatus({ 
          available: false, 
          message: 'These dates conflict with existing bookings' 
        });
        return;
      }

      // Check available days
      const availableDays = listing.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const startDay = new Date(startDate).toLocaleDateString('en-US', { weekday: 'long' });
      const endDay = new Date(endDate).toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!availableDays.includes(startDay)) {
        setAvailabilityStatus({ 
          available: false, 
          message: `Check-in not available on ${startDay}` 
        });
        return;
      }
      
      if (!availableDays.includes(endDay)) {
        setAvailabilityStatus({ 
          available: false, 
          message: `Check-out not available on ${endDay}` 
        });
        return;
      }

      // All checks passed
      setAvailabilityStatus({ 
        available: true, 
        message: 'Dates are available! You can proceed with the update.' 
      });

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus({ available: false, message: 'Error checking availability' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!booking) return;

    // Check availability before updating
    if (!availabilityStatus || !availabilityStatus.available) {
      alert('Please check availability first before updating the booking.');
      return;
    }

    try {
      setUpdating(true);
      
      const updateData = {
        startDate: new Date(editStartDate).toISOString().split('T')[0],
        endDate: new Date(editEndDate).toISOString().split('T')[0],
        guests: editGuests,
        specialRequests: editSpecialRequests,
      };

      const result = await BookingManagementService.updateBooking(booking.id, updateData);
      
      if (result.success) {
        alert('Booking updated successfully!');
        setBooking(prev => prev ? { ...prev, ...updateData } : null);
        setShowEditModal(false);
        setAvailabilityStatus(null);
      } else {
        alert(result.message || 'Failed to update booking.');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate?.('home')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Details</Text>
        <Text style={styles.subtitle}>
          Booking #{booking.id}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.cardTitle}>Booking Status</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Farm Information</Text>
        <View style={styles.farmInfo}>
          <Text style={styles.farmTitle}>{booking.listingTitle}</Text>
          <Text style={styles.farmLocation}>📍 {booking.listingLocation || 'Location not specified'}</Text>
          <Text style={styles.farmPrice}>£{booking.totalPrice} total</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking Details</Text>
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.startDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out:</Text>
            <Text style={styles.detailValue}>{formatDate(booking.endDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests:</Text>
            <Text style={styles.detailValue}>{booking.guests || 1}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Price:</Text>
            <Text style={styles.detailValue}>£{booking.totalPrice}</Text>
          </View>
          {booking.specialRequests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requests:</Text>
              <Text style={styles.detailValue}>{booking.specialRequests}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <View style={styles.contactDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Farmer:</Text>
            <Text style={styles.detailValue}>{booking.farmerName || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Camper:</Text>
            <Text style={styles.detailValue}>{booking.camperName || 'Unknown'}</Text>
          </View>
        </View>
      </View>

      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={styles.editButtonText}>✏️ Edit Booking</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.cancelButtonText}>❌ Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Booking</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Check-in Date</Text>
              <TextInput
                style={styles.textInput}
                value={editStartDate}
                onChangeText={setEditStartDate}
                placeholder="DD-MM-YYYY"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Check-out Date</Text>
              <TextInput
                style={styles.textInput}
                value={editEndDate}
                onChangeText={setEditEndDate}
                placeholder="DD-MM-YYYY"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Guests</Text>
              <View style={styles.guestsRow}>
                <TouchableOpacity 
                  style={styles.guestButton}
                  onPress={() => setEditGuests(Math.max(1, editGuests - 1))}
                >
                  <Text style={styles.guestButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.guestCount}>{editGuests}</Text>
                <TouchableOpacity 
                  style={styles.guestButton}
                  onPress={() => setEditGuests(editGuests + 1)}
                >
                  <Text style={styles.guestButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Requests</Text>
              <TextInput
                style={styles.textArea}
                value={editSpecialRequests}
                onChangeText={setEditSpecialRequests}
                placeholder="Any special requests..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Check Availability Button */}
            <TouchableOpacity 
              style={[styles.checkAvailabilityButton, checkingAvailability && styles.checkAvailabilityButtonDisabled]}
              onPress={handleCheckAvailability}
              disabled={checkingAvailability}
            >
              <Text style={styles.checkAvailabilityButtonText}>
                {checkingAvailability ? 'Checking...' : '🔍 Check Availability'}
              </Text>
            </TouchableOpacity>

            {/* Availability Status */}
            {availabilityStatus && (
              <View style={[
                styles.availabilityStatus,
                availabilityStatus.available ? styles.availabilityStatusSuccess : styles.availabilityStatusError
              ]}>
                <Text style={[
                  styles.availabilityStatusText,
                  availabilityStatus.available ? styles.availabilityStatusTextSuccess : styles.availabilityStatusTextError
                ]}>
                  {availabilityStatus.available ? '✅' : '❌'} {availabilityStatus.message}
                </Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                onPress={handleUpdateBooking}
                disabled={updating}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? 'Updating...' : 'Update Booking'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelConfirmButton, cancelling && styles.cancelConfirmButtonDisabled]}
                onPress={handleCancelBooking}
                disabled={cancelling}
              >
                <Text style={styles.cancelConfirmButtonText}>
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Keep Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Error Snackbar */}
      {showError && (
        <View style={styles.errorSnackbar}>
          <Text style={styles.errorSnackbarText}>{error}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 12,
    color: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  farmInfo: {
    marginBottom: 8,
  },
  farmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  farmPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  bookingDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contactDetails: {
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelConfirmButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelConfirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  cancelConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  errorSnackbar: {
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
  errorSnackbarText: {
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
  checkAvailabilityButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkAvailabilityButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  checkAvailabilityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availabilityStatus: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  availabilityStatusSuccess: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  availabilityStatusError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  availabilityStatusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  availabilityStatusTextSuccess: {
    color: '#2E7D32',
  },
  availabilityStatusTextError: {
    color: '#D32F2F',
  },
});
