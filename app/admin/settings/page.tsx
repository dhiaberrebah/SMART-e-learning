import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    redirect('/admin/settings?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/settings?success=profile_updated')
}

async function handleChangePassword(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (newPassword !== confirmPassword) {
    redirect('/admin/settings?error=' + encodeURIComponent('Les mots de passe ne correspondent pas'))
  }
  if (newPassword.length < 6) {
    redirect('/admin/settings?error=' + encodeURIComponent('Le mot de passe doit comporter au moins 6 caractères'))
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    redirect('/admin/settings?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/settings?success=password_changed')
}

export default async function SettingsPage({
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
    .single()

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Gérer votre profil et les informations système</p>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {sp.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {sp.success === 'profile_updated' ? '✓ Profil mis à jour' : '✓ Mot de passe modifié'}
        </div>
      )}

      {/* Profile section */}
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
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            Mettre à jour
          </button>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
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
          <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium">
            Modifier le mot de passe
          </button>
        </form>
      </div>

      {/* System info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informations système</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Utilisateurs', value: totalUsers || 0, color: 'bg-indigo-100 text-indigo-700' },
            { label: 'Élèves', value: totalStudents || 0, color: 'bg-purple-100 text-purple-700' },
            { label: 'Classes', value: totalClasses || 0, color: 'bg-amber-100 text-amber-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
          <p>SMART e-Learning v1.0</p>
          <p>Plateforme Supabase + Next.js</p>
          <p>Compte créé le : {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
      </div>
    </div>
  )
}
