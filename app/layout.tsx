import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Security Patrol Tracker',
  description: 'Track security patrols with GPS verification',
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
