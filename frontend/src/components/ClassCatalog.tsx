import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createSchoolAdmissionApi } from '../api/schoolAdmissionApi'
import type { ClassSummary } from '../api/types'
import { RequestFeedback } from './RequestFeedback'

type ClassCatalogProps =
  | {
      mode: 'admin'
      studentId?: never
    }
  | {
      mode: 'student'
      studentId: string
    }

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.'
}

function SeatMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="seat-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ClassCatalog({ mode, studentId }: ClassCatalogProps) {
  const api = useMemo(
    () => createSchoolAdmissionApi(mode === 'student' ? studentId : undefined),
    [mode, studentId],
  )
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [totalSeats, setTotalSeats] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [applyingClassId, setApplyingClassId] = useState<string | null>(null)
  const [appliedClassIds, setAppliedClassIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadClasses = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setClasses(await api.getClasses())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [api])

  useEffect(() => {
    let isCurrent = true

    void api
      .getClasses()
      .then((nextClasses) => {
        if (isCurrent) {
          setClasses(nextClasses)
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
  }, [api])

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = className.trim()
    const seats = Number(totalSeats)

    setFormError(null)
    setActionError(null)
    setNotice(null)

    if (!name) {
      setFormError('Enter a class name.')
      return
    }

    if (!Number.isInteger(seats) || seats < 1) {
      setFormError('Total seats must be a whole number greater than zero.')
      return
    }

    setIsCreating(true)

    try {
      await api.createClass({ name, totalSeats: seats })
      setClassName('')
      setTotalSeats('')
      setNotice(`${name} was created successfully.`)
      await loadClasses()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleApply(admissionClass: ClassSummary) {
    setApplyingClassId(admissionClass.id)
    setActionError(null)
    setNotice(null)

    try {
      const hold = await api.createHold(admissionClass.id)
      setAppliedClassIds((current) => new Set(current).add(admissionClass.id))
      setNotice(
        `Seat held for ${admissionClass.name} until ${new Date(
          hold.expiresAt,
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      )
      await loadClasses()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setApplyingClassId(null)
    }
  }

  return (
    <div className={`class-workspace ${mode}`}>
      {mode === 'admin' ? (
        <section className="class-admin-card" aria-labelledby="create-class-title">
          <div className="section-heading compact">
            <div>
              <p className="card-kicker">Admin tool</p>
              <h2 id="create-class-title">Create a class</h2>
            </div>
            <span className="section-step">1</span>
          </div>

          <form className="class-form" onSubmit={handleCreateClass} noValidate>
            <label>
              <span>Class name</span>
              <input
                name="className"
                maxLength={200}
                placeholder="Example: Class 1"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                disabled={isCreating}
              />
            </label>
            <label>
              <span>Total seats</span>
              <input
                name="totalSeats"
                type="number"
                min="1"
                step="1"
                placeholder="Example: 30"
                value={totalSeats}
                onChange={(event) => setTotalSeats(event.target.value)}
                disabled={isCreating}
              />
            </label>
            <button className="primary-button class-submit" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating class…' : 'Create class'}
            </button>
          </form>
          {formError ? <p className="inline-error" role="alert">{formError}</p> : null}
        </section>
      ) : null}

      <section className="class-list-section" aria-labelledby="class-list-title">
        <div className="section-heading">
          <div>
            <p className="card-kicker">
              {mode === 'admin' ? 'Live availability' : 'Open for application'}
            </p>
            <h2 id="class-list-title">
              {mode === 'admin' ? 'Classes and seat counts' : 'Available classes'}
            </h2>
            <p>
              {mode === 'admin'
                ? 'Counts come directly from the admission database.'
                : 'Choose a class to hold one seat for ten minutes.'}
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadClasses()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing…' : 'Refresh counts'}
          </button>
        </div>

        <div className="catalog-feedback" aria-live="polite">
          {notice ? <p className="success-notice">{notice}</p> : null}
          {actionError ? <RequestFeedback kind="error" message={actionError} /> : null}
        </div>

        {isLoading && classes.length === 0 ? (
          <RequestFeedback kind="loading" message="Loading classes and seat counts…" />
        ) : null}

        {loadError ? (
          <RequestFeedback kind="error" message={loadError} onRetry={() => void loadClasses()} />
        ) : null}

        {!isLoading && !loadError && classes.length === 0 ? (
          <div className="catalog-empty">
            <h3>No classes yet</h3>
            <p>
              {mode === 'admin'
                ? 'Create the first class using the form above.'
                : 'An administrator has not created a class yet.'}
            </p>
          </div>
        ) : null}

        {classes.length > 0 ? (
          <div className="class-card-grid">
            {classes.map((admissionClass) => {
              const isApplying = applyingClassId === admissionClass.id
              const hasApplied = appliedClassIds.has(admissionClass.id)
              const isFull = admissionClass.availableSeats === 0

              return (
                <article className="class-card" key={admissionClass.id}>
                  <div className="class-card-heading">
                    <div>
                      <span className="class-label">School class</span>
                      <h3>{admissionClass.name}</h3>
                    </div>
                    <span className={`availability-pill ${isFull ? 'full' : ''}`}>
                      {isFull ? 'Full' : `${admissionClass.availableSeats} available`}
                    </span>
                  </div>

                  <div className="seat-metrics" aria-label={`${admissionClass.name} seat counts`}>
                    <SeatMetric label="Total" value={admissionClass.totalSeats} />
                    <SeatMetric label="Held" value={admissionClass.heldSeats} />
                    <SeatMetric label="Confirmed" value={admissionClass.confirmedSeats} />
                    <SeatMetric label="Available" value={admissionClass.availableSeats} />
                  </div>

                  {mode === 'student' ? (
                    <button
                      className="apply-button"
                      type="button"
                      disabled={isFull || isApplying || hasApplied}
                      onClick={() => void handleApply(admissionClass)}
                    >
                      {isApplying
                        ? 'Holding seat…'
                        : hasApplied
                          ? 'Seat held'
                          : isFull
                            ? 'No seats available'
                            : 'Apply and hold seat'}
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )
}
