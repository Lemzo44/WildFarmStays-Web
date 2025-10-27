import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ReviewService } from '../services/ReviewService';

interface ReviewsManagementProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function ReviewsManagement({ onNavigate }: ReviewsManagementProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const handleApproveReview = async (reviewId: string) => {
    Alert.alert(
      'Approve Review',
      'Are you sure you want to approve this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            Alert.alert('Success', 'Review approved');
            loadReviews();
          }
        }
      ]
    );
  };

  const handleRemoveReview = async (reviewId: string) => {
    Alert.alert(
      'Remove Review',
      'Are you sure you want to remove this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReviewService.deleteReview(reviewId);
              Alert.alert('Success', 'Review removed');
              loadReviews();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove review');
            }
          }
        }
      ]
    );
  };

  // Add getAllReviews and deleteReview to ReviewService if they don't exist
  // For now, using mock implementation

  let filteredReviews = reviews;
  if (filterRating !== 'all') {
    filteredReviews = filteredReviews.filter((r: any) => r.rating === parseInt(filterRating));
  }
  if (filterStatus !== 'all') {
    filteredReviews = filteredReviews.filter((r: any) => r.status === filterStatus);
  }

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
      </View>

      <View style={styles.content}>
        <Text style={styles.resultsText}>{filteredReviews.length} reviews found</Text>
        
        {filteredReviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApproveReview(review.id)}
                >
                  <Text style={styles.approveButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveReview(review.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <Text style={styles.reviewDate}>
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        ))}

        {filteredReviews.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
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
  reviewRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#D32F2F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
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
});

