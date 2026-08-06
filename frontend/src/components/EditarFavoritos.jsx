import React, { useState } from "react";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";
import { useLang } from "@/context/LangContext";
import { apiFetch } from "../lib/api";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import IconButton from "@/components/ui/IconButton";

export default function EditarFavoritos({ favoritos, onGuardar, onCerrar }) {
  const { t } = useLang();
  const [seleccionados, setSeleccionados] = useState([...favoritos]);
  const [buscando, setBuscando] = useState(null); // índice a editar
  const [query, setQuery] = useState("");

  const { resultados, cargando } = useDebouncedSearch(
    query,
    (q) =>
      apiFetch(`/juegos/populares/?q=${encodeURIComponent(q)}&por_pagina=10`)
        .then((res) => res.json())
        .then((data) => data.juegos || []),
    { delay: 400, minLength: 2 }
  );

  const seleccionarJuego = (juego, idx) => {
    if (seleccionados.some(fav => fav && fav.id === juego.id)) return;
    const nuevos = [...seleccionados];
    nuevos[idx] = juego;
    setSeleccionados(nuevos);
    setBuscando(null);
    setQuery("");
  };

  const quitarJuego = idx => {
    const nuevos = [...seleccionados];
    nuevos[idx] = null;
    setSeleccionados(nuevos);
  };

  return (
    <div className="fixed inset-0 z-modal bg-black/70 flex items-center justify-center">
      <div className="bg-card p-6 rounded-2xl max-w-2xl w-full shadow-2xl relative">
        <IconButton onClick={onCerrar} label="Cerrar" className="absolute top-2 right-4 text-2xl">✕</IconButton>
        <h2 className="text-2xl font-bold mb-4 text-primary">Elige tus 5 juegos favoritos</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 justify-items-center mb-6">
          {Array(5).fill().map((_, i) => (
            <div key={i} className="relative w-24 sm:w-28">
              {seleccionados[i] ? (
                <div>
                  <GameCard
                    juego={seleccionados[i]}
                    onClick={() => setBuscando(i)}
                  />
                  <IconButton
                    onClick={() => quitarJuego(i)}
                    label={`Quitar ${seleccionados[i].name}`}
                    className="absolute -top-2 -right-2 bg-destructive text-white shadow-lg"
                    title="Quitar"
                  >✕</IconButton>
                </div>
              ) : (
                <button
                  onClick={() => setBuscando(i)}
                  className="w-24 h-40 sm:w-28 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/30 text-sm text-center px-1"
                  title="Añadir juego favorito"
                >+ Añadir</button>
              )}
            </div>
          ))}
        </div>
        <button
          className="bg-primary text-primary-foreground font-bold px-5 py-2 rounded mt-4"
          onClick={() => onGuardar(seleccionados)}
        >
          Guardar cambios
        </button>
        {/* Mini-buscador flotante */}
        {buscando !== null && (
          <div className="fixed inset-0 z-modal bg-black/60 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl w-full max-w-md shadow-xl">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t("searchFavoriteGamePlaceholder")}
                className="w-full mb-4 p-2 rounded bg-background border border-border text-foreground text-lg"
                autoFocus
              />

              {cargando ? (
                <div className="flex justify-center items-center h-32">
                  <LoaderCirculo color="naranja" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {resultados.length === 0 && query.length > 1 ? (
                    <div className="text-muted-foreground text-center py-6">No se han encontrado juegos</div>
                  ) : (
                    resultados.map(j => (
                      <div
                        key={j.id}
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => seleccionarJuego(j, buscando)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            seleccionarJuego(j, buscando);
                          }
                        }}
                      >
                        <img src={j.cover?.url ? `https:${j.cover.url.replace("t_thumb", "t_cover_big")}` : "/sin_portada.png"}
                          alt="" className="w-10 h-14 object-contain rounded" />
                        <span className="text-foreground text-base">{j.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button onClick={() => setBuscando(null)} className="mt-6 w-full bg-muted text-primary px-3 py-2 rounded font-bold">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
