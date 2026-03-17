import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function handleDeactivate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const userId = formData.get('user_id') as string

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    redirect(`/admin/users/delete/${userId}?error=` + encodeURIComponent(error.message))
  }
  redirect('/admin/users?success=user_deactivated')
}

async function handleReactivate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const userId = formData.get('user_id') as string

  await supabase
    .from('profiles')
    .update({ is_active: true, deactivated_at: null })
    .eq('id', userId)

  redirect('/admin/users?success=user_reactivated')
}

export default async function DeleteUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!targetUser) redirect('/admin/users')

  const { data: currentUser } = await supabase.auth.getUser()
  if (currentUser.user?.id === id) redirect('/admin/users')

  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)

  const { count: classesCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', id)

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    teacher: 'Enseignant',
    parent: 'Parent',
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gérer le compte</h1>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-700 text-xl font-bold">
              {targetUser.full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{targetUser.full_name}</p>
            <p className="text-sm text-gray-500">{targetUser.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{roleLabels[targetUser.role] || targetUser.role}</p>
          </div>
        </div>

        {(studentsCount ?? 0) > 0 || (classesCount ?? 0) > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-sm">
            <p className="font-medium text-amber-800 mb-1">Données associées :</p>
            <ul className="text-amber-700 space-y-0.5">
              {(studentsCount ?? 0) > 0 && <li>• {studentsCount} élève(s) lié(s) à ce parent</li>}
              {(classesCount ?? 0) > 0 && <li>• {classesCount} classe(s) assignée(s) à cet enseignant</li>}
            </ul>
            <p className="text-amber-600 text-xs mt-2">La désactivation ne supprime pas ces données.</p>
          </div>
        ) : null}

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-5 ${targetUser.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full ${targetUser.is_active !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {targetUser.is_active !== false ? 'Compte actif' : 'Compte désactivé'}
        </div>

        {targetUser.is_active !== false ? (
          <form action={handleDeactivate}>
            <input type="hidden" name="user_id" value={targetUser.id} />
            <p className="text-sm text-gray-600 mb-4">
              Désactiver ce compte empêchera l&apos;utilisateur de se connecter. Ses données seront conservées.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Désactiver le compte
              </button>
              <Link
                href="/admin/users"
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
              >
                Annuler
              </Link>
            </div>
          </form>
        ) : (
          <form action={handleReactivate}>
            <input type="hidden" name="user_id" value={targetUser.id} />
            <p className="text-sm text-gray-600 mb-4">
              Ce compte est actuellement désactivé. Vous pouvez le réactiver.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
              >
                Réactiver le compte
              </button>
              <Link
                href="/admin/users"
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
              >
                Retour
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
