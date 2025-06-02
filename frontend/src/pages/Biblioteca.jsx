import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GameCard from "@/components/GameCard";
import TarjetaSkeleton from "../components/TarjetaSkeleton";
import { FaSort, FaSortAmountUp, FaSortAmountDown } from "react-icons/fa";

const OPCIONES_POR_PAGINA = [10, 20, 30, 40, 50];

export default function Biblioteca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(parseInt(searchParams.get("pagina") || "1", 10));
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("popularidad");
  const [ascendente, setAscendente] = useState(false);
  const [mostrarMenuOrden, setMostrarMenuOrden] = useState(false);
  const [porPagina, setPorPagina] = useState(parseInt(searchParams.get("por_pagina") || "30", 10));
  const navigate = useNavigate();
  const menuRef = useRef();

  useEffect(() => {
    setCargando(true);
    fetch(`/api/juegos/biblioteca/?pagina=${pagina}&por_pagina=${porPagina}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setJuegos(data.juegos || []);
        setPaginasTotales(data.paginas_totales);
        setTotalResultados(data.total_resultados);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("pagina", String(pagina));
        newParams.set("por_pagina", String(porPagina));
        setSearchParams(newParams);
      })
      .catch(() => setJuegos([]))
      .finally(() => setCargando(false));
  }, [pagina, porPagina]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMostrarMenuOrden(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generarPaginas = () => {
    const delta = 2;
    const pages = new Set([1, paginasTotales]);
    for (let i = pagina - delta; i <= pagina + delta; i++) {
      if (i > 1 && i < paginasTotales) pages.add(i);
    }
    return [...pages].sort((a, b) => a - b);
  };

  const ordenarJuegos = (a, b) => {
    const dir = ascendente ? 1 : -1;
    if (orden === "nombre") return dir * a.name.localeCompare(b.name);
    if (orden === "fecha") return dir * ((a.first_release_date || 0) - (b.first_release_date || 0));
    return dir * ((a.aggregated_rating || 0) - (b.aggregated_rating || 0));
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
    <div className="min-h-screen bg-fondo text-claro p-6 max-w-full xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Mi biblioteca</h1>

        <div className="flex flex-wrap items-center gap-2 relative" ref={menuRef}>
          <input
            type="text"
            placeholder="Buscar en tu biblioteca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-metal text-claro border border-borde rounded px-3 py-1"
          />

          <button
            onClick={() => setMostrarMenuOrden(!mostrarMenuOrden)}
            className="bg-borde hover:bg-metal text-claro px-3 py-1 rounded flex items-center gap-2"
          >
            <FaSort /> Ordenar
          </button>

          {mostrarMenuOrden && (
            <div className="absolute right-0 mt-12 w-48 bg-metal border border-borde rounded shadow-md z-10">
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
                  className={`w-full px-4 py-2 text-left hover:bg-borde ${
                    orden === tipo ? "font-bold text-naranja" : ""
                  }`}
                >
                  {tipo === "popularidad" && "📈 Popularidad"}
                  {tipo === "nombre" && "🔤 Nombre"}
                  {tipo === "fecha" && "🕒 Fecha de salida"}
                  {orden === tipo && (ascendente ? <FaSortAmountUp className="inline ml-1" /> : <FaSortAmountDown className="inline ml-1" />)}
                </button>
              ))}
            </div>
          )}

          {/* Selector de juegos por página */}
          <div className="flex items-center gap-2">
            <select
              value={OPCIONES_POR_PAGINA.includes(porPagina) ? porPagina : ""}
              onChange={cambiarPorPagina}
              className="bg-metal text-claro border border-borde rounded px-3 py-1"
            >
              <option value="">Otro…</option>
              {OPCIONES_POR_PAGINA.map((n) => (
                <option key={n} value={n}>
                  Mostrar {n}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={500}
              value={porPagina}
              onChange={e => {
                let val = parseInt(e.target.value, 10) || 1;
                if (val > 500) val = 500;
                if (val < 1) val = 1;
                setPorPagina(val);
                setPagina(1);
              }}
              className="w-20 bg-metal text-claro border border-borde rounded px-2 py-1 text-center"
              title="Cantidad personalizada"
            />
            <span className="text-xs text-borde">/página</span>
          </div>
        </div>
      </div>

      {!cargando && totalResultados > 0 && (
        <div className="mb-4 text-claro">
          {totalResultados} juego{totalResultados !== 1 && "s"} en total
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
          {Array(porPagina).fill().map((_, i) => <TarjetaSkeleton key={i} />)}
        </div>
      ) : juegos.length === 0 ? (
        <p>No tienes juegos en tu biblioteca.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-6">
            {[...juegos]
              .filter((j) => j.name?.toLowerCase().includes(busqueda.toLowerCase()))
              .sort(ordenarJuegos)
              .map((juego) => (
                <GameCard
                  key={juego.id}
                  juego={juego}
                  onClick={() => navigate(`/juego/${juego.id}`)}
                />
              ))}
          </div>

          {/* Paginación */}
          {paginasTotales > 1 && (
            <div className="mt-6 text-center">
              <p>Página {pagina} de {paginasTotales}</p>
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                {generarPaginas().map((n) =>
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`px-3 py-1 rounded ${pagina === n
                      ? "bg-naranja text-black font-bold"
                      : "bg-borde text-claro hover:bg-metal"}`}
                  >
                    {n}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
