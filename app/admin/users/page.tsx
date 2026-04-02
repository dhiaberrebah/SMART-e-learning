import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { sendAdminBroadcast } from './actions'

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

const TARGET_LABEL: Record<string, string> = {
  all: 'Tous',
  teacher: 'Enseignants',
  parent: 'Parents',
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

  const { data: recentBroadcasts } = await supabase
    .from('admin_broadcast_messages')
    .select('id, title, target_audience, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

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
          <p className="text-gray-500 mt-1">Gestion des comptes, filtres et messages à la communauté</p>
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
      {sp.success === 'broadcast' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">
          ✓ Message envoyé aux utilisateurs concernés
        </div>
      )}

      {/* Message administration */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Message de l&apos;administration</h2>
        <p className="text-xs text-gray-500 mb-4">
          Le message apparaît sur le tableau de bord et la page « Messages administration » des parents et/ou enseignants
          selon la cible.
        </p>
        <form action={sendAdminBroadcast} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
            <input
              name="title"
              required
              placeholder="Objet du message"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Contenu visible par les destinataires…"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-y min-h-[100px]"
            />
          </div>
          <div className="rounded-lg border-2 border-gray-900 bg-gray-50 p-4">
            <span className="block text-base font-semibold text-gray-900 mb-3">Destinataires</span>
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex items-start gap-3 cursor-pointer text-gray-900 font-medium leading-snug">
                <input
                  type="radio"
                  name="target_audience"
                  value="all"
                  defaultChecked
                  className="mt-1 h-4 w-4 shrink-0 border-gray-900 text-gray-900 accent-gray-900"
                />
                Tous les utilisateurs (parents + enseignants + autres comptes éligibles)
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-gray-900 font-medium leading-snug">
                <input
                  type="radio"
                  name="target_audience"
                  value="teacher"
                  className="mt-1 h-4 w-4 shrink-0 border-gray-900 text-gray-900 accent-gray-900"
                />
                Enseignants uniquement
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-gray-900 font-medium leading-snug">
                <input
                  type="radio"
                  name="target_audience"
                  value="parent"
                  className="mt-1 h-4 w-4 shrink-0 border-gray-900 text-gray-900 accent-gray-900"
                />
                Parents uniquement
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-semibold shadow-sm"
          >
            Envoyer le message
          </button>
        </form>

        {(recentBroadcasts?.length ?? 0) > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Messages récents</h3>
            <ul className="space-y-2 text-sm">
              {(recentBroadcasts ?? []).map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-gray-600">
                  <span className="font-medium text-gray-900">{m.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {TARGET_LABEL[m.target_audience] ?? m.target_audience}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
