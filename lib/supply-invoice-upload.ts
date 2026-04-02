import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { existsSync } from 'fs'

const MAX_BYTES = 10 * 1024 * 1024

const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}

function invoicesDir() {
  return path.join(process.cwd(), 'public', 'uploads', 'supply-invoices')
}

/** Relative web path must stay under /uploads/supply-invoices/ */
export function resolveInvoiceDiskPath(relativeWebPath: string): string | null {
  const normalized = relativeWebPath.replace(/^\//, '')
  if (!normalized.startsWith('uploads/supply-invoices/')) return null
  const full = path.resolve(process.cwd(), 'public', normalized)
  const base = path.resolve(invoicesDir())
  if (!full.startsWith(base)) return null
  return full
}

export async function removeInvoiceFileIfExists(relativeWebPath: string | null | undefined) {
  if (!relativeWebPath) return
  const disk = resolveInvoiceDiskPath(relativeWebPath)
  if (!disk || !existsSync(disk)) return
  await unlink(disk)
}

export async function saveSupplyInvoiceFromFile(
  file: File
): Promise<{ relativePath: string } | { error: string }> {
  if (!file || file.size === 0) return { error: 'Aucun fichier.' }
  if (file.size > MAX_BYTES) return { error: 'Fichier trop volumineux (max 10 Mo).' }
  const ext = ALLOWED[file.type]
  if (!ext) return { error: 'Format non accepté : JPEG, PNG, WebP ou PDF uniquement.' }

  const dir = invoicesDir()
  await mkdir(dir, { recursive: true })
  const name = `${randomBytes(16).toString('hex')}${ext}`
  const diskPath = path.join(dir, name)
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(diskPath, buf)

  return { relativePath: `/uploads/supply-invoices/${name}` }
}
