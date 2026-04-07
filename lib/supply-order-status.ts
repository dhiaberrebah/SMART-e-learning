import type { SupabaseClient } from '@supabase/supabase-js'
import { deductOrderLinesFromStock, restoreOrderLinesToStock } from '@/lib/supply-inventory'

type PrevOrder = {
  status: string
  stock_deducted: boolean
  items: unknown
  notes: string | null
}

/**
 * Met à jour statut (+ notes si fourni) avec déduction / restitution de stock à la livraison.
 * Si `notes` est omis, conserve les notes existantes.
 */
export async function patchSupplyOrderStatus(
  db: SupabaseClient,
  orderId: string,
  patch: { status: string; notes?: string | null }
) {
  const { data: prev, error: fetchErr } = await db
    .from('supply_orders')
    .select('status, stock_deducted, items, notes')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchErr || !prev) return { error: fetchErr?.message ?? 'Commande introuvable.' }

  const p = prev as PrevOrder
  const newStatus = patch.status
  const nextNotes = patch.notes !== undefined ? patch.notes : p.notes

  let stock_deducted = Boolean(p.stock_deducted)

  if (newStatus === 'delivered' && p.status !== 'delivered' && !p.stock_deducted) {
    await deductOrderLinesFromStock(db, p.items)
    stock_deducted = true
  } else if (p.status === 'delivered' && newStatus !== 'delivered' && p.stock_deducted) {
    await restoreOrderLinesToStock(db, p.items)
    stock_deducted = false
  }

  const { error } = await db
    .from('supply_orders')
    .update({
      status: newStatus,
      notes: nextNotes,
      stock_deducted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  return { error: error?.message ?? null }
}
