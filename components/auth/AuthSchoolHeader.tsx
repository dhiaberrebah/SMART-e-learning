'use client'

import Image from 'next/image'

/** Logo + nom d’établissement sur les pages connexion / inscription */
export function AuthSchoolHeader() {
  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      <div className="relative h-[72px] w-[72px] rounded-2xl overflow-hidden bg-white ring-2 ring-indigo-100 shadow-md">
        <Image
          src="/why-almourabi-1.png"
          alt="مدرستي"
          fill
          className="object-cover"
          sizes="72px"
          priority
        />
      </div>
      <p
        dir="rtl"
        lang="ar"
        className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
      >
        مدرستي
      </p>
    </div>
  )
}
