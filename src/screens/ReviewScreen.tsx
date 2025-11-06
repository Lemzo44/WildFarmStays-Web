import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ReviewService } from '../services/ReviewService';
import { ImageUploadService } from '../services/ImageUploadService';
import ImageUploadConfirmationModal from '../components/ImageUploadConfirmationModal';

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
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({});
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

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

  const handleAddImage = () => {
    if (!currentUser) {
      setError('You must be logged in to upload images.');
      setShowError(true);
      return;
    }

    if (images.length >= 3) {
      setError('Maximum 3 images allowed.');
      setShowError(true);
      return;
    }

    // Show confirmation modal
    setShowImageUploadModal(true);
  };

  const handleConfirmImageUpload = async () => {
    // Close modal first
    setShowImageUploadModal(false);
    
    // Immediately open file picker - this preserves user activation context
    try {
      const imageIndex = images.length;
      setUploadingImages(prev => ({ ...prev, [imageIndex]: true }));

      // Open file picker immediately while user activation context is still valid
      const file = await ImageUploadService.selectImageFile();
      
      if (!file) {
        setUploadingImages(prev => {
          const updated = { ...prev };
          delete updated[imageIndex];
          return updated;
        });
        return; // User cancelled
      }

      // Upload image
      const result = await ImageUploadService.uploadImage(
        file,
        'reviews',
        currentUser!.id
      );

      if (result.success && result.url) {
        setImages(prev => [...prev, result.url!]);
      } else {
        setError(result.error || 'Failed to upload image');
        setShowError(true);
      }
    } catch (error: any) {
      console.error('Error adding image:', error);
      setError('Failed to upload image. Please try again.');
      setShowError(true);
    } finally {
      setUploadingImages(prev => {
        const updated = { ...prev };
        delete updated[images.length];
        return updated;
      });
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
        images: images.length > 0 ? images : undefined,
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
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(error?.message || 'Failed to submit review');
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
        <Text style={styles.cardTitle}>Photos (Optional)</Text>
        <Text style={styles.commentLabel}>
          Add up to 3 photos to share your experience
        </Text>
        
        <View style={styles.imageContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image
                source={{ uri: image }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImages(prev => prev.filter((_, i) => i !== index));
                }}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
              disabled={uploadingImages[images.length]}
            >
              <Text style={styles.addImageText}>
                {uploadingImages[images.length] ? 'Uploading...' : '+ Add Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* Image Upload Confirmation Modal */}
      <ImageUploadConfirmationModal
        visible={showImageUploadModal}
        onConfirm={handleConfirmImageUpload}
        onCancel={() => setShowImageUploadModal(false)}
        maxImages={3}
        context="review"
      />
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
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});



