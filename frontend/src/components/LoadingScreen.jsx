import React from "react";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-max flex flex-col items-center justify-center bg-background text-foreground">
            <div className="relative flex items-center justify-center mb-8">
                <span className="sr-only">Cargando...</span>
                {/* Spinner principal */}
                <div className="w-24 h-24 rounded-full border-[6px] border-primary border-t-transparent animate-spin" />
                {/* Círculo interior pulsante */}
                <div className="absolute w-12 h-12 rounded-full bg-card border-2 border-primary opacity-80 animate-pulse"></div>
            </div>

            <h2 className="text-2xl font-bold text-primary mb-2 animate-pulse">
                GameS
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm animate-pulse">
                Preparando tu experiencia...
            </p>
        </div>
    );
}
