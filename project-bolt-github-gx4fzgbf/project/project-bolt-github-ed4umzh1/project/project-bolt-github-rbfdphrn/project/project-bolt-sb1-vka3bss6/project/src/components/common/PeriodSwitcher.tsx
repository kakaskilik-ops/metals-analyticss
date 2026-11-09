import { PERIODS } from '@/data/periods';
import { cn } from '@/lib/cn';
import type { PeriodKey } from '@/types/market';

interface PeriodSwitcherProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
}

export default function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Период"
      className="inline-flex rounded-lg border border-ink-700 bg-ink-950 p-1"
    >
      {PERIODS.map((period) => {
        const isActive = period.key === value;
        return (
          <button
            key={period.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(period.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-ink-700 text-brand-400 shadow-sm'
                : 'text-ink-400 hover:text-ink-100'
            )}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
