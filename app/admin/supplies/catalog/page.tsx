import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function toggleAvailable(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  const current = formData.get('available') === 'true'
  await db.from('supply_catalog').update({ available: !current }).eq('id', id)
  redirect('/admin/supplies/catalog')
}

async function deleteItem(formData: FormData) {
  'use server'
  const db = createServiceClient()
  const id = formData.get('id') as string
  await db.from('supply_catalog').delete().eq('id', id)
  redirect('/admin/supplies/catalog')
}

const CATEGORY_COLORS: Record<string, string> = {
  Livres:    'bg-blue-50 text-blue-700',
  Cahiers:   'bg-violet-50 text-violet-700',
  Papeterie: 'bg-amber-50 text-amber-700',
  Rangement: 'bg-emerald-50 text-emerald-700',
  Divers:    'bg-gray-100 text-gray-600',
}

export default async function AdminCatalogPage() {
  const db = createServiceClient()
  const { data: items } = await db
    .from('supply_catalog')
    .select('id, name, description, category, unit_price, unit, icon, available, stock_quantity, min_stock_quantity, created_at')
    .order('category').order('name')

  const categories = Array.from(new Set((items ?? []).map((i: any) => i.category)))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/supplies" className="text-sm text-indigo-600 hover:underline">← Fournitures</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Catalogue des articles</h1>
        </div>
        <Link href="/admin/supplies/catalog/add"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + Ajouter un article
        </Link>
      </div>

      {categories.map((cat: any) => (
        <div key={cat} className="mb-8">
          <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}>{cat}</span>
            <span className="text-gray-400 font-normal">{(items ?? []).filter((i: any) => i.category === cat).length} articles</span>
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Article</th>
                  <th className="px-4 py-2.5 text-left font-medium">Description</th>
                  <th className="px-4 py-2.5 text-left font-medium">Prix unitaire</th>
                  <th className="px-4 py-2.5 text-left font-medium">Unité</th>
                  <th className="px-4 py-2.5 text-left font-medium">Stock</th>
                  <th className="px-4 py-2.5 text-left font-medium">Catalogue</th>
                  <th className="px-4 py-2.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(items ?? []).filter((i: any) => i.category === cat).map((item: any) => {
                  const stock = Number(item.stock_quantity ?? 0)
                  const minS = Number(item.min_stock_quantity ?? 0)
                  const rupture = item.available && stock === 0
                  const low = item.available && stock > 0 && minS > 0 && stock <= minS
                  return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.available ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{item.description ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{Number(item.unit_price).toFixed(3)} DT</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900">{stock} unité{stock !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-gray-500">seuil : {minS}</span>
                        {rupture && (
                          <span className="text-xs font-medium text-red-600">Rupture</span>
                        )}
                        {low && !rupture && (
                          <span className="text-xs font-medium text-amber-700">Stock faible</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.available ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.available ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/supplies/catalog/edit/${item.id}`}
                          className="text-xs text-indigo-600 hover:underline">Modifier</Link>
                        <form action={toggleAvailable}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="available" value={String(item.available)} />
                          <button type="submit"
                            className={`text-xs hover:underline ${item.available ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {item.available ? 'Désactiver' : 'Activer'}
                          </button>
                        </form>
                        <form action={deleteItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="text-xs text-red-500 hover:underline">Supprimer</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {(items ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p>Aucun article dans le catalogue.</p>
        </div>
      )}
    </div>
  )
}
