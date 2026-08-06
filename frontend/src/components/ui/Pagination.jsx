import React from "react";

/**
 * `paginas`: array de números de página, o "..." para elipsis.
 */
export default function Pagination({ paginas, paginaActual, onCambiar }) {
  return (
    <div className="flex justify-center gap-2 mt-2 flex-wrap">
      {paginas.map((n, i) =>
        n === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onCambiar(n)}
            className={`px-3 py-1 rounded ${
              paginaActual === n
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-muted text-foreground hover:bg-card"
            }`}
          >
            {n}
          </button>
        )
      )}
    </div>
  );
}
