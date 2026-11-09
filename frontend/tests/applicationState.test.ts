import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canConfirmApplication,
  effectiveStatus,
  formatCountdown,
  remainingSeconds,
  statusText,
} from '../src/applicationState.ts'
import type { MyHoldResponse } from '../src/api/types.ts'

const now = Date.parse('2026-11-09T12:00:00.000Z')

function application(
  status: MyHoldResponse['status'],
  expiresAt: string,
): MyHoldResponse {
  return {
    holdId: '11111111-1111-1111-1111-111111111111',
    classId: '22222222-2222-2222-2222-222222222222',
    className: 'Class 1',
    status,
    expiresAt,
  }
}

test('a live HELD application keeps its status and can be confirmed', () => {
  const hold = application('HELD', '2026-11-09T12:10:00.000Z')

  assert.equal(effectiveStatus(hold, now), 'HELD')
  assert.equal(remainingSeconds(hold, now), 600)
  assert.equal(canConfirmApplication(hold, now), true)
})

test('a HELD application becomes EXPIRED exactly at the deadline', () => {
  const hold = application('HELD', '2026-11-09T12:00:00.000Z')

  assert.equal(effectiveStatus(hold, now), 'EXPIRED')
  assert.equal(remainingSeconds(hold, now), 0)
  assert.equal(canConfirmApplication(hold, now), false)
})

test('non-held applications cannot be confirmed', () => {
  for (const status of ['CONFIRMED', 'EXPIRED', 'CANCELLED'] as const) {
    const hold = application(status, '2026-11-09T12:10:00.000Z')
    assert.equal(canConfirmApplication(hold, now), false)
    assert.ok(statusText(status).length > 0)
  }
})

test('countdown uses a stable MM:SS display', () => {
  assert.equal(formatCountdown(601), '10:01')
  assert.equal(formatCountdown(60), '01:00')
  assert.equal(formatCountdown(0), '00:00')
})
