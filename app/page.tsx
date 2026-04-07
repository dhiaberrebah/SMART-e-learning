import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { submitContactAdmin } from "@/app/actions/contact-admin";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string }>;
}) {
  const sp = await searchParams;
  const contact = sp.contact;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      redirect(`/${profile.role}/dashboard`);
    }
  }

  const { data: school } = await supabase
    .from('school_settings')
    .select(
      'school_name, study_hours, enrollment_period, registration_fee_dt, tuition_annual_dt, tuition_notes'
    )
    .eq('id', true)
    .maybeSingle();

  const showSchoolInfo =
    school &&
    (school.registration_fee_dt != null ||
      school.tuition_annual_dt != null ||
      (school.study_hours && school.study_hours.trim()) ||
      (school.enrollment_period && school.enrollment_period.trim()) ||
      (school.tuition_notes && school.tuition_notes.trim()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-indigo-600">SMART e-Learning</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Espace parents
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]"
            aria-hidden
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
              {/* Colonne texte — zones ordonnées */}
              <div className="lg:col-span-6 space-y-8">
                {/* Accroche + titre + CTA */}
                <header className="space-y-5">
                  <span className="inline-flex items-center gap-2 bg-indigo-100/90 text-indigo-800 text-sm font-semibold px-4 py-2 rounded-full border border-indigo-200/60 shadow-sm">
                    <span aria-hidden>🎒</span>
                    {school?.school_name?.trim() ? school.school_name.trim() : "Primaire tunisien — 1re à 6e année"}
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                    Plateforme d&apos;apprentissage{" "}
                    <span className="text-indigo-600">intelligent</span>
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                    Suivi personnalisé pour les élèves de l&apos;école primaire en Tunisie. Enseignants, parents et
                    enfants réunis sur une seule plateforme simple et claire.
                  </p>
                </header>

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                  <Link
                    href="/register"
                    className="inline-flex justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/80"
                  >
                    Inscription parent
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex justify-center px-8 py-3.5 text-base font-semibold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    Connexion
                  </Link>
                </div>
              </div>

            {/* Hero visuel */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="rounded-3xl shadow-2xl overflow-hidden relative z-10 ring-2 ring-white bg-gradient-to-br from-teal-400/20 to-cyan-500/10">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/images%20(1).jpg"
                      alt="Élèves du primaire en classe autour d'un globe"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 520px"
                      priority
                    />
                  </div>
                </div>

                {/* Floating card 1 — top left */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 items-center gap-3 z-20 hidden sm:flex">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Cours terminé</p>
                    <p className="text-xs text-gray-400">Mathématiques</p>
                  </div>
                </div>

                {/* Floating card 2 — bottom right */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 items-center gap-3 z-20 hidden sm:flex">
                  <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Score moyen</p>
                    <p className="text-xs text-indigo-600 font-bold">+12% ce mois</p>
                  </div>
                </div>

                {/* Decorative blobs */}
                <div className="absolute -z-10 top-8 right-8 w-64 h-64 bg-indigo-200 rounded-full opacity-30 blur-3xl" />
                <div className="absolute -z-10 bottom-8 left-8 w-48 h-48 bg-blue-200 rounded-full opacity-30 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* Comptes, plateforme & informations d'inscription (données admin) */}
        <section className="border-b border-indigo-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Accès & informations</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Comptes, plateforme et inscriptions
              </h2>
              <p className="mt-3 text-gray-600 leading-relaxed">
                Comment vous connecter, ce que la plateforme apporte aux familles, et les modalités pratiques
                (tarifs, horaires, dates) communiquées par l&apos;école.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-indigo-200/80 bg-indigo-50/90 px-4 py-4 sm:px-8 sm:py-4 text-center mb-10">
              <p className="text-sm sm:text-base font-semibold text-indigo-950">
                Compte parent avec CIN · Accès enseignant par l&apos;administration
              </p>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-12">
              {[
                { t: "École & maison", d: "Notes, présences et messages au même endroit", emoji: "🏠" },
                { t: "Contenus clairs", d: "Cours et ressources alignés sur le primaire", emoji: "📚" },
                { t: "Données protégées", d: "Espaces séparés par rôle et connexion sécurisée", emoji: "🔒" },
              ].map((item) => (
                <li
                  key={item.t}
                  className="rounded-2xl border border-gray-200 bg-gray-50/80 px-5 py-5 shadow-sm"
                >
                  <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-xl" aria-hidden>
                      {item.emoji}
                    </span>
                    {item.t}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.d}</p>
                </li>
              ))}
            </ul>

            {showSchoolInfo ? (
              <div className="max-w-4xl mx-auto rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-white to-indigo-50/40 shadow-md overflow-hidden">
                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-6">
                    Inscriptions & tarifs
                  </h3>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {school?.registration_fee_dt != null && (
                      <li className="rounded-xl bg-indigo-50 px-5 py-4 border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-semibold">Frais d&apos;inscription</p>
                        <p className="text-2xl font-bold text-indigo-800 tabular-nums mt-1">
                          {Number(school.registration_fee_dt).toFixed(3)} DT
                        </p>
                      </li>
                    )}
                    {school?.tuition_annual_dt != null && (
                      <li className="rounded-xl bg-white px-5 py-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold">Scolarité annuelle</p>
                        <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">
                          {Number(school.tuition_annual_dt).toFixed(3)} DT
                        </p>
                      </li>
                    )}
                    {school?.study_hours?.trim() && (
                      <li className="sm:col-span-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm pt-2 border-t border-indigo-100/80">
                        <span className="text-gray-500 shrink-0 font-medium">Horaires des cours</span>
                        <span className="font-semibold text-gray-900">{school.study_hours.trim()}</span>
                      </li>
                    )}
                    {school?.enrollment_period?.trim() && (
                      <li className="sm:col-span-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
                        <span className="text-gray-500 shrink-0 font-medium">Période d&apos;inscriptions</span>
                        <span className="font-semibold text-gray-900 whitespace-pre-line">
                          {school.enrollment_period.trim()}
                        </span>
                      </li>
                    )}
                    {school?.tuition_notes?.trim() && (
                      <li className="sm:col-span-2 text-sm text-gray-600 bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-3 mt-1">
                        <span className="font-semibold text-amber-900">Remarque · </span>
                        {school.tuition_notes.trim()}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 max-w-xl mx-auto">
                Les frais, horaires et dates d&apos;inscription s&apos;affichent ici lorsque l&apos;administration les a
                renseignés dans les paramètres de l&apos;école.
              </p>
            )}
          </div>
        </section>

        {/* Niveaux — enseignement primaire tunisien (1re–6e année) */}
        <section className="bg-slate-50 border-y border-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">École primaire — Tunisie</span>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">De la 1re à la 6e année</h3>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                SMART e-Learning est dédié à l&apos;enseignement primaire tunisien : un suivi adapté aux élèves de la 1re à la 6e année, avec leurs parents et leurs enseignants.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Cycle préparatoire", sub: "1re — 3e année", desc: "Premiers apprentissages : lecture, écriture, calcul et habitudes de vie en classe.", color: "from-sky-500 to-blue-600" },
                { title: "Cycle primaire", sub: "4e — 6e année", desc: "Consolidation des bases, autonomie et préparation sereine à la suite du parcours.", color: "from-indigo-500 to-violet-600" },
                { title: "Programme & matières", sub: "Fondamentaux", desc: "Français, arabe, mathématiques, découverte et activités — au rythme du programme tunisien.", color: "from-violet-500 to-purple-600" },
                { title: "Parents & école", sub: "Lien école — maison", desc: "Présence, notes et ressources des enseignants accessibles pour suivre votre enfant au quotidien.", color: "from-emerald-500 to-teal-600" },
              ].map((c) => (
                <div key={c.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${c.color}`} />
                  <div className="p-6">
                    <p className="text-xs font-semibold text-indigo-600">{c.sub}</p>
                    <h4 className="text-lg font-bold text-gray-900 mt-1">{c.title}</h4>
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Matières */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Matières & ressources</h3>
            <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
              Contenus pédagogiques, devoirs et supports partagés par vos enseignants — centralisés sur une seule plateforme.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Mathématiques",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                ),
                ring: "from-violet-500 to-indigo-600",
              },
              {
                label: "Sciences",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                ),
                ring: "from-sky-500 to-blue-600",
              },
              {
                label: "Français",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                ),
                ring: "from-rose-500 to-pink-600",
              },
              {
                label: "Anglais",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                ),
                ring: "from-emerald-500 to-teal-600",
              },
              {
                label: "Histoire — Géo",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ),
                ring: "from-amber-500 to-orange-600",
              },
              {
                label: "Informatique",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                ),
                ring: "from-slate-600 to-slate-800",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="group flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-100 py-6 px-3 shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${m.ring} text-white shadow-lg shadow-indigo-200/50 group-hover:scale-105 transition-transform`}>
                  {m.icon}
                </div>
                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Équipe pédagogique — visuel 2 */}
        <section className="bg-gradient-to-b from-white to-teal-50/40 py-16 border-y border-teal-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 text-teal-800 px-4 py-1.5 text-sm font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Expertise &amp; bienveillance
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Une équipe qui croit en chaque élève</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enseignants, encadrement et corps professoral unis pour offrir un cadre sérieux, chaleureux et motivant — comme sur les meilleures plateformes de réussite scolaire.
                </p>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {[
                    { t: "Pédagogie structurée", d: "Parcours clairs et objectifs visibles", i: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    ) },
                    { t: "Accompagnement humain", d: "Écoute et suivi personnalisé", i: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ) },
                    { t: "Clarté pour les parents", d: "Transparence sur les contenus", i: (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    ) },
                    { t: "Exigence & encouragement", d: "Viser l'excellence sans stress", i: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    ) },
                  ].map((row) => (
                    <li key={row.t} className="flex gap-3 rounded-xl border border-teal-100/80 bg-white/80 p-4 shadow-sm">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{row.i}</svg>
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{row.t}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2 relative">
                <div className="absolute -inset-3 bg-gradient-to-tr from-teal-200/50 to-cyan-200/40 rounded-[2rem] blur-xl -z-10" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/why-almourabi-2.png"
                      alt="Équipe éducative diverse et souriante"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 560px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Communauté & collaboration — visuel 3 */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-indigo-200/40 to-violet-200/30 rounded-[2rem] blur-xl -z-10" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-indigo-50">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/why-almourabi-3.png"
                      alt="Élèves et apprentissage collaboratif en ligne"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 560px"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-800 px-4 py-1.5 text-sm font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                  Ensemble, on va plus loin
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Apprendre, échanger, progresser</h3>
                <p className="text-gray-600 leading-relaxed">
                  La plateforme relie communication, contenus numériques et esprit d&apos;équipe : idéal pour rester motivé et voir ses efforts récompensés.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { k: "Échanges & annonces", c: "text-violet-600 bg-violet-50 border-violet-100" },
                    { k: "Travail en autonomie", c: "text-blue-600 bg-blue-50 border-blue-100" },
                    { k: "Croissance continue", c: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                    { k: "Outils modernes", c: "text-amber-600 bg-amber-50 border-amber-100" },
                  ].map((chip) => (
                    <span key={chip.k} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${chip.c}`}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {chip.k}
                    </span>
                  ))}
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  Rejoindre l&apos;aventure
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi nous — réussite scolaire */}
        <section className="bg-gradient-to-b from-indigo-950 to-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold">Réussite scolaire en ligne</h3>
                <p className="mt-4 text-indigo-200 leading-relaxed">
                  Combinez cours, exercices et suivi des progrès. Les parents restent informés ; les enseignants gagnent du temps sur l&apos;organisation et le partage des ressources.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Accès 24h/24 aux contenus et annonces de la classe",
                    "Présence et notes consultables depuis l’espace parent",
                    "Fournitures scolaires et commandes simplifiées",
                    "Interface claire, adaptée mobile et bureau",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-indigo-100">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/40 flex items-center justify-center text-xs">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: "100%", t: "Transparence", d: "Visibilité pour la famille" },
                  { n: "1", t: "Plateforme", d: "École, parents, enseignants" },
                  { n: "TN", t: "Contexte local", d: "Pensé pour la Tunisie" },
                  { n: "∞", t: "Ressources", d: "Contenus évolutifs" },
                ].map((b) => (
                  <div key={b.t} className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5">
                    <p className="text-2xl font-bold text-amber-300">{b.n}</p>
                    <p className="mt-1 font-semibold text-white">{b.t}</p>
                    <p className="mt-1 text-xs text-indigo-200">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900">Comment ça marche ?</h3>
              <p className="mt-3 text-gray-500 text-lg">Simple, rapide et efficace</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-indigo-100" />
              {[
                {
                  step: "01",
                  icon: (
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  title: "Créez votre compte",
                  desc: "Inscrivez-vous en tant qu'enseignant, parent ou administrateur en quelques secondes.",
                },
                {
                  step: "02",
                  icon: (
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  title: "Organisez les classes",
                  desc: "Créez des classes, ajoutez des élèves et assignez les enseignants responsables.",
                },
                {
                  step: "03",
                  icon: (
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: "Suivez les progrès",
                  desc: "Consultez les rapports, la présence et les performances en temps réel.",
                },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center">
                      {icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {step}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Conçu pour chacun</h3>
            <p className="mt-3 text-gray-500 text-lg">Un espace dédié pour chaque rôle</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Teacher card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-6">
                <svg viewBox="0 0 200 140" className="w-full max-w-[200px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Whiteboard */}
                  <rect x="30" y="10" width="140" height="90" rx="8" fill="white" opacity="0.2"/>
                  <rect x="38" y="18" width="124" height="74" rx="4" fill="white" opacity="0.15"/>
                  {/* Math on board */}
                  <text x="55" y="45" fill="white" fontSize="14" fontFamily="monospace" opacity="0.9">f(x) = ax²</text>
                  <line x1="55" y1="60" x2="145" y2="60" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                  <text x="65" y="78" fill="white" fontSize="10" fontFamily="monospace" opacity="0.7">+ bx + c</text>
                  {/* Pointer */}
                  <line x1="148" y1="45" x2="162" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
                  {/* Teacher figure */}
                  <circle cx="163" cy="100" r="14" fill="#FDE68A"/>
                  <rect x="150" y="112" width="26" height="22" rx="6" fill="white" opacity="0.3"/>
                  {/* Stars */}
                  <text x="38" y="130" fontSize="12" fill="#FCD34D">★ ★ ★</text>
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <svg className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pour les enseignants</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">Gérez vos cours, exercices et suivez les performances de chaque élève en temps réel.</p>
              </div>
            </div>

            {/* Parent card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-6">
                <svg viewBox="0 0 200 140" className="w-full max-w-[200px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Phone screen */}
                  <rect x="65" y="5" width="70" height="120" rx="12" fill="white" opacity="0.2"/>
                  <rect x="70" y="20" width="60" height="95" rx="6" fill="white" opacity="0.15"/>
                  {/* Notification cards on phone */}
                  <rect x="74" y="26" width="52" height="18" rx="4" fill="white" opacity="0.3"/>
                  <text x="80" y="38" fill="white" fontSize="7" fontFamily="sans-serif">✓ Présent aujourd&apos;hui</text>
                  <rect x="74" y="50" width="52" height="18" rx="4" fill="white" opacity="0.3"/>
                  <text x="80" y="62" fill="white" fontSize="7" fontFamily="sans-serif">📊 Note: 17/20</text>
                  <rect x="74" y="74" width="52" height="18" rx="4" fill="white" opacity="0.3"/>
                  <text x="80" y="86" fill="white" fontSize="7" fontFamily="sans-serif">📅 Devoir rendu</text>
                  {/* Heart */}
                  <text x="88" y="115" fontSize="14" fill="#FCA5A5">♥</text>
                  {/* Stars */}
                  <text x="38" y="130" fontSize="12" fill="#A7F3D0">★ ★ ★</text>
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pour les parents</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">Suivez les résultats, la présence et recevez des alertes personnalisées pour vos enfants.</p>
              </div>
            </div>

            {/* AI card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center p-6">
                <svg viewBox="0 0 200 140" className="w-full max-w-[200px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Brain / circuit illustration */}
                  <circle cx="100" cy="65" r="38" fill="white" opacity="0.15"/>
                  <circle cx="100" cy="65" r="26" fill="white" opacity="0.15"/>
                  {/* Circuit dots and lines */}
                  <circle cx="100" cy="65" r="6" fill="white" opacity="0.9"/>
                  <line x1="106" y1="65" x2="130" y2="65" stroke="white" strokeWidth="2" opacity="0.6"/>
                  <circle cx="134" cy="65" r="4" fill="#FCD34D" opacity="0.9"/>
                  <line x1="94" y1="65" x2="70" y2="65" stroke="white" strokeWidth="2" opacity="0.6"/>
                  <circle cx="66" cy="65" r="4" fill="#FCD34D" opacity="0.9"/>
                  <line x1="100" y1="59" x2="100" y2="35" stroke="white" strokeWidth="2" opacity="0.6"/>
                  <circle cx="100" cy="31" r="4" fill="#A5F3FC" opacity="0.9"/>
                  <line x1="100" y1="71" x2="100" y2="95" stroke="white" strokeWidth="2" opacity="0.6"/>
                  <circle cx="100" cy="99" r="4" fill="#A5F3FC" opacity="0.9"/>
                  {/* Diagonal lines */}
                  <line x1="106" y1="59" x2="122" y2="43" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="125" cy="40" r="3" fill="#FCA5A5" opacity="0.9"/>
                  <line x1="94" y1="59" x2="78" y2="43" stroke="white" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="75" cy="40" r="3" fill="#FCA5A5" opacity="0.9"/>
                  {/* Spark lines */}
                  <text x="40" y="25" fill="#FCD34D" fontSize="10" opacity="0.8">✦</text>
                  <text x="150" y="30" fill="#A5F3FC" fontSize="8" opacity="0.8">✦</text>
                  <text x="155" y="100" fill="#FCD34D" fontSize="12" opacity="0.8">✦</text>
                  {/* Label */}
                  <text x="72" y="125" fill="white" fontSize="9" fontFamily="sans-serif" opacity="0.8">IA · Recommandations</text>
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                    <svg className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Intelligence artificielle</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">Des recommandations et alertes intelligentes pour améliorer les performances de chaque élève.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="bg-amber-50/60 border-y border-amber-100/80 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900">Ils nous font confiance</h3>
              <p className="mt-3 text-gray-600">Parents et équipes pédagogiques partagent leur expérience</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "Je vois enfin la présence et les notes de mes enfants sans attendre le cahier de liaison.", author: "Parent d’élève", role: "Tunis" },
                { quote: "Moins de paperasse : annonces, ressources et suivi au même endroit.", author: "Enseignant", role: "Mathématiques" },
                { quote: "La plateforme nous aide à garder le lien entre l’école et la maison.", author: "Direction", role: "Établissement partenaire" },
              ].map((x) => (
                <blockquote key={x.author} className="bg-white rounded-2xl shadow-sm border border-amber-100/50 p-6 flex flex-col">
                  <p className="text-amber-600 text-3xl leading-none font-serif">&ldquo;</p>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1 -mt-1">{x.quote}</p>
                  <footer className="mt-4 pt-4 border-t border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{x.author}</p>
                    <p className="text-xs text-gray-500">{x.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900">Questions fréquentes</h3>
            <p className="mt-2 text-gray-500">Tout ce qu’il faut savoir avant de commencer</p>
          </div>
          <div className="space-y-3">
            {[
              { q: "Comment créer un compte parent ?", a: "Utilisez « Espace parents » puis l'inscription : vous indiquez votre CIN (le même que pour l'école). Vos enfants sont liés automatiquement lorsque l'administration les enregistre avec ce CIN. Les comptes enseignant sont créés par l'administration." },
              { q: "Les cours sont-ils en direct ?", a: "SMART e-Learning centralise ressources, annonces, présence et notes. Le mode de cours (présentiel, hybride ou en ligne) dépend de votre établissement." },
              { q: "Mes données sont-elles protégées ?", a: "L’accès est sécurisé par compte. Chaque rôle ne voit que les informations qui lui sont destinées." },
              { q: "Puis-je commander des fournitures ?", a: "Oui : l’espace parent permet de passer commande et de suivre le statut des livraisons." },
            ].map((item) => (
              <details key={item.q} className="group bg-white rounded-xl border border-gray-200 shadow-sm open:shadow-md transition-shadow">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900">
                  {item.q}
                  <span className="text-indigo-500 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact administration */}
        <section id="contact-admin" className="bg-gradient-to-b from-slate-800 to-slate-900 py-16 mb-0 scroll-mt-24">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 mb-4 ring-1 ring-indigo-400/30">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">Contacter l&apos;administration</h3>
              <p className="mt-2 text-slate-400 text-sm sm:text-base">
                École, parent ou partenaire : envoyez un message à l&apos;équipe. Nous vous répondrons sur l&apos;adresse indiquée.
              </p>
            </div>

            {contact === "success" && (
              <div className="mb-6 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 px-4 py-3 text-sm text-center">
                Message envoyé. Merci — nous vous recontacterons bientôt.
              </div>
            )}
            {contact === "missing" && (
              <div className="mb-6 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-100 px-4 py-3 text-sm text-center">
                Veuillez remplir au minimum le nom, l&apos;e-mail et le message.
              </div>
            )}
            {contact === "invalid_email" && (
              <div className="mb-6 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-100 px-4 py-3 text-sm text-center">
                Adresse e-mail invalide.
              </div>
            )}
            {contact === "error" && (
              <div className="mb-6 rounded-xl bg-red-500/15 border border-red-400/40 text-red-100 px-4 py-3 text-sm text-center">
                Envoi impossible pour le moment. Réessayez plus tard ou contactez l&apos;école directement.
              </div>
            )}

            <form action={submitContactAdmin} className="rounded-2xl bg-white/95 shadow-xl border border-white/10 p-6 sm:p-8 space-y-4">
              <div>
                <label htmlFor="ca-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  id="ca-name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label htmlFor="ca-email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="ca-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="vous@exemple.com"
                />
              </div>
              <div>
                <label htmlFor="ca-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  id="ca-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+216 …"
                />
              </div>
              <div>
                <label htmlFor="ca-subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  id="ca-subject"
                  name="subject"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex. inscription, question technique…"
                />
              </div>
              <div>
                <label htmlFor="ca-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ca-message"
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[120px]"
                  placeholder="Décrivez votre demande…"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer à l&apos;administration
              </button>
              <p className="text-xs text-gray-500 pt-1">
                Les champs marqués <span className="text-red-500">*</span> sont obligatoires. Pour créer un compte parent, utilisez{" "}
                <Link href="/register" className="text-indigo-600 font-medium hover:underline">
                  l&apos;inscription
                </Link>
                .
              </p>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">SMART e-Learning</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Plateforme pour l&apos;école primaire tunisienne (1re–6e année) : suivi, ressources et lien famille — école.
                </p>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Navigation</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Inscription parent</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Offre</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#contact-admin" className="hover:text-white transition-colors">Contacter l&apos;administration</a></li>
                  <li><span className="text-gray-500">Établissements &amp; enseignants</span></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Inspiration</p>
                <p className="text-sm leading-relaxed">
                  Conçu dans l&apos;esprit des plateformes de réussite scolaire comme{" "}
                  <a href="https://almourabi.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Almourabi
                  </a>
                  , avec un outil dédié à votre école.
                </p>
              </div>
            </div>
            <p className="text-center text-sm pt-8">© {new Date().getFullYear()} SMART e-Learning. Tous droits réservés.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
