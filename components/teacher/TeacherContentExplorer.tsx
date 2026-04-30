'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  contentKindLabel,
  fileNameFromPath,
  formatBytes,
  type ContentKind,
} from '@/lib/pedagogical-content-kind'

export type TeacherContentItem = {
  id: string
  title: string
  description: string | null
  file_path: string | null
  mime_type: string | null
  size_bytes: number | null
  created_at: string
  content_kind?: string | null
  class: { name: string } | null
  kind: ContentKind
  views: number
  downloads: number
}

function getMimeIcon(mime: string | null, kind: ContentKind) {
  if (kind === 'image') return '🖼️'
  if (kind === 'pdf') return '📕'
  if (kind === 'video') return '🎬'
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.includes('pdf')) return '📕'
  if (mime.includes('video')) return '🎬'
  if (mime.includes('audio')) return '🎵'
  return '📄'
}

export function TeacherContentExplorer({
  items,
  deleteAction,
}: {
  items: TeacherContentItem[]
  deleteAction: (formData: FormData) => Promise<void>
}) {
  const [preview, setPreview] = useState<TeacherContentItem | null>(null)

  const previewDetails = useMemo(() => {
    if (!preview) return null
    const mimeLabel = preview.mime_type?.trim() || '—'
    const extKind: ContentKind =
      preview.content_kind &&
      ['pdf', 'video', 'image', 'other'].includes(preview.content_kind)
        ? (preview.content_kind as ContentKind)
        : preview.kind

    const fileName =
      fileNameFromPath(preview.file_path) ||
      (preview.file_path?.startsWith('http') ? 'Lien externe' : null)

    return { fileName, mimeLabel, effectiveKindLabel: contentKindLabel(extKind) }
  }, [preview])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{getMimeIcon(c.mime_type, c.kind)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                  <span className="text-[10px] uppercase tracking-wide shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {contentKindLabel(c.kind)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {c.class?.name && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {c.class.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    <span title="Vues">👁 {c.views}</span>
                    <span title="Téléchargements">⬇ {c.downloads}</span>
                  </span>
                </div>
                {c.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  {formatBytes(c.size_bytes) && (
                    <span>{formatBytes(c.size_bytes)}</span>
                  )}
                  <span>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                  {c.file_path && (
                    <a
                      href={c.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium text-xs"
                    >
                      Ouvrir le fichier
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreview(c)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Aperçu
                  </button>
                  <Link
                    href={`/teacher/content/${c.id}/edit`}
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Modifier
                  </Link>
                  <form action={deleteAction} className="inline ml-auto">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-0 p-0 font-medium text-xs"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && previewDetails ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreview(null)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 rounded-lg p-1"
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="text-4xl mb-3">{getMimeIcon(preview.mime_type, preview.kind)}</div>
            <h2 id="preview-title" className="text-lg font-semibold text-gray-900 pr-8">
              {preview.title}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900 font-medium">{previewDetails.effectiveKindLabel}</dd>
              </div>
              {previewDetails.fileName ? (
                <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                  <dt className="text-gray-500">Fichier / lien</dt>
                  <dd className="text-gray-900 text-right break-all">{previewDetails.fileName}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-gray-500">MIME</dt>
                <dd className="text-gray-900 text-right break-all">{previewDetails.mimeLabel}</dd>
              </div>
              {formatBytes(preview.size_bytes) ? (
                <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                  <dt className="text-gray-500">Taille</dt>
                  <dd className="text-gray-900">{formatBytes(preview.size_bytes)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-gray-500">Classe</dt>
                <dd className="text-gray-900">{preview.class?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-gray-500">Créé le</dt>
                <dd className="text-gray-900">
                  {new Date(preview.created_at).toLocaleString('fr-FR')}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-gray-500">Vues cumulées</dt>
                <dd className="text-gray-900">{preview.views}</dd>
              </div>
              <div className="flex justify-between gap-4 pb-1">
                <dt className="text-gray-500">Téléchargements</dt>
                <dd className="text-gray-900">{preview.downloads}</dd>
              </div>
              {preview.description ? (
                <div className="pt-3">
                  <dt className="text-gray-500 mb-1">Description</dt>
                  <dd className="text-gray-800 whitespace-pre-wrap">{preview.description}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {preview.file_path ? (
                <a
                  href={preview.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Ouvrir le fichier
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
