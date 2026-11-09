import { formatDateTime } from '@/lib/format';

interface LastUpdatedProps {
  at: Date;
}

export default function LastUpdated({ at }: LastUpdatedProps) {
  return (
    <p className="flex items-center gap-2 text-xs text-ink-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      <span>
        Последнее обновление: <span className="tabular-nums text-ink-200">{formatDateTime(at.getTime())}</span>
      </span>
    </p>
  );
}
