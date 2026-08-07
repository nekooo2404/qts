import {
  Blocks,
  ChartNoAxesCombined,
  FileText,
  GitPullRequestArrow,
  LayoutTemplate,
  LifeBuoy,
  MousePointer2,
  Network,
  PanelsTopLeft,
  ScanSearch,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'

const icons = {
  Blocks,
  ChartNoAxesCombined,
  FileText,
  GitPullRequestArrow,
  LayoutTemplate,
  LifeBuoy,
  MousePointer2,
  Network,
  PanelsTopLeft,
  ScanSearch,
  ShieldCheck,
  Waypoints,
} as const

type MarketingIconProps = {
  name: keyof typeof icons | string
  size?: number
}

export function MarketingIcon({ name, size = 22 }: MarketingIconProps) {
  const Icon = icons[name as keyof typeof icons] ?? Blocks
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}
