'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Youtube, Facebook, Calendar, Trophy, GraduationCap, HeartHandshake, Info, HelpCircle, Mail, Circle, Activity, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { roboto } from '@/lib/fonts'
import ThemeSwitcher from '@/components/theme-switcher'
import LiveIndicator from '@/components/live-indicator'
import { useCurrentActiveHeroSection } from '@/hooks/use-hero-section'
import Image from 'next/image'
import { navItems, NavItem } from '@/lib/constants/navigation'
import { RealTimeClock, CompactClock } from '@/components/real-time-clock'

// Icon mapping for navigation items - verifying imports
const iconMap: Record<string, LucideIcon> = {
  'Schedule': Calendar,
  'Standings': Trophy,
  'Schools': GraduationCap,
  'Volunteers': HeartHandshake,
  'About Us': Info,
  'FAQ': HelpCircle,
  'Contact Us': Mail,
  'Statistics': Activity,
}

// Subtitle mapping for navigation items
const subtitleMap: Record<string, string> = {
  'Schedule': 'View upcoming games & results',
  'Standings': 'Current team rankings',
  'Statistics': 'Player & team stats',
  'Schools': 'Our member institutions',
  'Volunteers': 'Join the community',
  'About Us': 'Learn about the league',
  'FAQ': 'Frequently asked questions',
  'Contact Us': 'Get in touch with us',
}

// Custom Dropdown Component
function NavDropdown({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        className={`${roboto.className} px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 font-medium flex items-center gap-1.5 outline-none group-hover:text-foreground group-hover:bg-muted/50`}
        aria-expanded={isOpen}
      >
        {item.name}
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} // Cubic bezier for smooth easing
            className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden z-50 ring-1 ring-black/5"
          >
            <div className="flex flex-col gap-1">
              {item.children?.map((child) => {
                const Icon = iconMap[child.name] || Circle;
                const subtitle = subtitleMap[child.name];
                
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className="group flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-all duration-200"
                  >
                    <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`${roboto.className} text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200`}>
                        {child.name}
                      </span>
                      {subtitle && (
                        <span className={`${roboto.className} text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200 line-clamp-1`}>
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: heroData } = useCurrentActiveHeroSection()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-lg border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/img/cesafi-logo.webp"
              alt="CESAFI Logo"
              width={80}
              height={80}
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-1">
            {navItems.map((item) =>
              item.children ? (
                <NavDropdown key={item.name} item={item} />
              ) : (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={`${roboto.className} px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium`}
                >
                  {item.name}
                </Link>
              ),
            )}
          </div>

          {/* Right Side - Desktop: Clock, Live Indicator & Theme Switcher */}
          <div className="hidden lg:flex items-center space-x-4">
            <RealTimeClock className="text-muted-foreground" showIcon={true} showTimezone={false} size="sm" />
            <div className="w-px h-6 bg-border" />
            <LiveIndicator
              isLive={heroData?.data?.is_active || false}
              liveUrl={heroData?.data?.video_link}
              title="CESAFI Live Stream"
              timeRemaining={heroData?.data?.time_remaining}
              variant="navbar"
            />
            <div className="flex items-center space-x-1">
              <a
                href="https://www.youtube.com/@CESAFIOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted/50 transition-colors duration-200"
                aria-label="CESAFI YouTube Channel"
              >
                <Youtube size={18} />
              </a>
              <a
                href="https://www.facebook.com/thecesafi"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-muted/50 transition-colors duration-200"
                aria-label="CESAFI Facebook Page"
              >
                <Facebook size={18} />
              </a>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Mobile Right Side - Clock, Live Indicator, Theme Switcher & Menu Button */}
          <div className="flex lg:hidden items-center space-x-3">
            <CompactClock className="text-muted-foreground" />
            <LiveIndicator
              isLive={heroData?.data?.is_active || false}
              liveUrl={heroData?.data?.video_link}
              title="CESAFI Live Stream"
              timeRemaining={heroData?.data?.time_remaining}
              variant="compact"
            />
            <a
              href="https://www.youtube.com/@CESAFIOfficial"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
              aria-label="CESAFI YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href="https://www.facebook.com/cesikilig"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
              aria-label="CESAFI Facebook"
            >
              <Facebook size={18} />
            </a>
            <ThemeSwitcher />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed top-0 left-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 h-screen w-80 bg-background border-l border-border shadow-2xl z-[70]"
            >
              <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/img/cesafi-logo.webp"
                      alt="CESAFI Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-6 py-8 overflow-y-auto">
                  <div className="space-y-2">
                    {navItems.map((item, index) => (
                      <div key={item.name}>
                        {item.children ? (
                          <div className="space-y-1">
                            <div className="px-4 py-2 font-semibold text-muted-foreground/70 text-sm uppercase tracking-wider">
                              {item.name}
                            </div>
                            <div className="pl-4 space-y-1">
                              {item.children.map((child, childIndex) => (
                                <motion.div
                                  key={child.name}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 + childIndex * 0.05 }}
                                >
                                  <Link
                                    href={child.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`${roboto.className} flex items-center space-x-3 text-foreground hover:text-foreground py-3 px-4 rounded-xl hover:bg-muted/50 font-medium transition-all duration-200 group`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors duration-200" />
                                    <span className="text-lg">{child.name}</span>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Link
                              href={item.href!}
                              onClick={() => setIsMenuOpen(false)}
                              className={`${roboto.className} flex items-center space-x-3 text-foreground hover:text-foreground py-4 px-4 rounded-xl hover:bg-muted/50 font-medium transition-all duration-200 group`}
                            >
                              <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors duration-200" />
                              <span className="text-lg">{item.name}</span>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer - Optional branding or info */}
                <div className="p-6 border-t border-border">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Cebu Schools Athletics Foundation, Inc.
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
