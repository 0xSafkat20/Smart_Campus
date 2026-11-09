export const STUDENT_ID_LENGTH = 17
const STORAGE_KEY = 'school-admission.student-id'
const STUDENT_ID_PATTERN = /^\d{17}$/

export function normalizeStudentId(value: string) {
  return value.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH)
}

export function isValidStudentId(value: string) {
  return STUDENT_ID_PATTERN.test(value)
}

export function getStoredStudentId() {
  const storedValue = window.localStorage.getItem(STORAGE_KEY)
  return storedValue && isValidStudentId(storedValue) ? storedValue : null
}

export function storeStudentId(studentId: string) {
  window.localStorage.setItem(STORAGE_KEY, studentId)
}

export function clearStoredStudentId() {
  window.localStorage.removeItem(STORAGE_KEY)
}
