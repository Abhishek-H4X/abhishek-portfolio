import { useEffect, useRef } from "react";

const activeDialogs = [];
const selectors = 'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialog(open, onClose, modal = true) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const id = Symbol("dialog");
    activeDialogs.push(id);
    const previous = document.activeElement;
    const panel = ref.current;
    const focusable = () => [...panel.querySelectorAll(selectors)].filter((el) => el.getClientRects().length);
    (focusable()[0] || panel).focus({ preventScroll: true });
    const keydown = (event) => {
      if (activeDialogs.at(-1) !== id) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      } else if (modal && event.key === "Tab") {
        const elements = focusable();
        const first = elements[0] || panel;
        const last = elements.at(-1) || panel;
        if (!elements.length || !panel.contains(document.activeElement) ||
            (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const focusin = (event) => {
      if (modal && activeDialogs.at(-1) === id && !panel.contains(event.target)) {
        (focusable()[0] || panel).focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      const index = activeDialogs.indexOf(id);
      if (index !== -1) activeDialogs.splice(index, 1);
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
      if (previous?.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [open, modal]);
  return ref;
}
