import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <label className={cn('relative block', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-ink-700 bg-ink-950 pl-10 pr-3 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors duration-200 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}
