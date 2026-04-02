import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { normalizeParentCin } from '@/lib/parent-cin'

async function handleAddUser(formData: FormData) {
  'use server'
  const email    = formData.get('email')     as string
  const password = formData.get('password')  as string
  const fullName = formData.get('full_name') as string
  const role     = formData.get('role')      as string
  const cinNorm  = normalizeParentCin(formData.get('cin') as string)

  if (role === 'parent') {
    if (!cinNorm || cinNorm.length < 5) {
      redirect('/admin/users/add?error=' + encodeURIComponent('Le CIN est obligatoire pour un compte parent (min. 5 caractères).'))
    }
  }

  let errorMsg: string | null = null

  try {
    // Service client has persistSession:false → signUp never writes a cookie
    // so the admin's session is completely unaffected
    const db = createServiceClient()
    const meta: Record<string, string> = { full_name: fullName, role }
    if (role === 'parent' && cinNorm) meta.cin = cinNorm
    const { error } = await db.auth.signUp({
      email,
      password,
      options: { data: meta },
    })
    if (error) errorMsg = error.message
  } catch (e: any) {
    if (e?.digest) throw e
    errorMsg = e?.message ?? 'Erreur serveur inconnue'
  }

  if (errorMsg) {
    redirect('/admin/users/add?error=' + encodeURIComponent(errorMsg))
  }

  redirect('/admin/users?success=user_added')
}

export default async function AddUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un utilisateur</h1>
          <p className="text-gray-500 text-sm mt-0.5">Créer un compte enseignant ou parent</p>
        </div>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form action={handleAddUser} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom complet
            </label>
            <input
              type="text"
              name="full_name"
              required
              placeholder="Entrez le nom complet"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse e-mail
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="exemple@ecole.fr"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
            <select
              name="role"
              required
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">Choisir un rôle</option>
              <option value="teacher">Enseignant</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CIN du parent <span className="text-gray-400 font-normal">(si rôle Parent)</span>
            </label>
            <input
              type="text"
              name="cin"
              autoComplete="off"
              placeholder="Obligatoire pour un compte parent"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Même format que pour l&apos;inscription parent en ligne (rattachement des élèves).</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              Créer le compte
            </button>
            <Link
              href="/admin/users"
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium text-blue-900">Remarques :</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Cette liste ne concerne que les <strong>enseignants</strong> et les <strong>parents</strong></li>
          <li>Les parents peuvent également s&apos;inscrire eux-mêmes via la page d&apos;inscription publique</li>
          <li>Un e-mail de confirmation sera envoyé à l&apos;utilisateur</li>
          <li>Le mot de passe doit comporter au moins 6 caractères</li>
        </ul>
      </div>
    </div>
  )
}
