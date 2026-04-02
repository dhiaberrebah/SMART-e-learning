import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { renumberStudentsSequential } from '@/lib/student-numbers'

async function handleDelete(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const studentId = formData.get('student_id') as string

  // Delete related attendance records first
  await supabase.from('attendance').delete().eq('student_id', studentId)

  const { error } = await supabase.from('students').delete().eq('id', studentId)

  if (error) {
    redirect(`/admin/students/delete/${studentId}?error=` + encodeURIComponent(error.message))
  }

  await renumberStudentsSequential(supabase)
  redirect('/admin/students?success=student_deleted')
}

export default async function DeleteStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select(`*, parent:profiles!students_parent_id_fkey(full_name), class:classes(name)`)
    .eq('id', id)
    .maybeSingle()

  if (!student) redirect('/admin/students')

  const { count: attendanceCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', id)

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/students" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Supprimer l&apos;élève</h1>
      </div>

      {errorParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {decodeURIComponent(errorParam)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-700 text-xl font-bold">
              {(student as any).full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{(student as any).full_name}</p>
            <p className="text-sm text-gray-500">
              {(student as any).student_number ? `N° ${(student as any).student_number}` : 'Pas de numéro'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Classe : {(student as any).class?.name || 'Non inscrit'}
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-medium text-red-800 mb-2">⚠️ Cette action est irréversible</p>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• L&apos;élève sera définitivement supprimé</li>
            {(attendanceCount ?? 0) > 0 && (
              <li>• {attendanceCount} enregistrement(s) de présence seront supprimés</li>
            )}
            <li>• Le compte parent associé ne sera pas affecté</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-5 space-y-1">
          <p>Parent : {(student as any).parent?.full_name || '—'}</p>
          <p>Inscrit le : {new Date((student as any).created_at).toLocaleDateString('fr-FR')}</p>
        </div>

        <form action={handleDelete}>
          <input type="hidden" name="student_id" value={(student as any).id} />
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              Supprimer définitivement
            </button>
            <Link
              href="/admin/students"
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
