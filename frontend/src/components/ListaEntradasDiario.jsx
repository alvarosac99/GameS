import React from "react";

export default function ListaEntradasDiario({ entradas, cargando }) {
  if (cargando) {
    return <p className="text-claro">Cargando entradas...</p>;
  }

  if (!Array.isArray(entradas) || entradas.length === 0) {
    return <p className="text-claro">No hay entradas todavía.</p>;
  }

  return (
    <div className="space-y-4">
      {entradas.map((entrada) => (
        <div
          key={entrada.id}
          className="bg-[#1a1a1a] p-4 rounded-xl shadow border-l-4 border-naranja"
        >
          <h2 className="text-lg font-semibold">Juego ID: {entrada.juego}</h2>
          <p className="text-sm text-claro">
            {new Date(entrada.fecha).toLocaleString("es-ES")}
          </p>
          <p className="italic capitalize">{entrada.estado}</p>
          <p className="mt-2">{entrada.nota}</p>
          {entrada.duracion && (
            <p className="text-sm mt-1 text-claro">
              Duración: {entrada.duracion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}