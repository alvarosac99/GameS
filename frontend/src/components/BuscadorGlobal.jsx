// src/components/BuscadorGlobal.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiUsers } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import DropLoader from "@/components/DropLoader";
import { useLang } from "@/context/LangContext";
import { apiFetch } from "../lib/api";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

export default function BuscadorGlobal({ className = "" }) {
  const [modo, setModo] = useState("juegos"); // juegos | personas
  const [query, setQuery] = useState("");
  const [showSug, setShowSug] = useState(false);
  const navigate = useNavigate();
  const contenedorRef = useRef();
  const { t } = useLang();

  const { resultados: sugerencias, cargando } = useDebouncedSearch(
    query,
    (q) => {
      const endpoint =
        modo === "juegos"
          ? `/juegos/populares/?q=${encodeURIComponent(q)}&por_pagina=5`
          : `/usuarios/buscar/?q=${encodeURIComponent(q)}`;
      return apiFetch(endpoint)
        .then((res) => res.json())
        .then((data) => (modo === "juegos" ? data.juegos || [] : data.resultados || []));
    },
    { delay: 300, minLength: 2 }
  );

  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  useEffect(() => {
    const manejarEscape = (e) => {
      if (e.key === "Escape") setShowSug(false);
    };
    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, []);

  const buscar = (q) => {
    setQuery(q);
    setShowSug(true);
  };

  const submitBusqueda = (e) => {
    e.preventDefault();
    setShowSug(false);
    if (!query.trim()) return;
    const destino = modo === "juegos" ? `/juegos?q=${encodeURIComponent(query)}` : `/perfiles?q=${encodeURIComponent(query)}`;
    navigate(destino);
  };

  const cambiarModo = () => {
    setModo((prev) => (prev === "juegos" ? "personas" : "juegos"));
    setQuery("");
    setShowSug(false);
  };

  return (
    <div ref={contenedorRef} className={`relative flex items-center ${className}`}>
      <form onSubmit={submitBusqueda} className="flex gap-2 items-center w-full">
        <label htmlFor="buscador-global" className="sr-only">
          {modo === "juegos" ? t("searchGamesPlaceholder") : t("searchPeoplePlaceholder")}
        </label>
        <input
          id="buscador-global"
          type="text"
          placeholder={modo === "juegos" ? t("searchGamesPlaceholder") : t("searchPeoplePlaceholder")}
          value={query}
          onChange={(e) => buscar(e.target.value)}
          onFocus={() => setShowSug(true)}
          className="px-3 py-1 rounded bg-card text-foreground border border-border placeholder:text-muted-foreground w-48 sm:w-64"
        />
        <button
          type="button"
          className={`p-2 rounded-full border border-border ${modo === "juegos" ? "text-primary" : "text-info"} bg-card`}
          title={modo === "juegos" ? "Buscar en personas" : "Buscar en juegos"}
          onClick={cambiarModo}
        >
          {modo === "juegos" ? <FiUsers /> : <FaGamepad />}
        </button>
        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 py-1 rounded"
        >
          Buscar
        </button>
      </form>

      {/* Sugerencias */}
      {showSug && (query.length >= 2) && (
        <div className="absolute top-full left-0 w-full bg-card border border-border rounded-b-lg shadow-xl z-dropdown max-h-80 overflow-y-auto">
          {cargando && (

            <div className="p-3 text-muted-foreground text-center"><DropLoader /></div>
          )}
          {!cargando && sugerencias.length === 0 && (
            <div className="p-3 text-muted-foreground text-center">
              No se han encontrado resultados.
              <div className="mt-1 text-sm">
                ¿Quizás quisiste decir:&nbsp;
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => {
                    const nueva = query.slice(0, -1);
                    setQuery(nueva);
                    buscar(nueva);
                  }}
                >
                  {query.slice(0, -1)}
                </button>?
              </div>
            </div>
          )}
          {!cargando && sugerencias.length > 0 && (
            <ul>
              {sugerencias.map((item, i) =>
                modo === "juegos" ? (
                  <li
                    key={item.id || i}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-primary/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/juego/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/juego/${item.id}`);
                      }
                    }}
                  >
                    <img
                      src={item.cover?.url ? `https:${item.cover.url.replace("t_thumb", "t_cover_small")}` : "/sin_portada.png"}
                      alt=""
                      className="w-8 h-8 object-cover rounded"
                    />
                    <span>{item.name}</span>
                  </li>
                ) : (
                  <li
                    key={item.username || i}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-primary/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/perfil/${item.username}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/perfil/${item.username}`);
                      }
                    }}
                  >
                    <img
                      src={item.foto || "/media/avatares/default.png"}
                      alt=""
                      className="w-8 h-8 object-cover rounded-full"
                    />
                    <span className="font-bold">{item.nombre || item.username}</span>
                    <span className="text-primary">@{item.username}</span>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
