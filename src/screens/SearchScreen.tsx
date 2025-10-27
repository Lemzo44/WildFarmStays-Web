import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { ReviewService } from '../services/ReviewService';
import WebMap from '../components/WebMap';
import WebMarker from '../components/WebMarker';

export default function SearchScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState({
    latitude: 54.7024,
    longitude: -3.2766,
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    amenities: [],
    priceRange: [0, 200],
    wildnessRating: 0,
    restrictions: [],
  });

  useEffect(() => {
    loadListings();
    getCurrentLocation();
  }, []);

  const loadListings = async () => {
    try {
      const allListings = await LocalStorageService.getAll('listings');
      console.log('📋 All listings loaded:', allListings.length);
      setListings(allListings);
    } catch (error) {
      console.error('❌ Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Simulate getting current location (UK center)
      setRegion({
        latitude: 54.7024,
        longitude: -3.2766,
        latitudeDelta: 5.0,
        longitudeDelta: 5.0,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setFilterMenuVisible(false);
  };

  const clearFilters = () => {
    setSelectedFilters({
      amenities: [],
      priceRange: [0, 200],
      wildnessRating: 0,
      restrictions: [],
    });
    setFilterMenuVisible(false);
  };

  const handleMarkerPress = (listing: any) => {
    console.log('Marker pressed:', listing.title);
    // Navigate to booking screen (would need navigation prop)
  };

  const getFilteredListings = () => {
    return listings.filter((listing: any) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          listing.title.toLowerCase().includes(searchLower) ||
          listing.location.toLowerCase().includes(searchLower) ||
          listing.description.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Price filter
      if (listing.price < selectedFilters.priceRange[0] || 
          listing.price > selectedFilters.priceRange[1]) {
        return false;
      }

      // Wildness rating filter
      if (selectedFilters.wildnessRating > 0 && 
          listing.wildnessRating < selectedFilters.wildnessRating) {
        return false;
      }

      // Amenities filter
      if (selectedFilters.amenities.length > 0) {
        const hasAllAmenities = selectedFilters.amenities.every((amenity: string) =>
          listing.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  };

  const filteredListings = getFilteredListings();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchbar}
          placeholder="Search by location, postcode, or farm name..."
          onChangeText={handleSearch}
          value={searchQuery}
        />
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterMenuVisible(!filterMenuVisible)}
          >
            <Text style={styles.filterButtonText}>🔍 Filters</Text>
          </TouchableOpacity>
          
          {filterMenuVisible && (
            <View style={styles.filterMenu}>
              <TouchableOpacity 
                style={styles.filterMenuItem}
                onPress={() => handleFilterChange('wildnessRating', 3)}
              >
                <Text style={styles.filterMenuText}>Wildness 3+</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterMenuItem}
                onPress={() => handleFilterChange('wildnessRating', 4)}
              >
                <Text style={styles.filterMenuText}>Wildness 4+</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterMenuItem}
                onPress={() => handleFilterChange('wildnessRating', 5)}
              >
                <Text style={styles.filterMenuText}>Wildness 5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterMenuItem}
                onPress={clearFilters}
              >
                <Text style={styles.filterMenuText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <WebMap
        region={region}
        listings={filteredListings}
        style={styles.map}
      >
        {filteredListings.map((listing: any) => (
          <WebMarker
            key={listing.id}
            coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
            title={listing.title}
            description={`£${listing.price}/night • ${listing.wildnessRating}/5 wildness • ${listing.location}`}
            onPress={() => handleMarkerPress(listing)}
          />
        ))}
      </WebMap>

      <View style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>{filteredListings.length} listings found</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listingsContainer}>
          {filteredListings.slice(0, 3).map((listing: any) => (
            <View key={listing.id} style={styles.listingCard}>
              <View style={styles.listingHeader}>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingPrice}>£{listing.price}/night</Text>
              </View>
              
              <Text style={styles.listingLocation}>
                {listing.location}
              </Text>
              
              <View style={styles.listingDetails}>
                <View style={styles.wildnessChip}>
                  <Text style={styles.chipText}>Wildness: {listing.wildnessRating}/5</Text>
                </View>
                <View style={styles.ratingChip}>
                  <Text style={styles.chipText}>⭐ {listing.rating || 'New'}</Text>
                </View>
              </View>
              
              <Text style={styles.listingDescription} numberOfLines={2}>
                {listing.description}
              </Text>
              
              <View style={styles.listingAmenities}>
                {listing.amenities.slice(0, 3).map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
                {listing.amenities.length > 3 && (
                  <View style={styles.amenityChip}>
                    <Text style={styles.amenityText}>+{listing.amenities.length - 3} more</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleMarkerPress(listing)}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>📋 View All Listings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchbar: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  filterContainer: {
    position: 'relative',
  },
  filterButton: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  filterMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
    minWidth: 150,
  },
  filterMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  filterMenuText: {
    fontSize: 14,
    color: '#333',
  },
  map: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewAllButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  listingsContainer: {
    flexDirection: 'row',
  },
  listingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listingDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  wildnessChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  listingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  listingAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  amenityChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
