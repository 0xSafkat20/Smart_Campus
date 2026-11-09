type BrandProps = {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={compact ? 'app-brand' : 'brand-lockup'}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3.5 9.25 12 4l8.5 5.25" />
          <path d="M5.5 10.5h13v8h-13z" />
          <path d="M3.5 20h17M9 11v7.5M15 11v7.5" />
        </svg>
      </span>
      <div>
        <p className="brand-name">School Admission Portal</p>
        <p className="brand-caption">Online admission services</p>
      </div>
    </div>
  )
}
