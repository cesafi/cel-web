'use client'

import { useCurrentActiveHeroSection } from '@/hooks/use-hero-section'
import { useScroll, motion } from 'framer-motion'
import { useRef } from 'react'
import { Loader2, AlertCircle, ChevronDown, Play } from 'lucide-react'
import Image from 'next/image'
import LazyYouTube from '@/components/ui/lazy-youtube'

export default function HeroSection() {
  const ref = useRef(null)
  const _scrollYProgress = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const { data: heroData, isLoading, error } = useCurrentActiveHeroSection()

  // Fallback video ID (current hardcoded video)
  const FALLBACK_VIDEO_ID = '8Mz9ytswq7E'

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // Determine which video to show
  const isLive = heroData?.data?.is_active && heroData?.data?.video_link

  const videoId = isLive ? getVideoId(heroData?.data?.video_link || '') || FALLBACK_VIDEO_ID : null // No YouTube video ID needed for local loop

  const videoTitle = isLive ? 'CESAFI Live Video' : 'CESAFI Season 25 Trailer'

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
        {isLive && videoId ? (
          <div className="absolute inset-0 scale-[2.5] transform sm:scale-[2] md:scale-[1.8] lg:scale-[1.15] xl:scale-108">
            <LazyYouTube
              videoId={videoId}
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
              <use xlinkHref="#wave-path" x="50" y="7" className="fill-muted" />
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

      {/* Desktop Content - Bottom Left */}
      <div className="relative z-10 hidden h-full items-end justify-start px-8 pt-8 pb-36 lg:flex">
        <div className="mx-auto flex w-full max-w-7xl items-end justify-between space-y-6">
          <div className="space-y-6">
            {/* Floating Animated Logo (Only show in Live mode or if desired) */}
            <div className="animate-fade-in-up animation-delay-1000 opacity-0">
              <div className="animate-float-gentle flex h-32 w-32 items-center justify-center">
                <Image
                  src="/img/cesafi-logo.webp"
                  alt="CESAFI Logo"
                  width={256}
                  height={256}
                  className="h-full w-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Watch Live Button - Desktop */}
            {isLive ? (
              <div className="animate-fade-in-up animation-delay-2000 opacity-0">
                <button
                  onClick={handleLiveClick}
                  className="font-moderniz flex animate-pulse items-center space-x-2 rounded-xl border-2 border-red-500/50 bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-red-700 hover:shadow-red-500/25"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>Watch Live</span>
                </button>
              </div>
            ) : (
              <div className="animate-fade-in-up animation-delay-2000 opacity-0">
                <h1 className="font-moderniz mb-4 text-4xl font-black text-white drop-shadow-lg md:text-6xl">
                  CESAFI
                  <br />
                  <span className="text-white/90">ESPORTS LEAGUE</span>
                </h1>
                <p className="text-lg text-white/90 drop-shadow-md md:text-xl">
                  The den of the best esports student athletes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transform animate-bounce">
        <div className="flex cursor-pointer flex-col items-center text-white/70 transition-colors hover:text-white">
          <span className="mb-2 text-xs font-medium">Scroll</span>
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>
    </section>
  )
}
