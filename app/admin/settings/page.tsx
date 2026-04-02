import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function textOrNull(v: FormDataEntryValue | null) {
  const t = String(v ?? '').trim()
  return t === '' ? null : t
}

function numOrNull(v: FormDataEntryValue | null) {
  const t = String(v ?? '').trim()
  if (t === '') return null
  const n = parseFloat(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

async function handleSchoolSettings(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    redirect('/admin/settings?error=' + encodeURIComponent('Accès refusé'))
  }

  const schoolName = String(formData.get('school_name') ?? '').trim()
  if (!schoolName) {
    redirect('/admin/settings?error=' + encodeURIComponent('Le nom de l’établissement est requis'))
  }

  const { error } = await supabase.from('school_settings').upsert(
    {
      id: true,
      school_name: schoolName,
      study_hours: textOrNull(formData.get('study_hours')),
      enrollment_period: textOrNull(formData.get('enrollment_period')),
      registration_fee_dt: numOrNull(formData.get('registration_fee_dt')),
      tuition_annual_dt: numOrNull(formData.get('tuition_annual_dt')),
      tuition_notes: textOrNull(formData.get('tuition_notes')),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (error) {
    redirect('/admin/settings?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/settings?success=school_updated')
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
    .maybeSingle()

  const { data: school } = await supabase.from('school_settings').select('*').eq('id', true).maybeSingle()

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Profil de l&apos;établissement (page d&apos;accueil) et informations système.
          </p>
        </div>
        <Link href="/admin/profile" className="text-sm text-indigo-600 hover:underline shrink-0">
          ← Profil &amp; mot de passe
        </Link>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {sp.success === 'school_updated' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Paramètres de l’établissement enregistrés
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-5 border border-indigo-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Profil de l&apos;établissement</h2>
        <p className="text-xs text-gray-500 mb-4">
          Horaires, inscriptions, frais : affichés sur la page d&apos;accueil publique (frais d&apos;inscription mis en avant).
        </p>
        <form action={handleSchoolSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;établissement *</label>
            <input
              type="text"
              name="school_name"
              required
              defaultValue={school?.school_name ?? 'Mon établissement'}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horaires des cours</label>
            <input
              type="text"
              name="study_hours"
              placeholder="Ex. 8h00 – 16h30, du lundi au vendredi"
              defaultValue={school?.study_hours ?? ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Période d&apos;inscription</label>
            <textarea
              name="enrollment_period"
              rows={2}
              placeholder="Ex. Inscriptions du 1er juin au 15 septembre 2026"
              defaultValue={school?.enrollment_period ?? ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Frais d&apos;inscription (DT)</label>
              <input
                type="number"
                name="registration_fee_dt"
                step="0.001"
                min="0"
                placeholder="Ex. 150"
                defaultValue={
                  school?.registration_fee_dt != null ? Number(school.registration_fee_dt).toFixed(3) : ''
                }
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Affiché sur la page d&apos;accueil</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Scolarité annuelle (DT)</label>
              <input
                type="number"
                name="tuition_annual_dt"
                step="0.001"
                min="0"
                placeholder="Ex. 1200"
                defaultValue={
                  school?.tuition_annual_dt != null ? Number(school.tuition_annual_dt).toFixed(3) : ''
                }
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Précisions sur les frais (optionnel)</label>
            <textarea
              name="tuition_notes"
              rows={2}
              placeholder="Ex. réduction famille nombreuse, modalités de paiement…"
              defaultValue={school?.tuition_notes ?? ''}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Enregistrer l&apos;établissement
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informations système</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Utilisateurs', value: totalUsers || 0, color: 'bg-indigo-100 text-indigo-700' },
            { label: 'Élèves', value: totalStudents || 0, color: 'bg-purple-100 text-purple-700' },
            { label: 'Classes', value: totalClasses || 0, color: 'bg-amber-100 text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400 space-y-0.5">
          <p>SMART e-Learning v1.0</p>
          <p>Plateforme Supabase + Next.js</p>
          <p>
            Compte créé le :{' '}
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
