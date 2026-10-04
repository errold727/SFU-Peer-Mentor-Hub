import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  onClose,
  children,
  variant = 'modal',
  returnFocus,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: 'modal' | 'drawer' | 'timetable';
  returnFocus?: () => HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const focusTarget = useRef(returnFocus);
  focusTarget.current = returnFocus;
  useEffect(() => {
    const d = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    if (variant === 'timetable') document.body.style.overflow = 'hidden';
    d?.showModal();
    return () => {
      d?.close();
      if (variant === 'timetable') document.body.style.overflow = previousOverflow;
      // The launcher may have been removed by clearing the last selected section.
      const target = focusTarget.current?.() ?? (opener?.isConnected ? opener : null);
      target?.focus({ preventScroll: true });
    };
  }, [variant]);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ].filter((e) => e.getClientRects().length);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      aria-label={title}
      className={
        variant === 'drawer'
          ? 'detail-drawer'
          : variant === 'timetable'
            ? 'timetable-dialog'
            : undefined
      }
    >
      <header className="section-heading">
        <h2>{title}</h2>
        <button
          aria-label={variant === 'timetable' ? 'Close timetable' : 'Close details'}
          onClick={onClose}
        >
          <X size={20} />
          {variant === 'timetable' && 'Close'}
        </button>
      </header>
      {children}
    </dialog>
  );
}
