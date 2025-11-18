import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { ReviewService } from '../services/ReviewService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface ReviewsManagementProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function ReviewsManagement({ onNavigate }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [listingTitle, setListingTitle] = useState<string>('');
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const allReviews = await ReviewService.getAllReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadReviewDetails = async (review: any) => {
    try {
      setLoading(true);
      
      // Load reviewer name
      if (review.reviewerId || review.reviewer_id) {
        const reviewerId = review.reviewerId || review.reviewer_id;
        try {
          const reviewer = await APIService.getById('profiles', reviewerId);
          if (reviewer) {
            const firstName = reviewer.first_name || reviewer.firstName || '';
            const lastName = reviewer.last_name || reviewer.lastName || '';
            setReviewerName(`${firstName} ${lastName}`.trim() || 'Anonymous');
          } else {
            setReviewerName(review.reviewerName || 'Anonymous');
          }
        } catch (error) {
          setReviewerName(review.reviewerName || 'Anonymous');
        }
      } else {
        setReviewerName(review.reviewerName || 'Anonymous');
      }

      // Load listing title
      const listingId = review.listingId || review.listing_id;
      if (listingId) {
        try {
          const listing = await APIService.getById('listings', listingId);
          if (listing) {
            setListingTitle(listing.title || listing.name || 'Unknown Listing');
          } else {
            setListingTitle('Unknown Listing');
          }
        } catch (error) {
          setListingTitle('Unknown Listing');
        }
      } else {
        setListingTitle('Unknown Listing');
      }

      setSelectedReview(review);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading review details:', error);
      Alert.alert('Error', 'Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    Alert.alert(
      'Approve Review',
      'Are you sure you want to approve this review? It will be visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              console.log('Approving review:', reviewId);
              
              // Update the review
              const updatedReview = await ReviewService.updateReview(reviewId, { approved: true });
              console.log('Review updated successfully:', updatedReview);
              
              // Reload reviews to reflect the change
              await loadReviews();
              
              // Close the modal
              setShowDetailsModal(false);
              
              Alert.alert('Success', 'Review approved successfully', [
                { text: 'OK' }
              ]);
            } catch (error: any) {
              console.error('Error approving review:', error);
              console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
              });
              Alert.alert('Error', error?.message || 'Failed to approve review. Please check the console for details.');
            }
          }
        }
      ]
    );
  };

  const handleRejectReview = async (reviewId: string) => {
    Alert.alert(
      'Reject Review',
      'Are you sure you want to reject this review? It will be removed from public view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Rejecting review:', reviewId);
              
              const updatedReview = await ReviewService.updateReview(reviewId, { approved: false });
              console.log('Review rejected successfully:', updatedReview);
              
              // Reload reviews to reflect the change
              await loadReviews();
              
              // Close the modal
              setShowDetailsModal(false);
              
              Alert.alert('Success', 'Review rejected', [
                { text: 'OK' }
              ]);
            } catch (error: any) {
              console.error('Error rejecting review:', error);
              console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
              });
              Alert.alert('Error', error?.message || 'Failed to reject review. Please check the console for details.');
            }
          }
        }
      ]
    );
  };

  const handleRemoveReview = async (reviewId: string) => {
    Alert.alert(
      'Remove Review',
      'Are you sure you want to permanently delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReviewService.deleteReview(reviewId);
              Alert.alert('Success', 'Review removed');
              setShowDetailsModal(false);
              loadReviews();
            } catch (error: any) {
              console.error('Error removing review:', error);
              Alert.alert('Error', error?.message || 'Failed to remove review');
            }
          }
        }
      ]
    );
  };

  const normalizeReviewImages = (review: any): string[] => {
    if (!review) {
      console.log('normalizeReviewImages: No review provided');
      return [];
    }
    
    let images = review.images || [];
    console.log('normalizeReviewImages: Raw images data:', images, 'Type:', typeof images);
    
    // Handle JSON string (if stored as JSON in database)
    if (typeof images === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(images);
        console.log('normalizeReviewImages: Parsed JSON:', parsed);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (parsed && typeof parsed === 'string' && parsed.startsWith('http')) {
          images = [parsed];
        } else if (images.startsWith('http')) {
          // If not JSON but is a URL string, use it directly
          images = [images];
        } else {
          images = [];
        }
      } catch (e) {
        // Not JSON, check if it's a direct URL string
        console.log('normalizeReviewImages: Not JSON, checking if URL string');
        if (images.startsWith('http') || images.startsWith('https')) {
          images = [images];
        } else {
          images = [];
        }
      }
    }
    
    // Filter to only valid URL strings
    if (Array.isArray(images)) {
      const filtered = images.filter((img: any) => 
        img && 
        typeof img === 'string' && 
        (img.startsWith('http') || img.startsWith('https'))
      );
      console.log('normalizeReviewImages: Filtered images:', filtered);
      return filtered;
    }
    
    console.log('normalizeReviewImages: No valid images found');
    return [];
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  let filteredReviews = reviews;
  if (filterRating !== 'all') {
    filteredReviews = filteredReviews.filter((r: any) => r.rating === parseInt(filterRating));
  }
  if (filterStatus !== 'all') {
    if (filterStatus === 'approved') {
      filteredReviews = filteredReviews.filter((r: any) => r.approved === true);
    } else if (filterStatus === 'pending') {
      filteredReviews = filteredReviews.filter((r: any) => r.approved !== true);
    }
  }

  const reviewImages = selectedReview ? normalizeReviewImages(selectedReview) : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Management</Text>
        <Text style={styles.subtitle}>Moderate user reviews</Text>
      </View>

      {/* Filters */}
      <View style={styles.controls}>
        <Text style={styles.filterLabel}>Filter by Rating:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterRating === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterRating('all')}
          >
            <Text style={[styles.filterButtonText, filterRating === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[styles.filterButton, filterRating === rating.toString() && styles.filterButtonActive]}
              onPress={() => setFilterRating(rating.toString())}
            >
              <Text style={[styles.filterButtonText, filterRating === rating.toString() && styles.filterButtonTextActive]}>
                {rating}⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: 16 }]}>Filter by Status:</Text>
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
            style={[styles.filterButton, filterStatus === 'approved' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('approved')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'approved' && styles.filterButtonTextActive]}>
              Approved
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
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.resultsText}>{filteredReviews.length} reviews found</Text>
        
        {filteredReviews.map((review) => {
          const isApproved = review.approved === true;
          return (
            <TouchableOpacity
              key={review.id}
              style={styles.reviewCard}
              onPress={() => loadReviewDetails(review)}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.reviewHeaderLeft}>
                  <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                  {isApproved && (
                    <View style={styles.approvedBadge}>
                      <Text style={styles.approvedBadgeText}>✓ Approved</Text>
                    </View>
                  )}
                </View>
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApproveReview(review.id);
                    }}
                  >
                    <Text style={styles.approveButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveReview(review.id);
                    }}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.reviewTitle} numberOfLines={1}>
                {review.title || 'No title'}
              </Text>
              <Text style={styles.reviewComment} numberOfLines={2}>
                {review.comment || 'No comment'}
              </Text>
              {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                <Text style={styles.hasPhotosText}>📷 {review.images.length} photo(s)</Text>
              )}
              <Text style={styles.reviewDate}>
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {filteredReviews.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        )}
      </View>

      {/* Review Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.modalCloseText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Review Details</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : selectedReview ? (
            <View style={styles.modalContent}>
              {/* Status Badge */}
              <View style={styles.statusSection}>
                {selectedReview.approved ? (
                  <View style={styles.approvedBadgeLarge}>
                    <Text style={styles.approvedBadgeTextLarge}>✓ Approved</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>⏳ Pending Approval</Text>
                  </View>
                )}
              </View>

              {/* Review Info */}
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Listing</Text>
                <Text style={styles.detailValue}>{listingTitle}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Reviewer</Text>
                <Text style={styles.detailValue}>{reviewerName}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Rating</Text>
                {renderStars(selectedReview.rating)}
              </View>

              {selectedReview.title && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedReview.title}</Text>
                </View>
              )}

              {/* Photos Section - Prominent Display (Moved up for visibility) */}
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>
                  📷 Photos ({reviewImages.length})
                  {reviewImages.length > 0 && (
                    <Text style={styles.photoWarningText}> - Click to view full size</Text>
                  )}
                </Text>
                {reviewImages.length > 0 ? (
                  <View style={styles.photosContainer}>
                    {reviewImages.map((image, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.photoThumbnail}
                        onPress={() => {
                          setSelectedImageIndex(index);
                          setShowImageGallery(true);
                        }}
                      >
                        <Image
                          source={{ uri: image }}
                          style={styles.photoThumbnailImage}
                          resizeMode="cover"
                        />
                        {reviewImages.length > 1 && index === 0 && (
                          <View style={styles.photoCountBadge}>
                            <Text style={styles.photoCountText}>+{reviewImages.length - 1}</Text>
                          </View>
                        )}
                        <View style={styles.photoOverlay}>
                          <Text style={styles.photoOverlayText}>Tap to enlarge</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noPhotosContainer}>
                    <Text style={styles.noPhotosText}>No photos attached to this review</Text>
                  </View>
                )}
                {reviewImages.length > 0 && (
                  <Text style={styles.photoNoteText}>
                    ⚠️ Please review all photos before approving to ensure content is appropriate.
                  </Text>
                )}
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Review</Text>
                <Text style={styles.detailComment}>{selectedReview.comment || 'No comment provided'}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Date Submitted</Text>
                <Text style={styles.detailValue}>
                  {selectedReview.createdAt
                    ? new Date(selectedReview.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {!selectedReview.approved && (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.approveActionButton]}
                    onPress={() => handleApproveReview(selectedReview.id)}
                  >
                    <Text style={styles.approveActionText}>✓ Approve Review</Text>
                  </TouchableOpacity>
                )}
                {selectedReview.approved && (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.rejectActionButton]}
                    onPress={() => handleRejectReview(selectedReview.id)}
                  >
                    <Text style={styles.rejectActionText}>✕ Reject Review</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.deleteActionButton]}
                  onPress={() => handleRemoveReview(selectedReview.id)}
                >
                  <Text style={styles.deleteActionText}>🗑️ Delete Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </Modal>

      {/* Image Gallery Modal */}
      {showImageGallery && reviewImages.length > 0 && (
        <Modal
          visible={showImageGallery}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowImageGallery(false)}
        >
          <View style={styles.galleryModal}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>
                {selectedImageIndex + 1} / {reviewImages.length}
              </Text>
              <TouchableOpacity
                style={styles.galleryCloseButton}
                onPress={() => setShowImageGallery(false)}
              >
                <Text style={styles.galleryCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.galleryImageContainer}>
              <Image
                source={{ uri: reviewImages[selectedImageIndex] }}
                style={styles.galleryImage}
                resizeMode="contain"
              />
            </View>

            {reviewImages.length > 1 && (
              <View style={styles.galleryControls}>
                <TouchableOpacity
                  style={[
                    styles.galleryNavButton,
                    selectedImageIndex === 0 && styles.galleryNavButtonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedImageIndex > 0) {
                      setSelectedImageIndex(selectedImageIndex - 1);
                    }
                  }}
                  disabled={selectedImageIndex === 0}
                >
                  <Text style={styles.galleryNavText}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.galleryNavButton,
                    selectedImageIndex === reviewImages.length - 1 && styles.galleryNavButtonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedImageIndex < reviewImages.length - 1) {
                      setSelectedImageIndex(selectedImageIndex + 1);
                    }
                  }}
                  disabled={selectedImageIndex === reviewImages.length - 1}
                >
                  <Text style={styles.galleryNavText}>Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Thumbnail strip */}
            {reviewImages.length > 1 && (
              <View style={styles.thumbnailStrip}>
                {reviewImages.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}
                    onPress={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Modal>
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
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  approvedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#E8F5E8',
  },
  approveButtonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  removeButtonText: {
    color: '#D32F2F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  hasPhotosText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  modalCloseButton: {
    marginBottom: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    padding: 16,
  },
  statusSection: {
    marginBottom: 16,
  },
  approvedBadgeLarge: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approvedBadgeTextLarge: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#F57C00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  detailComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 20,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    justifyContent: 'flex-start',
  },
  photoThumbnail: {
    width: 150,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  photoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoWarningText: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'normal',
  },
  photoNoteText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F57C00',
  },
  noPhotosContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  noPhotosText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  modalActionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveActionButton: {
    backgroundColor: '#2E7D32',
  },
  approveActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectActionButton: {
    backgroundColor: '#FF9800',
  },
  rejectActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteActionButton: {
    backgroundColor: '#D32F2F',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Gallery Modal styles
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  galleryCloseButton: {
    padding: 8,
  },
  galleryCloseText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  galleryImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  galleryImage: {
    width: '100%',
    height: '70%',
  },
  galleryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  galleryNavButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  galleryNavButtonDisabled: {
    opacity: 0.3,
  },
  galleryNavText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  thumbnailStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FFFFFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
