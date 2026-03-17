import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const getRoleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    teacher: 'bg-green-100 text-green-700',
    parent: 'bg-blue-100 text-blue-700',
  }
  return map[role] || 'bg-gray-100 text-gray-700'
}

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: 'Administrateur',
    teacher: 'Enseignant',
    parent: 'Parent',
  }
  return map[role] || role
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const counts = {
    total: users?.length || 0,
    teachers: users?.filter(u => u.role === 'teacher').length || 0,
    parents: users?.filter(u => u.role === 'parent').length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gestion de tous les comptes utilisateurs</p>
        </div>
        <Link
          href="/admin/users/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          + Ajouter un utilisateur
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-900' },
          { label: 'Enseignants', value: counts.teachers, color: 'text-green-600' },
          { label: 'Parents', value: counts.parents, color: 'text-blue-600' },
          { label: 'Administrateurs', value: counts.admins, color: 'text-red-600' },
        ].map(s => (
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
              {['Nom', 'E-mail', 'Rôle', 'Statut', 'Date de création', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
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
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
