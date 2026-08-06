import React from "react";
import { cn } from "@/lib/utils";

function Panel({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-card/70 text-foreground border border-border shadow-sm backdrop-blur-sm rounded-2xl px-6 py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default React.forwardRef(Panel);
