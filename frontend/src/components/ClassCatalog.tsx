import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { createSchoolAdmissionApi } from '../api/schoolAdmissionApi'
import type { ClassSummary } from '../api/types'
import { RequestFeedback } from './RequestFeedback'

type SharedCatalogProps = {
  syncVersion?: number
  onApplicationChanged?: () => void
}

type ClassCatalogProps = SharedCatalogProps &
  (
    | {
        mode: 'admin'
        studentId?: never
      }
    | {
        mode: 'student'
        studentId: string
      }
  )

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.'
}

export function ClassCatalog({
  mode,
  studentId,
  syncVersion = 0,
  onApplicationChanged,
}: ClassCatalogProps) {
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

  const readCatalog = useCallback(async () => {
    const [nextClasses, applications] = await Promise.all([
      api.getClasses(),
      mode === 'student' ? api.getMyHolds() : Promise.resolve([]),
    ])

    return { nextClasses, applications }
  }, [api, mode])

  const applyCatalog = useCallback(
    ({
      nextClasses,
      applications,
    }: Awaited<ReturnType<typeof readCatalog>>) => {
      setClasses(nextClasses)
      setAppliedClassIds(
        new Set(
          applications
            .filter(
              (application) =>
                application.status === 'HELD' ||
                application.status === 'CONFIRMED',
            )
            .map((application) => application.classId),
        ),
      )
    },
    [],
  )

  const loadClasses = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      applyCatalog(await readCatalog())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [applyCatalog, readCatalog])

  useEffect(() => {
    let isCurrent = true

    void readCatalog()
      .then((catalog) => {
        if (isCurrent) {
          applyCatalog(catalog)
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
  }, [applyCatalog, readCatalog, syncVersion])

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
        `Seat reserved for ${admissionClass.name} until ${new Date(
          hold.expiresAt,
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      )
      await loadClasses()
      onApplicationChanged?.()
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
              <h2 id="create-class-title">Add admission class</h2>
            </div>
          </div>

          <form className="class-form" onSubmit={handleCreateClass} noValidate>
            <label>
              <span>Class &amp; shift</span>
              <input
                name="className"
                maxLength={200}
                placeholder="Class 6 - Morning Shift"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                disabled={isCreating}
              />
            </label>
            <label>
              <span>Seat capacity</span>
              <input
                name="totalSeats"
                type="number"
                min="1"
                step="1"
                placeholder="Example: 120"
                value={totalSeats}
                onChange={(event) => setTotalSeats(event.target.value)}
                disabled={isCreating}
              />
            </label>
            <button className="primary-button class-submit" type="submit" disabled={isCreating}>
              {isCreating ? 'Adding class…' : 'Add class'}
            </button>
          </form>
          {formError ? <p className="inline-error" role="alert">{formError}</p> : null}
        </section>
      ) : null}

      <section className="class-list-section" aria-labelledby="class-list-title">
        <div className="section-heading">
          <div>
            <h2 id="class-list-title">
              Admission classes
            </h2>
            <p>
              {mode === 'admin'
                ? 'Live capacity and admission status for every class and shift.'
                : 'Select a class and reserve one open seat for 10 minutes.'}
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadClasses()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
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
                ? 'Add the first admission class using the form.'
                : 'No admission classes are open right now.'}
            </p>
          </div>
        ) : null}

        {classes.length > 0 ? (
          <div className={`class-list ${mode}`} role="table" aria-label="Admission classes and seats">
            <div className="class-list-header" role="row">
              <span role="columnheader">Class &amp; shift</span>
              <span role="columnheader">Capacity</span>
              <span role="columnheader">Reserved</span>
              <span role="columnheader">Admitted</span>
              <span role="columnheader">Open seats</span>
              {mode === 'student' ? <span role="columnheader">Action</span> : null}
            </div>
            {classes.map((admissionClass) => {
              const isApplying = applyingClassId === admissionClass.id
              const hasApplied = appliedClassIds.has(admissionClass.id)
              const isFull = admissionClass.availableSeats === 0

              return (
                <div className="class-list-row" role="row" key={admissionClass.id}>
                  <div className="class-title-cell" role="cell">
                    <span className="mobile-column-label">Class &amp; shift</span>
                    <strong>{admissionClass.name}</strong>
                  </div>
                  <div className="class-number-cell" role="cell">
                    <span className="mobile-column-label">Capacity</span>
                    <strong>{admissionClass.totalSeats}</strong>
                  </div>
                  <div className="class-number-cell" role="cell">
                    <span className="mobile-column-label">Reserved</span>
                    <strong>{admissionClass.heldSeats}</strong>
                  </div>
                  <div className="class-number-cell" role="cell">
                    <span className="mobile-column-label">Admitted</span>
                    <strong>{admissionClass.confirmedSeats}</strong>
                  </div>
                  <div className="class-number-cell open-seat-cell" role="cell">
                    <span className="mobile-column-label">Open seats</span>
                    <span className={`availability-pill ${isFull ? 'full' : ''}`}>
                      {isFull ? 'Full' : `${admissionClass.availableSeats} open`}
                    </span>
                  </div>

                  {mode === 'student' ? (
                    <div className="class-action-cell" role="cell">
                      <button
                        className="apply-button"
                        type="button"
                        disabled={isFull || isApplying || hasApplied}
                        onClick={() => void handleApply(admissionClass)}
                      >
                        {isApplying
                          ? 'Reserving…'
                          : hasApplied
                            ? 'Reserved'
                            : isFull
                              ? 'Class full'
                              : 'Reserve seat'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )
}
