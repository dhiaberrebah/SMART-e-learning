'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Props {
  signOutAction?: () => Promise<void>
}

export default function DashboardNavbar({ signOutAction }: Props) {
  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-indigo-100 shadow-sm flex-shrink-0">
          <Image
            src="/why-almourabi-1.png"
            alt="مدرستي"
            fill
            className="object-cover"
            sizes="32px"
            priority
          />
        </div>
        <span
          dir="rtl"
          lang="ar"
          className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors"
        >
          مدرستي
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="hidden sm:inline">Retour à l&apos;accueil</span>
        </Link>

        {signOutAction && (
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </form>
        )}
      </div>
    </header>
  )
}
