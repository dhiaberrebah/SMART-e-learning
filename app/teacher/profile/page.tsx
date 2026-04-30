import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { getTeacherClasses } from '@/lib/teacher-classes'

/** ISO YYYY-MM-DD uniquement ; année = 4 chiffres ; date valide ; pas après aujourd’hui (heure locale). */
function sanitizeRecruitmentDateIso(raw: string): string | null {
  const s = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const year = parseInt(s.slice(0, 4), 10)
  const month = parseInt(s.slice(5, 7), 10)
  const day = parseInt(s.slice(8, 10), 10)
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const dt = new Date(year, month - 1, day)
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null
  const endToday = new Date()
  endToday.setHours(23, 59, 59, 999)
  if (dt > endToday) return null
  return s
}

async function updateProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const fullName = (formData.get('full_name') as string)?.trim() ?? ''
  if (!fullName) {
    redirect('/teacher/profile?error=' + encodeURIComponent('Le nom complet est obligatoire.'))
  }
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const address = ((formData.get('address') as string) || '').trim() || null
  const rdRaw = ((formData.get('recruitment_date') as string) || '').trim() || ''
  let recruitment_date: string | null = null
  if (rdRaw) {
    const sanitized = sanitizeRecruitmentDateIso(rdRaw)
    if (!sanitized) {
      redirect(
        '/teacher/profile?error=' +
          encodeURIComponent('Date de recrutement invalide (année sur 4 chiffres, entre 1900 et aujourd’hui).')
      )
    }
    recruitment_date = sanitized
  }

  const { error: updErr } = await db
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      address,
      recruitment_date,
    })
    .eq('id', user.id)

  if (updErr) {
    redirect('/teacher/profile?error=' + encodeURIComponent(updErr.message))
  }

  const newPassword = formData.get('new_password') as string
  if (newPassword && newPassword.length >= 6) {
    await supabase.auth.updateUser({ password: newPassword })
  }

  redirect('/teacher/profile?saved=1')
}

export default async function TeacherProfile({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const db = createServiceClient()

  const [{ data: profile }, classes, { data: subjects }] = await Promise.all([
    db
      .from('profiles')
      .select('full_name, phone, address, recruitment_date')
      .eq('id', user.id)
      .maybeSingle(),
    getTeacherClasses(db, user.id, 'id, name, grade_level, academic_year'),
    db.from('subjects').select('id, name, class_id').eq('teacher_id', user.id).order('name'),
  ])

  const phoneFromProfile =
    profile?.phone != null && String(profile.phone).trim() !== '' ? String(profile.phone).trim() : ''
  const phoneFromAuth = user.phone?.trim() ?? ''
  const phoneDisplay = phoneFromProfile || phoneFromAuth

  const classIds = (classes ?? []).map((c: any) => c.id)
  const { data: students } = classIds.length > 0
    ? await db.from('students').select('id, class_id').in('class_id', classIds)
    : Promise.resolve({ data: [] })

  const endToday = new Date()
  endToday.setHours(0, 0, 0, 0)
  const recruitmentDateMaxIso = `${endToday.getFullYear()}-${String(endToday.getMonth() + 1).padStart(2, '0')}-${String(endToday.getDate()).padStart(2, '0')}`

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos informations personnelles</p>
      </div>

      {sp.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {decodeURIComponent(sp.error)}
        </div>
      )}
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
                <input type="text" name="full_name" required defaultValue={profile?.full_name?.trim() ?? ''}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
                <input type="email" value={user?.email ?? ''} disabled
                  className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">L'e-mail ne peut pas être modifié ici.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  defaultValue={phoneDisplay}
                  placeholder="ex. +216 …"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={profile?.address?.trim() ?? ''}
                  placeholder="Adresse postale complète"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[4.5rem]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de recrutement</label>
                <input
                  type="date"
                  name="recruitment_date"
                  min="1900-01-01"
                  max={recruitmentDateMaxIso}
                  defaultValue={
                    profile?.recruitment_date
                      ? String(profile.recruitment_date).slice(0, 10)
                      : ''
                  }
                  className="w-full max-w-[10.5rem] sm:max-w-[11.5rem] tabular-nums border border-gray-400 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-datetime-edit-year-field]:inline-block [&::-webkit-datetime-edit-year-field]:max-w-[4ch] [&::-webkit-datetime-edit-year-field]:overflow-hidden"
                />
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
            {phoneDisplay ? (
              <p className="text-sm text-gray-600 mt-1">
                <a href={`tel:${phoneDisplay.replace(/\s/g, '')}`} className="hover:text-blue-600 hover:underline">
                  {phoneDisplay}
                </a>
              </p>
            ) : null}
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
              {profile?.recruitment_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recrutement</span>
                  <span className="font-medium text-gray-900">
                    {new Date(String(profile.recruitment_date) + 'T12:00:00').toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
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
