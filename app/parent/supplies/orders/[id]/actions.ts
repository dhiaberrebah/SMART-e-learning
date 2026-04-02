'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { removeInvoiceFileIfExists, saveSupplyInvoiceFromFile } from '@/lib/supply-invoice-upload'

export async function uploadSupplyOrderInvoice(orderId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté.' }

  const db = createServiceClient()
  const { data: order } = await db
    .from('supply_orders')
    .select('id, parent_id, status, invoice_path')
    .eq('id', orderId)
    .maybeSingle()

  if (!order || order.parent_id !== user.id) return { error: 'Commande introuvable.' }
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return { error: 'Cette commande ne peut plus être modifiée.' }
  }

  const file = formData.get('invoice') as File | null
  const saved = await saveSupplyInvoiceFromFile(file as File)
  if ('error' in saved) return { error: saved.error }

  await removeInvoiceFileIfExists(order.invoice_path)

  const { error } = await db
    .from('supply_orders')
    .update({
      invoice_path: saved.relativePath,
      invoice_uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/parent/supplies/orders/${orderId}`)
  revalidatePath('/parent/supplies')
  revalidatePath('/admin/supplies/orders')
  revalidatePath(`/admin/supplies/orders/${orderId}`)
  return { ok: true as const }
}
