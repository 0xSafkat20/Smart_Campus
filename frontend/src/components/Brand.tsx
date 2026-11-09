type BrandProps = {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={compact ? 'app-brand' : 'brand-lockup'}>
      <span className="brand-mark" aria-hidden="true">
        SA
      </span>
      <div>
        <p className="brand-name">School Admission</p>
        <p className="brand-caption">Online application portal</p>
      </div>
    </div>
  )
}
