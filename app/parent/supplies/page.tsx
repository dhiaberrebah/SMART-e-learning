import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import SupplyCatalog from './SupplyCatalog'

async function placeOrder({
  parentId, studentId, items, total, notes,
}: { parentId: string; studentId: string; items: any[]; total: number; notes: string }) {
  'use server'
  const db = createServiceClient()
  const { error } = await db.from('supply_orders').insert({
    parent_id: parentId,
    student_id: studentId,
    items,
    total_amount: total,
    notes: notes || null,
    status: 'pending',
  })
  return { error: error?.message }
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ En attente',
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
      .select('id, status, total_amount, notes, created_at, items, student:students(full_name)')
      .eq('parent_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('supply_catalog')
      .select('id, name, description, category, unit_price, unit, icon, available')
      .eq('available', true)
      .order('category')
      .order('name'),
  ])

  const childList = (children ?? []).map((c: any) => ({ id: c.id, full_name: c.full_name }))

  async function handleOrder(data: { studentId: string; items: any[]; total: number; notes: string }) {
    'use server'
    return placeOrder({ parentId: user!.id, ...data })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fournitures scolaires</h1>
        <p className="text-gray-500 text-sm mt-1">Commandez les fournitures dont votre enfant a besoin directement depuis l'école.</p>
      </div>

      {childList.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <span className="text-lg">⚠️</span>
          <span>Aucun enfant lié à votre compte. Contactez l'administration avant de passer une commande.</span>
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
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium"></th>
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
                      <td className="px-5 py-3 font-bold text-gray-900 whitespace-nowrap">{Number(o.total_amount).toFixed(3)} DT</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/parent/supplies/orders/${o.id}`}
                          className="text-xs text-indigo-600 hover:underline font-medium whitespace-nowrap">
                          Suivre →
                        </Link>
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
