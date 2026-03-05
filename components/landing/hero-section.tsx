'use client'

import { useCurrentActiveHeroSection } from '@/hooks/use-hero-section'
import { useScroll, motion } from 'framer-motion'
import { useRef } from 'react'
import { Loader2, AlertCircle, ChevronDown, Play } from 'lucide-react'
import Image from 'next/image'
import LazyYouTube from '@/components/ui/lazy-youtube'

interface HeroSectionProps {
  initialData?: { success: boolean; data?: any; error?: string };
}

export default function HeroSection({ initialData }: HeroSectionProps) {
  const ref = useRef(null)
  const _scrollYProgress = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const { data: heroData, isLoading, error } = useCurrentActiveHeroSection(initialData)

  // Determine which video to show
  const isLive = Boolean(heroData?.data?.is_active && heroData?.data?.video_link);
  const videoUrl = heroData?.data?.video_link || '';

  const isYouTube = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/.test(videoUrl);
  const isFacebook = /(?:facebook\.com|fb\.watch)/.test(videoUrl);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null;

  const videoTitle = isLive ? 'CESAFI Live Video' : 'CESAFI Season 25 Trailer';

  // Handle live button click
  const handleLiveClick = () => {
    if (heroData?.data?.video_link) {
      window.open(heroData.data.video_link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <section ref={ref} className="relative h-[calc(100vh-4rem)] overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
            <p className="text-lg">Loading video content...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-yellow-500" />
            <p className="text-lg">Unable to load video content</p>
            <p className="mt-2 text-sm text-gray-400">Using fallback video</p>
          </div>
        </div>
      )}

      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        {isLive && isYouTube && youtubeId ? (
          <div className="absolute inset-0 scale-[2.5] transform sm:scale-[2] md:scale-[1.8] lg:scale-[1.15] xl:scale-108">
            <LazyYouTube
              videoId={youtubeId}
              title={videoTitle}
              autoplay={true}
              muted={false}
              loop={true}
              controls={false}
              showThumbnail={false}
              className="pointer-events-none -top-20 h-screen w-screen scale-[2.5] sm:scale-[2] md:scale-[1.6] lg:scale-[1.15] xl:scale-108"
            />
          </div>
        ) : (
          /* Local Video Loop */
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/banner.jpg"
              className="h-full w-full scale-105 transform object-cover"
            >
              <source src="/videos/hero-loop.mp4" type="video/mp4" />
              <source src="/videos/hero-loop.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>

      {/* Blue gradient overlay for CESAFI branding */}
      <div className="absolute inset-0 bg-hero-gradient opacity-70" />

      {/* Wave Animation - Only for Trailer Video */}
      {!isLive && (
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 w-full overflow-hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 24 150 28"
            height={120}
            preserveAspectRatio="none"
            className="w-full"
          >
            <defs>
              <path id="wave-path" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>

            {/* Wave 1 - Slowest, most transparent */}
            <motion.g
              initial={{ x: 0 }}
              animate={{ x: [0, -40, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <use xlinkHref="#wave-path" x="50" y="3" fill="rgba(3, 29, 67, 0.4)" />
            </motion.g>

            {/* Wave 2 - Medium speed */}
            <motion.g
              initial={{ x: 0 }}
              animate={{ x: [0, -60, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <use xlinkHref="#wave-path" x="50" y="0" fill="rgba(5, 44, 98, 0.6)" />
            </motion.g>

            {/* Wave 3 - Fastest, solid to blend with page content */}
            <motion.g
              initial={{ x: 0 }}
              animate={{ x: [0, -80, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <use xlinkHref="#wave-path" x="50" y="7" className="fill-background" />
            </motion.g>
          </svg>
        </div>
      )}

      {/* Mobile Content - Centered */}
      <div className="relative z-10 flex h-full items-center justify-center p-8 lg:hidden">
        <div className="space-y-8 text-center">
          {/* Giant Floating Animated Logo */}
          <div className="animate-fade-in-up animation-delay-1000 opacity-0">
            <div className="animate-float mx-auto flex h-64 w-64 items-center justify-center p-4 sm:h-80 sm:w-80">
              <Image
                src="/img/cesafi-logo.webp"
                alt="CESAFI Logo"
                width={320}
                height={320}
                className="h-full w-full object-contain drop-shadow-2xl"
              />
            </div>
            <div className="mt-6 space-y-2">
              <h1 className="font-moderniz text-3xl font-black text-white drop-shadow-lg sm:text-4xl">
                CESAFI
                <br />
                <span className="text-white/90">ESPORTS LEAGUE</span>
              </h1>
              <p className="text-base text-white/90 drop-shadow-md sm:text-lg">
                The den of the best esports student athletes
              </p>
            </div>
          </div>

          {/* Watch Live Button - Mobile */}
          {heroData?.data?.is_active && (
            <div className="animate-fade-in-up animation-delay-2000 opacity-0">
              <button
                onClick={handleLiveClick}
                className="font-moderniz mx-auto flex animate-pulse items-center space-x-2 rounded-xl border-2 border-red-500/50 bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-red-700 hover:shadow-red-500/25"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Watch Live</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Content - Centered */}
      <div className="relative z-10 hidden h-full items-center justify-center lg:flex">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Large Centered Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 80, damping: 15 }}
          >
            <div className="animate-float-gentle flex h-56 w-56 items-center justify-center xl:h-64 xl:w-64">
              <Image
                src="/img/cesafi-logo.webp"
                alt="CESAFI Logo"
                width={320}
                height={320}
                className="h-full w-full object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Watch Live Button - Desktop (Live mode) */}
          {isLive ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <button
                onClick={handleLiveClick}
                className="font-moderniz flex animate-pulse items-center space-x-2 rounded-xl border-2 border-red-500/50 bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-red-700 hover:shadow-red-500/25"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Watch Live</span>
              </button>
            </motion.div>
          ) : (
            <>
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="font-moderniz text-7xl font-black text-white drop-shadow-lg xl:text-8xl"
              >
                CESAFI
                <br />
                <span className="text-white/90">ESPORTS LEAGUE</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="text-xl text-white/80 drop-shadow-md xl:text-2xl"
              >
                The den of the best esports student athletes
              </motion.p>
            </>
          )}
        </div>

        {/* Scroll Down Indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          onClick={() => {
            document.getElementById('schools-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 hover:text-white/90 transition-colors duration-300 cursor-pointer"
        >
          <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  )
}
