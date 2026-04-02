import type { SupabaseClient } from '@supabase/supabase-js'

type OrderLine = { id?: string; quantity?: number }

function lines(items: unknown): OrderLine[] {
  return Array.isArray(items) ? (items as OrderLine[]) : []
}

/** Diminue le stock catalogue pour chaque ligne (id = supply_catalog.id). */
export async function deductOrderLinesFromStock(db: SupabaseClient, items: unknown) {
  for (const line of lines(items)) {
    if (!line.id || !line.quantity || line.quantity <= 0) continue
    const { data: row } = await db.from('supply_catalog').select('stock_quantity').eq('id', line.id).maybeSingle()
    if (!row) continue
    const next = Math.max(0, Number(row.stock_quantity ?? 0) - line.quantity)
    await db
      .from('supply_catalog')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', line.id)
  }
}

/** Réintègre le stock si une commande livrée est annulée / repassée en autre statut. */
export async function restoreOrderLinesToStock(db: SupabaseClient, items: unknown) {
  for (const line of lines(items)) {
    if (!line.id || !line.quantity || line.quantity <= 0) continue
    const { data: row } = await db.from('supply_catalog').select('stock_quantity').eq('id', line.id).maybeSingle()
    if (!row) continue
    const next = Number(row.stock_quantity ?? 0) + line.quantity
    await db
      .from('supply_catalog')
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq('id', line.id)
  }
}
