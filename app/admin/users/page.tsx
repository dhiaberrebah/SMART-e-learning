import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const getRoleBadge = (role: string) => {
  const map: Record<string, string> = {
    teacher: 'bg-green-100 text-green-700',
    parent: 'bg-blue-100 text-blue-700',
  }
  return map[role] || 'bg-gray-100 text-gray-700'
}

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    teacher: 'Enseignant',
    parent: 'Parent',
  }
  return map[role] || role
}

function sanitizeIlike(s: string) {
  return s.replace(/%/g, '').replace(/_/g, '').trim()
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; error?: string; success?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const roleFilter =
    sp.role && ['teacher', 'parent'].includes(sp.role) ? sp.role : ''
  const qRaw = sp.q ? sanitizeIlike(sp.q) : ''

  let query = supabase
    .from('profiles')
    .select('*')
    .in('role', ['teacher', 'parent'])
    .order('created_at', { ascending: false })

  if (roleFilter) {
    query = query.eq('role', roleFilter)
  }
  if (qRaw) {
    query = query.or(`full_name.ilike.%${qRaw}%,email.ilike.%${qRaw}%`)
  }

  const { data: users, error } = await query

  const list = users ?? []
  const counts = {
    total: list.length,
    teachers: list.filter((u) => u.role === 'teacher').length,
    parents: list.filter((u) => u.role === 'parent').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gestion des comptes et filtres</p>
        </div>
        <Link
          href="/admin/users/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          + Ajouter un utilisateur
        </Link>
      </div>

      {sp.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      )}
      {/* Filtres */}
      <form method="get" className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="user-q" className="block text-xs font-medium text-gray-500 mb-1">
            Recherche (nom ou e-mail)
          </label>
          <input
            id="user-q"
            name="q"
            type="search"
            defaultValue={sp.q || ''}
            placeholder="Rechercher…"
            className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="user-role" className="block text-xs font-medium text-gray-500 mb-1">
            Rôle
          </label>
          <select
            id="user-role"
            name="role"
            defaultValue={roleFilter}
            className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Parents et enseignants</option>
            <option value="parent">Parents</option>
            <option value="teacher">Enseignants</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Filtrer
          </button>
          {(roleFilter || (sp.q && sp.q.trim())) && (
            <Link
              href="/admin/users"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {/* Stats (sur résultats filtrés) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Résultats', value: counts.total, color: 'text-gray-900' },
          { label: 'Enseignants', value: counts.teachers, color: 'text-green-600' },
          { label: 'Parents', value: counts.parents, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          Erreur lors du chargement des données
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Nom', 'E-mail', 'Rôle', 'Statut', 'Date de création', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users && users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">
                          {u.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{u.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.is_active !== false ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-medium flex gap-3">
                    <Link href={`/admin/users/edit/${u.id}`} className="text-indigo-600 hover:text-indigo-800">
                      Modifier
                    </Link>
                    {u.id !== user?.id && (
                      <Link href={`/admin/users/delete/${u.id}`} className="text-red-500 hover:text-red-700">
                        Désactiver
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  Aucun utilisateur ne correspond aux filtres
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
