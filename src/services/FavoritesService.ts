import { LocalStorageService } from './LocalStorageService';

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  farmName: string;
  location: string;
  rating: number;
  price: number;
  image: string;
  addedDate: string;
}

export class FavoritesService {
  // Add a listing to favorites
  static async addToFavorites(userId: string, listing: any): Promise<{success: boolean, message?: string, favorite?: Favorite}> {
    try {
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
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return { success: false, message: 'Failed to add to favorites' };
    }
  }

  // Remove a listing from favorites
  static async removeFromFavorites(userId: string, listingId: string): Promise<{success: boolean, message?: string}> {
    try {
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
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      return { success: false, message: 'Failed to remove from favorites' };
    }
  }

  // Check if a listing is in user's favorites
  static async isFavorite(userId: string, listingId: string): Promise<boolean> {
    try {
      const favorites = await LocalStorageService.getAll('favorites');
      return favorites.some((fav: Favorite) => fav.userId === userId && fav.listingId === listingId);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return false;
    }
  }

  // Get all favorites for a user
  static async getUserFavorites(userId: string): Promise<Favorite[]> {
    try {
      const favorites = await LocalStorageService.getAll('favorites');
      return favorites.filter((fav: Favorite) => fav.userId === userId);
    } catch (error) {
      console.error('❌ Error getting user favorites:', error);
      return [];
    }
  }

  // Get favorite listings with full listing data
  static async getFavoriteListings(userId: string): Promise<any[]> {
    try {
      const favorites = await this.getUserFavorites(userId);
      const listings = await LocalStorageService.getAll('listings');
      
      // Map favorites to full listing data
      const favoriteListings = favorites.map(favorite => {
        const listing = listings.find((l: any) => l.id === favorite.listingId);
        return {
          ...favorite,
          listing: listing,
          // Keep favorite metadata
          addedDate: favorite.addedDate,
        };
      }).filter(item => item.listing); // Only include favorites with valid listings

      return favoriteListings;
    } catch (error) {
      console.error('❌ Error getting favorite listings:', error);
      return [];
    }
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



