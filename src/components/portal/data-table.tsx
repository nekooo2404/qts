import type { ReactNode } from 'react'

type DataTableProps = {
  label: string
  children: ReactNode
  mobileCards?: ReactNode
}

export function DataTable({ label, children, mobileCards }: DataTableProps) {
  return (
    <div className="data-table-shell">
      <div className="data-table-scroll">
        <table aria-label={label}>{children}</table>
      </div>
      {mobileCards && <div className="data-table-mobile">{mobileCards}</div>}
    </div>
  )
}
