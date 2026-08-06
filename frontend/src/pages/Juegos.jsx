import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TarjetaSkeleton from "@/components/TarjetaSkeleton";
import GameCard from "@/components/GameCard";
import PerPageSelector from "@/components/ui/PerPageSelector";
import Pagination from "@/components/ui/Pagination";
import LoaderCirculo from "@/components/LoaderCirculo";
import { apiFetch } from "../lib/api";

const OPCIONES_POR_PAGINA = [10, 20, 30, 40, 50];

export default function Juegos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario, autenticado } = useAuth();

  const irAJuego = useCallback(
    (e) => navigate(`/juego/${e.currentTarget.dataset.juegoId}`),
    [navigate]
  );

  const initPagina = parseInt(searchParams.get("pagina") || "1", 10);
  const initOrden = searchParams.get("orden") || "popular";
  const initGenero = searchParams.get("genero") || "";
  const initPlataforma = searchParams.get("plataforma") || "";
  const initPublisher = searchParams.get("publisher") || "";
  const initPorPagina = parseInt(searchParams.get("por_pagina") || "30", 10);

  const terminoBusqueda = searchParams.get("q")?.trim() || "";

  const [juegos, setJuegos] = useState([]);
  const [pagina, setPagina] = useState(initPagina);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState(initOrden);
  const [ascendente, setAscendente] = useState(false);
  const [generoSel, setGeneroSel] = useState(initGenero);
  const [plataformaSel, setPlataformaSel] = useState(initPlataforma);
  const [publisherSel, setPublisherSel] = useState(initPublisher);
  const [porPagina, setPorPagina] = useState(initPorPagina);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publishers, setPublishers] = useState([]);
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
        setPublishers(data.publishers || []);
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
    if (descargando) {
      const interval = setInterval(obtenerJuegos, 10000);
      return () => clearInterval(interval);
    }
  }, [descargando]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOrdenAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (busquedaRef.current !== terminoBusqueda) {
      busquedaRef.current = terminoBusqueda;
      setPagina(1);
    }
  }, [terminoBusqueda]);

  const obtenerJuegos = () => {
    setCargando(true);
    setDescargando(false);
    const params = new URLSearchParams();
    params.set("pagina", pagina);
    params.set("por_pagina", porPagina);
    params.set("orden", orden + (ascendente ? "_asc" : ""));
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    if (publisherSel) params.set("publisher", publisherSel);
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("adult", usuario.filtro_adulto ? "1" : "0");
    }

    apiFetch(`/juegos/populares/?${params.toString()}`)
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
        const unicos = Array.from(new Map(data.juegos.map(j => [j.id, j])).values());
        setJuegos(unicos);
        setPagina(data.pagina_actual);
        setPaginasTotales(data.paginas_totales);
        setTotalResultados(data.total_resultados);
      })
      .catch(() => {
        setJuegos([]);
        setPaginasTotales(0);
        setTotalResultados(0);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (!filtersLoaded) return;
    obtenerJuegos();
    const params = new URLSearchParams();
    params.set("pagina", pagina);
    params.set("por_pagina", porPagina);
    params.set("orden", orden + (ascendente ? "_asc" : ""));
    if (terminoBusqueda) params.set("q", terminoBusqueda);
    if (generoSel) params.set("genero", generoSel);
    if (plataformaSel) params.set("plataforma", plataformaSel);
    if (publisherSel) params.set("publisher", publisherSel);
    if (autenticado && usuario && typeof usuario.filtro_adulto === "boolean") {
      params.set("adult", usuario.filtro_adulto ? "1" : "0");
    }
    navigate(`?${params.toString()}`, { replace: true });
  }, [pagina, orden, ascendente, generoSel, plataformaSel, publisherSel, terminoBusqueda, porPagina, filtersLoaded, autenticado, usuario?.filtro_adulto]);

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

  const toggleOrden = (nuevoOrden) => {
    if (orden === nuevoOrden) {
      setAscendente(!ascendente);
    } else {
      setOrden(nuevoOrden);
      setAscendente(false);
    }
    setPagina(1);
    setOrdenAbierto(false);
  };

  // Cambia porPagina desde el select rápido
  const cambiarPorPagina = (e) => {
    const valor = parseInt(e.target.value, 10);
    if (valor) {
      setPorPagina(valor);
      setPagina(1);
    }
  };

  return (
    <div className="min-h-screen text-foreground p-6 max-w-full xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto bg-transparent">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="mb-3">
          <h1 className="text-4xl font-black mb-1">
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
            onChange={(e) => {
              setGeneroSel(e.target.value);
              setPagina(1);
            }}
            className="bg-card text-foreground border border-border rounded px-3 py-1"
          >
            <option value="">🎭 Todos los géneros</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select
            value={plataformaSel}
            onChange={(e) => {
              setPlataformaSel(e.target.value);
              setPagina(1);
            }}
            className="bg-card text-foreground border border-border rounded px-3 py-1"
          >
            <option value="">🖥️ Todas las plataformas</option>
            {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {/* Selector personalizado para juegos por página */}
          <PerPageSelector
            opciones={OPCIONES_POR_PAGINA}
            valor={porPagina}
            onCambiarPreset={cambiarPorPagina}
            onCambiarPersonalizado={(e) => {
              let val = parseInt(e.target.value, 10) || 1;
              if (val > 500) val = 500;
              if (val < 1) val = 1;
              setPorPagina(val);
              setPagina(1);
            }}
          />
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
          {Array(porPagina).fill().map((_, i) => (
            <TarjetaSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
          {juegos.map((j) => (
            <GameCard key={j.id} juego={j} onClick={irAJuego} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {paginasTotales > 1 && !cargando && (
        <div className="text-center mt-6">
          Página {pagina} de {paginasTotales}
          <Pagination paginas={generarPaginas()} paginaActual={pagina} onCambiar={setPagina} />
        </div>
      )}
    </div>
  );
}
