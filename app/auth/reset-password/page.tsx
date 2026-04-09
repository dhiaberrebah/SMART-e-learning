'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthSchoolHeader } from '@/components/auth/AuthSchoolHeader'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initFromHash() {
      if (typeof window === 'undefined') return

      const supabase = createClient()

      const qCode = new URLSearchParams(window.location.search).get('code')
      if (qCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(qCode)
        if (cancelled) return
        if (error) {
          setSessionError(error.message || 'Lien invalide ou expiré.')
          setReady(true)
          return
        }
        window.history.replaceState(null, '', window.location.pathname)
        setReady(true)
        return
      }

      const hash = window.location.hash.replace(/^#/, '')
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')

      if (!access_token || !refresh_token) {
        if (!cancelled) {
          setSessionError(
            'Lien incomplet ou expiré. Demandez un nouveau lien depuis la page « Mot de passe oublié ».'
          )
          setReady(true)
        }
        return
      }

      if (type === 'signup' || type === 'email_change') {
        if (!cancelled) {
          setSessionError('Ce lien n’est pas valide pour une réinitialisation de mot de passe.')
          setReady(true)
        }
        return
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token })

      if (cancelled) return

      if (error) {
        setSessionError(error.message || 'Session invalide ou expirée.')
        setReady(true)
        return
      }

      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setReady(true)
    }

    void initFromHash()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    if (password.length < 6) {
      setSubmitError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setSubmitError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await supabase.auth.signOut()
      router.push('/login?reset=success')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de mettre à jour le mot de passe.'
      setSubmitError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <p className="text-gray-600 text-sm">Préparation du formulaire…</p>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg space-y-4">
          <AuthSchoolHeader />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{sessionError}</div>
          <Link href="/forgot-password" className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Demander un nouveau lien
          </Link>
          <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <AuthSchoolHeader />
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Choisissez un mot de passe sécurisé pour votre compte.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{submitError}</div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Minimum 6 caractères"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
