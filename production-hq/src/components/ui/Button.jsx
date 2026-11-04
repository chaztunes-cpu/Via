const variants = {
  primary: 'bg-zinc-100 text-zinc-900 hover:bg-white shadow-sm',
  secondary: 'bg-white/[0.04] text-zinc-200 ring-1 ring-inset ring-line-strong hover:bg-white/[0.08]',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]',
};

const sizes = {
  md: 'h-9 px-3.5 text-sm gap-1.5',
  sm: 'h-7 px-2.5 text-xs gap-1',
};

export default function Button({ variant = 'primary', size = 'md', className = '', icon: Icon, children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'size-3.5 shrink-0' : 'size-4 shrink-0'} strokeWidth={2} />}
      {children}
    </button>
  );
}
