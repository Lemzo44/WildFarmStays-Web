import { supabase, useSupabase } from '../lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  /**
   * Upload an image file to Supabase Storage
   * @param file - The file to upload
   * @param folder - The folder/bucket to upload to (e.g., 'listings', 'reviews')
   * @param userId - The user ID for organizing files
   * @returns The public URL of the uploaded image
   */
  static async uploadImage(
    file: File,
    folder: 'listings' | 'reviews',
    userId: string
  ): Promise<ImageUploadResult> {
    if (!useSupabase || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured',
      };
    }

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File must be an image',
        };
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'Image size must be less than 5MB',
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${timestamp}-${randomString}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading image:', error);
        return {
          success: false,
          error: error.message || 'Failed to upload image',
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return {
          success: false,
          error: 'Failed to get image URL',
        };
      }

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error: any) {
      console.error('Exception uploading image:', error);
      return {
        success: false,
        error: error?.message || 'Failed to upload image',
      };
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - The public URL of the image to delete
   * @returns Success status
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    if (!useSupabase || !supabase) {
      return false;
    }

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/images/');
      if (urlParts.length < 2) {
        return false;
      }

      const filePath = urlParts[1];
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception deleting image:', error);
      return false;
    }
  }

  /**
   * Create a file input element and trigger file selection
   * Returns a Promise that resolves with the selected file
   */
  static selectImageFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';

      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        document.body.removeChild(input);
        resolve(file);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };

      document.body.appendChild(input);
      input.click();
    });
  }
}

