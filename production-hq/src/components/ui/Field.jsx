import { forwardRef } from 'react';

export const inputClass =
  'w-full rounded-lg border border-line bg-white/[0.02] text-sm text-zinc-200 placeholder:text-zinc-500 transition-colors hover:border-line-strong focus:border-zinc-500 focus:outline-none';

/** Small uppercase label used for panel sections and form fields. */
export function FieldLabel({ htmlFor, children, as: Tag = 'label' }) {
  return (
    <Tag htmlFor={htmlFor} className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </Tag>
  );
}

export function Field({ id, label, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      {children}
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={`h-9 px-3 ${inputClass} ${className}`} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`resize-none px-3 py-2.5 leading-relaxed ${inputClass} ${className}`} {...props} />;
});

/** Date picker that works in "YYYY-MM-DD" strings. */
export const DateInput = forwardRef(function DateInput({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      type="date"
      className={`h-9 px-3 ${inputClass} [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-80 ${className}`}
      {...props}
    />
  );
});
