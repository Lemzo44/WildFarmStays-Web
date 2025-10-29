import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface EditListingScreenProps {
  listing?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function EditListingScreen({ listing, onNavigate }: EditListingScreenProps) {
  const { currentUser, isAdmin } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    postcode: '',
    county: '',
    location: '',
    parkingLocation: '',
    cancellationPolicy: '',
    coordinates: null as { latitude: number; longitude: number } | null,
    amenities: [] as string[],
    restrictions: [] as string[],
    seasonalHighlights: [] as string[],
    wildnessRating: 3,
    maxGuests: 4,
    images: [] as string[],
    // Availability settings
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    blackoutDates: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');

  // Mock listing data if not provided
  const mockListing = {
    id: '1',
    title: 'Green Valley Farm',
    description: 'A beautiful farm in the heart of Yorkshire with stunning views and peaceful surroundings.',
    price: 25,
    address: 'Green Valley Farm, Country Lane',
    postcode: 'YO1 1AA',
    location: 'Yorkshire, UK',
    amenities: ['Parking', 'Toilets', 'Shower', 'Fire Pit', 'BBQ'],
    wildnessRating: 3,
    maxGuests: 4,
  };

  // Extract listing from screenData if it's an object with listing property
  const extractedListing = listing?.listing || listing;
  const currentListing = extractedListing || mockListing;
  const isFromAdmin = listing?.fromAdmin || false;
  const viewOnly = listing?.viewOnly || false;

  useEffect(() => {
    // Populate form with existing listing data
    setFormData({
      title: currentListing.title || '',
      description: currentListing.description || '',
      price: currentListing.price?.toString() || '',
      address: currentListing.address || '',
      postcode: currentListing.postcode || '',
      county: currentListing.county || '',
      location: currentListing.location || '',
      parkingLocation: currentListing.parkingLocation || '',
      cancellationPolicy: currentListing.cancellationPolicy || '',
      coordinates: currentListing.coordinates || null,
      amenities: currentListing.amenities || [],
      restrictions: currentListing.restrictions || [],
      seasonalHighlights: currentListing.seasonalHighlights || [],
      wildnessRating: currentListing.wildnessRating || 3,
      maxGuests: currentListing.maxGuests || 4,
      images: currentListing.images || [],
      availableDays: currentListing.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      checkInTime: currentListing.checkInTime || '14:00',
      checkOutTime: currentListing.checkOutTime || '11:00',
      blackoutDates: currentListing.blackoutDates || [],
    });
  }, [currentListing]);

  const availableAmenities = [
    'Drinking water',
    'Compost toilet',
    'Fire pit',
    'Wildlife watching',
    'Nature trails',
    'Farm produce',
    'Secluded pitch',
    'Picnic area',
    'Firewood supply',
    'Bird hides',
    'Fishing access',
    'Wildflower meadow',
    'Hammock stands',
    'Meadow access',
    'Seasonal fruits',
    'Farm tours',
    'Stargazing spots',
    'Herb garden',
    'Orchard access',
    'Wooded areas',
    'Farm animals',
    'Bee colonies',
    'Compost bins',
    'Kayaking',
    'Bird feeders',
    'Dog-friendly',
    'Hiking paths',
    'Wildlife guides',
    'Rustic benches',
    'Swimming',
    'Parking',
    'River Access',
    'Mountain Access',
    'Lake Access',
  ];

  const availableRestrictions = [
    'No Dogs', 'No Children', 'No Fires', 'No Smoking', 'No Alcohol',
    'No Music', 'No Vehicles', 'Quiet Hours', 'Maximum Group Size'
  ];

  const seasonalHighlights = [
    'Spring Wildflowers', 'Summer Swimming', 'Fall Colors', 'Winter Views',
    'Bird Watching', 'Stargazing', 'Harvest Season', 'Wildlife Migration'
  ];

  const counties = [
    // Northern Ireland
    'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone',
    // Republic of Ireland
    'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
    'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
    'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
    'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
    'Wexford', 'Wicklow'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate location string from address and postcode
      if (field === 'address' || field === 'postcode') {
        const address = field === 'address' ? value : updated.address;
        const postcode = field === 'postcode' ? value : updated.postcode;
        updated.location = `${address}, ${postcode}`.replace(/^,\s*|,\s*$/g, '');
      }
      
      return updated;
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleRestrictionToggle = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction]
    }));
  };

  const handleSeasonalToggle = (season: string) => {
    setFormData(prev => ({
      ...prev,
      seasonalHighlights: prev.seasonalHighlights.includes(season)
        ? prev.seasonalHighlights.filter(s => s !== season)
        : [...prev.seasonalHighlights, season]
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleWildnessRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, wildnessRating: rating }));
  };

  const handleAddBlackoutDate = () => {
    // Set default dates (1 week from today for 7 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Format dates as DD/MM/YYYY
    const formatUKDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    setSelectedStartDate(formatUKDate(startDate));
    setSelectedEndDate(formatUKDate(endDate));
    setShowDatePicker(true);
  };

  const handleConfirmBlackoutDate = () => {
    if (!selectedStartDate || !selectedEndDate) {
      setError('Please select both start and end dates');
      setShowError(true);
      return;
    }

    // Convert DD/MM/YYYY to Date objects
    const parseUKDate = (dateString: string) => {
      const parts = dateString.split('/');
      if (parts.length !== 3) {
        throw new Error('Invalid date format');
      }
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    };

    try {
      const start = parseUKDate(selectedStartDate);
      const end = parseUKDate(selectedEndDate);
      
      if (start > end) {
        setError('End date must be after start date');
        setShowError(true);
        return;
      }

      // Add all dates in the range
      const newBlackoutDates: string[] = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        newBlackoutDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        blackoutDates: [...prev.blackoutDates, ...newBlackoutDates]
      }));

      setShowDatePicker(false);
      setSelectedStartDate('');
      setSelectedEndDate('');
    } catch (error) {
      setError('Please enter dates in DD/MM/YYYY format');
      setShowError(true);
    }
  };

  const handleCancelBlackoutDate = () => {
    setShowDatePicker(false);
    setSelectedStartDate('');
    setSelectedEndDate('');
  };

  const handleRemoveBlackoutDate = (dateToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      blackoutDates: prev.blackoutDates.filter(date => date !== dateToRemove)
    }));
  };

  const handleAddImage = () => {
    // For web, we'll simulate adding an image with a placeholder URL
    // In a real implementation, this would open a file picker
    const newImageUrl = `https://example.com/farm-image-${Date.now()}.jpg`;
    
    if (formData.images.length < 5) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl]
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleGetCurrentLocation = () => {
    // For web, we'll use the browser's geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            coordinates: { latitude, longitude }
          }));
          alert('Location updated successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get current location. Please enter address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a farm title.');
      setShowError(true);
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description.');
      setShowError(true);
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price per night.');
      setShowError(true);
      return false;
    }
    if (!formData.address.trim()) {
      setError('Please enter the farm address.');
      setShowError(true);
      return false;
    }
    if (!formData.postcode.trim()) {
      setError('Please enter the postcode.');
      setShowError(true);
      return false;
    }
    if (!formData.county.trim()) {
      setError('Please select a county.');
      setShowError(true);
      return false;
    }
    if (formData.amenities.length === 0) {
      setError('Please select at least one amenity.');
      setShowError(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('You must be logged in to edit a listing.');
      setShowError(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const useSupabaseBackend = useSupabase;
      const listingId = currentListing.id || currentListing.id;
      
      // Check if this was a rejected listing being resubmitted
      const isResubmission = currentListing.status === 'rejected' || currentListing.availability === 'rejected';
      
      if (useSupabaseBackend) {
        // Map to Supabase schema (snake_case)
        const supabaseUpdateData: any = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          address: formData.address.trim() || null,
          postcode: formData.postcode.trim() || null,
          county: formData.county.trim() || null,
          latitude: formData.coordinates?.latitude || currentListing.latitude || null,
          longitude: formData.coordinates?.longitude || currentListing.longitude || null,
          price: parseFloat(formData.price) || 0,
          price_per_night: parseFloat(formData.price) || 0,
          max_guests: formData.maxGuests || 4,
          amenities: formData.amenities.length > 0 ? formData.amenities : [],
          restrictions: formData.restrictions.length > 0 ? formData.restrictions : [],
          seasonal_highlights: formData.seasonalHighlights.length > 0 ? formData.seasonalHighlights : [],
          images: formData.images.length > 0 ? formData.images : (currentListing.images || ['https://example.com/farm.jpg']),
          parking_location: formData.parkingLocation.trim() || null,
          cancellation_policy: formData.cancellationPolicy.trim() || null,
          wildness_rating: formData.wildnessRating || 3,
        };

        // If resubmitting a rejected listing, set status to pending
        if (isResubmission) {
          supabaseUpdateData.status = 'pending';
          supabaseUpdateData.availability = 'pending';
          supabaseUpdateData.rejection_reason = null;
        }

        await APIService.update('listings', listingId, supabaseUpdateData);
      } else {
        // Fallback to localStorage
        const updatedListingData = {
          ...currentListing,
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          address: formData.address.trim(),
          postcode: formData.postcode.trim(),
          county: formData.county.trim(),
          location: formData.location.trim(),
          parkingLocation: formData.parkingLocation.trim(),
          cancellationPolicy: formData.cancellationPolicy.trim(),
          coordinates: formData.coordinates,
          latitude: formData.coordinates?.latitude || currentListing.latitude || 54.7024,
          longitude: formData.coordinates?.longitude || currentListing.longitude || -3.2766,
          amenities: formData.amenities,
          restrictions: formData.restrictions,
          seasonalHighlights: formData.seasonalHighlights,
          wildnessRating: formData.wildnessRating,
          maxGuests: formData.maxGuests,
          images: formData.images.length > 0 ? formData.images : currentListing.images || ['https://example.com/farm.jpg'],
          availableDays: formData.availableDays,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          blackoutDates: formData.blackoutDates,
          availability: isResubmission ? 'pending' : currentListing.availability,
          ...(isResubmission && { rejectionReason: undefined, rejectedAt: undefined }),
          updatedAt: new Date().toISOString(),
        };

        await LocalStorageService.save('listings', updatedListingData);
      }
      
      if (isResubmission) {
        alert('Listing resubmitted successfully! It will be reviewed by our admin team before going live.');
      } else {
        alert('Farm listing updated successfully!');
      }
      onNavigate?.('listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      setError('Failed to update listing. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) {
      setError('You must be logged in to delete a listing.');
      setShowError(true);
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this listing? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      
      await LocalStorageService.delete('listings', currentListing.id);
      
      alert('Farm listing deleted successfully!');
      onNavigate?.('listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError('Failed to delete listing. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const renderWildnessRating = () => {
    return (
      <View style={styles.wildnessContainer}>
        <Text style={styles.wildnessLabel}>Wildness Rating</Text>
        <Text style={styles.wildnessDescription}>
          How remote and natural is your farm? (1 = Very accessible, 5 = Completely wild)
        </Text>
        <View style={styles.wildnessButtons}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.wildnessButton,
                formData.wildnessRating === rating && styles.wildnessButtonSelected
              ]}
              onPress={() => handleWildnessRatingChange(rating)}
            >
              <Text style={[
                styles.wildnessButtonText,
                formData.wildnessRating === rating && styles.wildnessButtonTextSelected
              ]}>
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {(isAdmin() || isFromAdmin) && (
          <TouchableOpacity onPress={() => onNavigate?.('listing-management')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Listings</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Edit Farm Listing</Text>
        <Text style={styles.subtitle}>
          Update your farm listing information
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Farm Title *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="e.g., Green Valley Farm"
            maxLength={100}
            editable={!viewOnly}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={styles.textArea}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe your farm, what makes it special, what campers can expect..."
            multiline
            numberOfLines={4}
            maxLength={1000}
            editable={!viewOnly}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Photos</Text>
          <Text style={styles.amenitiesDescription}>
            Add photos to showcase your property (up to 5 images)
          </Text>
          
          <View style={styles.imageContainer}>
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imageText}>📷 Image {index + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {formData.images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
              >
                <Text style={styles.addImageText}>+ Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Price per Night (£) *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            placeholder="25"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="e.g., Green Valley Farm, Country Lane"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Postcode *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.postcode}
            onChangeText={(value) => handleInputChange('postcode', value)}
            placeholder="e.g., YO1 1AA"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>County *</Text>
          <select
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              backgroundColor: '#F5F5F5',
              marginBottom: '8px',
              color: '#333'
            }}
            value={formData.county}
            onChange={(e) => handleInputChange('county', e.target.value)}
            disabled={viewOnly}
          >
            <option value="">Select County</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Parking Location *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.parkingLocation}
            onChangeText={(value) => handleInputChange('parkingLocation', value)}
            placeholder="e.g., Designated field, Near farm gate, Secure parking area"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cancellation Policy</Text>
          <TextInput
            style={styles.textArea}
            value={formData.cancellationPolicy}
            onChangeText={(value) => handleInputChange('cancellationPolicy', value)}
            placeholder="e.g., Free cancellation up to 24 hours before check-in"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max Guests</Text>
          <View style={styles.guestsRow}>
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => setFormData(prev => ({ ...prev, maxGuests: Math.max(1, prev.maxGuests - 1) }))}
            >
              <Text style={styles.guestButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.guestCount}>{formData.maxGuests}</Text>
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => setFormData(prev => ({ ...prev, maxGuests: prev.maxGuests + 1 }))}
            >
              <Text style={styles.guestButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location Services</Text>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={handleGetCurrentLocation}
          >
            <Text style={styles.locationButtonText}>📍 Get Current Location</Text>
          </TouchableOpacity>
          {formData.coordinates && (
            <Text style={styles.coordinatesText}>
              Coordinates: {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Farm Characteristics</Text>
        {renderWildnessRating()}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amenities *</Text>
        <Text style={styles.amenitiesDescription}>
          Select all amenities available at your farm
        </Text>
        <View style={styles.amenitiesGrid}>
          {availableAmenities.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityChip,
                formData.amenities.includes(amenity) && styles.amenityChipSelected
              ]}
              onPress={() => handleAmenityToggle(amenity)}
            >
              <Text style={[
                styles.amenityText,
                formData.amenities.includes(amenity) && styles.amenityTextSelected
              ]}>
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Restrictions</Text>
        <Text style={styles.amenitiesDescription}>
          Set any restrictions or rules for your farm
        </Text>
        <View style={styles.amenitiesGrid}>
          {availableRestrictions.map((restriction) => (
            <TouchableOpacity
              key={restriction}
              style={[
                styles.amenityChip,
                formData.restrictions.includes(restriction) && styles.amenityChipSelected
              ]}
              onPress={() => handleRestrictionToggle(restriction)}
            >
              <Text style={[
                styles.amenityText,
                formData.restrictions.includes(restriction) && styles.amenityTextSelected
              ]}>
                {restriction}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seasonal Highlights</Text>
        <Text style={styles.amenitiesDescription}>
          What makes your property special in different seasons?
        </Text>
        <View style={styles.amenitiesGrid}>
          {seasonalHighlights.map((season) => (
            <TouchableOpacity
              key={season}
              style={[
                styles.amenityChip,
                formData.seasonalHighlights.includes(season) && styles.amenityChipSelected
              ]}
              onPress={() => handleSeasonalToggle(season)}
            >
              <Text style={[
                styles.amenityText,
                formData.seasonalHighlights.includes(season) && styles.amenityTextSelected
              ]}>
                {season}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Availability Settings</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Available Days</Text>
          <View style={styles.amenitiesGrid}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.amenityChip,
                  formData.availableDays.includes(day) && styles.amenityChipSelected
                ]}
                onPress={() => handleDayToggle(day)}
              >
                <Text style={[
                  styles.amenityText,
                  formData.availableDays.includes(day) && styles.amenityTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Check-in Time</Text>
            <TextInput
              style={styles.textInput}
              value={formData.checkInTime}
              onChangeText={(value) => handleInputChange('checkInTime', value)}
              placeholder="14:00"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Check-out Time</Text>
            <TextInput
              style={styles.textInput}
              value={formData.checkOutTime}
              onChangeText={(value) => handleInputChange('checkOutTime', value)}
              placeholder="11:00"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Blackout Dates</Text>
        <Text style={styles.amenitiesDescription}>
          Block out dates when your farm is not available
        </Text>
        
        <TouchableOpacity style={styles.addBlackoutButton} onPress={handleAddBlackoutDate}>
          <Text style={styles.addBlackoutButtonText}>+ Add Blackout Period</Text>
        </TouchableOpacity>

        {formData.blackoutDates.length > 0 && (
          <View style={styles.blackoutContainer}>
            {formData.blackoutDates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={styles.blackoutChip}
                onPress={() => handleRemoveBlackoutDate(date)}
              >
                <Text style={styles.blackoutText}>{date}</Text>
                <Text style={styles.blackoutRemove}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Blackout Period</Text>
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Start Date (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={selectedStartDate}
                  onChangeText={setSelectedStartDate}
                  placeholder="01/01/2024"
                />
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>End Date (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={selectedEndDate}
                  onChangeText={setSelectedEndDate}
                  placeholder="07/01/2024"
                />
              </View>
            </View>
            <View style={styles.datePickerButtons}>
              <TouchableOpacity style={styles.datePickerButton} onPress={handleConfirmBlackoutDate}>
                <Text style={styles.datePickerButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.datePickerCancelButton} onPress={handleCancelBlackoutDate}>
                <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {viewOnly ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.approveButtonAdmin}
            onPress={async () => {
              if (currentListing) {
                const listingId = currentListing.id;
                const useSupabaseBackend = useSupabase;
                
                try {
                  if (useSupabaseBackend) {
                    await APIService.update('listings', listingId, {
                      status: 'approved',
                      availability: 'available'
                    });
                  } else {
                    const listing = await LocalStorageService.getById('listings', listingId);
                    if (listing) {
                      listing.availability = 'available';
                      await LocalStorageService.save('listings', listing);
                    }
                  }
                  alert('Listing approved successfully!');
                  onNavigate?.('listing-management');
                } catch (error: any) {
                  console.error('Error approving listing:', error);
                  alert(`Failed to approve listing: ${error.message || 'Unknown error'}`);
                }
              }
            }}
          >
            <Text style={styles.approveButtonTextAdmin}>✓ Approve Listing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rejectButtonAdmin}
            onPress={async () => {
              // Prompt for rejection reason
              const rejectionReason = window.prompt('Please provide a reason for rejection and any recommendations for the farmer:');
              
              if (rejectionReason && rejectionReason.trim()) {
                if (currentListing) {
                  const listingId = currentListing.id;
                  const useSupabaseBackend = useSupabase;
                  
                  try {
                    if (useSupabaseBackend) {
                      await APIService.update('listings', listingId, {
                        status: 'rejected',
                        rejection_reason: rejectionReason
                      });
                    } else {
                      const listing = await LocalStorageService.getById('listings', listingId);
                      if (listing) {
                        listing.rejectionReason = rejectionReason;
                        listing.rejectedAt = new Date().toISOString();
                        listing.availability = 'rejected';
                        await LocalStorageService.save('listings', listing);
                      }
                    }
                    
                    alert('Listing rejected. Farmer can see the feedback and resubmit.');
                    onNavigate?.('listing-management');
                  } catch (error: any) {
                    console.error('Error rejecting listing:', error);
                    alert(`Failed to reject listing: ${error.message || 'Unknown error'}`);
                  }
                }
              } else if (rejectionReason !== null) {
                // User pressed OK without entering a reason
                alert('Please provide a reason for rejection. The farmer needs to know why their listing was not approved.');
              }
            }}
          >
            <Text style={styles.rejectButtonTextAdmin}>✕ Reject Listing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.messageButtonAdmin}
            onPress={() => onNavigate?.('messages')}
          >
            <Text style={styles.messageButtonTextAdmin}>💬 Message Farmer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButtonView}
            onPress={() => onNavigate?.('listing-management')}
          >
            <Text style={styles.backButtonTextView}>← Back to Listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Updating...' : 'Update Listing'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => onNavigate?.('listings')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Listing</Text>
          </TouchableOpacity>
        </View>
      )}

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
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  guestCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  wildnessContainer: {
    marginBottom: 16,
  },
  wildnessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  wildnessDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  wildnessButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  wildnessButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wildnessButtonSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  wildnessButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  wildnessButtonTextSelected: {
    color: '#FFFFFF',
  },
  amenitiesDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  amenityChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  amenityText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  amenityTextSelected: {
    color: '#FFFFFF',
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
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButtonAdmin: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonTextAdmin: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButtonAdmin: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonTextAdmin: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageButtonAdmin: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonTextAdmin: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonView: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonTextView: {
    color: '#333',
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
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  addBlackoutButton: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  addBlackoutButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  blackoutContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  blackoutChip: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blackoutText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  blackoutRemove: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  datePickerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerCancelButton: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  datePickerCancelButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
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
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  imageText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
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
  locationButton: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  locationButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
