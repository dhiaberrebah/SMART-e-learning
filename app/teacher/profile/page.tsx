import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

async function updateProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const fullName = formData.get('full_name') as string

  await db.from('profiles').update({ full_name: fullName }).eq('id', user.id)

  const newPassword = formData.get('new_password') as string
  if (newPassword && newPassword.length >= 6) {
    await supabase.auth.updateUser({ password: newPassword })
  }

  redirect('/teacher/profile?saved=1')
}

export default async function TeacherProfile({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createServiceClient()

  const [{ data: profile }, { data: classes }, { data: subjects }] = await Promise.all([
    db.from('profiles').select('*').eq('id', user!.id).single(),
    db.from('classes').select('id, name, grade_level, academic_year').eq('teacher_id', user!.id).order('name'),
    db.from('subjects').select('id, name, class_id').eq('teacher_id', user!.id).order('name'),
  ])

  const classIds = (classes ?? []).map((c: any) => c.id)
  const { data: students } = classIds.length > 0
    ? await db.from('students').select('id, class_id').in('class_id', classIds)
    : Promise.resolve({ data: [] })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      {sp.saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          ✅ Profil mis à jour avec succès.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Informations personnelles</h2>
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                <input type="text" name="full_name" defaultValue={profile?.full_name ?? ''}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
                <input type="email" value={user?.email ?? ''} disabled
                  className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">L'e-mail ne peut pas être modifié ici.</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Changer le mot de passe</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                    <input type="password" name="new_password" minLength={6} placeholder="Minimum 6 caractères"
                      className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-xl shadow-sm p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-blue-700">{profile?.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <p className="font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              Enseignant
            </span>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Classes</span>
                <span className="font-medium text-gray-900">{(classes ?? []).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Matières</span>
                <span className="font-medium text-gray-900">{(subjects ?? []).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Élèves</span>
                <span className="font-medium text-gray-900">{(students ?? []).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Membre depuis</span>
                <span className="font-medium text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* My classes mini list */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Mes classes</h3>
            <div className="space-y-2">
              {(classes ?? []).length > 0 ? (
                (classes as any[]).map((c) => {
                  const count = (students ?? []).filter((s: any) => s.class_id === c.id).length
                  return (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        {c.grade_level && <p className="text-xs text-gray-400">{c.grade_level}</p>}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-gray-400">Aucune classe assignée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
