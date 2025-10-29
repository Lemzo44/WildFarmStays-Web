import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

export interface Favorite {
  id: string;
  userId: string; // Maps to camper_id in schema
  listingId: string;
  // Extended fields (fetched from listing)
  farmName?: string;
  location?: string;
  rating?: number;
  price?: number;
  image?: string;
  addedDate: string;
}

export class FavoritesService {
  // Add a listing to favorites
  static async addToFavorites(userId: string, listing: any): Promise<{success: boolean, message?: string, favorite?: Favorite}> {
    try {
      if (useSupabase) {
        // Check if already in favorites
        const isAlreadyFavorite = await this.isFavorite(userId, listing.id);
        if (isAlreadyFavorite) {
          return { success: false, message: 'Already in favorites' };
        }

        // Map to Supabase schema
        const supabaseFavoriteData = {
          camper_id: userId,
          listing_id: listing.id,
        };

        const created = await APIService.create('favorites', supabaseFavoriteData);
        
        const favorite: Favorite = {
          id: created.id,
          userId: created.camper_id || created.userId || userId,
          listingId: created.listing_id || created.listingId || listing.id,
          farmName: listing.title || listing.farmName,
          location: listing.location,
          rating: listing.rating,
          price: listing.price || listing.price_per_night,
          image: listing.images?.[0] || listing.image || '',
          addedDate: created.created_at || created.addedDate || new Date().toISOString(),
        };
        
        console.log('✅ Added to favorites:', favorite);
        return { success: true, favorite };
      } else {
        // Check if already in favorites
        const existingFavorites = await LocalStorageService.getAll('favorites');
        const alreadyFavorited = existingFavorites.find(
          (fav: Favorite) => fav.userId === userId && fav.listingId === listing.id
        );

        if (alreadyFavorited) {
          return { success: false, message: 'Already in favorites' };
        }

        // Create favorite entry
        const favoriteData: Favorite = {
          id: Date.now().toString(),
          userId,
          listingId: listing.id,
          farmName: listing.title,
          location: listing.location,
          rating: listing.rating,
          price: listing.price,
          image: listing.images?.[0] || '',
          addedDate: new Date().toISOString(),
        };

        await LocalStorageService.save('favorites', favoriteData);
        console.log('✅ Added to favorites:', favoriteData);
        
        return { success: true, favorite: favoriteData };
      }
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return { success: false, message: 'Failed to add to favorites' };
    }
  }

  // Remove a listing from favorites
  static async removeFromFavorites(userId: string, listingId: string): Promise<{success: boolean, message?: string}> {
    try {
      if (useSupabase) {
        // Find the favorite by camper_id and listing_id
        const favorites = await APIService.get('favorites', {
          filter: { column: 'camper_id', operator: 'eq', value: userId }
        });
        
        const favoriteToRemove = favorites.find((fav: any) => 
          (fav.listing_id || fav.listingId) === listingId
        );

        if (!favoriteToRemove) {
          return { success: false, message: 'Not in favorites' };
        }

        await APIService.delete('favorites', favoriteToRemove.id);
        console.log('✅ Removed from favorites');
        
        return { success: true };
      } else {
        const favorites = await LocalStorageService.getAll('favorites');
        const favoriteToRemove = favorites.find(
          (fav: Favorite) => fav.userId === userId && fav.listingId === listingId
        );

        if (!favoriteToRemove) {
          return { success: false, message: 'Not in favorites' };
        }

        await LocalStorageService.delete('favorites', favoriteToRemove.id);
        console.log('✅ Removed from favorites:', favoriteToRemove);
        
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      return { success: false, message: 'Failed to remove from favorites' };
    }
  }

  // Check if a listing is in user's favorites
  static async isFavorite(userId: string, listingId: string): Promise<boolean> {
    try {
      if (useSupabase) {
        const favorites = await APIService.get('favorites', {
          filter: { column: 'camper_id', operator: 'eq', value: userId }
        });
        
        return favorites.some((fav: any) => 
          (fav.listing_id || fav.listingId) === listingId
        );
      } else {
        const favorites = await LocalStorageService.getAll('favorites');
        return favorites.some((fav: Favorite) => fav.userId === userId && fav.listingId === listingId);
      }
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return false;
    }
  }

  // Get all favorites for a user
  static async getUserFavorites(userId: string): Promise<Favorite[]> {
    try {
      if (useSupabase) {
        const favorites = await APIService.get('favorites', {
          filter: { column: 'camper_id', operator: 'eq', value: userId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        return favorites.map((fav: any) => ({
          id: fav.id,
          userId: fav.camper_id || fav.userId || userId,
          listingId: fav.listing_id || fav.listingId,
          addedDate: fav.created_at || fav.addedDate || '',
        }));
      } else {
        const favorites = await LocalStorageService.getAll('favorites');
        return favorites.filter((fav: Favorite) => fav.userId === userId);
      }
    } catch (error) {
      console.error('❌ Error getting user favorites:', error);
      return [];
    }
  }

  // Get favorite listings with full listing data
  static async getFavoriteListings(userId: string): Promise<any[]> {
    try {
      const favorites = await this.getUserFavorites(userId);
      const useSupabaseBackend = useSupabase;
      
      let listings: any[] = [];
      if (useSupabaseBackend) {
        // Fetch all listings and filter to favorites
        const allListings = await APIService.get('listings', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize listings
        listings = allListings.map((listing: any) => ({
          ...listing,
          farmerId: listing.farmer_id || listing.farmerId,
          maxGuests: listing.max_guests || listing.maxGuests,
          pricePerNight: listing.price_per_night || listing.price,
          wildnessRating: listing.wildness_rating || listing.wildnessRating,
        }));
      } else {
        listings = await LocalStorageService.getAll('listings');
      }
      
      // Map favorites to full listing data
      const favoriteListings = favorites.map(favorite => {
        const listing = listings.find((l: any) => l.id === favorite.listingId);
        if (!listing) return null;
        
        return {
          ...favorite,
          listing: listing,
          // Keep favorite metadata
          addedDate: favorite.addedDate,
          // Include listing details
          farmName: listing.title || favorite.farmName,
          location: listing.location || favorite.location,
          rating: listing.rating || favorite.rating,
          price: listing.price || listing.price_per_night || favorite.price,
          image: listing.images?.[0] || listing.image || favorite.image,
        };
      }).filter(item => item !== null); // Only include favorites with valid listings

      return favoriteListings;
    } catch (error) {
      console.error('❌ Error getting favorite listings:', error);
      return [];
    }
  }

  // Get favorite listings with details (alias for compatibility)
  static async getFavoriteListingsWithDetails(userId: string): Promise<any[]> {
    return this.getFavoriteListings(userId);
  }

  // Toggle favorite status (add if not favorite, remove if favorite)
  static async toggleFavorite(userId: string, listing: any): Promise<{success: boolean, message?: string, favorite?: Favorite}> {
    try {
      const isFavorited = await this.isFavorite(userId, listing.id);
      
      if (isFavorited) {
        return await this.removeFromFavorites(userId, listing.id);
      } else {
        return await this.addToFavorites(userId, listing);
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      return { success: false, message: 'Failed to toggle favorite' };
    }
  }
}

export default FavoritesService;



