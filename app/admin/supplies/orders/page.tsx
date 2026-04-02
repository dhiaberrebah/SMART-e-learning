import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée',
}
const ALL_STATUSES = Object.keys(STATUS_LABEL)

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const db = createServiceClient()

  let query = db
    .from('supply_orders')
    .select(
      'id, status, total_amount, notes, created_at, items, invoice_path, student:students(full_name, class:classes(name)), parent:profiles!parent_id(full_name)'
    )
    .order('created_at', { ascending: false })

  if (sp.status && ALL_STATUSES.includes(sp.status)) {
    query = query.eq('status', sp.status) as any
  }

  const { data: orders } = await query

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/supplies" className="text-sm text-indigo-600 hover:underline">← Fournitures</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Toutes les commandes</h1>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin/supplies/orders"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!sp.status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Toutes
        </Link>
        {ALL_STATUSES.map(s => (
          <Link key={s} href={`/admin/supplies/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sp.status === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b">
              <th className="px-5 py-3 font-medium">N° commande</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Parent</th>
              <th className="px-5 py-3 font-medium">Élève / Classe</th>
              <th className="px-5 py-3 font-medium">Articles</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-10">Aucune commande</td>
              </tr>
            ) : (orders as any[]).map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3 font-medium text-gray-900">{o.parent?.full_name ?? '—'}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{o.student?.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{o.student?.class?.name ?? '—'}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(o.items ?? []).slice(0, 2).map((item: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.icon} {item.name} ×{item.quantity}
                      </span>
                    ))}
                    {(o.items ?? []).length > 2 && <span className="text-xs text-gray-400">+{(o.items ?? []).length - 2}</span>}
                  </div>
                </td>
                <td className="px-5 py-3 font-bold text-gray-900 whitespace-nowrap">{Number(o.total_amount).toFixed(3)} DT</td>
                <td className="px-5 py-3">
                  {o.invoice_path ? (
                    <a
                      href={o.invoice_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Voir scan
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/supplies/orders/${o.id}`} className="text-xs text-indigo-600 hover:underline font-medium">
                    Gérer →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
