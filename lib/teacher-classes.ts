/**
 * A teacher can be linked to a class either as the primary teacher (classes.teacher_id)
 * or as a subject teacher (subjects.teacher_id). This helper combines both sources.
 */

export async function getTeacherClassIds(db: any, teacherId: string): Promise<string[]> {
  const [{ data: direct }, { data: viaSubjects }] = await Promise.all([
    db.from('classes').select('id').eq('teacher_id', teacherId),
    db.from('subjects').select('class_id').eq('teacher_id', teacherId),
  ])
  const ids = new Set<string>()
  for (const c of direct ?? []) ids.add(c.id)
  for (const s of viaSubjects ?? []) if (s.class_id) ids.add(s.class_id)
  return [...ids]
}

export async function getTeacherClasses(
  db: any,
  teacherId: string,
  select = 'id, name, description, grade_level, academic_year'
) {
  const ids = await getTeacherClassIds(db, teacherId)
  if (ids.length === 0) return []
  const { data } = await db.from('classes').select(select).in('id', ids).order('name')
  return data ?? []
}

/** Check if a teacher is allowed to act on a given class (primary or via subject). */
export async function teacherCanAccessClass(
  db: any,
  teacherId: string,
  classId: string
): Promise<boolean> {
  const [{ data: direct }, { data: via }] = await Promise.all([
    db.from('classes').select('id').eq('id', classId).eq('teacher_id', teacherId).maybeSingle(),
    db.from('subjects').select('id').eq('class_id', classId).eq('teacher_id', teacherId).limit(1).maybeSingle(),
  ])
  return !!(direct || via)
}
