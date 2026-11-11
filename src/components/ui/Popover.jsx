import { useCallback, useRef, useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

/** Button + floating panel. `children` receives a `close` function. */
export default function Popover({ trigger, children, align = 'right', className = 'w-64', placement = 'bottom' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={`absolute z-40 popover anim-pop p-1.5 ${className} ${align === 'right' ? 'right-0' : 'left-0'} ${placement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}
          role="menu"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
