import { useState, type FormEvent } from 'react'
import {
  isValidStudentId,
  normalizeStudentId,
  STUDENT_ID_LENGTH,
} from '../studentIdentity'
import { Brand } from './Brand'

type StudentIdentityScreenProps = {
  onContinue: (studentId: string) => void
}

export function StudentIdentityScreen({
  onContinue,
}: StudentIdentityScreenProps) {
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidStudentId(studentId)) {
      setError('Enter your complete 17-digit registration number.')
      return
    }

    setError('')
    onContinue(studentId)
  }

  return (
    <main className="identity-page">
      <section className="identity-intro" aria-label="Admission portal overview">
        <div className="intro-content">
          <Brand />

          <div className="intro-copy">
            <p className="eyebrow">Admission 2026</p>
            <h1>Your school journey starts here.</h1>
            <p>
              Review available classes, reserve a seat, and complete your
              admission from one clear and secure place.
            </p>

            <ul className="intro-points">
              <li>
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                Live seat availability
              </li>
              <li>
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                Simple application tracking
              </li>
              <li>
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                No account or password required
              </li>
            </ul>
          </div>

          <p className="intro-footer">
            A simple admission experience for students and guardians.
          </p>
        </div>
      </section>

      <section className="identity-form-panel" aria-labelledby="identity-title">
        <div className="identity-form-wrap">
          <div className="mobile-brand">
            <Brand compact />
          </div>

          <p className="eyebrow">Student access</p>
          <h2 id="identity-title">Find your admission workspace</h2>
          <p className="form-description">
            Enter the 17-digit birth registration number used for this
            application. We will remember it on this device.
          </p>

          <form className="student-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="student-id">
              Birth registration number
            </label>

            <div className={`input-shell${error ? ' has-error' : ''}`}>
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.75 6.25A2.25 2.25 0 0 1 7 4h10a2.25 2.25 0 0 1 2.25 2.25v11.5A2.25 2.25 0 0 1 17 20H7a2.25 2.25 0 0 1-2.25-2.25V6.25Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 9.25h8M8 13h5M8 16.75h3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                id="student-id"
                name="studentId"
                type="text"
                value={studentId}
                onChange={(event) => {
                  setStudentId(normalizeStudentId(event.target.value))
                  if (error) setError('')
                }}
                inputMode="numeric"
                autoComplete="off"
                maxLength={STUDENT_ID_LENGTH}
                placeholder="Example: 20152691234567890"
                aria-describedby={error ? 'student-id-error' : 'student-id-help'}
                aria-invalid={Boolean(error)}
                autoFocus
              />
              <span className="input-count" aria-hidden="true">
                {studentId.length}/{STUDENT_ID_LENGTH}
              </span>
            </div>

            <div className="field-support">
              {error ? (
                <p className="field-error" id="student-id-error" role="alert">
                  {error}
                </p>
              ) : (
                <span id="student-id-help">Numbers only, without spaces.</span>
              )}
            </div>

            <button className="primary-button" type="submit">
              Continue to admission portal
            </button>
          </form>

          <div className="privacy-note">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7.5 10V7.75a4.5 4.5 0 0 1 9 0V10m-10 0h11A1.5 1.5 0 0 1 19 11.5v7A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-7A1.5 1.5 0 0 1 6.5 10Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Your registration number stays on this device and is used only to
              retrieve your applications.
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
