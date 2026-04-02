import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function handleUpdateProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: formData.get('full_name') as string })
    .eq('id', user.id)

  if (error) {
    redirect('/admin/profile?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/profile?success=profile_updated')
}

async function handleChangePassword(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (newPassword !== confirmPassword) {
    redirect('/admin/profile?error=' + encodeURIComponent('Les mots de passe ne correspondent pas'))
  }
  if (newPassword.length < 6) {
    redirect('/admin/profile?error=' + encodeURIComponent('Le mot de passe doit comporter au moins 6 caractères'))
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    redirect('/admin/profile?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/profile?success=password_changed')
}

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
          <p className="text-gray-500 mt-1 text-sm">Votre compte administrateur et la sécurité du mot de passe.</p>
        </div>
        <Link href="/admin/settings" className="text-sm text-indigo-600 hover:underline shrink-0">
          Paramètres établissement →
        </Link>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {sp.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {sp.success === 'profile_updated'
            ? '✓ Profil mis à jour'
            : '✓ Mot de passe modifié'}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Administrateur
            </span>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">Modifier le profil</h2>
        <form action={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input
              type="text"
              name="full_name"
              required
              defaultValue={profile?.full_name || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
            <input
              type="email"
              disabled
              defaultValue={profile?.email || ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">L&apos;adresse e-mail ne peut pas être modifiée</p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Mettre à jour
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Changer le mot de passe</h2>
        <form action={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              name="new_password"
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              name="confirm_password"
              required
              minLength={6}
              placeholder="Répétez le mot de passe"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
          >
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
