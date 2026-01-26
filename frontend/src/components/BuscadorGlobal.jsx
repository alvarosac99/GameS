// src/components/BuscadorGlobal.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiUsers } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import DropLoader from "@/components/DropLoader";
import { useLang } from "@/context/LangContext";

export default function BuscadorGlobal({ className = "" }) {
  const [modo, setModo] = useState("juegos"); // juegos | personas
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef();
  const navigate = useNavigate();
  const contenedorRef = useRef();
  const { t } = useLang();

  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  const buscar = (q) => {
    setQuery(q);
    setShowSug(true);
    setSugerencias([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setCargando(false);
      return;
    }
    setCargando(true);

    let endpoint = modo === "juegos"
      ? `/api/juegos/populares/?q=${encodeURIComponent(q)}&por_pagina=5`
      : `/api/usuarios/buscar/?q=${encodeURIComponent(q)}`;

    debounceRef.current = setTimeout(() => {
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (modo === "juegos") {
            setSugerencias(data.juegos || []);
          } else {
            setSugerencias(data.resultados || []);
          }
        })
        .catch(() => setSugerencias([]))
        .finally(() => setCargando(false));
    }, 300);
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
    setSugerencias([]);
    setShowSug(false);
  };

  return (
    <div ref={contenedorRef} className={`relative flex items-center ${className}`}>
      <form onSubmit={submitBusqueda} className="flex gap-2 items-center w-full">
        <input
          type="text"
          placeholder={modo === "juegos" ? t("searchGamesPlaceholder") : t("searchPeoplePlaceholder")}
          value={query}
          onChange={(e) => buscar(e.target.value)}
          onFocus={() => setShowSug(true)}
          className="px-3 py-1 rounded bg-metal text-claro border border-borde placeholder:text-gray-400 w-48 sm:w-64"
        />
        <button
          type="button"
          className={`p-2 rounded-full border border-borde ${modo === "juegos" ? "text-naranja" : "text-blue-400"} bg-metal`}
          title={modo === "juegos" ? "Buscar en personas" : "Buscar en juegos"}
          onClick={cambiarModo}
        >
          {modo === "juegos" ? <FiUsers /> : <FaGamepad />}
        </button>
        <button
          type="submit"
          className="bg-naranja hover:bg-naranjaHover text-black font-semibold px-3 py-1 rounded"
        >
          Buscar
        </button>
      </form>

      {/* Sugerencias */}
      {showSug && (query.length >= 2) && (
        <div className="absolute top-full left-0 w-full bg-metal border border-borde rounded-b-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {cargando && (

            <div className="p-3 text-borde text-center"><DropLoader /></div>
          )}
          {!cargando && sugerencias.length === 0 && (
            <div className="p-3 text-gray-500 text-center">
              No se han encontrado resultados.
              <div className="mt-1 text-sm">
                ¿Quizás quisiste decir:&nbsp;
                <span
                  className="font-semibold underline cursor-pointer"
                  onClick={() => {
                    const nueva = query.slice(0, -1);
                    setQuery(nueva);
                    buscar(nueva);
                  }}
                >
                  {query.slice(0, -1)}
                </span>?
              </div>
            </div>
          )}
          {!cargando && sugerencias.length > 0 && (
            <ul>
              {sugerencias.map((item, i) =>
                modo === "juegos" ? (
                  <li
                    key={item.id || i}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-naranja/20 cursor-pointer"
                    onClick={() => navigate(`/juego/${item.id}`)}
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
                    className="flex items-center gap-2 px-4 py-2 hover:bg-naranja/20 cursor-pointer"
                    onClick={() => navigate(`/perfil/${item.username}`)}
                  >
                    <img
                      src={item.foto || "/media/avatares/default.png"}
                      alt=""
                      className="w-8 h-8 object-cover rounded-full"
                    />
                    <span className="font-bold">{item.nombre || item.username}</span>
                    <span className="text-naranja">@{item.username}</span>
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
