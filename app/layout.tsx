import { moderniz, roboto } from '@/lib/fonts'
import './globals.css'
import { Providers } from '@/components/providers'
export { metadata } from './metadata'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${moderniz.variable} ${roboto.variable} antialiased font-roboto`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
