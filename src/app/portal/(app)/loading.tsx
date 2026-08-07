import { LoadingSkeleton } from '@client/components/portal/loading-skeleton'

export default function PortalLoading() {
  return (
    <div className="portal-page">
      <LoadingSkeleton rows={7} />
    </div>
  )
}
