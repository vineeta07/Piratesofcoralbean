import '../styles/globals.css'

export const metadata = {
  title: 'Sales Deal Intelligence — Coral AI Pipeline',
  description: 'AI-powered sales pipeline risk analysis. Unifies data from Salesforce, Gmail, Gong, Slack, and LinkedIn to surface deal risks and actionable insights.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-900">
        {children}
      </body>
    </html>
  )
}