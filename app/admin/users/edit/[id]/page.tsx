import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { normalizeParentCin } from '@/lib/parent-cin'

async function handleUpdate(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const userId = formData.get('user_id') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  if (!['teacher', 'parent'].includes(role)) {
    redirect('/admin/users/edit/' + userId + '?error=' + encodeURIComponent('Rôle non autorisé'))
  }

  const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (target?.role === 'admin') redirect('/admin/users')

  const cin =
    role === 'parent' ? normalizeParentCin(formData.get('cin') as string) : null
  if (role === 'parent' && (!cin || cin.length < 5)) {
    redirect('/admin/users/edit/' + userId + '?error=' + encodeURIComponent('CIN obligatoire pour un parent (min. 5 caractères).'))
  }

  const isTeacher = role === 'teacher'
  const phone = isTeacher ? ((formData.get('phone') as string) || '').trim() || null : null
  const address = isTeacher ? ((formData.get('address') as string) || '').trim() || null : null
  const rdRaw = ((formData.get('recruitment_date') as string) || '').trim()
  const recruitment_date = isTeacher && rdRaw ? rdRaw : null

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      role,
      cin,
      phone,
      address,
      recruitment_date,
    })
    .eq('id', userId)

  if (error) {
    redirect('/admin/users/edit/' + userId + '?error=' + encodeURIComponent(error.message))
  }
  redirect('/admin/users?success=user_updated')
}

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()
  const { data: editUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!editUser) redirect('/admin/users')
  if (editUser.role === 'admin') redirect('/admin/users')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;utilisateur</h1>
          <p className="text-gray-500 text-sm mt-0.5">{editUser.full_name}</p>
        </div>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="user_id" value={editUser.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input
              type="text"
              name="full_name"
              required
              defaultValue={editUser.full_name}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
            <input
              type="email"
              disabled
              defaultValue={editUser.email}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">L&apos;adresse e-mail ne peut pas être modifiée</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
            <select
              name="role"
              required
              defaultValue={editUser.role}
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="teacher">Enseignant</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Coordonnées enseignant</p>
            <p className="text-xs text-gray-500 -mt-2">Enregistrées uniquement si le rôle est Enseignant.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                defaultValue={(editUser as { phone?: string | null }).phone ?? ''}
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
              <textarea
                name="address"
                rows={3}
                defaultValue={(editUser as { address?: string | null }).address ?? ''}
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y min-h-[4.5rem] bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de recrutement</label>
              <input
                type="date"
                name="recruitment_date"
                defaultValue={
                  (editUser as { recruitment_date?: string | null }).recruitment_date
                    ? String((editUser as { recruitment_date: string }).recruitment_date).slice(0, 10)
                    : ''
                }
                className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CIN <span className="text-gray-400 font-normal">(parents uniquement)</span>
            </label>
            <input
              type="text"
              name="cin"
              autoComplete="off"
              defaultValue={(editUser as { cin?: string | null }).cin || ''}
              placeholder="Numéro CIN du parent"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Laissé vide si le compte est enseignant (sera effacé à l&apos;enregistrement si rôle Enseignant).</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 space-y-1">
            <p>Créé le : {new Date(editUser.created_at).toLocaleDateString('fr-FR')}</p>
            <p>Mis à jour le : {new Date(editUser.updated_at).toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
              Enregistrer
            </button>
            <Link href="/admin/users" className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
