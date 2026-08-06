import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TarjetaSkeleton from "@/components/TarjetaSkeleton";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";
import { apiFetch } from "../lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const POR_PAGINA = 24;

export default function Juegos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario, autenticado } = useAuth();

  const irAJuego = useCallback(
    (e) => navigate(`/juego/${e.currentTarget.dataset.juegoId}`),
    [navigate]
  );

  const initOrden = searchParams.get("orden") || "popular";
  const initGenero = searchParams.get("genero") || "";
  const initPlataforma = searchParams.get("plataforma") || "";

  const terminoBusqueda = searchParams.get("q")?.trim() || "";

  const [juegos, setJuegos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [orden, setOrden] = useState(initOrden);
  const [ascendente, setAscendente] = useState(false);
  const [generoSel, setGeneroSel] = useState(initGenero);
  const [plataformaSel, setPlataformaSel] = useState(initPlataforma);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [mensajeCargaLenta, setMensajeCargaLenta] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [ordenAbierto, setOrdenAbierto] = useState(false);
  const dropdownRef = useRef();
  const busquedaRef = useRef(terminoBusqueda);

  useEffect(() => {
    apiFetch("/juegos/filtros/")
      .then(res => res.json())
      .then(data => {
        setGenres(data.genres || []);
        setPlatforms(data.platforms || []);
      })
      .finally(() => setFiltersLoaded(true));
  }, []);

  useEffect(() => {
    if (cargando) {
      const timeout = setTimeout(() => setMensajeCargaLenta(true), 3000);
      return () => clearTimeout(timeout);
    } else {
      setMensajeCargaLenta(false);
    }
  }, [cargando]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOrdenAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const obtenerJuegos = (paginaFetch, append) => {
    if (append) setCargandoMas(true);
    else setCargando(true);
    setDescargando(false);
    const params = new URLSearchParams();
    params.set("pagina", paginaFetch);
    params.set("por_pagina", POR_PAGINA);
    params.set("orden", orden + (ascendente ? "_asc" : ""));
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("adult", usuario.filtro_adulto ? "1" : "0");
    }

    apiFetch(`/juegos/populares/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data?.error === "descargando") {
          setDescargando(true);
          setJuegos([]);
          setPagina(1);
          setPaginasTotales(1);
          setTotalResultados(0);
          return;
        }
        setJuegos((prev) => {
          const base = append ? prev : [];
          return Array.from(new Map([...base, ...data.juegos].map(j => [j.id, j])).values());
        });
        setPagina(data.pagina_actual);
        setPaginasTotales(data.paginas_totales);
        setTotalResultados(data.total_resultados);
      })
      .catch(() => {
        if (!append) {
          setJuegos([]);
          setPaginasTotales(0);
          setTotalResultados(0);
        }
      })
      .finally(() => {
        setCargando(false);
        setCargandoMas(false);
      });
  };

  // Recarga desde el principio cuando cambian filtros/orden/búsqueda
  useEffect(() => {
    if (!filtersLoaded) return;
    obtenerJuegos(1, false);
    const params = new URLSearchParams();
    params.set("orden", orden + (ascendente ? "_asc" : ""));
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("adult", usuario.filtro_adulto ? "1" : "0");
    }
    navigate(`?${params.toString()}`, { replace: true });
  }, [orden, ascendente, generoSel, plataformaSel, terminoBusqueda, filtersLoaded, autenticado, usuario?.filtro_adulto]);

  useEffect(() => {
    if (descargando) {
      const interval = setInterval(() => obtenerJuegos(1, false), 10000);
      return () => clearInterval(interval);
    }
  }, [descargando]);

  const cargarMas = () => {
    if (pagina < paginasTotales) obtenerJuegos(pagina + 1, true);
  };

  const sentinelRef = useInfiniteScroll(cargarMas, {
    hasMore: pagina < paginasTotales,
    loading: cargando || cargandoMas,
  });

  const toggleOrden = (nuevoOrden) => {
    if (orden === nuevoOrden) {
      setAscendente(!ascendente);
    } else {
      setOrden(nuevoOrden);
      setAscendente(false);
    }
    setOrdenAbierto(false);
  };

  return (
    <div className="min-h-screen text-foreground p-6 max-w-full xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto bg-transparent">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="mb-3">
          <h1 className="font-display text-4xl font-black mb-1">
            {terminoBusqueda
              ? `Resultados para ${terminoBusqueda.charAt(0).toUpperCase() + terminoBusqueda.slice(1)}`
              : "🎮 Juegos"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto items-center">
          {/* Dropdown Orden */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOrdenAbierto(!ordenAbierto)}
              className="bg-card border border-border text-foreground px-3 py-1 rounded"
            >
              Orden: {orden} {ascendente ? "↑" : "↓"}
            </button>
            {ordenAbierto && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded shadow-lg z-dropdown">
                {["popular", "nombre", "fecha"].map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleOrden(o)}
                    className={`w-full text-left px-4 py-2 hover:bg-muted ${orden === o ? "font-bold text-primary" : ""
                      }`}
                  >
                    {o === "popular" && "📈 Popularidad"}
                    {o === "nombre" && "🔤 Nombre"}
                    {o === "fecha" && "🕒 Fecha de salida"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={generoSel}
            onChange={(e) => setGeneroSel(e.target.value)}
            className="bg-card text-foreground border border-border rounded px-3 py-1"
          >
            <option value="">🎭 Todos los géneros</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select
            value={plataformaSel}
            onChange={(e) => setPlataformaSel(e.target.value)}
            className="bg-card text-foreground border border-border rounded px-3 py-1"
          >
            <option value="">🖥️ Todas las plataformas</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Resultado y grid */}
      {!cargando && (
        <div className="mb-4 text-foreground">
          {totalResultados} resultado{totalResultados !== 1 && "s"}
        </div>
      )}

      {descargando ? (
        <LoaderCirculo texto="Estamos recopilando todos los datos de IGDB. Espera unos segundos." />
      ) : cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
          {Array(POR_PAGINA).fill().map((_, i) => (
            <TarjetaSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
            {juegos.map((j) => (
              <GameCard key={j.id} juego={j} onClick={irAJuego} />
            ))}
          </div>

          {pagina < paginasTotales && (
            <div
              ref={sentinelRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6 mt-6"
            >
              {Array(POR_PAGINA).fill().map((_, i) => (
                <TarjetaSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
