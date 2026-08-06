import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";
import Planificar from "./Planificar";
import { FaTimes } from "react-icons/fa";
import { apiFetch, fetchJuegosPorIds } from "../lib/api";
import { formatHoras } from "@/lib/format";

export default function Planificaciones() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const [vista, setVista] = useState("lista");
  const [cargando, setCargando] = useState(true);
  const [pendientes, setPendientes] = useState([]);
  const [completadas, setCompletadas] = useState([]);
  const [autoPlan, setAutoPlan] = useState([]);

  const cargarListas = async () => {
    setCargando(true);
    try {
      const [resPend, resComp] = await Promise.all([
        fetchAuth("/juegos/planificaciones/"),
        fetchAuth("/juegos/planificaciones_completadas/")
      ]);
      const dataPend = await resPend.json();
      const dataComp = await resComp.json();
      const detallados = await Promise.all(
        dataPend.map(async (p) => {
          const juegosDet = await fetchJuegosPorIds(p.juegos.slice(0, 4));
          return {
            ...p,
            juegos: juegosDet,
            total: p.duracion_total,
            jugado: p.duracion_jugada,
            restante:
              p.duracion_total != null
                ? Math.max(0, p.duracion_total - p.duracion_jugada)
                : null,
          };
        })
      );
      setPendientes(detallados);
      setCompletadas(dataComp);
    } catch (e) {
      setPendientes([]);
      setCompletadas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vista === "lista") cargarListas();
  }, [vista]);

  const eliminarPlan = async (id) => {
    if (!window.confirm("¿Eliminar esta planificación?")) return;
    try {
      const res = await fetchAuth(`/juegos/planificaciones/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setPendientes((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const cargarAuto = async () => {
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
      setAutoPlan(detallados);
    } catch (e) {
      setAutoPlan([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vista === "auto") cargarAuto();
  }, [vista]);

  const guardarAuto = async () => {
    await fetchAuth("/juegos/planificaciones/", {
      method: "POST",
      body: JSON.stringify({ nombre: "Plan automático", juegos: autoPlan.map((j) => j.id) }),
    });
    setVista("lista");
    cargarListas();
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="font-display text-3xl font-bold">Planificaciones</h1>
      <div className="flex gap-2">
        <button
          onClick={() => setVista("lista")}
          className={`px-3 py-1 rounded ${vista === "lista" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Ver planificaciones
        </button>
        <button
          onClick={() => setVista("manual")}
          className={`px-3 py-1 rounded ${vista === "manual" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Planificación propia
        </button>
        <button
          onClick={() => setVista("auto")}
          className={`px-3 py-1 rounded ${vista === "auto" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Automática
        </button>
      </div>

      {vista === "lista" && (
        cargando ? (
          <p>Cargando...</p>
        ) : (
          <>
            {pendientes.length === 0 && completadas.length === 0 ? (
              <p>No hay planificaciones guardadas.</p>
            ) : (
              <>
                {pendientes.length > 0 && (
                  <>
                    <h2 className="text-xl font-semibold">Pendientes</h2>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {pendientes.map((p) => (
                        <div key={p.id} className="bg-card/30 p-4 rounded relative">
                          <button
                            onClick={() => eliminarPlan(p.id)}
                            className="absolute top-2 right-2 bg-card text-destructive text-xs rounded-md px-2 py-1 flex items-center gap-1 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <FaTimes /> Eliminar
                          </button>
                          <h2 className="font-semibold mb-2">{p.nombre}</h2>
                          <div
                            role="button"
                            tabIndex={0}
                            className="grid grid-cols-2 gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => navigate(`/planificacion/${p.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/planificacion/${p.id}`);
                              }
                            }}
                          >
                            {p.juegos.slice(0, 4).map((j) => (
                              <GameCard key={j.id} juego={j} />
                            ))}
                          </div>
                          <div className="text-xs mt-2">
                            <p>Total: {formatHoras(p.total)}</p>
                            <p>Jugado: {formatHoras(p.jugado)}</p>
                            {p.restante != null && (
                              <p>Restante: {formatHoras(p.restante)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {completadas.length > 0 && (
                  <>
                    <h2 className="text-xl font-semibold mt-6">Completadas</h2>
                    <ul className="space-y-4">
                      {completadas.map((p) => (
                        <li key={p.id} className="bg-card/30 p-4 rounded">
                          <h3 className="font-semibold mb-2">{p.nombre}</h3>
                          <p>Total jugado: {formatHoras(p.resumen.total_segundos)}</p>
                          <p>Completados: {p.resumen.completados}</p>
                          <p>Saltados: {p.resumen.saltados}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )
      )}

      {vista === "manual" && <Planificar />}

      {vista === "auto" && (
        cargando ? (
          <p>Cargando...</p>
        ) : autoPlan.length === 0 ? (
          <p>No hay juegos pendientes en tu biblioteca.</p>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {autoPlan.map((j) => (
                <div key={j.id} className="bg-card/30 p-2 rounded">
                  <GameCard juego={j} />
                  <div className="text-xs mt-1 space-y-1">
                    <p>Total: {formatHoras(j.total)}</p>
                    <p>Jugado: {formatHoras(j.jugado)}</p>
                    {j.restante != null && (
                      <p>Restante: {formatHoras(j.restante)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={guardarAuto}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-bold"
            >
              Guardar plan automático
            </button>
          </>
        )
      )}
    </div>
  );
}

