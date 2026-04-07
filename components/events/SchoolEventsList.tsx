type EventTarget = {
  target_type?: string
  class_id?: string | null
  class?: { name?: string | null } | null
}

export type SchoolEventRow = {
  id: string
  title: string
  description?: string | null
  start_at: string
  end_at?: string | null
  location?: string | null
  targets?: EventTarget[] | null
}

type Variant = 'parent' | 'teacher'

const VARIANT = {
  parent: {
    borderDefault: 'border-emerald-400',
    dayMuted: 'bg-emerald-100',
    dayMutedText: 'text-emerald-700',
    dayMutedMonth: 'text-emerald-500',
    classPill: 'bg-emerald-50 text-emerald-700',
  },
  teacher: {
    borderDefault: 'border-blue-400',
    dayMuted: 'bg-blue-100',
    dayMutedText: 'text-blue-700',
    dayMutedMonth: 'text-blue-500',
    classPill: 'bg-blue-50 text-blue-700',
  },
} as const

export function SchoolEventsList({
  displayEvents,
  filter,
  classIds,
  variant,
  upcomingCount,
  pastCount,
  basePath,
  pastEmptySubtext,
}: {
  displayEvents: SchoolEventRow[]
  filter: 'upcoming' | 'past'
  classIds: string[]
  variant: Variant
  upcomingCount: number
  pastCount: number
  basePath: '/parent/events' | '/teacher/events'
  pastEmptySubtext: string
}) {
  const now = new Date()
  const v = VARIANT[variant]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Événements scolaires</h1>
        <p className="text-gray-500 mt-1">
          {variant === 'teacher'
            ? 'Événements publiés par l&apos;administration pour toute l&apos;école ou vos classes.'
            : 'Actualités et événements de l&apos;école'}
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <a
          href={`${basePath}?filter=upcoming`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          À venir ({upcomingCount})
        </a>
        <a
          href={`${basePath}?filter=past`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Passés ({pastCount})
        </a>
      </div>

      {displayEvents.length > 0 ? (
        <div className="space-y-4">
          {displayEvents.map((event) => {
            const startDate = new Date(event.start_at)
            const endDate = event.end_at ? new Date(event.end_at) : null
            const isToday = startDate.toDateString() === now.toDateString()
            const isThisWeek =
              startDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 && startDate > now
            const targets = event.targets || []
            const targetedClasses = targets
              .filter((t) => t.class_id && classIds.includes(t.class_id))
              .map((t) => t.class?.name)
              .filter(Boolean) as string[]

            const borderLeft = isToday ? 'border-red-500' : isThisWeek ? 'border-amber-400' : v.borderDefault
            const dayBox = isToday ? 'bg-red-100' : isThisWeek ? 'bg-amber-100' : v.dayMuted
            const dayNum = isToday ? 'text-red-700' : isThisWeek ? 'text-amber-700' : v.dayMutedText
            const dayMon = isToday ? 'text-red-500' : isThisWeek ? 'text-amber-500' : v.dayMutedMonth

            return (
              <div
                key={event.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${borderLeft}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${dayBox}`}
                    >
                      <span className={`text-lg font-bold leading-none ${dayNum}`}>
                        {startDate.toLocaleDateString('fr-FR', { day: 'numeric' })}
                      </span>
                      <span className={`text-xs uppercase font-medium mt-0.5 ${dayMon}`}>
                        {startDate.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-900">{event.title}</h3>
                        {isToday && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Aujourd&apos;hui
                          </span>
                        )}
                        {isThisWeek && !isToday && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Cette semaine
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {endDate &&
                            ` → ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                          {' · '}
                          {startDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {event.location}
                          </span>
                        )}
                      </div>

                      {targetedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-xs text-gray-400">Concerne :</span>
                          {targetedClasses.map((cls, i) => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${v.classPill}`}>
                              {cls}
                            </span>
                          ))}
                        </div>
                      ) : targets.length === 0 ? (
                        <span className="text-xs text-gray-400 mt-2 inline-block">Événement général</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">{filter === 'upcoming' ? '📅' : '🗓️'}</div>
          <h3 className="text-sm font-medium text-gray-700">
            {filter === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement passé'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'upcoming'
              ? 'Les prochains événements apparaîtront ici'
              : pastEmptySubtext}
          </p>
        </div>
      )}
    </div>
  )
}
