import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';
import { FavoritesService } from '../services/FavoritesService';
import { ReviewService } from '../services/ReviewService';
import { MessageService } from '../services/MessageService';
import Tooltip from '../components/Tooltip';
import Platform from '../utils/Platform';

interface ListingsScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function ListingsScreen({ onNavigate }: ListingsScreenProps = {}) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isFarmer = currentUser?.role === 'farmer';
  
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [favoriteStatus, setFavoriteStatus] = useState({});
  const [listingReviewStats, setListingReviewStats] = useState({});
  const [hoveredElement, setHoveredElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedAmenities, setExpandedAmenities] = useState({});

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      let allListings: any[] = [];
      const useSupabaseBackend = useSupabase;

      if (useSupabaseBackend) {
        // Fetch from Supabase
        allListings = await APIService.get('listings', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize field names (snake_case -> camelCase) for compatibility
        allListings = allListings.map((listing: any) => ({
          ...listing,
          farmerId: listing.farmer_id || listing.farmerId,
          maxGuests: listing.max_guests || listing.maxGuests,
          pricePerNight: listing.price_per_night || listing.price_per_night || listing.price,
          wildnessRating: listing.wildness_rating || listing.wildnessRating,
          parkingLocation: listing.parking_location || listing.parkingLocation,
          cancellationPolicy: listing.cancellation_policy || listing.cancellationPolicy,
          seasonalHighlights: listing.seasonal_highlights || listing.seasonalHighlights,
          reviewCount: listing.review_count || listing.reviewCount || 0,
          // Handle availability/status mapping
          availability: listing.status === 'approved' || listing.status === 'live' 
            ? 'available' 
            : listing.availability || 'pending',
        }));
      } else {
        // Fallback to localStorage
        allListings = await LocalStorageService.getAll('listings');
      }
      
      // Filter listings based on user role
      let filteredListings = allListings;
      if (isFarmer && currentUser) {
        // Farmers see all their listings (including pending for approval)
        filteredListings = allListings.filter((listing: any) => 
          (listing.farmerId || listing.farmer_id) === currentUser.id
        );
      } else {
        // Campers only see approved/live listings
        filteredListings = allListings.filter((listing: any) => 
          listing.status === 'approved' || listing.status === 'live' || 
          (listing.status !== 'rejected' && listing.availability === 'available')
        );
      }
      
      setListings(filteredListings);
      
      // Load favorite status for each listing (only for available listings shown to campers)
      if (currentUser && !isFarmer) {
        const statusMap: any = {};
        for (const listing of filteredListings) {
          statusMap[listing.id] = await FavoritesService.isFavorite(currentUser.id, listing.id);
        }
        setFavoriteStatus(statusMap);
      }

      // Load review stats for each listing
      const reviewStatsMap: any = {};
      for (const listing of filteredListings) {
        const stats = await ReviewService.getListingReviewStats(listing.id);
        reviewStatsMap[listing.id] = stats;
      }
      setListingReviewStats(reviewStatsMap);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      loadListings();
    } else {
      // Search in title and location
      const filtered = listings.filter((listing: any) =>
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.location.toLowerCase().includes(query.toLowerCase())
      );
      setListings(filtered);
    }
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
    
    let sorted = [...listings];
    switch (sortType) {
      case 'price-low':
        sorted.sort((a: any, b: any) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a: any, b: any) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a: any, b: any) => {
          const ratingA = listingReviewStats[a.id]?.totalReviews > 0 
            ? listingReviewStats[a.id].averageRating 
            : a.rating;
          const ratingB = listingReviewStats[b.id]?.totalReviews > 0 
            ? listingReviewStats[b.id].averageRating 
            : b.rating;
          return ratingB - ratingA;
        });
        break;
      case 'wildness':
        sorted.sort((a: any, b: any) => b.wildnessRating - a.wildnessRating);
        break;
      default:
        loadListings();
        return;
    }
    setListings(sorted);
  };

  const handleToggleFavorite = async (listing: any) => {
    if (isFarmer || !currentUser) return;
    
    try {
      const result = await FavoritesService.toggleFavorite(currentUser.id, listing);
      if (result.success) {
        setFavoriteStatus((prev: any) => ({
          ...prev,
          [listing.id]: !prev[listing.id]
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleMessageFarmer = async (listing: any) => {
    if (isFarmer || !currentUser) return;
    
    try {
      // Create or get conversation
      const result = await MessageService.createOrGetConversation(
        currentUser.id,
        listing.farmerId,
        listing.id
      );
      
      if (result.success) {
        console.log('✅ Conversation ready');
        // Navigate to Messages screen (would need navigation prop)
        onNavigate?.('messages');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleBookNow = (listing: any) => {
    // Navigate to booking screen with the listing
    onNavigate?.('booking', listing);
  };

  const toggleAmenitiesExpansion = (listingId: string) => {
    setExpandedAmenities((prev: any) => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  const handleMouseEnter = (elementId: string, event: any) => {
    setHoveredElement(elementId);
    if (Platform.OS === 'web' && event) {
      const rect = event.target.getBoundingClientRect();
      const tooltipWidth = 300;
      const viewportWidth = window.innerWidth;
      
      let x = rect.left + rect.width / 2;
      
      if (x + tooltipWidth / 2 > viewportWidth) {
        x = viewportWidth - tooltipWidth / 2 - 10;
      }
      if (x - tooltipWidth / 2 < 0) {
        x = tooltipWidth / 2 + 10;
      }
      
      setTooltipPosition({
        x: x,
        y: rect.top - 10
      });
    }
  };

  const renderListingCard = ({ item }: { item: any }) => (
    <View style={styles.listingCard}>
      {/* Web layout: side-by-side */}
      <View style={styles.webCardLayout}>
        <View style={styles.webImageContainer}>
          <View style={styles.cardImage}>
            <Text style={styles.imagePlaceholder}>🖼️</Text>
          </View>
          {!isFarmer && currentUser && (
            <Tooltip 
              text={favoriteStatus[item.id] ? "Remove from favorites" : "Add to favorites"}
              visible={hoveredElement === `heart-${item.id}`}
              elementId={`heart-${item.id}`}
              position={tooltipPosition}
            >
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(item)}
                onMouseEnter={(e) => handleMouseEnter(`heart-${item.id}`, e)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <Text style={styles.favoriteIcon}>
                  {favoriteStatus[item.id] ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </Tooltip>
          )}
        </View>
        
        <View style={styles.webContentContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.listingTitle}>{item.title}</Text>
          </View>
          
          {/* Show rejection feedback to farmers for rejected listings */}
          {item.availability === 'rejected' && item.rejectionReason && isFarmer && (
            <View style={styles.rejectionBanner}>
              <Text style={styles.rejectionText}>⚠️ Listing Rejected</Text>
              <Text style={styles.rejectionReason}>Admin feedback: {item.rejectionReason}</Text>
              <Text style={styles.rejectionHelp}>Please edit this listing to address the issues and resubmit.</Text>
            </View>
          )}
          
          <Text style={styles.location}>📍 {item.location}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.rating}>
                {listingReviewStats[item.id]?.totalReviews > 0 
                  ? listingReviewStats[item.id].averageRating.toFixed(1) 
                  : item.rating}
              </Text>
              {listingReviewStats[item.id]?.totalReviews > 0 && (
                <Text style={styles.reviewCount}>({listingReviewStats[item.id].totalReviews})</Text>
              )}
            </View>
            <Tooltip 
              text={`Wildness rating: ${item.wildnessRating} out of 5. Higher scores indicate more remote, natural settings.`}
              visible={hoveredElement === `wildness-${item.id}`}
              elementId={`wildness-${item.id}`}
              position={tooltipPosition}
            >
              <View 
                style={styles.wildnessRow}
                onMouseEnter={(e) => handleMouseEnter(`wildness-${item.id}`, e)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <Text style={styles.leafIcon}>🍃</Text>
                <Text style={styles.wildness}>Wildness: {item.wildnessRating}/5</Text>
              </View>
            </Tooltip>
          </View>

          <View style={styles.amenitiesContainer}>
            {(() => {
              const amenitiesToShow = expandedAmenities[item.id] ? item.amenities : item.amenities.slice(0, 5);
              return amenitiesToShow.map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ));
            })()}
            {item.amenities.length > 5 && (
              <TouchableOpacity
                style={[styles.amenityChip, styles.viewMoreChip]}
                onPress={() => toggleAmenitiesExpansion(item.id)}
              >
                <Text style={styles.viewMoreText}>
                  {expandedAmenities[item.id] ? 'View Less' : `+${item.amenities.length - 5} more`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>£{item.price}</Text>
            <Text style={styles.priceUnit}>/night</Text>
          </View>

          {!isFarmer && currentUser && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => handleBookNow(item)}
              >
                <Text style={styles.bookNowButtonText}>📅 Book Now</Text>
              </TouchableOpacity>
              <Tooltip 
                text="Send a message to the farmer about this listing"
                visible={hoveredElement === `message-${item.id}`}
                elementId={`message-${item.id}`}
                position={tooltipPosition}
              >
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleMessageFarmer(item)}
                  onMouseEnter={(e) => handleMouseEnter(`message-${item.id}`, e)}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <Text style={styles.messageButtonText}>💬 Message</Text>
                </TouchableOpacity>
              </Tooltip>
            </View>
          )}

          {isFarmer && currentUser && (
            <View style={styles.actionButtons}>
              {item.availability === 'rejected' ? (
                <>
                  <TouchableOpacity 
                    style={styles.resubmitButton}
                    onPress={() => onNavigate?.('edit-listing', item)}
                  >
                    <Text style={styles.resubmitButtonText}>🔄 Fix & Resubmit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => {
                      if (window.confirm('Are you sure you want to delete this rejected listing?')) {
                        console.log('Delete listing:', item.id);
                      }
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => onNavigate?.('edit-listing', item)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.reviewsButton}
                    onPress={() => onNavigate?.('reviews')}
                  >
                    <Text style={styles.reviewsButtonText}>⭐ Reviews</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => {
                      if (window.confirm('Are you sure you want to delete this listing?')) {
                        console.log('Delete listing:', item.id);
                      }
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isFarmer ? 'My Listings' : 'Browse Farms'}
        </Text>
        <Text style={styles.subtitle}>
          {isFarmer 
            ? 'Manage your farm listings and bookings'
            : 'Discover amazing farms for your next stay'
          }
        </Text>
      </View>

      {/* Search Bar - Only for Campers */}
      {!isFarmer && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farms by name or location..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      )}

      {/* Sort Options - Only for Campers */}
      {!isFarmer && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'recent' && styles.activeSortButton]}
              onPress={() => handleSort('recent')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.activeSortButtonText]}>Recent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'price-low' && styles.activeSortButton]}
              onPress={() => handleSort('price-low')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price-low' && styles.activeSortButtonText]}>Price ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'price-high' && styles.activeSortButton]}
              onPress={() => handleSort('price-high')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price-high' && styles.activeSortButtonText]}>Price ↓</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'rating' && styles.activeSortButton]}
              onPress={() => handleSort('rating')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.activeSortButtonText]}>Rating</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'wildness' && styles.activeSortButton]}
              onPress={() => handleSort('wildness')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'wildness' && styles.activeSortButtonText]}>Wildness</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isFarmer && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => onNavigate?.('create-listing')}
          >
            <Text style={styles.primaryButtonText}>➕ Add New Listing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Listings */}
      <FlatList
        data={listings}
        renderItem={renderListingCard}
        keyExtractor={(item: any) => item.id}
        style={styles.listingsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeSortButton: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
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
  primaryButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listingsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  webCardLayout: {
    flexDirection: 'row',
  },
  webImageContainer: {
    width: 200,
    height: 150,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
  },
  webContentContainer: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  wildnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  wildness: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 4,
  },
  amenityChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  viewMoreChip: {
    backgroundColor: '#F0F0F0',
  },
  viewMoreText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  bookNowButton: {
    backgroundColor: '#2E7D32',
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  messageButton: {
    backgroundColor: '#E8F5E8',
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewsButton: {
    backgroundColor: '#FFF3E0',
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsButtonText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectionBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  rejectionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  rejectionHelp: {
    fontSize: 12,
    color: '#D32F2F',
    fontStyle: 'italic',
  },
  resubmitButton: {
    backgroundColor: '#2E7D32',
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
