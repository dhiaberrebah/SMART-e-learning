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
    redirect('/parent/profile?error=' + encodeURIComponent(error.message))
  }
  redirect('/parent/profile?success=updated')
}

async function handleChangePassword(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (newPassword !== confirmPassword) {
    redirect('/parent/profile?error=' + encodeURIComponent('Les mots de passe ne correspondent pas'))
  }
  if (newPassword.length < 6) {
    redirect('/parent/profile?error=' + encodeURIComponent('Le mot de passe doit comporter au moins 6 caractères'))
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    redirect('/parent/profile?error=' + encodeURIComponent(error.message))
  }
  redirect('/parent/profile?success=password')
}

export default async function ParentProfilePage({
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

  const accountEmail = user!.email ?? (profile as { email?: string | null })?.email ?? ''

  // Get children info
  const { data: children } = await supabase
    .from('students')
    .select(`
      id, full_name, student_number, date_of_birth,
      class:classes(name, grade_level)
    `)
    .eq('parent_id', user!.id)
    .order('full_name')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérer vos informations personnelles</p>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {sp.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {sp.success === 'updated' ? '✓ Profil mis à jour' : '✓ Mot de passe modifié'}
        </div>
      )}

      {/* Profile info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{accountEmail}</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              Parent
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
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CIN</label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              defaultValue={(profile as { cin?: string | null })?.cin ?? ''}
              placeholder="Non renseigné"
              autoComplete="off"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono uppercase cursor-default"
            />
            <p className="text-xs text-gray-500 mt-1">
              Renseigné à l&apos;inscription. Pour toute correction, contactez l&apos;administration de l&apos;école.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
            <input
              type="email"
              readOnly
              tabIndex={-1}
              defaultValue={accountEmail}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-default text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">L&apos;adresse e-mail ne peut pas être modifiée ici.</p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            Enregistrer
          </button>
        </form>
      </div>

      {/* Password */}
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
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
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
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
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

      {/* My children summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Mes enfants ({children?.length || 0})</h2>
          <a href="/parent/children" className="text-xs text-emerald-600 hover:underline">Voir le détail</a>
        </div>
        {children && children.length > 0 ? (
          <div className="space-y-2">
            {children.map((child: any) => (
              <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 text-xs font-bold">{child.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{child.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {child.class?.name || 'Classe non assignée'}
                    {child.class?.grade_level ? ` · ${child.class.grade_level}` : ''}
                  </p>
                </div>
                {child.student_number && (
                  <span className="text-xs text-gray-400">N° {child.student_number}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun enfant associé à votre compte
          </p>
        )}

        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
          <p>Compte créé le : {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
      </div>
    </div>
  )
}
