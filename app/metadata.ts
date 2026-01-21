import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CESAFI Esports League | We forge legends!',
  description: 'Stay updated with the latest schedule, standings, and stats of the CESAFI Esports League!',
  keywords: [
    'CESAFI Esports League',
    'esports schedule',
    'esports standings',
    'esports stats',
    'CESAFI',
    'gaming tournament',
  ],
  icons: {
    icon: [{ url: 'favicon.ico', href: 'favicon.ico' }],
  },
  openGraph: {
    title: 'CESAFI Esports League',
    description: 'Stay updated with the latest schedule, standings, and stats of the CESAFI Esports League!',
    url: 'https://cesafiesportsleague.com',
    siteName: 'CESAFI Esports League',
    images: [
      {
        url: 'https://cesafiesportsleague.com/banner.jpg',
        width: 1200,
        height: 630,
        alt: 'CESAFI Esports League Banner',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@CESAFIEsports',
    title: 'CESAFI Esports League',
    description: 'Stay updated with the latest schedule, standings, and stats of the CESAFI Esports League!',
    images: ['https://cesafiesportsleague.com/banner.jpg'],
  },
  alternates: {
    canonical: 'https://cesafiesportsleague.com',
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#16166b',
}
