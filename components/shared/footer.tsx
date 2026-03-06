import Link from 'next/link'
import Image from 'next/image'
import { moderniz, roboto } from '@/lib/fonts'
import { navItems, NavItem } from '@/lib/constants/navigation'
import { RealTimeClock } from '@/components/real-time-clock'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card text-card-foreground border-border border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-12">
          {/* About Column - Full width on mobile */}
          <div className="col-span-2 lg:col-span-1 space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Image src="/img/cesafi-logo.webp" alt="CESAFI Logo" width={40} height={40} className="h-8 w-8" />
              <span className={`${moderniz.className} text-lg font-bold`}>CESAFI</span>
            </div>
            <p className={`${roboto.className} text-muted-foreground text-sm leading-relaxed`}>
              Cebu Schools Athletic Foundation, Inc. is the central hub for showcasing athletic excellence, academic-driven
              sports, and esports-inspired energy within Cebu&apos;s schools.
            </p>
          </div>

          {/* Navigation Column 1: Season & Community */}
          <div className="text-center md:text-left space-y-6 lg:space-y-8">
            {/* Season */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>Season</h3>
              <ul className="space-y-1.5 lg:space-y-2">
                {navItems.find(i => i.name === 'Season')?.children?.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>Community</h3>
              <ul className="space-y-1.5 lg:space-y-2">
                {navItems.find(i => i.name === 'Community')?.children?.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Column 2: General & Info */}
          <div className="text-center md:text-left space-y-6 lg:space-y-8">
            {/* General */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>General</h3>
              <ul className="space-y-1.5 lg:space-y-2">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    News
                  </Link>
                </li>
              </ul>
            </div>

            {/* Info */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>Info</h3>
              <ul className="space-y-1.5 lg:space-y-2">
                {navItems.find(i => i.name === 'Info')?.children?.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact + Follow Us Column */}
          <div className="col-span-2 sm:col-span-1 space-y-6 text-center md:text-left">
            {/* Contact Section */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>Contact</h3>
              <div className={`${roboto.className} text-muted-foreground space-y-1.5 lg:space-y-2 text-sm`}>
                <p>Email: cesafiesportsleague@gmail.com</p>
                <p>Phone: (+63) 916 389 3780</p>
                <p>Address: Cebu City, Philippines</p>
              </div>
            </div>

            {/* Follow Us Section */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className={`${moderniz.className} text-base lg:text-lg font-bold`}>Follow Us</h3>
              <div className="flex justify-center md:justify-start space-x-3">
                <a
                  href="https://www.youtube.com/@cesafiesportsleague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-red-500 hover:bg-muted transition-all duration-200"
                  aria-label="CESAFI YouTube Channel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <path d="m10 15 5-3-5-3z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/CesafiEsportsLeague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-blue-500 hover:bg-muted transition-all duration-200"
                  aria-label="CESAFI Facebook Page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@cesafiesportsleague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-black dark:hover:text-white hover:bg-muted transition-all duration-200"
                  aria-label="CESAFI TikTok"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                  </svg>
                </a>
              </div>
              <p className={`${roboto.className} text-muted-foreground text-sm text-center md:text-left`}>
                Stay connected with the latest updates, live streams, and highlights.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-border mt-8 sm:mt-12 border-t pt-6 sm:pt-8">
          <div className="flex flex-col items-center justify-between space-y-3 text-center sm:flex-row sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <p className={`${roboto.className} text-muted-foreground text-xs sm:text-sm`}>
                © {currentYear} Cebu Schools Athletic Foundation, Inc. All rights reserved.
              </p>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <RealTimeClock className="text-muted-foreground" showIcon={true} showTimezone={false} size="sm" />
            </div>
            <div className="flex space-x-6">
              <Link
                href="/privacy-policy"
                className={`${roboto.className} text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className={`${roboto.className} text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors`}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
