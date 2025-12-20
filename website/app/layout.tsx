import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Focus Circle - Capture & Organize Your Ideas',
  description: 'An ADHD-friendly app for capturing, organizing, and finding ideas using voice recording, text input, and AI-powered categorization.',
  keywords: 'productivity, ideas, voice recording, AI, task management, ADHD-friendly',
  authors: [{ name: 'Professor Cat Limited' }],
  openGraph: {
    title: 'Focus Circle - Capture & Organize Your Ideas',
    description: 'An ADHD-friendly app for capturing, organizing, and finding ideas using voice recording, text input, and AI-powered categorization.',
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

