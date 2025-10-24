import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ReviewService } from '../services/ReviewService';

interface ReviewScreenProps {
  listing?: any;
  booking?: any;
  onNavigate?: (screen: string) => void;
}

export default function ReviewScreen({ listing, booking, onNavigate }: ReviewScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Mock listing data if not provided
  const mockListing = {
    id: '1',
    title: 'Green Valley Farm',
    location: 'Yorkshire, UK',
    farmerName: 'Sarah Farmer',
  };

  const currentListing = listing || mockListing;

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
    // Auto-generate title based on rating
    if (!title) {
      const titles: { [key: number]: string } = {
        1: 'Poor experience',
        2: 'Below expectations',
        3: 'Average stay',
        4: 'Great experience',
        5: 'Amazing stay!'
      };
      setTitle(titles[selectedRating]);
    }
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

  const handleSubmitReview = async () => {
    if (!currentUser) {
      setError('You must be logged in to submit a review.');
      setShowError(true);
      return;
    }

    if (rating === 0) {
      setError('Please select a rating.');
      setShowError(true);
      return;
    }

    if (!title.trim()) {
      setError('Please enter a review title.');
      setShowError(true);
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment.');
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      
      const reviewData = {
        listingId: currentListing.id,
        reviewerId: currentUser.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      const result = await ReviewService.createReview(reviewData);
      
      if (result.success) {
        // Show success message and navigate back
        alert('Review submitted successfully!');
        onNavigate?.('home');
      } else {
        setError(result.message || 'Failed to submit review');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Write a Review</Text>
        <Text style={styles.subtitle}>
          Share your experience at {currentListing.title}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Farm Details</Text>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{currentListing.title}</Text>
          <Text style={styles.listingLocation}>📍 {currentListing.location}</Text>
          <Text style={styles.farmerName}>Hosted by {currentListing.farmerName}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Rating</Text>
        <Text style={styles.ratingLabel}>How would you rate your stay?</Text>
        {renderStars()}
        {rating > 0 && (
          <Text style={styles.ratingText}>
            {rating} out of 5 stars
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review Title</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Give your review a title..."
          maxLength={100}
        />
        <Text style={styles.charCount}>{title.length}/100</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Review</Text>
        <Text style={styles.commentLabel}>
          Tell others about your experience at this farm
        </Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience, what you loved, what could be improved..."
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{comment.length}/1000</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review Guidelines</Text>
        <View style={styles.guidelines}>
          <Text style={styles.guidelineItem}>• Be honest and specific about your experience</Text>
          <Text style={styles.guidelineItem}>• Mention what you enjoyed most</Text>
          <Text style={styles.guidelineItem}>• Be respectful and constructive</Text>
          <Text style={styles.guidelineItem}>• Help other campers make informed decisions</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => onNavigate?.('home')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  listingInfo: {
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
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
  titleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  guidelines: {
    marginTop: 8,
  },
  guidelineItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
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



