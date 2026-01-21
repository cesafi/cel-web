export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
}

export interface CloudinaryTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad' | 'pad' | 'lpad' | 'lfill';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif' | 'svg' | 'gif';
  gravity?: 'auto' | 'center' | 'face' | 'faces' | 'north' | 'south' | 'east' | 'west' | 'north_east' | 'north_west' | 'south_east' | 'south_west';
  fetch_format?: string;
  dpr?: string | number;
  flags?: string[];
}

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  api_key?: string;
}

export interface CloudinaryDeleteResult {
  result: 'ok' | 'not found';
  public_id: string;
  resource_type?: string;
  invalidated?: boolean;
  partial?: boolean;
  info?: string;
}

export interface CloudinaryError {
  message: string;
  name: string;
  http_code: number;
}

export interface CloudinaryServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}