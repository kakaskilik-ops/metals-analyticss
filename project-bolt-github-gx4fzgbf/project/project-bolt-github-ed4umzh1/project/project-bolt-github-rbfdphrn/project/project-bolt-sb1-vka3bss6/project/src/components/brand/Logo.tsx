interface LogoMarkProps {
  className?: string;
}

function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" stroke="#27303B" />
      <path
        d="M10 30L20 9L30 30"
        stroke="#00C781"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 23.5H25.5" stroke="#00C781" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark className="h-10 w-10 shrink-0" />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold uppercase leading-none tracking-[0.2em] text-ink-100">
          Alpha Analyst
        </p>
        <p className="mt-2 text-[9px] font-medium uppercase leading-[1.5] tracking-[0.16em] text-ink-400">
          Аналитика мирового рынка металлов
        </p>
      </div>
    </div>
  );
}
