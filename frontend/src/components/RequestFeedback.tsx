type RequestFeedbackProps = {
  kind: 'loading' | 'error'
  message: string
  onRetry?: () => void
}

export function RequestFeedback({
  kind,
  message,
  onRetry,
}: RequestFeedbackProps) {
  return (
    <div
      className={`request-feedback ${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <span className="feedback-dot" aria-hidden="true" />
      <span>{message}</span>
      {kind === 'error' && onRetry ? (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}
