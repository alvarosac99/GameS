import React from "react";
import { cn } from "@/lib/utils";

/**
 * Botón solo-icono con área táctil mínima de 44x44 y `aria-label` obligatorio.
 */
function IconButton({ label, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "w-11 h-11 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default React.forwardRef(IconButton);
