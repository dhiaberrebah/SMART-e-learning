import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { submitContactAdmin } from '@/app/actions/contact-admin'

export default async function TeacherNewAdminMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'teacher') redirect('/')

  const defaultName = profile?.full_name?.trim() || ''
  const defaultEmail = (user.email ?? '').trim()

  const notice = sp.contact

  return (
    <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <Link href="/teacher/admin-messages" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Messages administration
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau message à l&apos;administration</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Votre message est envoyé à l&apos;équipe (même flux que les demandes depuis la page d&apos;accueil).
        </p>
      </div>

      {notice === 'missing' || notice === 'invalid_email' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice === 'invalid_email'
            ? 'Adresse e-mail invalide.'
            : 'Veuillez remplir au minimum le nom, l&apos;e-mail et le message.'}
        </div>
      ) : null}
      {notice === 'error' ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Envoi impossible pour le moment. Réessayez plus tard.
        </div>
      ) : null}

      <form action={submitContactAdmin} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <input type="hidden" name="redirect_context" value="teacher_admin" />
        <div>
          <label htmlFor="tm-full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            id="tm-full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            defaultValue={defaultName}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white"
            placeholder="Votre nom"
          />
        </div>
        <div>
          <label htmlFor="tm-email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            id="tm-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white"
            placeholder="vous@exemple.com"
          />
        </div>
        <div>
          <label htmlFor="tm-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            id="tm-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile?.phone != null && String(profile.phone).trim() !== '' ? String(profile.phone).trim() : ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white"
            placeholder="+216 …"
          />
        </div>
        <div>
          <label htmlFor="tm-subject" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            id="tm-subject"
            name="subject"
            type="text"
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white"
            placeholder="Ex. question sur les présences…"
          />
        </div>
        <div>
          <label htmlFor="tm-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="tm-message"
            name="message"
            required
            rows={6}
            maxLength={8000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-y min-h-[120px] bg-white"
            placeholder="Décrivez votre demande…"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Envoyer à l&apos;administration
          </button>
          <Link
            href="/teacher/admin-messages"
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
