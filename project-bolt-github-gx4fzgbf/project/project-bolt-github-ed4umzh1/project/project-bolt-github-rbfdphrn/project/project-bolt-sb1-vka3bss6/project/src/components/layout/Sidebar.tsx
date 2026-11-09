import { Bot, Gem, TrendingUp, Activity, type LucideIcon } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import DemoBadge from '@/components/common/DemoBadge';
import { cn } from '@/lib/cn';

export type Section = 'market' | 'metals' | 'sources' | 'ai';

const NAV_ITEMS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'market', label: 'Рынок', icon: TrendingUp },
  { id: 'metals', label: 'Металлы', icon: Gem },
  { id: 'sources', label: 'Источники', icon: Activity },
  { id: 'ai', label: 'ИИ-аналитик', icon: Bot },
];

interface SidebarProps {
  active: Section;
  onChange: (section: Section) => void;
}

export default function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="border-b border-ink-800 bg-ink-900/80 backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:self-start md:border-b-0 md:border-r">
      <div className="px-5 pb-4 pt-5 md:px-6 md:pb-6 md:pt-7">
        <Logo />
      </div>

      <nav
        aria-label="Основная навигация"
        className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-4 md:pb-0"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 md:w-full',
                isActive
                  ? 'bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
              )}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-brand-500 md:block" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-ink-800 p-5 md:block">
        <DemoBadge />
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          Металлы с источником LIVE используют реальные котировки. Остальные — демонстрационные данные.
        </p>
      </div>
    </aside>
  );
}
