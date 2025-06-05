import React from "react";
import { Link, useNavigate } from "react-router-dom";
import GameCard from "./GameCard";

export default function ListaEntradasDiario({ entradas, cargando }) {
  const navigate = useNavigate();
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
          className="flex gap-4 bg-metal p-4 rounded-xl shadow border-l-4 border-naranja"
        >
          <div
            className="w-20 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/juego/${entrada.juego}`)}
          >
            <GameCard
              juego={{
                id: entrada.juego,
                name: entrada.juego_nombre || `Juego ID: ${entrada.juego}`,
                cover: entrada.juego_cover
                  ? { url: entrada.juego_cover.replace(/^https:/, "") }
                  : null,
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              <Link to={`/juego/${entrada.juego}`} className="hover:text-naranja">
                {entrada.juego_nombre || `Juego ID: ${entrada.juego}`}
              </Link>
            </h2>
            <p className="text-sm text-claro">
              {new Date(entrada.fecha).toLocaleString("es-ES")}
            </p>
            <p className="italic capitalize">{entrada.estado}</p>
            <p className="mt-2">{entrada.nota}</p>
            {entrada.duracion && (
              <p className="text-sm mt-1 text-claro">Duración: {entrada.duracion}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
