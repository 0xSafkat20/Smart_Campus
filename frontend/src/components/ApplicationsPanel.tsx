import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { createSchoolAdmissionApi } from '../api/schoolAdmissionApi'
import type { HoldStatus, MyHoldResponse } from '../api/types'
import { RequestFeedback } from './RequestFeedback'

type ApplicationsPanelProps = {
  studentId: string
  syncVersion: number
  onApplicationChanged: () => void
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.'
}

function effectiveStatus(
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

function remainingSeconds(application: MyHoldResponse, now: number) {
  return Math.max(
    0,
    Math.ceil((new Date(application.expiresAt).getTime() - now) / 1000),
  )
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

function statusText(status: HoldStatus) {
  return {
    HELD: 'Seat temporarily held',
    CONFIRMED: 'Admission confirmed',
    EXPIRED: 'Hold expired',
    CANCELLED: 'Application cancelled',
  }[status]
}

function ApplicationStatus({ status }: { status: HoldStatus }) {
  return <span className={`application-status ${status.toLowerCase()}`}>{status}</span>
}

export function ApplicationsPanel({
  studentId,
  syncVersion,
  onApplicationChanged,
}: ApplicationsPanelProps) {
  const api = useMemo(() => createSchoolAdmissionApi(studentId), [studentId])
  const [applications, setApplications] = useState<MyHoldResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyHoldId, setBusyHoldId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const reportedExpiredIds = useRef(new Set<string>())

  const loadApplications = useCallback(async () => {
    setLoadError(null)

    try {
      const nextApplications = await api.getMyHolds()
      setApplications(nextApplications)
      return nextApplications
    } catch (error) {
      setLoadError(getErrorMessage(error))
      return null
    }
  }, [api])

  useEffect(() => {
    let isCurrent = true

    void api
      .getMyHolds()
      .then((nextApplications) => {
        if (isCurrent) {
          setApplications(nextApplications)
          setLoadError(null)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [api, syncVersion])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const expiredHeldIds = applications
    .filter(
      (application) =>
        application.status === 'HELD' &&
        remainingSeconds(application, now) === 0,
    )
    .map((application) => application.holdId)

  useEffect(() => {
    const newlyExpiredIds = expiredHeldIds.filter(
      (holdId) => !reportedExpiredIds.current.has(holdId),
    )

    if (newlyExpiredIds.length === 0) {
      return
    }

    newlyExpiredIds.forEach((holdId) => reportedExpiredIds.current.add(holdId))

    void api
      .getMyHolds()
      .then((nextApplications) => {
        setApplications(nextApplications)
        setNotice('A seat hold expired. The seat is available again.')
        onApplicationChanged()
      })
      .catch((error: unknown) => setActionError(getErrorMessage(error)))
  }, [api, expiredHeldIds, onApplicationChanged])

  async function handleConfirm(application: MyHoldResponse) {
    if (remainingSeconds(application, Date.now()) === 0) {
      setActionError('This hold has expired and cannot be confirmed.')
      return
    }

    setBusyHoldId(application.holdId)
    setActionError(null)
    setNotice(null)

    try {
      await api.confirmHold(application.holdId)
      await loadApplications()
      setNotice(`${application.className} admission was confirmed.`)
      onApplicationChanged()
    } catch (error) {
      setActionError(getErrorMessage(error))
      await loadApplications()
    } finally {
      setBusyHoldId(null)
    }
  }

  async function handleCancel(application: MyHoldResponse) {
    setBusyHoldId(application.holdId)
    setActionError(null)
    setNotice(null)

    try {
      await api.cancelHold(application.holdId)
      await loadApplications()
      setNotice(`${application.className} application was cancelled.`)
      onApplicationChanged()
    } catch (error) {
      setActionError(getErrorMessage(error))
      await loadApplications()
    } finally {
      setBusyHoldId(null)
    }
  }

  const currentApplication =
    applications.find(
      (application) => effectiveStatus(application, now) === 'HELD',
    ) ?? applications[0]
  const currentStatus = currentApplication
    ? effectiveStatus(currentApplication, now)
    : null
  const currentCanConfirm =
    currentApplication !== undefined &&
    currentStatus === 'HELD' &&
    remainingSeconds(currentApplication, now) > 0
  const currentCanCancel =
    currentStatus === 'HELD' || currentStatus === 'CONFIRMED'

  return (
    <section className="applications-section" aria-labelledby="applications-title">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Your admission activity</p>
          <h2 id="applications-title">My applications</h2>
          <p>Track your current hold, confirm the admission fee, or cancel.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void loadApplications()}
          disabled={isLoading}
        >
          Refresh applications
        </button>
      </div>

      <div className="catalog-feedback" aria-live="polite">
        {notice ? <p className="success-notice">{notice}</p> : null}
        {actionError ? <RequestFeedback kind="error" message={actionError} /> : null}
      </div>

      {isLoading ? (
        <RequestFeedback kind="loading" message="Loading your applications…" />
      ) : null}

      {loadError ? (
        <RequestFeedback
          kind="error"
          message={loadError}
          onRetry={() => void loadApplications()}
        />
      ) : null}

      {!isLoading && !loadError && applications.length === 0 ? (
        <div className="catalog-empty">
          <h3>No applications yet</h3>
          <p>Choose an available class above and hold a seat to get started.</p>
        </div>
      ) : null}

      {currentApplication ? (
        <article className="current-application">
          <div>
            <p className="current-label">Current application</p>
            <h3>{currentApplication.className}</h3>
            <p>{statusText(currentStatus ?? currentApplication.status)}</p>
          </div>
          <div className="countdown-block" aria-live="polite">
            <span>
              {currentStatus === 'HELD' || currentStatus === 'EXPIRED'
                ? 'Time remaining'
                : 'Application status'}
            </span>
            <strong>
              {currentStatus === 'HELD' || currentStatus === 'EXPIRED'
                ? formatCountdown(remainingSeconds(currentApplication, now))
                : currentStatus}
            </strong>
          </div>
          <div className="current-actions">
            <button
              className="apply-button"
              type="button"
              disabled={
                busyHoldId === currentApplication.holdId ||
                !currentCanConfirm
              }
              onClick={() => void handleConfirm(currentApplication)}
            >
              {busyHoldId === currentApplication.holdId
                ? 'Working…'
                : currentStatus === 'EXPIRED'
                  ? 'Confirmation disabled'
                  : currentStatus === 'CONFIRMED'
                    ? 'Admission confirmed'
                    : currentStatus === 'CANCELLED'
                      ? 'Application closed'
                      : 'Confirm admission fee'}
            </button>
            {currentCanCancel ? (
              <button
                className="danger-button"
                type="button"
                disabled={busyHoldId === currentApplication.holdId}
                onClick={() => void handleCancel(currentApplication)}
              >
                Cancel application
              </button>
            ) : null}
          </div>
        </article>
      ) : null}

      {applications.length > 0 ? (
        <div className="application-list" aria-label="All applications">
          <div className="application-list-heading">
            <h3>All applications</h3>
            <span>{applications.length} total</span>
          </div>
          {applications.map((application) => {
            const status = effectiveStatus(application, now)
            const isBusy = busyHoldId === application.holdId
            const canConfirm =
              status === 'HELD' && remainingSeconds(application, now) > 0
            const canCancel = status === 'HELD' || status === 'CONFIRMED'
            const showConfirm = status === 'HELD' || status === 'EXPIRED'

            return (
              <article className="application-row" key={application.holdId}>
                <div className="application-summary">
                  <h4>{application.className}</h4>
                  <p>
                    {statusText(status)}
                    {status === 'HELD'
                      ? ` · ${formatCountdown(remainingSeconds(application, now))} left`
                      : ''}
                  </p>
                </div>
                <ApplicationStatus status={status} />
                <div className="application-row-actions">
                  {showConfirm ? (
                    <button
                      className="small-action"
                      type="button"
                      disabled={isBusy || !canConfirm}
                      onClick={() => void handleConfirm(application)}
                    >
                      {status === 'EXPIRED' ? 'Confirm disabled' : 'Confirm'}
                    </button>
                  ) : null}
                  {canCancel ? (
                    <button
                      className="small-action danger"
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleCancel(application)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
