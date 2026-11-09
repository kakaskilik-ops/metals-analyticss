import { cn } from '@/lib/cn';

interface DemoBadgeProps {
  className?: string;
}

export default function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-ink-600 bg-ink-800 px-2 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-ink-300',
        className
      )}
    >
      DEMO
    </span>
  );
}
