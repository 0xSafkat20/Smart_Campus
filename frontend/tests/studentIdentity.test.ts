import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isValidStudentId,
  normalizeStudentId,
  STUDENT_ID_LENGTH,
} from '../src/studentIdentity.ts'

test('student identity keeps only the first 17 digits', () => {
  assert.equal(
    normalizeStudentId('20 15-2691 abc 234567890999'),
    '20152691234567890',
  )
  assert.equal(STUDENT_ID_LENGTH, 17)
})

test('student identity requires exactly 17 digits', () => {
  assert.equal(isValidStudentId('20152691234567890'), true)
  assert.equal(isValidStudentId('2015269123456789'), false)
  assert.equal(isValidStudentId('2015269123456789A'), false)
})
