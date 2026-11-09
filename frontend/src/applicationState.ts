import type { HoldStatus, MyHoldResponse } from './api/types'

export function effectiveStatus(
  application: MyHoldResponse,
  now: number,
): HoldStatus {
  if (
    application.status === 'HELD' &&
    new Date(application.expiresAt).getTime() <= now
  ) {
    return 'EXPIRED'
  }

  return application.status
}

export function remainingSeconds(
  application: MyHoldResponse,
  now: number,
) {
  return Math.max(
    0,
    Math.ceil((new Date(application.expiresAt).getTime() - now) / 1000),
  )
}

export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export function canConfirmApplication(
  application: MyHoldResponse,
  now: number,
) {
  return (
    effectiveStatus(application, now) === 'HELD' &&
    remainingSeconds(application, now) > 0
  )
}

export function statusText(status: HoldStatus) {
  return {
    HELD: 'Seat temporarily held',
    CONFIRMED: 'Admission confirmed',
    EXPIRED: 'Hold expired',
    CANCELLED: 'Application cancelled',
  }[status]
}
