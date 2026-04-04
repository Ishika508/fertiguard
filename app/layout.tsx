import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'FertiGuard — Smart Fertigation Monitor',
  description: 'Real-time fertigation monitoring and clog mitigation system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        
      </body>
    </html>
  )
}
// app/layout.tsx or your root layout
import { Navbar } from '@/components/navbar'