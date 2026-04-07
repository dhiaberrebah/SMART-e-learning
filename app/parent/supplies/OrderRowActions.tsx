'use client'

import { useTransition } from 'react'
import { parentCancelSupplyOrder, parentMarkSupplyOrderDelivered } from './orderActions'

const CANCELABLE = new Set(['pending', 'confirmed', 'shipped'])

export default function OrderRowActions({
  orderId,
  status,
  layout = 'column',
}: {
  orderId: string
  status: string
  layout?: 'column' | 'row'
}) {
  const [pending, start] = useTransition()
  const canCancel = CANCELABLE.has(status)
  const canMarkDelivered = status !== 'delivered' && status !== 'cancelled'

  if (!canCancel && !canMarkDelivered) return <span className="text-gray-300">—</span>

  const wrap =
    layout === 'row'
      ? 'flex flex-wrap gap-2 items-center'
      : 'flex flex-col gap-1.5 items-end'

  return (
    <div className={wrap}>
      {canMarkDelivered && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Confirmer que vous avez bien reçu la commande ?')) return
            start(async () => { await parentMarkSupplyOrderDelivered(orderId) })
          }}
          className={`font-medium text-emerald-700 hover:underline disabled:opacity-50 whitespace-nowrap ${layout === 'row' ? 'text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100' : 'text-xs'}`}
        >
          {layout === 'row' ? 'Marquer comme livrée' : 'Réception OK'}
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Annuler cette commande ?')) return
            start(async () => { await parentCancelSupplyOrder(orderId) })
          }}
          className={`font-medium text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap ${layout === 'row' ? 'text-sm px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100' : 'text-xs'}`}
        >
          {layout === 'row' ? 'Annuler la commande' : 'Annuler'}
        </button>
      )}
    </div>
  )
}
