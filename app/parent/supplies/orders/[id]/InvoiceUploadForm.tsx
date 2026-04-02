'use client'

import { useState } from 'react'
import { uploadSupplyOrderInvoice } from './actions'

export default function InvoiceUploadForm({
  orderId,
  existingPath,
  disabled,
}: {
  orderId: string
  existingPath: string | null
  disabled: boolean
}) {
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    setPending(true)
    const res = await uploadSupplyOrderInvoice(orderId, fd)
    setPending(false)
    if ('error' in res && res.error) {
      setMsg({ type: 'err', text: res.error })
      return
    }
    setMsg({ type: 'ok', text: "Justificatif enregistré. L'école va vérifier le paiement." })
    e.currentTarget.reset()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
      <h2 className="font-semibold text-gray-800 text-sm mb-1">Paiement — facture de l&apos;école</h2>
      <p className="text-xs text-gray-500 mb-4">
        L&apos;école vous remet une facture papier. Après paiement, scannez ou photographiez-la et déposez le fichier
        ici (JPEG, PNG, WebP ou PDF, max 10 Mo).
      </p>

      {existingPath && (
        <p className="text-xs text-emerald-700 mb-3 font-medium">
          ✓ Un justificatif est déjà en ligne. Vous pouvez le remplacer en envoyant un nouveau fichier.
        </p>
      )}

      {msg && (
        <div
          className={`text-sm px-3 py-2 rounded-lg mb-3 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="file"
          name="invoice"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={!existingPath}
          disabled={disabled || pending}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
        >
          {pending ? 'Envoi…' : existingPath ? 'Remplacer le justificatif' : 'Téléverser le justificatif'}
        </button>
      </form>

      {existingPath && (
        <a
          href={existingPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-emerald-600 hover:underline font-medium"
        >
          Voir le justificatif actuel →
        </a>
      )}
    </div>
  )
}
