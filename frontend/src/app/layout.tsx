import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CardioScan — Heart Attack Risk Prediction',
  description: 'AI-powered cardiovascular risk assessment using XGBoost + Random Forest + KNN ensemble',
  keywords: 'heart attack prediction, cardiovascular risk, AI medical, CardioScan',
  openGraph: {
    title: 'CardioScan — Heart Attack Risk Prediction',
    description: 'Advanced ML ensemble model for cardiac risk assessment',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
