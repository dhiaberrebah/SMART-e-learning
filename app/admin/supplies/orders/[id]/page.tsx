import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { patchSupplyOrderStatus } from '@/lib/supply-order-status'
import { paymentTypeLabel } from '@/lib/supply-order-labels'

async function quickConfirmOrder(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const db = createServiceClient()
  const { data: row } = await db.from('supply_orders').select('status').eq('id', id).maybeSingle()
  if (!row || row.status !== 'pending') redirect(`/admin/supplies/orders/${id}`)
  const { error } = await patchSupplyOrderStatus(db, id, { status: 'confirmed' })
  if (error) redirect(`/admin/supplies/orders/${id}?err=${encodeURIComponent(error)}`)
  redirect(`/admin/supplies/orders/${id}?updated=1`)
}

async function quickCancelOrder(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const db = createServiceClient()
  const { data: row } = await db.from('supply_orders').select('status').eq('id', id).maybeSingle()
  if (!row || row.status === 'cancelled' || row.status === 'delivered') {
    redirect(`/admin/supplies/orders/${id}`)
  }
  const { error } = await patchSupplyOrderStatus(db, id, { status: 'cancelled' })
  if (error) redirect(`/admin/supplies/orders/${id}?err=${encodeURIComponent(error)}`)
  redirect(`/admin/supplies/orders/${id}?updated=1`)
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'En attente',   color: 'bg-amber-100 text-amber-700 border-amber-300',     icon: '⏳' },
  confirmed: { label: 'Confirmée',    color: 'bg-blue-100 text-blue-700 border-blue-300',        icon: '✅' },
  shipped:   { label: 'En livraison', color: 'bg-purple-100 text-purple-700 border-purple-300',  icon: '🚚' },
  delivered: { label: 'Livrée',       color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: '📦' },
  cancelled: { label: 'Annulée',      color: 'bg-red-100 text-red-600 border-red-300',           icon: '❌' },
}

export default async function AdminOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ updated?: string; err?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const db = createServiceClient()

  const { data: order } = await db
    .from('supply_orders')
    .select(
      'id, status, total_amount, delivery_cost, payment_type, notes, created_at, updated_at, items, invoice_path, invoice_uploaded_at, student:students(full_name, class:classes(name)), parent:profiles!parent_id(full_name, email)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const meta = STATUS_META[order.status] ?? STATUS_META.pending

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-1 text-sm">
        <Link href="/admin/supplies/orders" className="text-indigo-600 hover:underline">← Commandes</Link>
      </div>

      {sp.updated === '1' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mt-3 text-sm text-emerald-800">
          <span>✅</span><span>Commande mise à jour avec succès.</span>
        </div>
      )}
      {sp.err && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3 text-sm text-red-800">
          <span>⚠️</span><span>{sp.err}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Commande #{id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-gray-400 text-sm">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-3 mb-5">
          {order.status === 'pending' && (
            <form action={quickConfirmOrder}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Confirmer la commande
              </button>
            </form>
          )}
          <form action={quickCancelOrder}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border-2 border-red-200 text-red-700 hover:bg-red-50 transition-colors"
            >
              Annuler la commande
            </button>
          </form>
        </div>
      )}

      {order.status === 'pending' && (
        <p className="text-sm text-gray-600 mb-5">
          Validez ou refusez la commande. La livraison et la déduction de stock sont gérées lorsque le parent marque la commande comme livrée.
        </p>
      )}

      <div className="mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400">Parent</p><p className="font-medium">{(order as any).parent?.full_name ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Email</p><p className="text-gray-600 text-xs">{(order as any).parent?.email ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Élève</p><p className="font-medium">{(order as any).student?.full_name ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Classe</p><p className="text-gray-600">{(order as any).student?.class?.name ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Mode de paiement</p><p className="font-medium">{(order as { payment_type?: string }).payment_type ? paymentTypeLabel((order as { payment_type: string }).payment_type) : '—'}</p></div>
            <div><p className="text-xs text-gray-400">Frais de livraison</p><p className="font-medium">{Number((order as { delivery_cost?: number }).delivery_cost ?? 0).toFixed(3)} DT</p></div>
          </div>
          {(order as { notes?: string | null }).notes ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Remarque parent</p>
              <p className="text-sm text-gray-700">{(order as { notes: string }).notes}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Justificatif paiement (fichier local) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-2">Justificatif de paiement (facture parent)</h2>
        {(order as { invoice_path?: string | null }).invoice_path ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Téléversé le{' '}
              {(order as { invoice_uploaded_at?: string | null }).invoice_uploaded_at
                ? new Date((order as { invoice_uploaded_at: string }).invoice_uploaded_at).toLocaleString('fr-FR')
                : '—'}
            </p>
            {(order as { invoice_path: string }).invoice_path.toLowerCase().endsWith('.pdf') ? (
              <a
                href={(order as { invoice_path: string }).invoice_path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
              >
                Ouvrir le PDF →
              </a>
            ) : (
              <a
                href={(order as { invoice_path: string }).invoice_path}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 overflow-hidden max-w-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(order as { invoice_path: string }).invoice_path}
                  alt="Justificatif de paiement"
                  className="w-full h-auto max-h-80 object-contain bg-gray-50"
                />
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Aucun justificatif téléversé par le parent pour l&apos;instant.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Articles ({items.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="text-2xl">{item.icon ?? '📦'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">{item.category} · {item.unit}</p>
              </div>
              <p className="text-sm text-gray-500">{Number(item.unit_price).toFixed(3)} DT × {item.quantity}</p>
              <p className="text-sm font-bold text-indigo-600 w-24 text-right">
                {(Number(item.unit_price) * item.quantity).toFixed(3)} DT
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Sous-total articles</span>
            <span className="font-medium text-gray-900">{Number(order.total_amount).toFixed(3)} DT</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Livraison</span>
            <span className="font-medium text-gray-900">{Number((order as { delivery_cost?: number }).delivery_cost ?? 0).toFixed(3)} DT</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-700 text-sm">Total à payer</span>
            <span className="text-lg font-bold text-indigo-600">
              {(Number(order.total_amount) + Number((order as { delivery_cost?: number }).delivery_cost ?? 0)).toFixed(3)} DT
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
