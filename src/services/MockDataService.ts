// Mock data for local testing - matches original project
export const MOCK_DATA = {
  users: [
    {
      id: '1',
      email: 'camper@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Camper',
      role: 'camper',
      phone: '+1234567890',
      verified: true,
      subscriptionStatus: 'active',
      subscriptionType: 'monthly',
      subscriptionStartDate: '2024-01-15',
      subscriptionEndDate: '2026-01-15',
      subscriptionRenewalDate: '2026-01-15',
      joinDate: '2024-01-15',
    },
    {
      id: '2',
      email: 'farmer@test.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Farmer',
      role: 'farmer',
      phone: '+1234567891',
      verified: true,
      subscriptionStatus: 'active',
      joinDate: '2024-01-10',
    },
    {
      id: '3',
      email: 'expired@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Expired',
      role: 'camper',
      phone: '+1234567892',
      verified: true,
      subscriptionStatus: 'expired',
      subscriptionType: 'monthly',
      subscriptionStartDate: '2023-12-01',
      subscriptionEndDate: '2024-01-01',
      subscriptionRenewalDate: '2024-01-01',
      joinDate: '2023-12-01',
    },
  ],
  listings: [
    {
      id: '1',
      farmerId: '2',
      title: 'Green Valley Farm',
      description: 'A beautiful farm in the heart of Yorkshire with stunning views and peaceful surroundings.',
      location: 'Yorkshire, UK',
      latitude: 53.8008,
      longitude: -1.5491,
      price: 25,
      pricePerNight: 25,
      maxGuests: 4,
      amenities: ['Parking', 'Toilets', 'Shower', 'Fire Pit', 'BBQ', 'WiFi', 'Electric Hookup'],
      images: ['https://example.com/farm1.jpg'],
      availability: 'available',
      rating: 4.8,
      wildnessRating: 3,
      reviewCount: 12,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
    {
      id: '2',
      farmerId: '2',
      title: 'Sunset Meadows',
      description: 'Peaceful camping spot with amazing sunset views over rolling hills.',
      location: 'Devon, UK',
      latitude: 50.7184,
      longitude: -3.5339,
      price: 30,
      pricePerNight: 30,
      maxGuests: 6,
      amenities: ['Parking', 'Toilets', 'Shower', 'Fire Pit', 'BBQ', 'WiFi', 'Playground'],
      images: ['https://example.com/farm2.jpg'],
      availability: 'available',
      rating: 4.9,
      wildnessRating: 4,
      reviewCount: 8,
      createdAt: '2024-01-12T14:00:00Z',
      updatedAt: '2024-01-12T14:00:00Z',
    },
    {
      id: '3',
      farmerId: '2',
      title: 'Mountain View Farm',
      description: 'High altitude camping with breathtaking mountain views and fresh air.',
      location: 'Scotland, UK',
      latitude: 56.4907,
      longitude: -4.2026,
      price: 35,
      pricePerNight: 35,
      maxGuests: 3,
      amenities: ['Parking', 'Toilets', 'Fire Pit', 'Hiking Trails'],
      images: ['https://example.com/farm3.jpg'],
      availability: 'available',
      rating: 4.7,
      wildnessRating: 5,
      reviewCount: 15,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
    },
  ],
  bookings: [
    {
      id: '1',
      listingId: '1',
      listingTitle: 'Green Valley Farm',
      camperId: '1',
      camperName: 'John Camper',
      farmerId: '2',
      startDate: '2024-11-20',
      endDate: '2024-11-22',
      totalPrice: 50.00,
      status: 'confirmed',
      createdAt: '2024-10-01T10:00:00Z',
      updatedAt: '2024-10-01T10:00:00Z',
    },
    {
      id: '2',
      listingId: '2',
      listingTitle: 'Sunset Meadows',
      camperId: '1',
      camperName: 'John Camper',
      farmerId: '2',
      startDate: '2024-10-01',
      endDate: '2024-10-03',
      totalPrice: 60.00,
      status: 'completed',
      createdAt: '2024-09-15T14:00:00Z',
      updatedAt: '2024-10-03T12:00:00Z',
    },
    {
      id: '3',
      listingId: '3',
      listingTitle: 'Mountain View Farm',
      camperId: '1',
      camperName: 'John Camper',
      farmerId: '2',
      startDate: '2024-12-15',
      endDate: '2024-12-17',
      totalPrice: 70.00,
      status: 'pending',
      createdAt: '2024-10-10T16:00:00Z',
      updatedAt: '2024-10-10T16:00:00Z',
    },
  ],
  reviews: [
    {
      id: '1',
      listingId: '1',
      reviewerId: '1',
      reviewerName: 'John Camper',
      rating: 5,
      comment: 'Amazing farm with beautiful views! The farmer was very welcoming and the facilities were clean.',
      createdAt: '2024-10-05T10:00:00Z',
      updatedAt: '2024-10-05T10:00:00Z',
    },
    {
      id: '2',
      listingId: '2',
      reviewerId: '1',
      reviewerName: 'John Camper',
      rating: 4,
      comment: 'Great location and peaceful atmosphere. The sunset views were incredible!',
      createdAt: '2024-10-04T15:00:00Z',
      updatedAt: '2024-10-04T15:00:00Z',
    },
  ],
  messages: [
    {
      id: '1',
      conversationId: '1-2',
      senderId: '1',
      senderName: 'John Camper',
      receiverId: '2',
      content: 'Hi, I\'m interested in your farm for next weekend. Is it available?',
      timestamp: '2024-10-14T10:00:00Z',
      read: false,
    },
    {
      id: '2',
      conversationId: '1-2',
      senderId: '2',
      senderName: 'Sarah Farmer',
      receiverId: '1',
      content: 'Yes, it\'s available! I\'d be happy to host you.',
      timestamp: '2024-10-14T10:30:00Z',
      read: true,
    },
  ],
  favorites: [
    {
      id: '1',
      userId: '1',
      listingId: '1',
      farmName: 'Green Valley Farm',
      location: 'Yorkshire, UK',
      price: 25,
      rating: 4.8,
      addedDate: '2024-01-20T16:00:00Z',
    },
    {
      id: '2',
      userId: '1',
      listingId: '2',
      farmName: 'Sunset Meadows',
      location: 'Devon, UK',
      price: 30,
      rating: 4.9,
      addedDate: '2024-01-25T12:00:00Z',
    },
  ],
  farmerRatings: [
    {
      id: '1',
      farmerId: '2',
      camperId: '1',
      rating: 5,
      comment: 'Sarah is a wonderful host! Very welcoming and helpful.',
      createdAt: '2024-10-05T10:00:00Z',
    },
  ],
};

// Storage keys
const STORAGE_KEYS = {
  USERS: 'wildstay_users',
  LISTINGS: 'wildstay_listings',
  BOOKINGS: 'wildstay_bookings',
  REVIEWS: 'wildstay_reviews',
  MESSAGES: 'wildstay_messages',
  FAVORITES: 'wildstay_favorites',
  FARMERRATINGS: 'wildstay_farmer_ratings',
  CURRENT_USER: 'wildstay_current_user',
};

// Initialize local storage with mock data
export const initializeLocalStorage = () => {
  try {
    // Check if data already exists
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      // Store mock data
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_DATA.users));
      localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(MOCK_DATA.listings));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_DATA.bookings));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(MOCK_DATA.reviews));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(MOCK_DATA.messages));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(MOCK_DATA.favorites));
      localStorage.setItem(STORAGE_KEYS.FARMERRATINGS, JSON.stringify(MOCK_DATA.farmerRatings));
      console.log('✅ Mock data initialized in local storage');
    }
  } catch (error) {
    console.error('Error initializing mock data:', error);
  }
};

// Force reinitialize local storage with updated mock data
export const forceReinitializeLocalStorage = () => {
  try {
    console.log('🔄 Force reinitializing local storage with updated mock data...');
    
    // Clear all existing data
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.LISTINGS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.FARMERRATINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    // Store updated mock data
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_DATA.users));
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(MOCK_DATA.listings));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_DATA.bookings));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(MOCK_DATA.reviews));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(MOCK_DATA.messages));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(MOCK_DATA.favorites));
    localStorage.setItem(STORAGE_KEYS.FARMERRATINGS, JSON.stringify(MOCK_DATA.farmerRatings));
    
    console.log('✅ Local storage force reinitialized successfully');
  } catch (error) {
    console.error('Error force reinitializing mock data:', error);
  }
};
