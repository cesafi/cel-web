import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import CloudinaryService from '@/services/cloudinary';
import {
  CloudinaryUploadOptions,
  CloudinaryTransformationOptions
} from '@/lib/types/cloudinary';

interface CloudinaryState {
  isUploading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  uploadError: string | null;
  updateError: string | null;
  deleteError: string | null;
  uploadSuccess: boolean;
  updateSuccess: boolean;
  deleteSuccess: boolean;
}

export function useCloudinary() {
  const [state, setState] = useState<CloudinaryState>({
    isUploading: false,
    isUpdating: false,
    isDeleting: false,
    uploadError: null,
    updateError: null,
    deleteError: null,
    uploadSuccess: false,
    updateSuccess: false,
    deleteSuccess: false
  });

  const resetState = () => {
    setState({
      isUploading: false,
      isUpdating: false,
      isDeleting: false,
      uploadError: null,
      updateError: null,
      deleteError: null,
      uploadSuccess: false,
      updateSuccess: false,
      deleteSuccess: false
    });
  };

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      options
    }: {
      file: File;
      options?: CloudinaryUploadOptions;
    }) => CloudinaryService.uploadImage(file, options),
    onMutate: () => {
      setState((prev) => ({
        ...prev,
        isUploading: true,
        uploadError: null,
        uploadSuccess: false
      }));
    },
    onSuccess: (result) => {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadSuccess: result.success,
        uploadError: result.success ? null : result.error || 'Upload failed'
      }));
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadError: error.message,
        uploadSuccess: false
      }));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      publicId,
      newFile,
      options
    }: {
      publicId: string;
      newFile: File;
      options?: CloudinaryUploadOptions;
    }) => CloudinaryService.updateImage(publicId, newFile, options),
    onMutate: () => {
      setState((prev) => ({
        ...prev,
        isUpdating: true,
        updateError: null,
        updateSuccess: false
      }));
    },
    onSuccess: (result) => {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        updateSuccess: result.success,
        updateError: result.success ? null : result.error || 'Update failed'
      }));
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        isUpdating: false,
        updateError: error.message,
        updateSuccess: false
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ publicId, options }: { publicId: string; options?: { resourceType?: 'image' | 'video' | 'raw'; invalidate?: boolean } }) =>
      CloudinaryService.deleteImage(publicId, options),
    onMutate: () => {
      setState((prev) => ({
        ...prev,
        isDeleting: true,
        deleteError: null,
        deleteSuccess: false
      }));
    },
    onSuccess: (result) => {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        deleteSuccess: result.success,
        deleteError: result.success ? null : result.error || 'Delete failed'
      }));
    },
    onError: (error: Error) => {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        deleteError: error.message,
        deleteSuccess: false
      }));
    }
  });

  const uploadImage = (
    file: File,
    options?: CloudinaryUploadOptions
  ) => {
    return uploadMutation.mutateAsync({ file, options });
  };

  const updateImage = (
    publicId: string,
    newFile: File,
    options?: CloudinaryUploadOptions
  ) => {
    return updateMutation.mutateAsync({ publicId, newFile, options });
  };

  const deleteImage = (
    publicId: string, 
    options?: { resourceType?: 'image' | 'video' | 'raw'; invalidate?: boolean }
  ) => {
    return deleteMutation.mutateAsync({ publicId, options });
  };

  const getImageUrl = (
    publicId: string,
    transformations?: CloudinaryTransformationOptions
  ): string => {
    return CloudinaryService.getImageUrl(publicId, transformations);
  };

  return {
    // State
    isUploading: state.isUploading,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    uploadError: state.uploadError,
    updateError: state.updateError,
    deleteError: state.deleteError,
    uploadSuccess: state.uploadSuccess,
    updateSuccess: state.updateSuccess,
    deleteSuccess: state.deleteSuccess,
    isLoading: state.isUploading || state.isUpdating || state.isDeleting,
    hasError: !!(state.uploadError || state.updateError || state.deleteError),
    hasSuccess: state.uploadSuccess || state.updateSuccess || state.deleteSuccess,

    // Actions
    uploadImage,
    updateImage,
    deleteImage,
    getImageUrl,
    resetState,

    // Raw mutation objects for advanced usage
    uploadMutation,
    updateMutation,
    deleteMutation
  };
}