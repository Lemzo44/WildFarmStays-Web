import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
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

  // Mock listing data if not provided
  const mockListingId = listingId || '1';

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [listingReviews, stats] = await Promise.all([
        ReviewService.getListingReviews(mockListingId),
        ReviewService.getListingReviewStats(mockListingId)
      ]);
      
      setReviews(listingReviews);
      setReviewStats(stats);
      
      // Load reviewer names
      const names: any = {};
      const useSupabaseBackend = useSupabase;
      
      for (const review of listingReviews) {
        try {
          if (review.reviewerName && review.reviewerName !== 'Anonymous') {
            // Use reviewerName if already provided from ReviewService
            names[review.id] = review.reviewerName;
          } else if (useSupabaseBackend) {
            // Fetch from Supabase profiles
            const reviewer = await APIService.getById('profiles', review.reviewerId);
            if (reviewer) {
              const firstName = reviewer.first_name || reviewer.firstName || '';
              const lastName = reviewer.last_name || reviewer.lastName || '';
              names[review.id] = `${firstName} ${lastName}`.trim() || 'Anonymous';
            } else {
              names[review.id] = 'Anonymous';
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

  const renderReviewItem = ({ item }: { item: any }) => (
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
              {reviewerNames[item.id] || 'Anonymous'}
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
    </View>
  );

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
});



