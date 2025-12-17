import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Revvy In-House Tools',
  description: 'Internal tools for Revvy operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

