import { useEffect } from "react";

/**
 * Custom hook to detect clicks outside of a ref element
 * @param {React.RefObject} ref - Reference to the element
 * @param {Function} handler - Handler to call when clicked outside
 * @param {boolean} enabled - Whether the hook is enabled
 */
export const useClickOutside = (ref, handler, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler, enabled]);
};
