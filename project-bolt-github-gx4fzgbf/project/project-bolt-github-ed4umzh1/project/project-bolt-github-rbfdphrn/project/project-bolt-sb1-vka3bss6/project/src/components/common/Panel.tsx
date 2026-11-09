import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export default function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-ink-800 bg-ink-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        className
      )}
    >
      {children}
    </section>
  );
}
