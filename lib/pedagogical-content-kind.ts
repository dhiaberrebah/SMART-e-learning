export type ContentKind = 'pdf' | 'video' | 'image' | 'other'

export function inferContentKindFromMime(mimeType: string | null | undefined): ContentKind {
  const m = (mimeType ?? '').toLowerCase()
  if (!m) return 'other'
  if (m.includes('pdf') || m === 'application/pdf') return 'pdf'
  if (m.startsWith('video/')) return 'video'
  if (m.startsWith('image/')) return 'image'
  return 'other'
}

export function inferContentKindFromUrl(path: string | null | undefined): ContentKind | null {
  const p = (path ?? '').toLowerCase()
  if (!p) return null
  if (/\.pdf(\?|$)/.test(p)) return 'pdf'
  if (/(\.mp4|\.webm|\.mov|\.ogg|youtube\.com|youtu\.be|vimeo\.com)(\?|$)/.test(p)) return 'video'
  if (/(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.svg)(\?|$)/.test(p)) return 'image'
  return null
}

/** Effective kind for filters: stored content_kind wins, then mime, then URL hint */
export function resolveContentKind(row: {
  content_kind?: string | null
  mime_type?: string | null
  file_path?: string | null
}): ContentKind {
  const ck = row.content_kind as ContentKind | null | undefined
  if (ck === 'pdf' || ck === 'video' || ck === 'image' || ck === 'other') return ck
  const fromMime = inferContentKindFromMime(row.mime_type)
  if (fromMime !== 'other') return fromMime
  const fromUrl = inferContentKindFromUrl(row.file_path)
  return fromUrl ?? 'other'
}

export function contentKindLabel(k: ContentKind): string {
  switch (k) {
    case 'pdf':
      return 'PDF'
    case 'video':
      return 'Vidéo'
    case 'image':
      return 'Image'
    default:
      return 'Autre'
  }
}

export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || Number.isNaN(bytes)) return null
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export function fileNameFromPath(filePath: string | null | undefined): string | null {
  if (!filePath?.trim()) return null
  try {
    if (filePath.startsWith('http')) {
      const u = new URL(filePath)
      const last = u.pathname.split('/').filter(Boolean).pop()
      return last || filePath
    }
  } catch {
    /* ignore */
  }
  const parts = filePath.split(/[/\\]/)
  return parts.filter(Boolean).pop() ?? filePath
}
