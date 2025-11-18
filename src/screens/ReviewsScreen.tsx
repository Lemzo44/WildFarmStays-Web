import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ReviewService } from '../services/ReviewService';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface ReviewsScreenProps {
  listingId?: string;
  onNavigate?: (screen: string) => void;
}

export default function ReviewsScreen({ listingId, onNavigate }: ReviewsScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviewerNames, setReviewerNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    if (listingId) {
      console.log('ReviewsScreen: Loading reviews for listingId:', listingId);
      loadReviews();
    } else {
      console.warn('ReviewsScreen: No listingId provided, cannot load reviews');
      setLoading(false);
    }
  }, [listingId]);

  const loadReviews = async () => {
    if (!listingId) {
      console.error('ReviewsScreen: Cannot load reviews without listingId');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('ReviewsScreen: Fetching reviews for listingId:', listingId);
      const [listingReviews, stats] = await Promise.all([
        ReviewService.getListingReviews(listingId),
        ReviewService.getListingReviewStats(listingId)
      ]);
      
      console.log('ReviewsScreen: Loaded', listingReviews.length, 'reviews');
      if (listingReviews.length > 0) {
        console.log('ReviewsScreen: First review listingId:', listingReviews[0].listingId);
      }
      
      setReviews(listingReviews);
      setReviewStats(stats);
      
      // Always resolve names from profiles when Supabase is enabled to avoid stale Anonymous
      const names: any = {};
      const useSupabaseBackend = useSupabase;
      
      for (const review of listingReviews) {
        try {
          if (useSupabaseBackend) {
            // Fetch from Supabase profiles
            const reviewer = review.reviewerId ? await APIService.getById('profiles', review.reviewerId) : null;
            if (reviewer) {
              const firstName = reviewer.first_name || reviewer.firstName || '';
              const lastName = reviewer.last_name || reviewer.lastName || '';
              names[review.id] = `${firstName} ${lastName}`.trim() || 'Anonymous';
            } else {
              // Fallback to server-provided name
              names[review.id] = review.reviewerName || 'Anonymous';
            }
          } else {
            // Fallback to localStorage
            const reviewer = await LocalStorageService.getById('users', review.reviewerId);
            if (reviewer) {
              names[review.id] = `${reviewer.firstName} ${reviewer.lastName}`;
            } else {
              names[review.id] = 'Anonymous';
            }
          }
        } catch (error) {
          names[review.id] = review.reviewerName || 'Anonymous';
        }
      }
      setReviewerNames(names);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const renderRatingDistribution = () => {
    return (
      <View style={styles.ratingDistribution}>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewStats.ratingDistribution[rating] || 0;
          const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
          
          return (
            <View key={rating} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{rating} star</Text>
              <View style={styles.ratingBar}>
                <View 
                  style={[
                    styles.ratingFill, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.ratingCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const normalizeReviewImages = (review: any): string[] => {
    if (!review) return [];
    
    let images = review.images || [];
    
    // Handle JSON string (if stored as JSON in database)
    if (typeof images === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(images);
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
        if (images.startsWith('http') || images.startsWith('https')) {
          images = [images];
        } else {
          images = [];
        }
      }
    }
    
    // Filter to only valid URL strings
    if (Array.isArray(images)) {
      return images.filter((img: any) => 
        img && 
        typeof img === 'string' && 
        (img.startsWith('http') || img.startsWith('https'))
      );
    }
    
    return [];
  };

  const renderReviewItem = ({ item }: { item: any }) => {
    const reviewImages = normalizeReviewImages(item);
    
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {reviewerNames[item.id]?.charAt(0) || 'A'}
              </Text>
            </View>
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>
                {reviewerNames[item.id] || item.reviewerName || 'Anonymous'}
              </Text>
              <Text style={styles.reviewDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRating}>
            {renderStars(item.rating)}
          </View>
        </View>
        
        {item.title && (
          <Text style={styles.reviewTitle}>{item.title}</Text>
        )}
        
        <Text style={styles.reviewComment}>{item.comment}</Text>
        
        {/* Review Photos */}
        {reviewImages.length > 0 && (
          <View style={styles.reviewPhotosContainer}>
            <Text style={styles.reviewPhotosLabel}>Photos:</Text>
            <View style={styles.reviewPhotosGrid}>
              {reviewImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reviewPhotoThumbnail}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setGalleryImages(reviewImages);
                    setShowImageGallery(true);
                  }}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.reviewPhotoImage}
                    resizeMode="cover"
                  />
                  {reviewImages.length > 1 && index === 0 && (
                    <View style={styles.reviewPhotoCountBadge}>
                      <Text style={styles.reviewPhotoCountText}>+{reviewImages.length - 1}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
        <Text style={styles.subtitle}>
          {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>

      {reviewStats.totalReviews > 0 ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Rating</Text>
            <View style={styles.overallRating}>
              <Text style={styles.averageRating}>
                {reviewStats.averageRating.toFixed(1)}
              </Text>
              <View style={styles.ratingStars}>
                {renderStars(Math.round(reviewStats.averageRating))}
              </View>
              <Text style={styles.totalReviews}>
                Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rating Breakdown</Text>
            {renderRatingDistribution()}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Reviews</Text>
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              Be the first to review this farm and help other campers!
            </Text>
            <TouchableOpacity style={styles.writeReviewButton}>
              <Text style={styles.writeReviewButtonText}>Write First Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && galleryImages.length > 0 && (
        <Modal
          visible={showImageGallery}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowImageGallery(false)}
        >
          <View style={styles.galleryModal}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>
                {selectedImageIndex + 1} / {galleryImages.length}
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
                source={{ uri: galleryImages[selectedImageIndex] }}
                style={styles.galleryImage}
                resizeMode="contain"
              />
            </View>

            {galleryImages.length > 1 && (
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
                    selectedImageIndex === galleryImages.length - 1 && styles.galleryNavButtonDisabled,
                  ]}
                  onPress={() => {
                    if (selectedImageIndex < galleryImages.length - 1) {
                      setSelectedImageIndex(selectedImageIndex + 1);
                    }
                  }}
                  disabled={selectedImageIndex === galleryImages.length - 1}
                >
                  <Text style={styles.galleryNavText}>Next →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <View style={styles.thumbnailStrip}>
                {galleryImages.map((image, index) => (
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
    marginBottom: 12,
    color: '#333',
  },
  overallRating: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  ratingStars: {
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#333',
    minWidth: 60,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    minWidth: 30,
    textAlign: 'right',
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    marginLeft: 12,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
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
    marginBottom: 24,
  },
  writeReviewButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewPhotosContainer: {
    marginTop: 12,
  },
  reviewPhotosLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  reviewPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewPhotoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewPhotoImage: {
    width: '100%',
    height: '100%',
  },
  reviewPhotoCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewPhotoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
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



