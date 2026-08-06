import React from "react";

function TarjetaSkeleton() {
    return (
        <div className="relative group rounded-lg overflow-hidden shadow-lg bg-card bg-opacity-50 h-[340px] flex flex-col justify-between animate-shimmer">
            {/* Imagen shimmer */}
            <div className="h-full w-full bg-gradient-to-r from-foreground/10 via-foreground/20 to-foreground/10 animate-shimmer" />
        </div>
    );
}

export default React.memo(TarjetaSkeleton);