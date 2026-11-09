import type { ReactNode } from 'react';
import Panel from '@/components/common/Panel';

interface MarketStatCardProps {
  label: string;
  value: string;
  footer: ReactNode;
}

export default function MarketStatCard({ label, value, footer }: MarketStatCardProps) {
  return (
    <Panel className="p-5 transition-colors duration-200 hover:border-ink-700">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-400">{label}</p>
      <p className="mt-3 truncate text-2xl font-semibold tabular-nums text-ink-100">{value}</p>
      <div className="mt-2 text-sm text-ink-400">{footer}</div>
    </Panel>
  );
}
