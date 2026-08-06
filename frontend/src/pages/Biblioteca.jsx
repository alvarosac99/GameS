import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";
import TarjetaSkeleton from "../components/TarjetaSkeleton";
import { FaSort, FaSortAmountUp, FaSortAmountDown } from "react-icons/fa";
import { useLang } from "../context/LangContext";
import { apiFetch } from "../lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const TANDA = 24;

export default function Biblioteca() {
  const [juegosTotales, setJuegosTotales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [visibles, setVisibles] = useState(TANDA);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("popularidad");
  const [ascendente, setAscendente] = useState(false);
  const [mostrarMenuOrden, setMostrarMenuOrden] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();
  const menuRef = useRef();

  const irAJuego = useCallback(
    (e) => navigate(`/juego/${e.currentTarget.dataset.juegoId}`),
    [navigate]
  );

  useEffect(() => {
    setCargando(true);
    apiFetch(`/juegos/biblioteca/?pagina=1&por_pagina=1000`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(async (data) => {
        const juegos = data.juegos || [];
        const resTiempos = await apiFetch("/sesiones/tiempos/", {
          credentials: "include",
        });
        const tiemposData = resTiempos.ok ? await resTiempos.json() : {};

        const valores = {};
        await Promise.all(
          juegos.map(async (j) => {
            const r = await apiFetch(`/juegos/valoracion/${j.id}/`, {
              credentials: "include",
            }).then((x) => (x.ok ? x.json() : null));
            if (r && r.mi_valoracion != null) valores[j.id] = r.mi_valoracion;
          })
        );

        const conInfo = juegos.map((j) => ({
          ...j,
          tiempo: tiemposData[j.id] || 0,
          valoracion: valores[j.id] ?? null,
        }));

        setJuegosTotales(conInfo);
      })
      .catch(() => setJuegosTotales([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    setVisibles(TANDA);
  }, [busqueda]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMostrarMenuOrden(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ordenarJuegos = (a, b) => {
    const dir = ascendente ? 1 : -1;
    if (orden === "nombre") return dir * a.name.localeCompare(b.name);
    if (orden === "fecha")
      return dir * ((a.first_release_date || 0) - (b.first_release_date || 0));
    return dir * ((a.aggregated_rating || 0) - (b.aggregated_rating || 0));
  };

  // 🔍 Filtrado local
  const juegosFiltrados = juegosTotales.filter((j) =>
    j.name?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const juegosOrdenados = [...juegosFiltrados].sort(ordenarJuegos);
  const juegosVisibles = juegosOrdenados.slice(0, visibles);
  const hayMas = visibles < juegosOrdenados.length;

  const sentinelRef = useInfiniteScroll(
    () => setVisibles((v) => v + TANDA),
    { hasMore: hayMas, loading: cargando }
  );

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 max-w-full xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto">

      {/* Header y controles */}
      <div
        ref={menuRef}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4"
      >
        <h1 className="font-display text-3xl font-bold">{t("libraryTitle")}</h1>

        <div className="flex flex-wrap items-center gap-2 relative">
          <input
            type="text"
            placeholder={t("searchLibrary")}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-card text-foreground border border-border rounded px-3 py-1"
          />

          <button
            onClick={() => setMostrarMenuOrden(!mostrarMenuOrden)}
            className="bg-muted hover:bg-card text-foreground px-3 py-1 rounded flex items-center gap-2"
          >
            <FaSort /> {t("order")}
          </button>

          {mostrarMenuOrden && (
            <div className="absolute right-0 mt-12 w-48 bg-card border border-border rounded shadow-md z-10">
              {["popularidad", "nombre", "fecha"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => {
                    if (orden === tipo) {
                      setAscendente(!ascendente);
                    } else {
                      setOrden(tipo);
                      setAscendente(false);
                    }
                    setMostrarMenuOrden(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-muted ${
                    orden === tipo ? "font-bold text-primary" : ""
                  }`}
                >
                  {tipo === "popularidad" && `📈 ${t("popularity")}`}
                  {tipo === "nombre" && `🔤 ${t("name")}`}
                  {tipo === "fecha" && `🕒 ${t("releaseDate")}`}
                  {orden === tipo &&
                    (ascendente ? (
                      <FaSortAmountUp className="inline ml-1" />
                    ) : (
                      <FaSortAmountDown className="inline ml-1" />
                    ))}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {!cargando && juegosFiltrados.length > 0 && (
        <div className="mb-4 text-foreground">
          {juegosFiltrados.length} juego
          {juegosFiltrados.length !== 1 && "s"} en total
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
          {Array(TANDA)
            .fill()
            .map((_, i) => (
              <TarjetaSkeleton key={i} />
            ))}
        </div>
      ) : juegosVisibles.length === 0 ? (
        <p>{t("noMatchingGames")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
            {juegosVisibles.map((juego) => (
              <GameCard
                key={juego.id}
                juego={juego}
                tiempo={juego.tiempo}
                valoracion={juego.valoracion}
                onClick={irAJuego}
              />
            ))}
          </div>

          {hayMas && (
            <div ref={sentinelRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6 mt-6">
              {Array(Math.min(TANDA, juegosOrdenados.length - visibles))
                .fill()
                .map((_, i) => (
                  <TarjetaSkeleton key={i} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
