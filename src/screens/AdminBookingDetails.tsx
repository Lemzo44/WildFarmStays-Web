import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { BookingManagementService } from '../services/BookingManagementService';

interface AdminBookingDetailsProps {
  booking?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function AdminBookingDetails({ booking, onNavigate }: AdminBookingDetailsProps) {
  const [bookingData, setBookingData] = useState(booking);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking?.id && !bookingData?.listingTitle) {
      loadFullBookingDetails();
    }
  }, [booking?.id]);

  const loadFullBookingDetails = async () => {
    if (!booking?.id) return;
    
    try {
      setLoading(true);
      const details = await BookingManagementService.getBookingDetails(booking.id);
      if (details) {
        setBookingData(details);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              if (bookingData?.id) {
                const result = await BookingManagementService.confirmBooking(bookingData.id);
                if (result.success) {
                  Alert.alert('Success', result.message);
                  await loadFullBookingDetails(); // Reload to get updated status
                  onNavigate?.('booking-management');
                } else {
                  Alert.alert('Error', result.message);
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm booking');
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = async () => {
    const refundAmount = bookingData?.totalPrice || bookingData?.total_price || 0;
    Alert.alert(
      'Cancel Booking',
      `Cancel this booking and issue £${refundAmount} refund?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel & Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              if (bookingData?.id) {
                const result = await BookingManagementService.cancelBooking(bookingData.id);
                if (result.success) {
                  Alert.alert('Success', `Booking cancelled and £${refundAmount} refund issued`);
                  await loadFullBookingDetails(); // Reload to get updated status
                  onNavigate?.('booking-management');
                } else {
                  Alert.alert('Error', result.message);
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleIssueRefund = async () => {
    Alert.prompt(
      'Issue Refund',
      'Enter refund amount:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue Refund',
          onPress: (amount) => {
            if (amount && !isNaN(parseFloat(amount))) {
              Alert.alert('Success', `£${amount} refund issued successfully`);
            } else {
              Alert.alert('Error', 'Invalid amount');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  if (!bookingData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No booking data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('booking-management')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
        <Text style={styles.subtitle}>Booking ID: {bookingData.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Listing</Text>
          <Text style={styles.value}>{bookingData.listingTitle}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Booking Dates</Text>
          <Text style={styles.value}>
            {bookingData.startDate || bookingData.start_date} to {bookingData.endDate || bookingData.end_date}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Total Price</Text>
          <Text style={styles.value}>£{bookingData.totalPrice || bookingData.total_price || 0}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, bookingData.status === 'confirmed' && styles.statusBadgeConfirmed, bookingData.status === 'pending' && styles.statusBadgePending]}>
            <Text style={[styles.statusText, bookingData.status === 'confirmed' && styles.statusTextConfirmed, bookingData.status === 'pending' && styles.statusTextPending]}>
              {bookingData.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Created At</Text>
          <Text style={styles.value}>
            {(bookingData.createdAt || bookingData.created_at) 
              ? new Date(bookingData.createdAt || bookingData.created_at).toLocaleString() 
              : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Camper Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => onNavigate?.('user-details', { id: bookingData.camperId || bookingData.camper_id })}
        >
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.value}>{bookingData.camperName || 'Unknown Camper'}</Text>
          <Text style={styles.linkText}>View customer details →</Text>
        </TouchableOpacity>
      </View>

      {/* Farmer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Farmer Information</Text>
        
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => onNavigate?.('user-details', { id: bookingData.farmerId || bookingData.farmer_id })}
        >
          <Text style={styles.label}>Farmer</Text>
          <Text style={styles.value}>{bookingData.farmerName || bookingData.farmerId || bookingData.farmer_id || 'Unknown Farmer'}</Text>
          <Text style={styles.linkText}>View farmer details →</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {bookingData.status === 'pending' && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
            <Text style={styles.confirmButtonText}>✓ Confirm Booking</Text>
          </TouchableOpacity>
        )}

        {bookingData.status !== 'cancelled' && bookingData.status !== 'completed' && (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
              <Text style={styles.cancelButtonText}>✕ Cancel Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refundButton} onPress={handleIssueRefund}>
              <Text style={styles.refundButtonText}>💰 Issue Refund</Text>
            </TouchableOpacity>
          </>
        )}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  linkText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeConfirmed: {
    backgroundColor: '#E8F5E8',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 14,
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
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refundButton: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refundButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});


