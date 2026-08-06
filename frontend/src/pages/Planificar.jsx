import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";
import { useLang } from "@/context/LangContext";
import { apiFetch } from "../lib/api";
import { formatHoras } from "@/lib/format";

export default function Planificar() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [biblioteca, setBiblioteca] = useState([]);
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const resBib = await fetchAuth("/juegos/biblioteca/?por_pagina=1000");
        const dataBib = await resBib.json();
        const juegos = (dataBib.juegos || []).filter((j) => j.estado !== "completado");
        const resTimes = await fetchAuth("/sesiones/tiempos/");
        const tiempos = await resTimes.json();

        const detallados = await Promise.all(
          juegos.map(async (j) => {
            const t = await apiFetch(`/juegos/tiempo/?nombre=${encodeURIComponent(j.name)}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);
            const jugado = tiempos[j.id] || 0;
            const total = t?.main ? t.main * 3600 : null;
            const restante = total != null ? Math.max(0, total - jugado) : null;
            return { ...j, jugado, total, restante };
          })
        );

        detallados.sort((a, b) => (a.restante ?? Infinity) - (b.restante ?? Infinity));
        setBiblioteca(detallados);
      } catch (e) {
        setBiblioteca([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const sugerencias = busqueda.length >= 2
    ? biblioteca.filter(
        (j) =>
          j.name.toLowerCase().includes(busqueda.toLowerCase()) &&
          !lista.some((x) => x.id === j.id)
      )
    : [];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Crear planificación</h1>

      <div className="space-y-2">
        <label htmlFor="plan-nombre" className="sr-only">
          {t("planNamePlaceholder")}
        </label>
        <input
          id="plan-nombre"
          type="text"
          placeholder={t("planNamePlaceholder")}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 rounded bg-background border border-border"
        />
        <label htmlFor="plan-busqueda" className="sr-only">
          {t("searchLibrary")}
        </label>
        <input
          id="plan-busqueda"
          type="text"
          placeholder={t("searchLibrary")}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 rounded bg-background border border-border"
        />
        {sugerencias.length > 0 && (
          <ul className="divide-y divide-border bg-card rounded">
            {sugerencias.map((j) => (
              <li
                key={j.id}
                role="button"
                tabIndex={0}
                className="p-2 hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setLista((prev) => [...prev, j]);
                  setBusqueda("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLista((prev) => [...prev, j]);
                    setBusqueda("");
                  }
                }}
              >
                {j.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {lista.length > 0 && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {lista.map((j) => (
            <div key={j.id} className="relative bg-card/30 p-2 rounded group">
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/60 z-10">
                <button
                  onClick={() => setLista((prev) => prev.filter((x) => x.id !== j.id))}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>
              <GameCard juego={j} />
              <div className="text-xs mt-1 space-y-1">
                <p>Total: {formatHoras(j.total)}</p>
                <p>Jugado: {formatHoras(j.jugado)}</p>
                {j.restante != null && <p>Restante: {formatHoras(j.restante)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!cargando && lista.length > 0 && (
        <button
          onClick={async () => {
            await fetchAuth("/juegos/planificaciones/", {
              method: "POST",
              body: JSON.stringify({ nombre: nombre || "Plan", juegos: lista.map((j) => j.id) }),
            });
            navigate("/planificaciones");
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-bold"
        >
          Guardar planificación
        </button>
      )}
    </div>
  );
}
