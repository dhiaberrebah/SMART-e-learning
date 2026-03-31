import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

async function updateOrderStatus(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const admin_note = formData.get('admin_note') as string

  await db.from('supply_orders').update({
    status,
    notes: admin_note || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  redirect(`/admin/supplies/orders/${id}?updated=1`)
}

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered']
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
  searchParams: Promise<{ updated?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const db = createServiceClient()

  const { data: order } = await db
    .from('supply_orders')
    .select('id, status, total_amount, notes, created_at, updated_at, items, student:students(full_name, class:classes(name)), parent:profiles!parent_id(full_name, email)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const meta = STATUS_META[order.status] ?? STATUS_META.pending
  const currentStepIdx = STATUS_STEPS.indexOf(order.status)

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

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Progression</h2>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
            <div className="absolute top-4 left-4 h-0.5 bg-indigo-500 z-0 transition-all"
              style={{ width: currentStepIdx <= 0 ? '0%' : `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
            <div className="relative z-10 flex justify-between">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIdx
                const sm = STATUS_META[step]
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 w-1/4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${done ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs font-medium text-center ${done ? 'text-gray-700' : 'text-gray-300'}`}>{sm.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Customer info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Client</h2>
          <div className="space-y-2 text-sm">
            <div><p className="text-xs text-gray-400">Parent</p><p className="font-medium">{(order as any).parent?.full_name ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Email</p><p className="text-gray-600 text-xs">{(order as any).parent?.email ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Élève</p><p className="font-medium">{(order as any).student?.full_name ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">Classe</p><p className="text-gray-600">{(order as any).student?.class?.name ?? '—'}</p></div>
          </div>
        </div>

        {/* Update status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Modifier le statut</h2>
          <form action={updateOrderStatus} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Statut</label>
              <select name="status" defaultValue={order.status}
                className="w-full border border-gray-400 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                {Object.entries(STATUS_META).map(([val, m]) => (
                  <option key={val} value={val}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Note interne</label>
              <textarea name="admin_note" rows={2} defaultValue={order.notes ?? ''}
                placeholder="Commentaire pour le parent…"
                className="w-full border border-gray-400 rounded-lg px-2 py-1.5 text-xs resize-none focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
            </div>
            <button type="submit"
              className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Enregistrer
            </button>
          </form>
        </div>
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
        <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
          <span className="font-semibold text-gray-700 text-sm">Total</span>
          <span className="text-lg font-bold text-indigo-600">{Number(order.total_amount).toFixed(3)} DT</span>
        </div>
      </div>
    </div>
  )
}
