'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Youtube, Facebook, Calendar, Trophy, GraduationCap, HeartHandshake, Info, HelpCircle, Mail, Circle, Activity, LucideIcon, Newspaper, Home, Gamepad2, UsersRound, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { roboto } from '@/lib/fonts'
import ThemeSwitcher from '@/components/theme-switcher'
import LiveIndicator from '@/components/live-indicator'
import { useCurrentActiveHeroSection } from '@/hooks/use-hero-section'
import Image from 'next/image'
import { navItems, NavItem } from '@/lib/constants/navigation'
import { RealTimeClock } from '@/components/real-time-clock'

// Icon mapping for navigation items - verifying imports
const iconMap: Record<string, LucideIcon> = {
  'Schedule': Calendar,
  'Standings': Trophy,
  'Schools': GraduationCap,
  'Players': UsersRound,
  'Volunteers': Sparkles,
  'About Us': Info,
  'FAQ': HelpCircle,
  'Contact Us': Mail,
  'Statistics': Activity,
  'Sponsors': HeartHandshake,
  'News': Newspaper,
  'Home': Home
}

// Subtitle mapping for navigation items
const subtitleMap: Record<string, string> = {
  'Schedule': 'View upcoming games & results',
  'Standings': 'Current team rankings',
  'Statistics': 'Player & team stats',
  'Schools': 'Our member institutions',
  'Players': 'Browse all competitors',
  'Volunteers': 'Join the community',
  'About Us': 'Learn about the league',
  'FAQ': 'Frequently asked questions',
  'Contact Us': 'Get in touch with us',
  'Sponsors': 'Supporting organizations',
  'News': 'Latest news and updates',
  'Home': 'Back to homepage'
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
                href="https://www.youtube.com/@cesafiesportsleague"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted/50 transition-colors duration-200"
                aria-label="CESAFI YouTube Channel"
              >
                <Youtube size={18} />
              </a>
              <a
                href="https://www.facebook.com/CesafiEsportsLeague"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-muted/50 transition-colors duration-200"
                aria-label="CESAFI Facebook Page"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@cesafiesportsleague"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-black dark:hover:text-white hover:bg-muted/50 transition-colors duration-200"
                aria-label="CESAFI TikTok"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                </svg>
              </a>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Mobile Right Side - Live Indicator, Theme Switcher & Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <LiveIndicator
              isLive={heroData?.data?.is_active || false}
              liveUrl={heroData?.data?.video_link}
              title="CESAFI Live Stream"
              timeRemaining={heroData?.data?.time_remaining}
              variant="compact"
            />
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
                {/* Header with logo and clock */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/img/cesafi-logo.webp"
                      alt="CESAFI Logo"
                      width={36}
                      height={36}
                      className="w-9 h-9 object-contain"
                    />
                    <div className="flex flex-col">
                      <span className={`${roboto.className} text-sm font-bold text-foreground`}>CESAFI</span>
                      <RealTimeClock className="text-muted-foreground" showIcon={false} showTimezone={false} size="sm" />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Accent gradient bar */}
                <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

                {/* Navigation Links */}
                <div className="flex-1 px-4 py-5 overflow-y-auto">
                  <div className="space-y-1">
                    {navItems.map((item, index) => {
                      const TopLevelIcon = iconMap[item.name] || Circle;
                      return (
                      <div key={item.name}>
                        {item.children ? (
                          <div className="space-y-0.5 mb-3">
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 }}
                              className="px-3 py-2 font-semibold text-muted-foreground/60 text-xs uppercase tracking-widest"
                            >
                              {item.name}
                            </motion.div>
                            <div className="space-y-0.5">
                              {item.children.map((child, childIndex) => {
                                const Icon = iconMap[child.name] || Circle;
                                return (
                                  <motion.div
                                    key={child.name}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.08 + childIndex * 0.04 }}
                                  >
                                    <Link
                                      href={child.href}
                                      onClick={() => setIsMenuOpen(false)}
                                      className={`${roboto.className} flex items-center gap-3 text-foreground hover:text-foreground py-2.5 px-3 rounded-xl hover:bg-muted/50 font-medium transition-all duration-200 group`}
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-200 flex-shrink-0">
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className="text-sm">{child.name}</span>
                                    </Link>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                          >
                            <Link
                              href={item.href!}
                              onClick={() => setIsMenuOpen(false)}
                              className={`${roboto.className} flex items-center gap-3 text-foreground hover:text-foreground py-2.5 px-3 rounded-xl hover:bg-muted/50 font-medium transition-all duration-200 group`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-200 flex-shrink-0">
                                <TopLevelIcon className="w-4 h-4" />
                              </div>
                              <span className="text-sm">{item.name}</span>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>

                {/* Social Links & Branding Footer */}
                <div className="border-t border-border">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 space-y-4"
                  >
                    <p className={`${roboto.className} text-xs font-semibold uppercase tracking-widest text-muted-foreground/60`}>
                      Connect With Us
                    </p>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.youtube.com/@cesafiesportsleague"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-red-500/15 hover:text-red-500 transition-all duration-200"
                        aria-label="CESAFI YouTube Channel"
                      >
                        <Youtube size={18} />
                      </a>
                      <a
                        href="https://www.facebook.com/CesafiEsportsLeague"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-blue-500/15 hover:text-blue-500 transition-all duration-200"
                        aria-label="CESAFI Facebook Page"
                      >
                        <Facebook size={18} />
                      </a>
                      <a
                        href="https://www.tiktok.com/@cesafiesportsleague"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-all duration-200"
                        aria-label="CESAFI TikTok"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                        </svg>
                      </a>
                    </div>
                    <p className={`${roboto.className} text-[11px] text-muted-foreground/50`}>
                      Cebu Schools Athletics Foundation, Inc.
                    </p>
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
