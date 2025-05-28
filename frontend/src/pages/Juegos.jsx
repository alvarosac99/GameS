import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useAuth } from "@/context/AuthContext";
import TarjetaSkeleton from "@/components/TarjetaSkeleton";


export default function Juegos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario, autenticado } = useAuth(); // <-- obtener autenticación y perfil

  // Inicializar estado desde la URL
  const initPagina = parseInt(searchParams.get("pagina") || "1", 10);
  const initOrden = searchParams.get("orden") || "popular";
  const initGenero = searchParams.get("genero") || "";
  const initPlataforma = searchParams.get("plataforma") || "";
  const terminoBusqueda = searchParams.get("q")?.trim() || "";

  const [juegos, setJuegos] = useState([]);
  const [pagina, setPagina] = useState(initPagina);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [orden, setOrden] = useState(initOrden);
  const [generoSel, setGeneroSel] = useState(initGenero);
  const [plataformaSel, setPlataformaSel] = useState(initPlataforma);

  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publishers, setPublishers] = useState([]);

  const [mensajeCargaLenta, setMensajeCargaLenta] = useState(false);

  const porPagina = 60;
  const [descargando, setDescargando] = useState(false);


  // Carga filtros
  useEffect(() => {
    fetch("/api/juegos/filtros/")
      .then((res) => res.json())
      .then((data) => {
        setGenres(data.genres || []);
        setPlatforms(data.platforms || []);
        setPublishers(data.publishers || []);
      })
      .catch(() => {
        setGenres([]);
        setPlatforms([]);
        setPublishers([]);
      })
      .finally(() => setFiltersLoaded(true));
  }, []);

  useEffect(() => {
    let timeout;
    if (cargando) {
      timeout = setTimeout(() => setMensajeCargaLenta(true), 3000);
    } else {
      setMensajeCargaLenta(false);
    }
    return () => clearTimeout(timeout);
  }, [cargando]);

  // Función para llamar a la API
  const obtenerJuegos = () => {
    setCargando(true);
    setDescargando(false); // Siempre resetea antes de fetch
    const params = new URLSearchParams();
    params.set("pagina", pagina);
    params.set("por_pagina", porPagina);
    params.set("orden", orden);
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("filtro_adulto", usuario.filtro_adulto ? "1" : "0");
    }

    fetch(`/api/juegos/populares/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data?.error === "descargando") {
          setDescargando(true);
          setCargando(false);
          setJuegos([]);
          setPagina(1);
          setPaginasTotales(1);
          setTotalResultados(0);
          return;
        }
        setDescargando(false);
        setJuegos(data.juegos || []);
        setPagina(data.pagina_actual);
        setPaginasTotales(data.paginas_totales > 0 ? data.paginas_totales : (data.juegos.length > 0 ? 1 : 0));
        setTotalResultados(data.total_resultados);
      })
      .catch(e => {
        console.error(e);
        setDescargando(false);
        setJuegos([]);
        setPaginasTotales(0);
        setTotalResultados(0);
      })
      .finally(() => setCargando(false));
  };

  // Recargar al cambiar filtros u orden o página
  useEffect(() => {
    if (!filtersLoaded) return;
    obtenerJuegos();
    const params = new URLSearchParams();
    params.set("pagina", pagina);
    params.set("por_pagina", porPagina);
    params.set("orden", orden);
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    // También refleja el filtro en la URL si está logueado
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("filtro_adulto", usuario.filtro_adulto ? "1" : "0");
    }
    navigate(`?${params.toString()}`, { replace: true });
    // eslint-disable-next-line
  }, [pagina, orden, generoSel, plataformaSel, terminoBusqueda, filtersLoaded, autenticado, usuario?.filtro_adulto]);
  // Generar paginación con “...”
  const generarPaginas = () => {
    const delta = 2;
    const pages = new Set([1, paginasTotales]);
    for (let i = pagina - delta; i <= pagina + delta; i++) {
      if (i > 1 && i < paginasTotales) pages.add(i);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const res = [];
    let prev = 0;
    sorted.forEach((p) => {
      if (p - prev > 1) res.push("...");
      res.push(p);
      prev = p;
    });
    return res;
  };

  return (
    <div className="min-h-screen bg-fondo text-claro p-6">
      {/* Cabecera y filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold flex-1">
          {terminoBusqueda ? `Resultados para \"${terminoBusqueda}\"` : "🎮 Juegos"}
        </h1>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {/* Orden */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="popular">Más populares</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="fecha">Más recientes</option>
          </select>
          {/* Género */}
          <select
            value={generoSel}
            onChange={(e) => setGeneroSel(e.target.value)}
            className="bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="">Todos los géneros</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {/* Plataforma */}
          <select
            value={plataformaSel}
            onChange={(e) => setPlataformaSel(e.target.value)}
            className="bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="">Todas las plataformas</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Total resultados */}
      {!cargando && (
        <div className="mb-4 text-claro">
          {totalResultados} resultado{totalResultados !== 1 && "s"}
        </div>
      )}

      {/* Sin resultados */}
      {!cargando && juegos.length === 0 && terminoBusqueda != "" && (
        <div className="text-center text-xl text-claro py-10">
          No hay resultados para "{terminoBusqueda}"
        </div>
      )}

      {/* Skeleton */}
      {descargando ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-naranja text-xl md:text-2xl font-bold mb-4">
            <svg className="mx-auto mb-2 animate-spin h-10 w-10 text-naranja animate-pulse" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Estamos recopilando todos los datos de IGDB.<br />
            Por favor, espera unos segundos y vuelve a intentarlo.
          </div>

        </div>
      ) : cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {Array(porPagina).fill().map((_, i) => (
            <TarjetaSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {juegos.map((j) => (
            <div
              key={j.id}
              className="relative group rounded-lg overflow-hidden shadow-lg transition-transform duration-50 transform-gpu cursor-pointer"
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rx = -(y - rect.height / 2) / 10;
                const ry = (x - rect.width / 2) / 10;
                card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
              }}
              onClick={() => navigate(`/juego/${j.id}`)}
            >
              {j.cover?.url ? (
                <img
                  src={`https:${j.cover.url.replace("t_thumb", "t_cover_big")}`}
                  alt={j.name}
                  className="block w-full max-h-[340px] object-contain transition-transform duration-50 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="w-full max-h-[340px] flex items-center justify-center bg-metal text-gray-300 text-sm px-2">
                  Sin portada
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-50" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-50">
                <h2 className="text-white text-lg font-semibold drop-shadow-md px-4 text-center">
                  {j.name}
                </h2>
              </div>
            </div>
          ))}
        </div>
      )}
      {cargando && mensajeCargaLenta && (
        <div className="mt-8 text-center text-naranja text-lg font-bold animate-pulse">
          La búsqueda puede tardar un poco.<br />
          Estamos descargando muchos datos y optimizando tu consulta...
        </div>
      )}


      {/* Texto página */}
      {paginasTotales > 1 && !cargando && (
        <div className="text-center text-claro mt-6">
          Página {pagina} de {paginasTotales}
        </div>
      )}

      {/* Botones paginación */}
      {paginasTotales > 1 && !cargando && (
        <div className="flex justify-center mt-4 flex-wrap gap-2">
          {generarPaginas().map((n, i) =>
            n === "..." ? (
              <span key={i} className="px-2 text-gray-400">…</span>
            ) : (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`px-3 py-1 rounded ${pagina === n
                  ? "bg-naranja text-black font-bold"
                  : "bg-borde text-claro hover:bg-metal"
                  }`}
              >
                {n}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}