'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthSchoolHeader } from '@/components/auth/AuthSchoolHeader'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && data?.error) {
        setError(data.error)
        return
      }
      setDone(true)
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la connexion
          </Link>
        </div>
        <AuthSchoolHeader />
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">Mot de passe oublié</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Saisissez l’adresse e-mail de votre compte. Si elle est enregistrée, vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
        </div>

        {done ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Si un compte existe pour cette adresse, un e-mail avec un lien de réinitialisation vient d’être envoyé. Pensez à vérifier les courriers indésirables.
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="vous@exemple.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
