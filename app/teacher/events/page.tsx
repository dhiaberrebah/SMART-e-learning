import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SchoolEventsList, type SchoolEventRow } from '@/components/events/SchoolEventsList'

export default async function TeacherEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const db = createServiceClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: teacherProfile } = await db
    .from('profiles')
    .select('created_at')
    .eq('id', user!.id)
    .maybeSingle()

  const accountSince = teacherProfile?.created_at
    ? new Date(teacherProfile.created_at as string)
    : user?.created_at
      ? new Date(user.created_at)
      : new Date(0)

  const { data: myClasses } = await db.from('classes').select('id').eq('teacher_id', user!.id)

  const classIds = (myClasses?.map((c) => c.id) as string[]) || []

  const { data: allEvents } = await db
    .from('events')
    .select(
      `
      *,
      targets:event_targets(
        target_type,
        class_id,
        class:classes(name)
      )
    `
    )
    .order('start_at', { ascending: false })

  const relevantEvents =
    (allEvents as SchoolEventRow[] | null)?.filter((event) => {
      const targets = event.targets || []
      if (targets.length === 0) return true
      return targets.some((t) => t.class_id && classIds.includes(t.class_id))
    }) || []

  const now = new Date()
  const filter = sp.filter === 'past' ? 'past' : 'upcoming'

  const isPastForAccount = (e: { start_at: string }) => {
    const start = new Date(e.start_at)
    return start < now && start >= accountSince
  }

  const displayEvents =
    filter === 'past'
      ? relevantEvents.filter(isPastForAccount)
      : relevantEvents.filter((e) => new Date(e.start_at) >= now)

  const upcomingCount = relevantEvents.filter((e) => new Date(e.start_at) >= now).length
  const pastCount = relevantEvents.filter(isPastForAccount).length

  return (
    <SchoolEventsList
      displayEvents={displayEvents}
      filter={filter}
      classIds={classIds}
      variant="teacher"
      upcomingCount={upcomingCount}
      pastCount={pastCount}
      basePath="/teacher/events"
      pastEmptySubtext="Aucun événement passé depuis la création de votre compte. Les événements plus anciens ne sont pas affichés."
    />
  )
}
