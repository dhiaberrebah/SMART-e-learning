'use client'
import { useState } from 'react'

export type CatalogItem = {
  id: string
  name: string
  description: string | null
  category: string
  unit_price: number
  unit: string
  icon: string
  available: boolean
}

type CartItem = CatalogItem & { quantity: number }

export default function SupplyCatalog({
  catalog,
  children,
  onOrder,
}: {
  catalog: CatalogItem[]
  children: { id: string; full_name: string }[]
  onOrder: (data: { studentId: string; items: CartItem[]; total: number; notes: string }) => Promise<{ error?: string }>
}) {
  const categories = ['Tous', ...Array.from(new Set(catalog.map(i => i.category)))]

  const [category, setCategory] = useState('Tous')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedChild, setSelectedChild] = useState(children[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const filtered = catalog.filter(item =>
    (category === 'Tous' || item.category === category) &&
    (search === '' || item.name.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (item: CatalogItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id))
    else setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c))
  }

  const total = cart.reduce((sum, c) => sum + Number(c.unit_price) * c.quantity, 0)

  const handleOrder = async () => {
    if (!selectedChild) { setError('Veuillez sélectionner un enfant.'); return }
    if (cart.length === 0) { setError('Votre panier est vide.'); return }
    setLoading(true); setError('')
    const res = await onOrder({ studentId: selectedChild, items: cart, total, notes })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); setCart([]); setNotes('')
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Catalog */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input type="text" placeholder="Rechercher un article…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-400 rounded-lg px-3 py-2 text-sm w-56 focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Aucun article trouvé.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col gap-2 transition-all hover:shadow-md ${inCart ? 'border-indigo-300 shadow-sm' : 'border-gray-100'}`}>
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-indigo-600">{Number(item.unit_price).toFixed(3)} DT</span>
                    <span className="text-xs text-gray-400">/{item.unit}</span>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, inCart.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-sm font-bold flex items-center justify-center hover:bg-red-100 hover:text-red-600">−</button>
                      <span className="text-sm font-semibold text-gray-900 flex-1 text-center">{inCart.quantity}</span>
                      <button onClick={() => updateQty(item.id, inCart.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center hover:bg-indigo-200">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)}
                      className="mt-1 w-full py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                      Ajouter
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="w-72 flex-shrink-0 sticky top-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between">
            <h2 className="font-semibold text-sm">🛒 Mon panier</h2>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{cart.length} article{cart.length !== 1 ? 's' : ''}</span>
          </div>

          {success && (
            <div className="px-4 py-3 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 border-b border-emerald-100">
              <span>✅</span><span>Commande envoyée avec succès !</span>
            </div>
          )}
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm flex items-center gap-2 border-b border-red-100">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🛒</div>Votre panier est vide
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
              {cart.map(c => (
                <div key={c.id} className="px-4 py-2.5 flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.quantity} × {Number(c.unit_price).toFixed(3)} DT</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{(c.quantity * Number(c.unit_price)).toFixed(3)} DT</span>
                  <button onClick={() => updateQty(c.id, 0)} className="text-gray-300 hover:text-red-500 transition-colors ml-1 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total estimé</span>
              <span className="text-base font-bold text-indigo-600">{total.toFixed(3)} DT</span>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Pour l'enfant</label>
              <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
                className="w-full border border-gray-400 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                {children.length === 0 && <option value="">— Aucun enfant —</option>}
                {children.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Remarques (optionnel)</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ex : livraison urgente, taille particulière…"
                className="w-full border border-gray-400 rounded-lg px-2 py-1.5 text-xs resize-none focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
            </div>
            <button onClick={handleOrder} disabled={loading || cart.length === 0}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? 'Envoi…' : 'Passer la commande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
