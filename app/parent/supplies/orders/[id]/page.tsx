import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InvoiceUploadForm from './InvoiceUploadForm'

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered']

function pendingDesc(hasInvoice: boolean) {
  if (hasInvoice) {
    return "Votre justificatif de paiement a été reçu. L'administration vérifie le paiement avant de marquer la commande comme livrée."
  }
  return "Réglez la facture remise par l'école, puis téléversez une photo ou un scan de cette facture ci-dessous. L'école validera le paiement et passera la commande en « Livrée »."
}

const STATUS_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending:   { label: 'En attente',     color: 'text-amber-600 bg-amber-100 border-amber-300',   icon: '⏳', desc: '' },
  confirmed: { label: 'Confirmée',      color: 'text-blue-600 bg-blue-100 border-blue-300',      icon: '✅', desc: "Votre commande a été prise en charge par l'administration." },
  shipped:   { label: 'En livraison',   color: 'text-purple-600 bg-purple-100 border-purple-300',icon: '🚚', desc: "Votre commande est en cours de livraison." },
  delivered: { label: 'Livrée',         color: 'text-emerald-600 bg-emerald-100 border-emerald-300', icon: '📦', desc: "La commande est marquée livrée : le paiement a été vérifié par l'école." },
  cancelled: { label: 'Annulée',        color: 'text-red-600 bg-red-100 border-red-300',         icon: '❌', desc: "Votre commande a été annulée." },
}

export default async function ParentOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const { data: order } = await db
    .from('supply_orders')
    .select(
      'id, status, total_amount, notes, created_at, updated_at, items, invoice_path, invoice_uploaded_at, student:students(full_name, class:classes(name))'
    )
    .eq('id', id)
    .eq('parent_id', user!.id)
    .maybeSingle()

  if (!order) notFound()

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const meta = STATUS_META[order.status] ?? STATUS_META.pending
  const isCancelled = order.status === 'cancelled'
  const currentStepIdx = STATUS_STEPS.indexOf(order.status)
  const hasInvoice = Boolean((order as { invoice_path?: string | null }).invoice_path)
  const statusNote =
    order.status === 'pending' ? pendingDesc(hasInvoice) : meta.desc
  const uploadDisabled = order.status === 'delivered' || order.status === 'cancelled'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-1 text-sm">
        <Link href="/parent/supplies" className="text-emerald-600 hover:underline">← Fournitures scolaires</Link>
      </div>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Commande #{id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Suivi de commande</h2>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
              style={{ width: currentStepIdx <= 0 ? '0%' : `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            <div className="relative z-10 flex justify-between">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIdx
                const active = i === currentStepIdx
                const sm = STATUS_META[step]
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 w-1/4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-300'} ${active ? 'ring-4 ring-emerald-100' : ''}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs font-medium text-center leading-tight ${active ? 'text-emerald-600' : done ? 'text-gray-700' : 'text-gray-300'}`}>
                      {sm.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 bg-gray-50 rounded-lg px-3 py-2">{statusNote}</p>
        </div>
      )}

      <InvoiceUploadForm
        orderId={order.id}
        existingPath={(order as { invoice_path?: string | null }).invoice_path ?? null}
        disabled={uploadDisabled}
      />

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700 flex items-center gap-2">
          <span className="text-lg">❌</span>
          <span>{meta.desc}</span>
        </div>
      )}

      {/* Child info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">Informations</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Élève</p>
            <p className="font-medium text-gray-900">{(order as any).student?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Classe</p>
            <p className="font-medium text-gray-900">{(order as any).student?.class?.name ?? '—'}</p>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Remarques</p>
              <p className="text-gray-700 italic text-sm">"{order.notes}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Articles commandés ({items.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="text-2xl">{item.icon ?? '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">{item.category} · {item.unit ?? 'unité'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{Number(item.unit_price).toFixed(3)} DT</p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <div className="w-20 text-right">
                <p className="text-sm font-bold text-indigo-600">{(Number(item.unit_price) * item.quantity).toFixed(3)} DT</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-lg font-bold text-indigo-600">{Number(order.total_amount).toFixed(3)} DT</span>
        </div>
      </div>
    </div>
  )
}
