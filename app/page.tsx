import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      redirect(`/${profile.role}/dashboard`);
    }
  }

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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                🚀 Plateforme éducative nouvelle génération
              </span>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl leading-tight">
                Plateforme d&apos;apprentissage{" "}
                <span className="text-indigo-600">intelligent</span>
              </h2>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed">
                Améliorez l&apos;apprentissage en ligne avec un suivi personnalisé pour chaque élève. Enseignants, parents et élèves réunis sur une seule plateforme.
              </p>
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link
                  href="/register"
                  className="px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Inscription parent
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 text-base font-medium text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Connexion
                </Link>
              </div>
              {/* Stats */}
              <div className="mt-10 flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">500+</p>
                  <p className="text-sm text-gray-500 mt-1">Élèves actifs</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-indigo-600">50+</p>
                  <p className="text-sm text-gray-500 mt-1">Enseignants</p>
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-indigo-600">98%</p>
                  <p className="text-sm text-gray-500 mt-1">Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                {/* Main illustration card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 relative z-10">
                  <svg viewBox="0 0 400 300" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background */}
                    <rect width="400" height="300" rx="16" fill="#F5F7FF"/>

                    {/* Desk */}
                    <rect x="60" y="220" width="280" height="10" rx="5" fill="#C7D2FE"/>
                    <rect x="100" y="230" width="12" height="40" rx="6" fill="#A5B4FC"/>
                    <rect x="288" y="230" width="12" height="40" rx="6" fill="#A5B4FC"/>

                    {/* Laptop screen */}
                    <rect x="110" y="130" width="180" height="100" rx="8" fill="#6366F1"/>
                    <rect x="118" y="138" width="164" height="84" rx="4" fill="#EEF2FF"/>

                    {/* Screen content - chart bars */}
                    <rect x="130" y="185" width="18" height="28" rx="3" fill="#6366F1" opacity="0.7"/>
                    <rect x="155" y="172" width="18" height="41" rx="3" fill="#6366F1"/>
                    <rect x="180" y="180" width="18" height="33" rx="3" fill="#6366F1" opacity="0.5"/>
                    <rect x="205" y="165" width="18" height="48" rx="3" fill="#6366F1"/>
                    <rect x="230" y="175" width="18" height="38" rx="3" fill="#6366F1" opacity="0.7"/>
                    {/* Chart label */}
                    <text x="168" y="152" fill="#6366F1" fontSize="9" fontWeight="600" fontFamily="sans-serif">Performances</text>

                    {/* Laptop base */}
                    <rect x="95" y="228" width="210" height="8" rx="4" fill="#818CF8"/>
                    <rect x="165" y="224" width="70" height="6" rx="3" fill="#A5B4FC"/>

                    {/* Student figure */}
                    <circle cx="310" cy="145" r="22" fill="#FDE68A"/>
                    <ellipse cx="310" cy="200" rx="24" ry="28" fill="#6366F1"/>
                    {/* Arms */}
                    <path d="M286 185 Q270 195 268 210" stroke="#6366F1" strokeWidth="10" strokeLinecap="round"/>
                    <path d="M334 185 Q350 195 252 210" stroke="#6366F1" strokeWidth="10" strokeLinecap="round"/>
                    {/* Hair */}
                    <path d="M288 138 Q290 118 310 115 Q330 118 332 138" fill="#1E1B4B"/>

                    {/* Floating elements */}
                    {/* Star 1 */}
                    <circle cx="70" cy="80" r="6" fill="#FCD34D"/>
                    <circle cx="340" cy="60" r="4" fill="#A5B4FC"/>
                    <circle cx="360" cy="200" r="5" fill="#FCA5A5"/>

                    {/* Book icon top-left */}
                    <rect x="48" y="100" width="40" height="50" rx="6" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2"/>
                    <line x1="56" y1="112" x2="80" y2="112" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="56" y1="120" x2="80" y2="120" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="56" y1="128" x2="72" y2="128" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="54" y="100" width="4" height="50" rx="2" fill="#C7D2FE"/>

                    {/* Trophy top-right */}
                    <rect x="330" y="90" width="36" height="32" rx="6" fill="#FFFFFF" stroke="#FCD34D" strokeWidth="2"/>
                    <text x="342" y="112" fill="#F59E0B" fontSize="16" fontFamily="sans-serif">🏆</text>

                    {/* Notification badge */}
                    <circle cx="355" cy="140" r="14" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2"/>
                    <text x="349" y="145" fill="#6366F1" fontSize="13" fontFamily="sans-serif">✓</text>
                  </svg>
                </div>

                {/* Floating card 1 — top left */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 z-20">
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
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 z-20">
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

        {/* CTA Banner */}
        <section className="bg-indigo-600 py-16 mb-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-5xl mb-4">🎓</div>
            <h3 className="text-3xl font-bold text-white mb-4">Prêt à transformer l&apos;éducation ?</h3>
            <p className="text-indigo-200 text-lg mb-8">
              Rejoignez des centaines d&apos;écoles qui font confiance à SMART e-Learning.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-lg"
            >
              Créer un compte parent
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-white font-bold">SMART e-Learning</span>
            </div>
            <p className="text-sm">© 2025 SMART e-Learning. Tous droits réservés.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
