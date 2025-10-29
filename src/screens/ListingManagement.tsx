import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';

interface ListingManagementProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function ListingManagement({ onNavigate }: ListingManagementProps) {
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, filterLocation]);

  const loadListings = async () => {
    try {
      const allListings = await APIService.get('listings', {
        orderBy: { column: 'created_at', ascending: false }
      });
      setListings(allListings);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const applyFilters = async () => {
    try {
      let allListings = await APIService.get('listings', {
        orderBy: { column: 'created_at', ascending: false }
      });

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allListings = allListings.filter((l: any) =>
          l.title?.toLowerCase().includes(query) ||
          l.location?.toLowerCase().includes(query) ||
          l.farmer_id === query ||
          l.farmerId === query
        );
      }

      // Filter by status (check both status and availability fields)
      if (filterStatus !== 'all') {
        allListings = allListings.filter((l: any) => {
          if (filterStatus === 'pending') return l.status === 'pending';
          if (filterStatus === 'available') return l.status === 'approved' || l.status === 'live';
          if (filterStatus === 'suspended') return l.availability === 'suspended';
          if (filterStatus === 'rejected') return l.status === 'rejected';
          return true;
        });
      }

      // Filter by location
      if (filterLocation !== 'all') {
        allListings = allListings.filter((l: any) =>
          l.location.includes(filterLocation)
        );
      }

      setListings(allListings);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleApproveListing = async (listingId: string) => {
    Alert.alert(
      'Approve Listing',
      'Are you sure you want to approve this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const listing = await APIService.getById('listings', listingId);
              if (listing) {
                // Update both status (for approval workflow) and availability (for operational status)
                await APIService.update('listings', listingId, {
                  status: 'approved',
                  availability: 'available'
                });
                
                Alert.alert('Success', 'Listing approved successfully', [
                  { text: 'OK', onPress: () => onNavigate?.('admin-dashboard') }
                ]);
              } else {
                Alert.alert('Error', 'Listing not found');
              }
            } catch (error: any) {
              console.error('Error approving listing:', error);
              Alert.alert('Error', `Failed to approve listing: ${error.message || 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const handleRejectListing = async (listingId: string) => {
    // Prompt for rejection reason
    const rejectionReason = window.prompt('Please provide a reason for rejection and any recommendations for the farmer:');
    
    if (!rejectionReason || !rejectionReason.trim()) {
      Alert.alert('Error', 'A rejection reason is required. The farmer needs to know why their listing was not approved.');
      return;
    }

    Alert.alert(
      'Reject Listing',
      'Are you sure you want to reject this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const listing = await APIService.getById('listings', listingId);
              if (listing) {
                // Update status to rejected and store rejection reason
                await APIService.update('listings', listingId, {
                  status: 'rejected',
                  rejection_reason: rejectionReason
                });
                
                Alert.alert('Success', 'Listing rejected. Farmer can see the feedback and resubmit.', [
                  { text: 'OK', onPress: () => onNavigate?.('admin-dashboard') }
                ]);
              } else {
                Alert.alert('Error', 'Listing not found');
              }
            } catch (error: any) {
              console.error('Error rejecting listing:', error);
              Alert.alert('Error', `Failed to reject listing: ${error.message || 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const handleSuspendListing = async (listingId: string) => {
    Alert.alert(
      'Suspend Listing',
      'Are you sure you want to suspend this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              const listing = await APIService.getById('listings', listingId);
              if (listing) {
                await APIService.update('listings', listingId, {
                  availability: 'suspended'
                });
                Alert.alert('Success', 'Listing suspended successfully', [
                  { text: 'OK', onPress: () => loadListings() }
                ]);
              } else {
                Alert.alert('Error', 'Listing not found');
              }
            } catch (error: any) {
              console.error('Error suspending listing:', error);
              Alert.alert('Error', `Failed to suspend listing: ${error.message || 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const handleDeleteListing = async (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocalStorageService.delete('listings', listingId);
              Alert.alert('Success', 'Listing deleted successfully');
              loadListings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(listings.map((l: any) => l.location.split(',')[0]))).sort();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Listing Management</Text>
        <Text style={styles.subtitle}>Manage farm listings</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings..."
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
              style={[styles.filterButton, filterStatus === 'available' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('available')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'available' && styles.filterButtonTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'suspended' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('suspended')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'suspended' && styles.filterButtonTextActive]}>
                Suspended
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'rejected' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('rejected')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'rejected' && styles.filterButtonTextActive]}>
                Rejected
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Filter by Location:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterLocation === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterLocation('all')}
            >
              <Text style={[styles.filterButtonText, filterLocation === 'all' && styles.filterButtonTextActive]}>
                All Locations
              </Text>
            </TouchableOpacity>
            {uniqueLocations.slice(0, 5).map((location) => (
              <TouchableOpacity
                key={location}
                style={[styles.filterButton, filterLocation === location && styles.filterButtonActive]}
                onPress={() => setFilterLocation(location)}
              >
                <Text style={[styles.filterButtonText, filterLocation === location && styles.filterButtonTextActive]}>
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Listings List */}
      <View style={styles.content}>
        <Text style={styles.resultsText}>{listings.length} listings found</Text>
        
        {listings.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.listingLocation}>📍 {listing.location}</Text>
              <View style={styles.listingMeta}>
                <Text style={styles.listingPrice}>£{listing.price || listing.price_per_night}/night</Text>
                <View style={[
                  styles.statusBadge, 
                  (listing.status === 'approved' || listing.status === 'live') && styles.statusBadgeActive, 
                  listing.status === 'pending' && styles.statusBadgePending, 
                  listing.status === 'rejected' && styles.statusBadgeRejected,
                  listing.availability === 'suspended' && styles.statusBadgeRejected
                ]}>
                  <Text style={[
                    styles.statusText, 
                    (listing.status === 'approved' || listing.status === 'live') && styles.statusTextActive, 
                    listing.status === 'pending' && styles.statusTextPending, 
                    listing.status === 'rejected' && styles.statusTextRejected,
                    listing.availability === 'suspended' && styles.statusTextRejected
                  ]}>
                    {listing.status === 'pending' ? '⏳ Pending' : 
                     listing.status === 'rejected' ? '✕ Rejected' : 
                     listing.availability === 'suspended' ? '⚠️ Suspended' : 
                     (listing.status === 'approved' || listing.status === 'live') ? '✓ Active' : '❓ Unknown'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.listingActions}>
              {listing.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => onNavigate?.('edit-listing', { listing, fromAdmin: true, viewOnly: true })}
                  >
                    <Text style={[styles.actionButtonText, styles.viewButtonText]}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveListing(listing.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectListing(listing.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {/* Show rejection details for rejected listings */}
              {listing.status === 'rejected' && (listing.rejection_reason || listing.rejectionReason) && (
                <View style={styles.rejectionInfoBanner}>
                  <Text style={styles.rejectionInfoTitle}>Rejected Feedback:</Text>
                  <Text style={styles.rejectionInfoText}>{listing.rejection_reason || listing.rejectionReason}</Text>
                </View>
              )}

              {listing.status !== 'pending' && listing.status !== 'rejected' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton]}
                    onPress={() => onNavigate?.('edit-listing', { listing, fromAdmin: true })}
                  >
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  {listing.availability === 'available' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleSuspendListing(listing.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.suspendButtonText]}>Suspend</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteListing(listing.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}

              {listing.status === 'rejected' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteListing(listing.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  locationButtons: {
    maxHeight: 60,
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
  listingCard: {
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
  listingInfo: {
    marginBottom: 12,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusBadge: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E8',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
  },
  statusTextActive: {
    color: '#2E7D32',
  },
  statusTextPending: {
    color: '#F57C00',
  },
  statusTextRejected: {
    color: '#D32F2F',
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    flex: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewButton: {
    backgroundColor: '#E3F2FD',
  },
  viewButtonText: {
    color: '#1976D2',
  },
  approveButton: {
    backgroundColor: '#2E7D32',
  },
  approveButtonText: {
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  rejectButtonText: {
    color: '#D32F2F',
  },
  suspendButton: {
    backgroundColor: '#FFF3E0',
  },
  suspendButtonText: {
    color: '#F57C00',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#D32F2F',
  },
  rejectionInfoBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  rejectionInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  rejectionInfoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

