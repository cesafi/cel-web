'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useAllPhotoGallery } from '@/hooks/use-photo-gallery';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  caption: string;
  photographer: string;
}

export default function PhotoGallery() {
  const ref = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch photo gallery data
  const { data: photoGalleryData, isLoading, error } = useAllPhotoGallery();

  // Transform photo gallery data
  const galleryImages: GalleryImage[] = useMemo(() => {
    if (photoGalleryData && Array.isArray(photoGalleryData)) {
      return photoGalleryData.map((item) => ({
        id: item.id,
        src: item.photo_url || '/img/cesafi-banner.jpg',
        alt: item.title,
        caption: item.caption || item.title,
        photographer: item.photo_by || 'Unknown'
      }));
    }
    return [];
  }, [photoGalleryData]);

  // Fallback images
  const fallbackImages: GalleryImage[] = [
    {
      id: 1,
      src: '/img/cesafi-banner.jpg',
      alt: 'CESAFI Esports League',
      caption: 'Celebrating esports excellence in Cebu',
      photographer: 'CEL Media'
    }
  ];

  const displayImages = galleryImages.length > 0 ? galleryImages : fallbackImages;

  // Lightbox navigation
  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev + 1) % displayImages.length : null
    );
  }, [displayImages.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : null
    );
  }, [displayImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, closeLightbox, goToNext, goToPrev]);

  // Masonry layout – distribute images into columns
  const getColumns = (images: GalleryImage[], colCount: number) => {
    const columns: GalleryImage[][] = Array.from({ length: colCount }, () => []);
    images.forEach((img, i) => {
      columns[i % colCount].push(img);
    });
    return columns;
  };

  // Loading state
  if (isLoading) {
    return (
      <section
        ref={ref}
        className="bg-background relative flex min-h-[60vh] items-center justify-center overflow-hidden"
      >
        <div className="text-center">
          <div className="border-primary/30 border-t-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4"></div>
          <p className={`${roboto.className} text-muted-foreground`}>Loading photo gallery...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section
        ref={ref}
        className="bg-background relative flex min-h-[60vh] items-center justify-center overflow-hidden"
      >
        <div className="text-center">
          <h2 className={`${moderniz.className} text-foreground mb-4 text-2xl font-bold`}>
            Photo Gallery Unavailable
          </h2>
          <p className={`${roboto.className} text-muted-foreground`}>
            Unable to load photos at the moment. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  // Calculate the flat index for lightbox from column-based layout
  const getFlatIndex = (image: GalleryImage) => {
    return displayImages.findIndex((img) => img.id === image.id);
  };

  return (
    <>
      <section ref={ref} className="bg-background relative overflow-hidden">
        {/* Header */}
        <div className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`${moderniz.className} mb-2 md:mb-4 text-3xl md:text-4xl leading-tight font-bold text-foreground lg:text-5xl xl:text-6xl`}
            >
              PHOTO
              <br />
              <span className="text-primary">GALLERY</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`${roboto.className} mx-auto max-w-4xl text-sm md:text-xl leading-relaxed text-muted-foreground lg:text-2xl`}
            >
              Capturing the spirit, passion, and excellence of CESAFI.
            </motion.p>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-24 sm:px-6 lg:px-8">
          {/* Mobile: 2 columns, Tablet: 3 columns, Desktop: 3 columns */}
          {/* We render three separate column layouts and show/hide with CSS */}

          {/* 2-col for mobile */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {getColumns(displayImages, 2).map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-3">
                {column.map((image) => (
                  <MasonryItem
                    key={image.id}
                    image={image}
                    onClick={() => openLightbox(getFlatIndex(image))}
                    index={getFlatIndex(image)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* 3-col for tablet and up */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {getColumns(displayImages, 3).map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4">
                {column.map((image) => (
                  <MasonryItem
                    key={image.id}
                    image={image}
                    onClick={() => openLightbox(getFlatIndex(image))}
                    index={getFlatIndex(image)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors duration-200 hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-10">
              <span className={`${roboto.className} rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm`}>
                {selectedIndex + 1} / {displayImages.length}
              </span>
            </div>

            {/* Previous Button */}
            {displayImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}

            {/* Next Button */}
            {displayImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}

            {/* Image */}
            <div
              className="relative flex max-h-[85vh] w-full max-w-5xl flex-col items-center px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full"
              >
                <Image
                  src={displayImages[selectedIndex].src}
                  alt={displayImages[selectedIndex].alt}
                  width={1200}
                  height={800}
                  className="h-auto max-h-[75vh] w-full rounded-lg object-contain"
                />
              </motion.div>

              {/* Image Details */}
              <div className="mt-4 w-full text-center">
                <h3 className={`${roboto.className} text-lg font-bold text-white md:text-xl`}>
                  {displayImages[selectedIndex].alt}
                </h3>
                <p className={`${roboto.className} mt-1 text-sm text-white/70 md:text-base`}>
                  {displayImages[selectedIndex].caption}
                </p>
                <p className={`${roboto.className} mt-2 inline-flex items-center gap-1.5 text-xs text-white/50`}>
                  <Camera className="h-3 w-3" />
                  {displayImages[selectedIndex].photographer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Masonry Item Component ─────────────────────────────────
interface MasonryItemProps {
  image: GalleryImage;
  onClick: () => void;
  index: number;
}

function MasonryItem({ image, onClick, index }: MasonryItemProps) {
  // Vary height based on index for visual interest
  const heightClass = index % 3 === 0
    ? 'aspect-[4/5]'
    : index % 3 === 1
      ? 'aspect-square'
      : 'aspect-[4/3]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.08 }}
      className={`group relative ${heightClass} cursor-pointer overflow-hidden rounded-xl`}
      onClick={onClick}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Info on Hover */}
      <div className="absolute right-0 bottom-0 left-0 translate-y-4 p-3 md:p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <h3
          className={`${roboto.className} text-sm font-semibold text-white md:text-base line-clamp-2`}
        >
          {image.alt}
        </h3>
        <p
          className={`${roboto.className} mt-1 flex items-center gap-1 text-xs text-white/70`}
        >
          <User className="h-3 w-3" />
          {image.photographer}
        </p>
      </div>
    </motion.div>
  );
}
