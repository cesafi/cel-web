import { getCldImageUrl, getCldOgImageUrl } from 'next-cloudinary';
import {
  CloudinaryUploadOptions,
  CloudinaryTransformationOptions,
  CloudinaryUploadResult,
  CloudinaryDeleteResult,
  CloudinaryServiceResponse
} from '@/lib/types/cloudinary';

class CloudinaryService {
  private static cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  private static apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  private static apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;
  static async uploadImage(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryServiceResponse<CloudinaryUploadResult>> {
    try {
      // Get API credentials

      if (!this.apiKey || !this.apiSecret) {
        return {
          success: false,
          error: 'Cloudinary API credentials not found. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables.'
        };
      }

      // Create FormData for signed upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', this.apiKey);

      // Add timestamp for signature
      const timestamp = Math.round(Date.now() / 1000);
      formData.append('timestamp', timestamp.toString());

      // Build parameters for signature - NOTE: api_key should NOT be in signature
      const params: Record<string, string> = {
        timestamp: timestamp.toString()
      };

      // Add folder if specified
      if (options.folder) {
        formData.append('folder', options.folder);
        params.folder = options.folder;
      }

      // Add optional parameters
      if (options.public_id) {
        formData.append('public_id', options.public_id);
        params.public_id = options.public_id;
      }
      
      if (options.overwrite) {
        formData.append('overwrite', 'true');
        params.overwrite = 'true';
      }

      // Sort keys alphabetically and create signature string
      const sortedKeys = Object.keys(params).sort();
      const signatureString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // Create signature using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString + this.apiSecret);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      formData.append('signature', signature);


      // Upload to Cloudinary using signed request
      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error?.message || 'Upload failed'
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  static getImageUrl(
    publicId: string,
    transformations: CloudinaryTransformationOptions = {}
  ): string {
    try {
      // Use next-cloudinary's getCldImageUrl for optimized URL generation
      return getCldImageUrl({
        src: publicId,
        width: transformations.width,
        height: transformations.height,
        crop: transformations.crop,
        quality: transformations.quality,
        format: transformations.format,
        gravity: transformations.gravity
      });
    } catch {
      // Fallback to manual URL construction if next-cloudinary fails
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const transforms = [];

      if (transformations.width) transforms.push(`w_${transformations.width}`);
      if (transformations.height) transforms.push(`h_${transformations.height}`);
      if (transformations.crop) transforms.push(`c_${transformations.crop}`);
      if (transformations.quality) transforms.push(`q_${transformations.quality}`);
      if (transformations.format) transforms.push(`f_${transformations.format}`);
      if (transformations.gravity) transforms.push(`g_${transformations.gravity}`);

      const transformString = transforms.length > 0 ? `${transforms.join(',')}/` : '';

      return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
    }
  }

  static async updateImage(
    publicId: string,
    newFile: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryServiceResponse<CloudinaryUploadResult>> {
    // For updates, we upload with the same public_id and overwrite: true
    const updateOptions = {
      ...options,
      public_id: publicId,
      overwrite: true
    };

    return await this.uploadImage(newFile, updateOptions);
  }

  static async deleteImage(
    publicId: string,
    options: {
      resourceType?: 'image' | 'video' | 'raw';
      invalidate?: boolean;
    } = {}
  ): Promise<CloudinaryServiceResponse<CloudinaryDeleteResult>> {
    try {
      const resourceType = options.resourceType || 'image';
      
      
      // Create FormData for the destroy API call
      const formData = new FormData();
      formData.append('public_id', publicId);
      
      // Add timestamp for signature
      const timestamp = Math.round(Date.now() / 1000);
      formData.append('timestamp', timestamp.toString());
      

      
      if (!this.apiKey || !this.apiSecret) {
        const error = 'Cloudinary API credentials not found. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables.';
        return {
          success: false,
          error
        };
      }
      
      formData.append('api_key', this.apiKey);
      
      // Add optional parameters
      if (options.invalidate) {
        formData.append('invalidate', 'true');
      }
      
      // Generate signature for authentication
      // Build params object for signature (not URLSearchParams to avoid encoding issues)
      const params: Record<string, string> = {
        public_id: publicId,
        timestamp: timestamp.toString()
      };
      
      if (options.invalidate) {
        params.invalidate = 'true';
      }
      
      // Sort keys alphabetically and create string
      const sortedKeys = Object.keys(params).sort();
      const signatureString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      
      // Create signature using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString + this.apiSecret);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      formData.append('signature', signature);
      
      const apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      

      if (!response.ok) {
        return {
          success: false,
          error: result.error?.message || result.message || 'Delete failed'
        };
      }

      return {
        success: true,
        data: {
          result: result.result,
          public_id: publicId,
          resource_type: resourceType,
          invalidated: options.invalidate || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  static getOgImageUrl(
    publicId: string,
    transformations: CloudinaryTransformationOptions = {}
  ): string {
    try {
      // Use next-cloudinary's getCldOgImageUrl for Open Graph images
      return getCldOgImageUrl({
        src: publicId,
        width: transformations.width || 1200,
        height: transformations.height || 630,
        crop: (transformations.crop as 'fill') || 'fill',
        quality: (transformations.quality as 'auto') || 'auto',
        format: (transformations.format as 'jpg') || 'jpg'
      });
    } catch {
      // Fallback to regular image URL
      return this.getImageUrl(publicId, {
        ...transformations,
        width: transformations.width || 1200,
        height: transformations.height || 630,
        crop: transformations.crop || 'fill',
        format: transformations.format || 'jpg'
      });
    }
  }
}


export default CloudinaryService;
