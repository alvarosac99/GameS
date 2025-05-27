import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Juegos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [juegos, setJuegos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState(searchParams.get("orden") || "popular");
  const [generoSel, setGeneroSel] = useState(searchParams.get("genero") || "");
  const [plataformaSel, setPlataformaSel] = useState(searchParams.get("plataforma") || "");
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const cantidadPorPagina = 60;
  const terminoBusqueda = searchParams.get("q")?.trim() || "";

  // Carga filtros al montar
  useEffect(() => {
    fetch(`/api/juegos/filtros/`)
      .then((res) => res.json())
      .then((data) => {
        setGenres(data.genres || []);
        setPlatforms(data.platforms || []);
        setPublishers(data.publishers || []);
        setFiltersLoaded(true);
      })
      .catch(() => setFiltersLoaded(true));
  }, []);

  const obtenerJuegos = () => {
    setCargando(true);

    const params = new URLSearchParams({
      page: pagina,
      per_page: cantidadPorPagina,
      orden,
    });
    if (terminoBusqueda) params.append("q", terminoBusqueda);
    if (generoSel) params.append("genero", generoSel);
    if (plataformaSel) params.append("plataforma", plataformaSel);

    fetch(`/api/juegos/populares/?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fallo en la API de juegos");
        return res.json();
      })
      .then((data) => {
        setJuegos(data.juegos || []);
        setPagina(data.pagina_actual || 1);
        setPaginasTotales(data.paginas_totales || 1);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar juegos:", err);
        setJuegos([]);
        setCargando(false);
      });
  };

  // Cada vez que cambien filtros u orden
  useEffect(() => {
    if (filtersLoaded) {
      setPagina(1);
      obtenerJuegos();
    }
  }, [terminoBusqueda, orden, generoSel, plataformaSel, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded) obtenerJuegos();
  }, [pagina]);

  function obtenerNumerosPaginacion(paginaActual, totalPaginas, delta = 2) {
    const pages = new Set();
    pages.add(1);
    for (let i = paginaActual - delta; i <= paginaActual + delta; i++) {
      if (i > 1 && i < totalPaginas) pages.add(i);
    }
    pages.add(totalPaginas);
    const sorted = [...pages].sort((a, b) => a - b);
    const resultado = [];
    let anterior = 0;
    for (let i = 0; i < sorted.length; i++) {
      const actual = sorted[i];
      if (actual - anterior > 1) resultado.push("...");
      resultado.push(actual);
      anterior = actual;
    }
    return resultado;
  }

  return (
    <div className="min-h-screen bg-fondo text-claro p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold flex-1">
          {terminoBusqueda ? `Resultados para "${terminoBusqueda}"` : "🎮 Juegos"}
        </h1>

        {/* Controles de filtros y orden adaptables */}
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-full sm:w-auto bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="popular">Más populares</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="fecha">Más recientes</option>
          </select>
          <select
            value={generoSel}
            onChange={(e) => setGeneroSel(e.target.value)}
            className="w-full sm:w-auto bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="">Todos los géneros</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={plataformaSel}
            onChange={(e) => setPlataformaSel(e.target.value)}
            className="w-full sm:w-auto bg-metal text-claro border border-borde rounded px-3 py-1"
          >
            <option value="">Todas las plataformas</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensaje si no hay resultados */}
      {!cargando && juegos.length === 0 && (
        <div className="text-center text-xl text-claro py-10">
          No hay resultados para "{terminoBusqueda}"
        </div>
      )}

      {/* Skeletons o lista */}
      {cargando ? (
        <SkeletonTheme baseColor="#2d2d2d" highlightColor="#2d2d2d">
          {Array(8).fill().map((_, i) => (
            <div key={i} className="bg-metal rounded shadow p-3">
              <Skeleton height={208} className="mb-3" />
              <Skeleton height={20} width="80%" className="mb-2" />
              <Skeleton height={15} width="60%" />
            </div>
          ))}
        </SkeletonTheme>
      ) : (
        juegos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {juegos.map((juego) => (
              <div
                key={juego.id}
                className="relative group rounded-lg overflow-hidden shadow-lg transition-transform duration-50 transform-gpu cursor-pointer"
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = -(y - centerY) / 10;
                  const rotateY = (x - centerX) / 10;
                  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)"; }}
                onClick={() => navigate(`/juego/${juego.id}`)}
              >
                {juego.cover?.url ? (
                  <img
                    src={`https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`}
                    alt={juego.name}
                    className="block w-full max-h-[340px] object-contain transition-transform duration-50 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full max-h-[340px] flex items-center justify-center bg-metal text-gray-300 text-sm text-center px-2">
                    Sin portada
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-50 z-10" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-50 z-20">
                  <h2 className="text-white text-lg font-semibold drop-shadow-md px-4 text-center">
                    {juego.name}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Paginación */}
      {juegos.length > 0 && (
        <div className="flex justify-center mt-10 flex-wrap gap-2">
          {obtenerNumerosPaginacion(pagina, paginasTotales).map((n, i) =>
            n === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={`page-${n}-${i}`}
                onClick={() => setPagina(n)}
                className={`px-3 py-1 rounded ${pagina === n ? "bg-naranja text-black font-bold" : "bg-borde text-claro hover:bg-metal"}`}
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
