import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { createSchoolAdmissionApi } from '../api/schoolAdmissionApi'
import {
  canConfirmApplication,
  effectiveStatus,
  formatCountdown,
  remainingSeconds,
  statusText,
} from '../applicationState'
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

function getStatusLabel(status: HoldStatus) {
  return {
    HELD: 'Reserved',
    CONFIRMED: 'Admitted',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
  }[status]
}

function ApplicationStatus({ status }: { status: HoldStatus }) {
  return (
    <span className={`application-status ${status.toLowerCase()}`}>
      {getStatusLabel(status)}
    </span>
  )
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
        setNotice('A reservation expired. The seat is open again.')
        onApplicationChanged()
      })
      .catch((error: unknown) => setActionError(getErrorMessage(error)))
  }, [api, expiredHeldIds, onApplicationChanged])

  async function handleConfirm(application: MyHoldResponse) {
    if (remainingSeconds(application, Date.now()) === 0) {
      setActionError('This reservation has expired and cannot be confirmed.')
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
    canConfirmApplication(currentApplication, now)
  const currentCanCancel =
    currentStatus === 'HELD' || currentStatus === 'CONFIRMED'

  return (
    <section className="applications-section" aria-labelledby="applications-title">
      <div className="section-heading">
        <div>
          <h2 id="applications-title">Application status</h2>
          <p>View your reservation, fee status, and application history.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void loadApplications()}
          disabled={isLoading}
        >
          Refresh
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
          <p>Choose an admission class above and reserve a seat to get started.</p>
        </div>
      ) : null}

      {currentApplication ? (
        <article className="current-application">
          <div>
            <p className="current-label">
              {currentStatus === 'HELD' ? 'Active reservation' : 'Latest application'}
            </p>
            <h3>{currentApplication.className}</h3>
            <p>{statusText(currentStatus ?? currentApplication.status)}</p>
          </div>
          <div className="countdown-block" aria-live="polite">
            <span>
              {currentStatus === 'HELD' || currentStatus === 'EXPIRED'
                ? 'Reservation expires in'
                : 'Application status'}
            </span>
            <strong>
              {currentStatus === 'HELD' || currentStatus === 'EXPIRED'
                ? formatCountdown(remainingSeconds(currentApplication, now))
                : getStatusLabel(currentStatus ?? currentApplication.status)}
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
                    ? 'Admission completed'
                    : currentStatus === 'CANCELLED'
                      ? 'Application closed'
                      : 'Confirm fee payment'}
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
        <div className="application-list" aria-label="Application history">
          <div className="application-list-heading">
            <h3>Application history</h3>
            <span>{applications.length} total</span>
          </div>
          {applications.map((application) => {
            const status = effectiveStatus(application, now)
            const isBusy = busyHoldId === application.holdId
            const canConfirm =
              canConfirmApplication(application, now)
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
