'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { patchSupplyOrderStatus } from '@/lib/supply-order-status'

const CANCELABLE = new Set(['pending', 'confirmed', 'shipped'])

export async function parentCancelSupplyOrder(orderId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  const db = createServiceClient()
  const { data: row } = await db
    .from('supply_orders')
    .select('id, parent_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!row || row.parent_id !== user.id) return { error: 'Commande introuvable.' }
  if (!CANCELABLE.has(row.status)) {
    return { error: 'Cette commande ne peut plus être annulée.' }
  }

  const { error } = await patchSupplyOrderStatus(db, orderId, { status: 'cancelled' })
  if (error) return { error }

  revalidatePath('/parent/supplies')
  revalidatePath(`/parent/supplies/orders/${orderId}`)
  revalidatePath('/admin/supplies/orders')
  revalidatePath(`/admin/supplies/orders/${orderId}`)
  return { ok: true as const }
}

export async function parentMarkSupplyOrderDelivered(orderId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  const db = createServiceClient()
  const { data: row } = await db
    .from('supply_orders')
    .select('id, parent_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (!row || row.parent_id !== user.id) return { error: 'Commande introuvable.' }
  if (row.status === 'delivered' || row.status === 'cancelled') {
    return { error: 'Cette commande est déjà livrée ou annulée.' }
  }

  const { error } = await patchSupplyOrderStatus(db, orderId, { status: 'delivered' })
  if (error) return { error }

  revalidatePath('/parent/supplies')
  revalidatePath(`/parent/supplies/orders/${orderId}`)
  revalidatePath('/admin/supplies/orders')
  revalidatePath(`/admin/supplies/orders/${orderId}`)
  return { ok: true as const }
}
