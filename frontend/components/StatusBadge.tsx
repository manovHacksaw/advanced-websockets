import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'scheduled' | 'live' | 'finished'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'live') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white uppercase tracking-wide', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Live
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wide', className)}>
        FT
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-500 uppercase tracking-wide', className)}>
      Soon
    </span>
  )
}
