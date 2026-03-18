import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WSProvider } from '@/components/WSProvider'
import { ConnectionIndicator } from '@/components/ConnectionIndicator'
import Link from 'next/link'
import { Code2 } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoalDigger · Live Sports',
  description: 'Real-time sports scores and commentary',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <WSProvider>
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl">⚽</span>
                <span className="font-black text-gray-900 tracking-tight text-lg">
                  Goal<span className="text-emerald-500">Digger</span>
                </span>
              </Link>

              <div className="flex items-center gap-3">
                <ConnectionIndicator />
                <Link
                  href="/dev"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                  title="Dev Panel"
                >
                  <Code2 size={14} />
                </Link>
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
        </WSProvider>
      </body>
    </html>
  )
}
