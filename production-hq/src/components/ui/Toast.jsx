import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ToastContext = createContext({ notify: () => {} });

/** Small messages in the bottom-right corner, e.g. "Couldn't save your update." */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (message, tone = 'error') => {
      const id = ++nextId.current;
      setToasts((list) => [...list.filter((t) => t.message !== message), { id, message, tone }].slice(-3));
      setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === 'error' ? CircleAlert : CircleCheck;
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border border-line-strong bg-surface-raised px-3.5 py-3 text-sm text-zinc-200 shadow-xl shadow-black/40 motion-safe:animate-fade-in"
            >
              <Icon className={`mt-0.5 size-4 shrink-0 ${t.tone === 'error' ? 'text-rose-400' : 'text-emerald-400'}`} />
              <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-mr-1 rounded p-0.5 text-zinc-500 hover:text-zinc-200"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
