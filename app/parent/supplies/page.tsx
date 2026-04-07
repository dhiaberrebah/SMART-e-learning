import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import SupplyCatalog from './SupplyCatalog'
import OrderRowActions from './OrderRowActions'
import { paymentTypeLabel } from '@/lib/supply-order-labels'
import { SUPPLY_DELIVERY_FEE_DT } from '@/lib/supply-constants'

const PAYMENT_KEYS = new Set(['cash', 'transfer', 'check', 'card', 'invoice'])

async function placeOrder({
  parentId,
  studentId,
  items,
  total,
  notes,
  paymentType,
}: {
  parentId: string
  studentId: string
  items: any[]
  total: number
  notes: string
  paymentType: string
}) {
  'use server'
  const db = createServiceClient()
  const ids = [...new Set(items.map((i: any) => i.id).filter(Boolean))]
  if (ids.length === 0) return { error: 'Panier invalide.' }

  const pt = PAYMENT_KEYS.has(paymentType) ? paymentType : 'invoice'

  const { data: rows } = await db.from('supply_catalog').select('id, stock_quantity, available').in('id', ids)
  const byId = new Map((rows ?? []).map((r: any) => [r.id, r]))

  for (const li of items) {
    const r = byId.get(li.id)
    if (!r) return { error: `Article « ${li.name ?? 'inconnu'} » introuvable.` }
    if (!r.available) return { error: `« ${li.name} » n'est plus proposé à la commande.` }
    const qty = Number(li.quantity) || 0
    const stock = Number(r.stock_quantity ?? 0)
    if (qty > stock) {
      return { error: `Stock insuffisant pour « ${li.name} » (disponible : ${stock}).` }
    }
  }

  const { error } = await db.from('supply_orders').insert({
    parent_id: parentId,
    student_id: studentId,
    items,
    total_amount: total,
    delivery_cost: SUPPLY_DELIVERY_FEE_DT,
    payment_type: pt,
    notes: notes || null,
    status: 'pending',
    stock_deducted: false,
  })
  return { error: error?.message }
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ En attente (facture)',
  confirmed: '✅ Confirmée',
  shipped:   '🚚 En livraison',
  delivered: '📦 Livrée',
  cancelled: '❌ Annulée',
}
const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function SuppliesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const [{ data: children }, { data: orders }, { data: catalogItems }] = await Promise.all([
    db.from('students').select('id, full_name').eq('parent_id', user!.id).order('full_name'),
    db.from('supply_orders')
      .select(
        'id, status, total_amount, delivery_cost, payment_type, notes, created_at, items, invoice_path, student:students(full_name)'
      )
      .eq('parent_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('supply_catalog')
      .select('id, name, description, category, unit_price, unit, icon, available, stock_quantity, min_stock_quantity')
      .eq('available', true)
      .order('category')
      .order('name'),
  ])

  const childList = (children ?? []).map((c: any) => ({ id: c.id, full_name: c.full_name }))

  async function handleOrder(data: {
    studentId: string
    items: any[]
    total: number
    notes: string
    paymentType: string
  }) {
    'use server'
    return placeOrder({ parentId: user!.id, ...data })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fournitures scolaires</h1>
        <p className="text-gray-500 text-sm mt-1 max-w-2xl">
          Commandez les articles depuis le catalogue. Vous réglez sur la facture remise par l&apos;école, puis vous déposez le scan ou la photo de cette facture sur la page de la commande ; l&apos;administration valide le paiement et marque la commande comme livrée.
        </p>
      </div>

      {childList.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <span className="text-lg">⚠️</span>
          <span>
            Aucun enfant lié : vérifiez votre CIN dans Mon profil (identique à celui donné à l&apos;école). Les élèves sont ajoutés automatiquement par l&apos;administration.
          </span>
        </div>
      )}

      <SupplyCatalog catalog={catalogItems ?? []} children={childList} onOrder={handleOrder} />

      {/* Order history */}
      {(orders ?? []).length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mes commandes</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">N° commande</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Enfant</th>
                  <th className="px-5 py-3 font-medium">Articles</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium">Livraison</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Justificatif</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(orders as any[]).map(o => {
                  const itemList: any[] = Array.isArray(o.items) ? o.items : []
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">{o.student?.full_name ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {itemList.slice(0, 2).map((item: any, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {item.icon} {item.name} ×{item.quantity}
                            </span>
                          ))}
                          {itemList.length > 2 && <span className="text-xs text-gray-400">+{itemList.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700 text-xs max-w-[140px]">
                        {paymentTypeLabel((o as { payment_type?: string }).payment_type)}
                      </td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {Number((o as { delivery_cost?: number }).delivery_cost ?? 0).toFixed(3)} DT
                      </td>
                      <td className="px-5 py-3 font-bold text-gray-900 whitespace-nowrap">
                        {(
                          Number(o.total_amount) + Number((o as { delivery_cost?: number }).delivery_cost ?? 0)
                        ).toFixed(3)}{' '}
                        DT
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {(o as { invoice_path?: string | null }).invoice_path ? (
                          <span className="text-emerald-600 font-medium">✓ Envoyé</span>
                        ) : (
                          <span className="text-amber-600">À téléverser</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right align-top">
                        <div className="flex flex-col items-end gap-2">
                          <OrderRowActions orderId={o.id} status={o.status} />
                          <Link href={`/parent/supplies/orders/${o.id}`}
                            className="text-xs text-indigo-600 hover:underline font-medium whitespace-nowrap">
                            Suivre →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
