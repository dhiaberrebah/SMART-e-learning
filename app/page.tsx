import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { submitContactAdmin } from "@/app/actions/contact-admin";
import HomeAnimations from "@/components/HomeAnimations";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string }>;
}) {
  const sp = await searchParams;
  const contact = sp.contact;
  const supabase = await createClient();

  const { data: school } = await supabase
    .from('school_settings')
    .select('school_name')
    .eq('id', true)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#f8f9ff] relative overflow-x-hidden">
      <HomeAnimations />

      {/* ─── Ambient background orbs ─── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="home-orb absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-300/20 blur-[80px]" />
        <div className="home-orb-2 absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-violet-300/15 blur-[100px]" />
        <div className="home-orb absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-200/15 blur-[80px]" />
      </div>

      {/* ─── Navbar ─── */}
      <nav className="home-nav-in bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-400/30 ring-2 ring-white">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
                SMART e-Learning
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="#faq" className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-lg transition-colors hover:bg-indigo-50">
                FAQ
              </Link>
              <Link href="#contact-admin" className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-lg transition-colors hover:bg-indigo-50">
                Contact
              </Link>
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg transition-all hover:bg-indigo-50/80 hover:scale-[1.02] active:scale-[0.98]">
                Connexion
              </Link>
              <Link href="/register" className="home-shimmer-btn px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-400/30 hover:shadow-lg hover:shadow-indigo-400/40 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                Espace parents
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
          {/* Animated grid background */}
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <svg className="home-grid-slide absolute inset-0 w-full h-[120%] opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4f46e5" strokeWidth="0.8"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(99,102,241,0.18),transparent)]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

              {/* Text column */}
              <div className="lg:col-span-6 space-y-8">
                <div className="space-y-6">
                  <span className="home-fade-up home-glow-badge inline-flex items-center gap-2 bg-white text-indigo-800 text-sm font-semibold px-4 py-2 rounded-full border border-indigo-200/80 shadow-lg shadow-indigo-100/60 backdrop-blur-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    {school?.school_name?.trim() || "Primaire tunisien — 1re à 6e année"}
                  </span>

                  <h2 className="home-fade-up home-delay-1 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                    Plateforme{" "}
                    <span className="home-accent-text">intelligente</span>
                    <br className="hidden sm:block" />
                    {" "}pour l&apos;école
                  </h2>

                  <p className="home-fade-up home-delay-2 text-lg text-gray-600 leading-relaxed max-w-xl">
                    Suivi personnalisé pour les élèves du primaire en Tunisie. Enseignants, parents et enfants réunis sur une seule plateforme simple et claire.
                  </p>
                </div>

                <div className="home-fade-up home-delay-3 flex flex-col sm:flex-row gap-3">
                  <Link href="/register" className="home-shimmer-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-xl shadow-indigo-300/40 hover:shadow-2xl hover:shadow-indigo-400/40 hover:-translate-y-0.5 active:translate-y-0">
                    Inscription parent
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-indigo-700 bg-white border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                    Connexion
                  </Link>
                </div>

                {/* Social proof strip */}
                <div className="home-fade-up home-delay-4 flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex -space-x-2">
                    {['bg-indigo-400','bg-violet-400','bg-emerald-400','bg-amber-400'].map((c,i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} ring-2 ring-white flex items-center justify-center text-white text-xs font-bold`}>
                        {['P','E','A','P'][i]}
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-gray-700">500+</strong> familles nous font confiance</span>
                </div>
              </div>

              {/* Visual column */}
              <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-lg home-scale-in home-delay-4">

                  {/* Decorative ring */}
                  <div className="home-spin-slow absolute -z-10 inset-[-10%] rounded-full border border-indigo-200/40 border-dashed" />
                  <div className="home-spin-slow absolute -z-10 inset-[-18%] rounded-full border border-violet-200/25 border-dashed" style={{ animationDirection: 'reverse', animationDuration: '35s' }} />

                  {/* Main image */}
                  <div className="rounded-3xl shadow-2xl shadow-indigo-300/30 overflow-hidden relative z-10 ring-4 ring-white/80">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src="/images%20(1).jpg"
                        alt="Élèves du primaire en classe"
                        fill
                        className="object-cover object-center transition-transform duration-700 ease-out motion-safe:hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 520px"
                        priority
                      />
                      {/* Image overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
                    </div>
                  </div>

                  {/* Floating card — top left */}
                  <div className="home-fade-up home-delay-5 absolute -top-5 -left-5 z-20 hidden sm:block">
                    <div className="home-float flex items-center gap-3 bg-white/98 backdrop-blur-sm rounded-2xl shadow-xl shadow-indigo-200/30 px-4 py-3 border border-white/80">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Présence validée</p>
                        <p className="text-xs text-emerald-500 font-medium">Mathématiques · 8h30</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating card — bottom right */}
                  <div className="home-fade-up home-delay-6 absolute -bottom-5 -right-5 z-20 hidden sm:block">
                    <div className="home-float-slow flex items-center gap-3 bg-white/98 backdrop-blur-sm rounded-2xl shadow-xl shadow-violet-200/30 px-4 py-3 border border-white/80">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Score moyen</p>
                        <p className="text-xs text-indigo-600 font-bold">+12% ce mois 🎉</p>
                      </div>
                    </div>
                  </div>

                  {/* Grade badge */}
                  <div className="home-fade-up home-delay-5 absolute top-1/2 -translate-y-1/2 -right-6 z-20 hidden lg:block">
                    <div className="home-float flex flex-col items-center bg-white/98 backdrop-blur-sm rounded-2xl shadow-xl shadow-amber-200/30 px-3 py-3 border border-white/80" style={{ animationDelay: '2s' }}>
                      <span className="text-2xl font-extrabold text-amber-500">17</span>
                      <span className="text-[10px] text-gray-400 font-medium">/20</span>
                      <span className="text-[10px] text-gray-500 mt-1">Dernière note</span>
                    </div>
                  </div>

                  {/* Blobs */}
                  <div className="home-blob absolute -z-10 top-8 right-4 w-56 h-56 bg-indigo-300/60 rounded-full blur-3xl" />
                  <div className="home-blob-delay absolute -z-10 bottom-4 left-4 w-44 h-44 bg-violet-200/60 rounded-full blur-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ANIMATED STATS STRIP
        ═══════════════════════════════════════════ */}
        <section className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 py-12 overflow-hidden relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_-20%,rgba(255,255,255,0.1),transparent)]" aria-hidden />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { n: 500, suffix: '+', label: 'Familles', icon: '👨‍👩‍👧' },
                { n: 30,  suffix: '+', label: 'Enseignants', icon: '🎓' },
                { n: 6,   suffix: '',  label: 'Niveaux scolaires', icon: '📚' },
                { n: 98,  suffix: '%', label: 'Satisfaction', icon: '⭐' },
              ].map((s) => (
                <div key={s.label} className="reveal text-center">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="text-4xl font-extrabold text-white">
                    <span data-counter={s.n} data-suffix={s.suffix}>0{s.suffix}</span>
                  </div>
                  <div className="text-indigo-200 text-sm font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES — 3 ROLES
        ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-14">
              <span className="home-section-tag">✦ Conçu pour chacun</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Un espace dédié à{" "}
                <span className="home-accent-text">chaque rôle</span>
              </h2>
              <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
                Enseignants, parents et administration — chacun trouve son tableau de bord sur mesure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  delay: '',
                  color: 'from-indigo-500 to-violet-600',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  title: 'Pour les enseignants',
                  desc: 'Gérez vos cours, saisissez présences et notes, partagez des ressources et suivez chaque élève.',
                  chips: ['Classes', 'Notes', 'Présences', 'Ressources'],
                  chipColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                },
                {
                  delay: 'reveal-delay-2',
                  color: 'from-emerald-500 to-teal-600',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ),
                  title: 'Pour les parents',
                  desc: 'Consultez les résultats, la présence et restez connecté à l\'école depuis votre téléphone.',
                  chips: ['Suivi', 'Alertes', 'Messages', 'Fournitures'],
                  chipColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                },
                {
                  delay: 'reveal-delay-4',
                  color: 'from-amber-500 to-orange-600',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Pour l\'administration',
                  desc: 'Pilotez classes, élèves, emplois du temps, statistiques et accès en un seul endroit.',
                  chips: ['Gestion', 'Stats', 'Emploi du temps', 'Rapports'],
                  chipColor: 'bg-amber-50 text-amber-700 border-amber-100',
                },
              ].map((card) => (
                <div key={card.title} className={`reveal home-feat-card ${card.delay} bg-white border border-gray-100 shadow-sm overflow-hidden`}>
                  <div className={`h-2 bg-gradient-to-r ${card.color}`} />
                  <div className="p-6 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-lg`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.chips.map((c) => (
                        <span key={c} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${card.chipColor}`}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — animated steps
        ═══════════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-20 sm:py-24 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-14">
              <span className="home-section-tag">✦ Comment ça marche</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, rapide et efficace</h2>
              <p className="mt-3 text-gray-500 text-lg">Démarrez en 3 étapes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

              {[
                { step: '01', emoji: '👤', title: 'Créez votre compte', desc: 'Inscrivez-vous en tant que parent avec votre CIN. Les comptes enseignants sont créés par l\'administration.', delay: '' },
                { step: '02', emoji: '🏫', title: 'Rejoignez l\'école', desc: 'Vos enfants sont automatiquement liés lorsque l\'administration les enregistre avec votre CIN.', delay: 'reveal-delay-2' },
                { step: '03', emoji: '📊', title: 'Suivez les progrès', desc: 'Consultez présences, notes et ressources en temps réel depuis votre espace personnel.', delay: 'reveal-delay-4' },
              ].map(({ step, emoji, title, desc, delay }) => (
                <div key={step} className={`reveal ${delay} flex flex-col items-center text-center group`}>
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-100 group-hover:shadow-xl group-hover:shadow-indigo-200/50 group-hover:scale-105 transition-all duration-350">
                      <span className="text-3xl">{emoji}</span>
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-extrabold rounded-full flex items-center justify-center shadow-md shadow-indigo-400/40">
                      {step}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            LEVELS GRID
        ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-14">
              <span className="home-section-tag">🇹🇳 École primaire — Tunisie</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                De la 1<sup>re</sup> à la 6<sup>e</sup> année
              </h2>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                Un suivi adapté aux élèves du primaire tunisien, avec leurs parents et leurs enseignants.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: 'Cycle préparatoire', sub: '1re — 3e année', desc: 'Premiers apprentissages : lecture, écriture, calcul et habitudes de vie.', color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', delay: '' },
                { title: 'Cycle primaire', sub: '4e — 6e année', desc: 'Consolidation des bases, autonomie et préparation sereine à la suite.', color: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50', delay: 'reveal-delay-2' },
                { title: 'Programme & matières', sub: 'Fondamentaux', desc: 'Français, arabe, maths, découverte — au rythme du programme tunisien.', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', delay: 'reveal-delay-3' },
                { title: 'Lien école — maison', sub: 'Parents & école', desc: 'Présence, notes et ressources accessibles pour suivre votre enfant.', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', delay: 'reveal-delay-4' },
              ].map((c) => (
                <div key={c.title} className={`reveal ${c.delay} home-feat-card border border-gray-100 overflow-hidden bg-white shadow-sm`}>
                  <div className={`h-1.5 bg-gradient-to-r ${c.color}`} />
                  <div className="p-5">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} mb-3`} style={{ color: 'inherit' }}>
                      {c.sub}
                    </div>
                    <h4 className="text-base font-bold text-gray-900">{c.title}</h4>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SUBJECTS
        ═══════════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-white to-indigo-50/40 py-20 border-t border-indigo-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-12">
              <span className="home-section-tag">📖 Matières &amp; ressources</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Toutes les matières centralisées
              </h2>
              <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
                Cours, devoirs et supports partagés par vos enseignants — au même endroit.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Mathématiques', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>), ring: 'from-violet-500 to-indigo-600', delay: '' },
                { label: 'Sciences',       icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>), ring: 'from-sky-500 to-blue-600', delay: 'reveal-delay-1' },
                { label: 'Français',       icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>), ring: 'from-rose-500 to-pink-600', delay: 'reveal-delay-2' },
                { label: 'Anglais',        icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>), ring: 'from-emerald-500 to-teal-600', delay: 'reveal-delay-3' },
                { label: 'Histoire — Géo', icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), ring: 'from-amber-500 to-orange-600', delay: 'reveal-delay-4' },
                { label: 'Informatique',   icon: (<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>), ring: 'from-slate-600 to-slate-800', delay: 'reveal-delay-5' },
              ].map((m) => (
                <div key={m.label} className={`reveal ${m.delay} group home-feat-card border border-gray-100/80 bg-white shadow-sm flex flex-col items-center justify-center py-7 px-3`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${m.ring} text-white shadow-lg ring-2 ring-white/40 group-hover:scale-110 transition-transform duration-300`}>
                    {m.icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TEAM / PEDAGOGY SECTION
        ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-24 border-y border-teal-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="reveal-left space-y-6">
                <span className="home-section-tag" style={{ background: 'linear-gradient(135deg,#ccfbf1,#d1fae5)', color: '#065f46', borderColor: '#6ee7b7' }}>
                  👩‍🏫 Expertise &amp; bienveillance
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                  Une équipe qui croit<br />en chaque élève
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Enseignants, encadrement et corps professoral unis pour offrir un cadre sérieux, chaleureux et motivant.
                </p>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {[
                    { t: 'Pédagogie structurée',    d: 'Parcours clairs et objectifs visibles',     color: 'bg-teal-500', i: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
                    { t: 'Accompagnement humain',   d: 'Écoute et suivi personnalisé',              color: 'bg-rose-500',  i: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /> },
                    { t: 'Clarté pour les parents', d: 'Transparence sur les contenus',            color: 'bg-indigo-500', i: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></> },
                    { t: 'Exigence & encouragement', d: "Viser l'excellence sans stress",          color: 'bg-amber-500',  i: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
                  ].map((row) => (
                    <li key={row.t} className="home-feat-card border border-gray-100 bg-white shadow-sm flex gap-3 p-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.color} text-white shadow-sm`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{row.i}</svg>
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{row.t}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="reveal-right relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-teal-200/40 to-cyan-200/30 rounded-[2.5rem] blur-2xl -z-10" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-teal-200/30 ring-4 ring-white hover:scale-[1.015] transition-transform duration-500">
                  <div className="relative aspect-[4/3] w-full">
                    <Image src="/why-almourabi-2.png" alt="Équipe éducative" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 560px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            COMMUNITY SECTION
        ═══════════════════════════════════════════ */}
        <section className="bg-white py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="reveal-right relative order-2 lg:order-1">
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/35 to-violet-200/25 rounded-[2.5rem] blur-2xl -z-10" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-200/25 ring-4 ring-indigo-50 hover:scale-[1.015] transition-transform duration-500">
                  <div className="relative aspect-[4/3] w-full">
                    <Image src="/why-almourabi-3.png" alt="Apprentissage collaboratif" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 560px" />
                  </div>
                </div>
              </div>

              <div className="reveal-left order-1 lg:order-2 space-y-6">
                <span className="home-section-tag">💬 Ensemble, on va plus loin</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                  Apprendre, échanger,<br />progresser
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  La plateforme relie communication, contenus numériques et esprit d&apos;équipe : idéal pour rester motivé et voir ses efforts récompensés.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { k: 'Échanges & annonces',  c: 'text-violet-600 bg-violet-50 border-violet-100' },
                    { k: 'Travail en autonomie', c: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { k: 'Croissance continue',  c: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { k: 'Outils modernes',      c: 'text-amber-600 bg-amber-50 border-amber-100' },
                  ].map((chip) => (
                    <span key={chip.k} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${chip.c}`}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {chip.k}
                    </span>
                  ))}
                </div>
                <Link href="/register" className="home-shimmer-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-300/40 hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5 transition-all duration-300">
                  Rejoindre l&apos;aventure
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DARK METRICS SECTION
        ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(99,102,241,0.3),transparent),radial-gradient(ellipse_60%_40%_at_100%_80%,rgba(167,139,250,0.15),transparent)]" aria-hidden />
          {/* Animated dots grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="reveal-left">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Réussite scolaire<br />
                  <span className="text-indigo-300">en ligne</span>
                </h2>
                <p className="mt-4 text-indigo-200 leading-relaxed">
                  Combinez cours, exercices et suivi des progrès. Les parents restent informés, les enseignants gagnent du temps sur l&apos;organisation.
                </p>
                <ul className="mt-8 space-y-3.5">
                  {[
                    'Accès 24h/24 aux contenus et annonces de la classe',
                    'Présence et notes consultables depuis l\'espace parent',
                    'Fournitures scolaires et commandes simplifiées',
                    'Interface claire, adaptée mobile et bureau',
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-indigo-100">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/50 border border-indigo-400/40 flex items-center justify-center text-[10px] text-indigo-200">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="reveal-right grid grid-cols-2 gap-4">
                {[
                  { n: '100%', t: 'Transparence',    d: 'Visibilité pour la famille',        glow: 'hover:border-amber-400/40' },
                  { n: '1',    t: 'Plateforme',       d: 'École, parents, enseignants',       glow: 'hover:border-indigo-400/40' },
                  { n: 'TN',   t: 'Contexte local',   d: 'Pensé pour la Tunisie',             glow: 'hover:border-teal-400/40' },
                  { n: '∞',    t: 'Ressources',       d: 'Contenus évolutifs',                glow: 'hover:border-violet-400/40' },
                ].map((b) => (
                  <div key={b.t} className={`group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 shadow-lg ${b.glow} hover:bg-white/8 transition-all duration-300 hover:-translate-y-1`}>
                    <p className="text-3xl font-extrabold text-amber-300 group-hover:scale-110 transition-transform duration-300 inline-block origin-left">{b.n}</p>
                    <p className="mt-1.5 font-bold text-white">{b.t}</p>
                    <p className="mt-0.5 text-xs text-indigo-300">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════ */}
        <section className="bg-gradient-to-b from-amber-50/50 to-white border-y border-amber-100/60 py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-12">
              <span className="home-section-tag" style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e', borderColor: '#fcd34d' }}>
                ⭐ Ils nous font confiance
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">Ce qu&apos;ils disent de nous</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: 'Je vois enfin la présence et les notes de mes enfants sans attendre le cahier de liaison.', author: 'Parent d\'élève', role: 'Tunis', avatar: 'P', color: 'bg-indigo-500' },
                { quote: 'Moins de paperasse : annonces, ressources et suivi au même endroit. Un gain de temps considérable.', author: 'Enseignant', role: 'Mathématiques', avatar: 'E', color: 'bg-teal-500' },
                { quote: 'La plateforme nous aide à garder le lien entre l\'école et la maison au quotidien.', author: 'Direction', role: 'Établissement partenaire', avatar: 'D', color: 'bg-amber-500' },
              ].map((x, i) => (
                <blockquote key={x.author} className={`reveal reveal-delay-${i+1} home-feat-card border border-gray-100 bg-white shadow-sm p-6 flex flex-col`}>
                  <div className="text-indigo-200 text-5xl leading-none font-serif mb-2">&ldquo;</div>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1 -mt-3">{x.quote}</p>
                  <footer className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className={`w-9 h-9 ${x.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{x.avatar}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{x.author}</p>
                      <p className="text-xs text-gray-400">{x.role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <section id="faq" className="py-20 sm:py-24 scroll-mt-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-12">
              <span className="home-section-tag">❓ Questions fréquentes</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Tout ce qu&apos;il faut savoir
              </h2>
              <p className="mt-3 text-gray-500">Avant de commencer</p>
            </div>
            <div className="space-y-3">
              {[
                { q: 'Comment créer un compte parent ?', a: 'Utilisez « Espace parents » puis l\'inscription : vous indiquez votre CIN (le même que pour l\'école). Vos enfants sont liés automatiquement lorsque l\'administration les enregistre avec ce CIN. Les comptes enseignant sont créés par l\'administration.' },
                { q: 'Les cours sont-ils en direct ?',   a: 'SMART e-Learning centralise ressources, annonces, présence et notes. Le mode de cours (présentiel, hybride ou en ligne) dépend de votre établissement.' },
                { q: 'Mes données sont-elles protégées ?', a: 'L\'accès est sécurisé par compte. Chaque rôle ne voit que les informations qui lui sont destinées.' },
                { q: 'Puis-je commander des fournitures ?', a: 'Oui : l\'espace parent permet de passer commande et de suivre le statut des livraisons.' },
              ].map((item, i) => (
                <details key={item.q} className={`reveal reveal-delay-${i+1} group bg-white rounded-2xl border border-gray-200 shadow-sm open:shadow-md open:border-indigo-200 transition-all duration-300`}>
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900">
                    {item.q}
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl leading-none group-open:rotate-45 transition-transform duration-300">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CONTACT FORM
        ═══════════════════════════════════════════ */}
        <section id="contact-admin" className="bg-gradient-to-b from-slate-800 to-slate-950 py-20 scroll-mt-24">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 mb-4 ring-1 ring-indigo-400/30">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Contacter l&apos;administration</h2>
              <p className="mt-2 text-slate-400 text-sm sm:text-base">
                École, parent ou partenaire : envoyez un message à l&apos;équipe.
              </p>
            </div>

            {contact === 'success' && (
              <div className="mb-6 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 px-4 py-3 text-sm text-center">
                Message envoyé. Merci — nous vous recontacterons bientôt.
              </div>
            )}
            {(contact === 'missing' || contact === 'invalid_email') && (
              <div className="mb-6 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-100 px-4 py-3 text-sm text-center">
                {contact === 'invalid_email' ? 'Adresse e-mail invalide.' : 'Veuillez remplir au minimum le nom, l\'e-mail et le message.'}
              </div>
            )}
            {contact === 'error' && (
              <div className="mb-6 rounded-xl bg-red-500/15 border border-red-400/40 text-red-100 px-4 py-3 text-sm text-center">
                Envoi impossible pour le moment. Réessayez plus tard.
              </div>
            )}

            <form action={submitContactAdmin} className="reveal reveal-scale rounded-2xl bg-white/98 backdrop-blur-sm shadow-2xl shadow-black/30 border border-white/20 p-6 sm:p-8 space-y-4">
              {[
                { id: 'ca-name',    name: 'full_name', type: 'text',  label: 'Nom complet',   required: true,  placeholder: 'Votre nom',              auto: 'name' },
                { id: 'ca-email',   name: 'email',     type: 'email', label: 'E-mail',         required: true,  placeholder: 'vous@exemple.com',        auto: 'email' },
                { id: 'ca-phone',   name: 'phone',     type: 'tel',   label: 'Téléphone',      required: false, placeholder: '+216 …',                  auto: 'tel' },
                { id: 'ca-subject', name: 'subject',   type: 'text',  label: 'Sujet',          required: false, placeholder: 'Ex. inscription…',        auto: 'off' },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label} {f.required ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optionnel)</span>}
                  </label>
                  <input id={f.id} name={f.name} type={f.type} required={f.required} autoComplete={f.auto}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label htmlFor="ca-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea id="ca-message" name="message" required rows={5}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[120px] transition-shadow"
                  placeholder="Décrivez votre demande…" />
              </div>
              <button type="submit" className="home-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 hover:from-indigo-500 hover:to-violet-500 transition-all hover:-translate-y-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Envoyer à l&apos;administration
              </button>
              <p className="text-xs text-gray-500 pt-1">
                Pour créer un compte parent, utilisez{" "}
                <Link href="/register" className="text-indigo-600 font-medium hover:underline">l&apos;inscription</Link>.
              </p>
            </form>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════ */}
        <footer className="bg-gray-950 text-gray-400 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">SMART e-Learning</span>
                </div>
                <p className="text-sm leading-relaxed">Plateforme pour l&apos;école primaire tunisienne (1re–6e année) : suivi, ressources et lien famille — école.</p>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Navigation</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Inscription parent</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Ressources</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#contact-admin" className="hover:text-white transition-colors">Contact administration</a></li>
                  <li><span className="text-gray-600">Établissements &amp; enseignants</span></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-4">Inspiration</p>
                <p className="text-sm leading-relaxed">
                  Conçu dans l&apos;esprit des plateformes comme{" "}
                  <a href="https://almourabi.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Almourabi</a>,
                  adapté à votre école.
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

