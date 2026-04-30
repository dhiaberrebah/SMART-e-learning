export type RawEventRow = {
  pedagogical_content_id: string
  event_kind: 'view' | 'download'
  created_at: string
}

export type ContentStatsMap = Record<string, { views: number; downloads: number }>

export function aggregateStatsByContent(
  events: RawEventRow[] | null | undefined,
  contentIds: string[]
): ContentStatsMap {
  const map: ContentStatsMap = {}
  for (const id of contentIds) map[id] = { views: 0, downloads: 0 }
  for (const e of events ?? []) {
    const m = map[e.pedagogical_content_id]
    if (!m) continue
    if (e.event_kind === 'view') m.views++
    else if (e.event_kind === 'download') m.downloads++
  }
  return map
}

export function countWeekViews(events: RawEventRow[] | null | undefined, weekStart: Date): number {
  const t0 = weekStart.getTime()
  let n = 0
  for (const e of events ?? []) {
    if (e.event_kind !== 'view') continue
    if (new Date(e.created_at).getTime() >= t0) n++
  }
  return n
}

export function totalDownloads(events: RawEventRow[] | null | undefined): number {
  let n = 0
  for (const e of events ?? []) {
    if (e.event_kind === 'download') n++
  }
  return n
}
