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

export default async function AdminSuppliesPage() {
  const db = createServiceClient()

  const [{ data: orders }, { data: catalog }, { data: pending }] = await Promise.all([
    db.from('supply_orders')
      .select('id, status, total_amount, created_at, items, student:students(full_name), parent:profiles!parent_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('supply_catalog').select('id, available').order('name'),
    db.from('supply_orders').select('id').eq('status', 'pending'),
  ])

  const totalOrders = (orders ?? []).length
  const pendingCount = (pending ?? []).length
  const catalogCount = (catalog ?? []).length
  const availableCount = (catalog ?? []).filter((c: any) => c.available).length
  const revenue = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total_amount), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des fournitures</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les commandes et le catalogue des articles scolaires.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/supplies/catalog/add"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            + Ajouter un article
          </Link>
          <Link href="/admin/supplies/orders"
            className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Toutes les commandes
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Commandes en attente', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: '⏳' },
          { label: 'Chiffre d\'affaires', value: `${revenue.toFixed(3)} DT`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰' },
          { label: 'Articles au catalogue', value: availableCount, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '📦' },
          { label: 'Total commandes', value: totalOrders, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🛒' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-5 flex items-start gap-3`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Commandes récentes</h2>
            <Link href="/admin/supplies/orders" className="text-xs text-indigo-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(orders ?? []).length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Aucune commande</p>
            ) : (orders as any[]).map(o => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{o.student?.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' · '}{(o.items ?? []).length} article{(o.items ?? []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-semibold text-sm text-gray-800">{Number(o.total_amount).toFixed(3)} DT</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                <Link href={`/admin/supplies/orders/${o.id}`} className="text-xs text-indigo-600 hover:underline">Gérer</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog quick links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Catalogue</h2>
            <Link href="/admin/supplies/catalog" className="text-xs text-indigo-600 hover:underline">Gérer →</Link>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Articles actifs</span>
              <span className="font-semibold text-emerald-600">{availableCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Articles désactivés</span>
              <span className="font-semibold text-gray-400">{catalogCount - availableCount}</span>
            </div>
            <hr />
            <Link href="/admin/supplies/catalog/add"
              className="block w-full text-center py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors">
              + Ajouter un article
            </Link>
            <Link href="/admin/supplies/catalog"
              className="block w-full text-center py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Modifier le catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
