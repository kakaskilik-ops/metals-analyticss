import { cn } from '@/lib/cn';
import type { DataStatus } from '@/types/market';

interface DataStatusBadgeProps {
  status: DataStatus;
  className?: string;
}

export default function DataStatusBadge({ status, className }: DataStatusBadgeProps) {
  const isLive = status === 'live' || status === 'cached';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-[0.14em]',
        isLive
          ? 'border-brand-500/30 bg-brand-500/10 text-brand-400'
          : 'border-ink-600 bg-ink-800 text-ink-300',
        className
      )}
    >
      {isLive && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
      )}
      {isLive ? 'LIVE' : 'DEMO'}
    </span>
  );
}
