import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="pointer-events-none absolute left-3 size-4 text-zinc-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-white/[0.02] pl-9 pr-8 text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors hover:border-line-strong focus:border-zinc-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 rounded p-0.5 text-zinc-500 hover:text-zinc-200"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
