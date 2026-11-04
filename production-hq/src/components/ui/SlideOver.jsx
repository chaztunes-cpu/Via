import { useEffect, useRef } from 'react';

/**
 * Right-hand slide-out panel. Esc or a click on the backdrop closes it.
 * A field that handles Esc itself (e.g. cancelling an edit) should call
 * e.preventDefault() so the panel stays open.
 */
export default function SlideOver({ open, onClose, labelledBy, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="absolute inset-0 bg-black/50 motion-safe:animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-2xl shadow-black/50 outline-none motion-safe:animate-slide-in sm:max-w-[480px]"
      >
        {children}
      </div>
    </div>
  );
}
