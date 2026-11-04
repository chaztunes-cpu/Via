function initials(name = '') {
  const parts = name.replace(/&/g, ' ').split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default function ClientAvatar({ name, size = 'md' }) {
  const sizes = { sm: 'size-6 text-[10px]', md: 'size-8 text-[11px]' };
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-300 ring-1 ring-inset ring-white/5 ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}
