import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Focus Circle - Stay Focused. Get More Done.',
  description: 'Eliminate distractions and reclaim hours of deep work every week with Focus Circle.',
  keywords: 'productivity, ideas, voice recording, AI, task management, ADHD-friendly',
  authors: [{ name: 'Professor Cat Limited' }],
  openGraph: {
    title: 'Focus Circle - Stay Focused. Get More Done.',
    description: 'Eliminate distractions and reclaim hours of deep work every week with Focus Circle.',
    type: 'website',
  },
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
