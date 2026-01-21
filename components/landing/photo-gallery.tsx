'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Camera, X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { useAllPhotoGallery } from '@/hooks/use-photo-gallery';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  caption: string;
}

export default function PhotoGallery() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Fetch photo gallery data
  const { data: photoGalleryData, isLoading, error } = useAllPhotoGallery();

  // Transform photo gallery data to match component format
  const galleryImages: GalleryImage[] = useMemo(() => {
    if (photoGalleryData && Array.isArray(photoGalleryData)) {
      return photoGalleryData.map((item) => ({
        id: item.id,
        src: item.photo_url || '/img/cesafi-banner.jpg',
        alt: item.title,
        category: item.category || 'General',
        caption: item.caption || item.title
      }));
    }
    return [];
  }, [photoGalleryData]);

  // Fallback images if no data is available
  const fallbackImages: GalleryImage[] = [
    {
      id: 1,
      src: '/img/cesafi-banner.jpg',
      alt: 'CESAFI Sports Excellence',
      category: 'General',
      caption: 'Celebrating athletic excellence in Cebu'
    }
  ];

  const displayImages = galleryImages.length > 0 ? galleryImages : fallbackImages;

  // Auto-play functionality
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-advance slides when playing
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(nextSlide, 4000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, nextSlide]);

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <section
        ref={ref}
        className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        <div className="text-center">
          <div className="border-primary/30 border-t-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4"></div>
          <p className={`${roboto.className} text-muted-foreground`}>Loading photo gallery...</p>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section
        ref={ref}
        className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden"
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

  return (
    <section ref={ref} className="bg-background relative min-h-screen overflow-hidden">
      {/* Header */}
      <motion.div style={{ y, opacity }} className="absolute top-0 right-0 left-0 z-20 pt-16 md:pt-20 pb-4 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className={`${moderniz.className} mb-2 md:mb-4 text-3xl md:text-4xl leading-tight font-bold text-white drop-shadow-2xl lg:text-5xl xl:text-6xl`}
          >
            PHOTO
            <br />
            <span className="text-primary">GALLERY</span>
          </h2>
          <p
            className={`${roboto.className} mx-auto max-w-4xl text-sm md:text-xl leading-relaxed text-white/90 drop-shadow-lg lg:text-2xl`}
          >
            Capturing the spirit, passion, and excellence of CESAFI.
          </p>
        </div>
      </motion.div>

      {/* Full-Screen Carousel */}
      <div className="relative h-screen w-full">
        {/* Main Image Display */}
        <div className="relative h-full w-full">
          {displayImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: index === currentIndex ? 1 : 0,
                scale: index === currentIndex ? 1 : 1.1
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === currentIndex}
              />

              {/* Gradient Overlay - Stronger for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Image Info - Positioned above thumbnails */}
              <div className="absolute right-0 bottom-28 md:bottom-36 left-0 p-4 md:p-8 lg:p-12">
                <div className="mx-auto max-w-4xl">
                  {/* Info Container with backdrop for guaranteed readability */}
                  <div className="inline-block rounded-xl px-4 md:px-6 py-3 md:py-4">
                    <div className="mb-2 md:mb-3">
                      <span
                        className={`${roboto.className} bg-primary text-primary-foreground rounded-full px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold tracking-wide uppercase`}
                      >
                        {image.category}
                      </span>
                    </div>
                    <h3
                      className={`${roboto.className} mb-1 md:mb-2 text-lg md:text-2xl leading-tight font-bold text-white lg:text-3xl xl:text-4xl`}
                    >
                      {image.alt}
                    </h3>
                    <p
                      className={`${roboto.className} text-sm md:text-base leading-relaxed text-white/90 lg:text-lg`}
                    >
                      {image.caption}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-0 flex items-center justify-between p-4 md:p-8 lg:p-12 pointer-events-none">
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="rounded-full bg-black/30 p-2 md:p-4 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/50 pointer-events-auto"
          >
            <ChevronLeft className="h-5 w-5 md:h-8 md:w-8" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="rounded-full bg-black/30 p-2 md:p-4 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/50 pointer-events-auto"
          >
            <ChevronRight className="h-5 w-5 md:h-8 md:w-8" />
          </button>
        </div>

        {/* Play/Pause Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <button
            onClick={togglePlay}
            className="rounded-full bg-black/30 p-4 md:p-6 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/50"
          >
            {isPlaying ? <Pause className="h-6 w-6 md:h-8 md:w-8" /> : <Play className="h-6 w-6 md:h-8 md:w-8" />}
          </button>
        </div>

        {/* Thumbnail Navigation - with background container */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 transform">
          <div className="flex gap-2 md:gap-3 rounded-xl bg-black/40 p-1.5 md:p-2 backdrop-blur-sm">
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-10 w-10 md:h-16 md:w-16 lg:h-20 lg:w-20 overflow-hidden rounded-lg transition-all duration-300 ${
                  index === currentIndex
                    ? 'ring-primary scale-105 ring-2'
                    : 'opacity-70 hover:scale-105 hover:opacity-100'
                }`}
              >
                <Image src={image.src} alt={image.alt} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Slide Counter */}
        <div className="absolute top-8 right-8">
          <div className="rounded-full bg-black/30 px-4 py-2 text-white backdrop-blur-sm">
            <span className={`${roboto.className} text-sm font-medium`}>
              {currentIndex + 1} / {displayImages.length}
            </span>
          </div>
        </div>

        {/* Click to View Full Size - hidden on mobile */}
        <div className="hidden md:block absolute right-8 bottom-8">
          <button
            onClick={() => openLightbox(displayImages[currentIndex])}
            className="flex items-center gap-2 rounded-full bg-black/30 px-6 py-3 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-black/50"
          >
            <Camera className="h-5 w-5" />
            <span className={`${roboto.className} text-sm font-medium`}>View Full Size</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-h-[90vh] w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-3 text-white transition-colors duration-200 hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="relative">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                width={1200}
                height={800}
                className="h-auto max-h-[80vh] w-full rounded-lg object-contain"
              />

              {/* Image Info */}
              <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className={`${roboto.className} mb-2 text-2xl font-bold text-white`}>
                  {selectedImage.alt}
                </h3>
                <p className={`${roboto.className} text-lg text-white/80`}>
                  {selectedImage.caption}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
