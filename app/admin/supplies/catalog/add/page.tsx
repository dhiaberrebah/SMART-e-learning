import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function addItem(formData: FormData) {
  'use server'
  const db = createServiceClient()
  await db.from('supply_catalog').insert({
    name:        formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category:    formData.get('category') as string,
    unit_price:  parseFloat(formData.get('unit_price') as string),
    unit:        formData.get('unit') as string,
    icon:        (formData.get('icon') as string) || '📦',
    available:   true,
  })
  redirect('/admin/supplies/catalog')
}

const COMMON_CATEGORIES = ['Livres', 'Cahiers', 'Papeterie', 'Rangement', 'Divers']
const COMMON_ICONS = ['📘','📗','📙','📕','📓','📒','📔','🖊️','✒️','✏️','🖍️','📏','📐','🧭','🔢','📁','🗂️','👜','🎒','🧴','✂️','🧽','🗑️','📦']

export default async function AddCatalogItem() {
  const db = createServiceClient()
  const { data: existingCategories } = await db
    .from('supply_catalog').select('category').order('category')
  const cats = Array.from(new Set([...COMMON_CATEGORIES, ...(existingCategories ?? []).map((c: any) => c.category)]))

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/admin/supplies/catalog" className="text-sm text-indigo-600 hover:underline">← Catalogue</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Ajouter un article</h1>

      <form action={addItem} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input name="name" required placeholder="Ex : Cahier 200 pages"
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={2} placeholder="Description courte de l'article"
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select name="category" required
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none">
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
            <input name="unit" required defaultValue="unité" placeholder="unité / lot / kit…"
              className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (DT) *</label>
          <input name="unit_price" type="number" required step="0.001" min="0" placeholder="0.000"
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icône (emoji)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_ICONS.map(icon => (
              <label key={icon} className="cursor-pointer">
                <input type="radio" name="icon" value={icon} className="sr-only peer" />
                <span className="text-2xl p-1 rounded-lg border border-transparent peer-checked:border-indigo-400 peer-checked:bg-indigo-50 hover:bg-gray-50 block transition-all">
                  {icon}
                </span>
              </label>
            ))}
          </div>
          <input name="icon" placeholder="Ou tapez un emoji personnalisé…"
            className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            Ajouter au catalogue
          </button>
          <Link href="/admin/supplies/catalog"
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
