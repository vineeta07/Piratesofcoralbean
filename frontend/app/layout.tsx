import '../styles/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Sales Deal Intelligence — Coral AI Pipeline',
  description: 'AI-powered sales pipeline risk analysis. Unifies data from Salesforce, Gmail, Gong, Slack, and LinkedIn to surface deal risks and actionable insights.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-slate-900`}>
        {children}
      </body>
    </html>
  )
}