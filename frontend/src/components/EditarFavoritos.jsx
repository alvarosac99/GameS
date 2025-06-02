import React, { useState, useRef } from "react";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";

export default function EditarFavoritos({ favoritos, onGuardar, onCerrar }) {
  const [seleccionados, setSeleccionados] = useState([...favoritos]);
  const [buscando, setBuscando] = useState(null); // índice a editar
  const [resultados, setResultados] = useState([]);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(false);

  // --- debounce ---
  const debounceRef = useRef();

  // Esta función sólo lanza fetch después de X ms sin teclear
  const buscar = (q) => {
    setQuery(q);
    setResultados([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setCargando(false);
      return;
    }
    setCargando(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/juegos/populares/?q=${encodeURIComponent(q)}&por_pagina=10`)
        .then(res => res.json())
        .then(data => setResultados(data.juegos || []))
        .finally(() => setCargando(false));
    }, 400); // 400ms es un valor UX ideal
  };

  const seleccionarJuego = (juego, idx) => {
    if (seleccionados.some(fav => fav && fav.id === juego.id)) return;
    const nuevos = [...seleccionados];
    nuevos[idx] = juego;
    setSeleccionados(nuevos);
    setBuscando(null);
    setResultados([]);
    setQuery("");
    setCargando(false);
  };

  const quitarJuego = idx => {
    const nuevos = [...seleccionados];
    nuevos[idx] = null;
    setSeleccionados(nuevos);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-metal p-6 rounded-2xl max-w-2xl w-full shadow-2xl relative">
        <button onClick={onCerrar} className="absolute top-2 right-4 text-2xl">✕</button>
        <h2 className="text-2xl font-bold mb-4 text-naranja">Elige tus 5 juegos favoritos</h2>
        <div className="flex gap-4 justify-center mb-6">
          {Array(5).fill().map((_, i) => (
            <div key={i} className="relative">
              {seleccionados[i] ? (
                <div>
                  <GameCard
                    juego={seleccionados[i]}
                    onClick={() => setBuscando(i)}
                  />
                  <button
                    onClick={() => quitarJuego(i)}
                    className="absolute top-1 right-1 bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                    title="Quitar"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setBuscando(i)}
                  className="w-28 h-40 bg-borde rounded-lg flex items-center justify-center text-gray-400 hover:bg-naranja/30"
                  title="Añadir juego favorito"
                >+ Añadir</button>
              )}
            </div>
          ))}
        </div>
        <button
          className="bg-naranja text-black font-bold px-5 py-2 rounded mt-4"
          onClick={() => onGuardar(seleccionados)}
        >
          Guardar cambios
        </button>
        {/* Mini-buscador flotante */}
        {buscando !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-metal p-6 rounded-xl w-full max-w-md shadow-xl">
              <input
                type="text"
                value={query}
                onChange={e => buscar(e.target.value)}
                placeholder="Busca tu juego favorito..."
                className="w-full mb-4 p-2 rounded bg-[#181b20] border border-borde text-claro text-lg"
                autoFocus
              />

              {cargando ? (
                <div className="flex justify-center items-center h-32">
                  <LoaderCirculo color="naranja" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {resultados.length === 0 && query.length > 1 ? (
                    <div className="text-gray-400 text-center py-6">No se han encontrado juegos</div>
                  ) : (
                    resultados.map(j => (
                      <div
                        key={j.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-borde rounded p-2 transition"
                        onClick={() => seleccionarJuego(j, buscando)}
                      >
                        <img src={j.cover?.url ? `https:${j.cover.url.replace("t_thumb", "t_cover_big")}` : "/sin_portada.png"}
                          alt="" className="w-10 h-14 object-contain rounded" />
                        <span className="text-claro text-base">{j.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button onClick={() => setBuscando(null)} className="mt-6 w-full bg-borde text-naranja px-3 py-2 rounded font-bold">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
