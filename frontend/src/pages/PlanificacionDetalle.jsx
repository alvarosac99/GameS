import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GameCard from "@/components/GameCard";
import { fetchJuegosPorIds } from "../lib/api";
import { formatHoras } from "@/lib/format";

export default function PlanificacionDetalle() {
  const { id } = useParams();
  const { fetchAuth } = useAuth();
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [estatus, setEstatus] = useState({});
  const [bibIds, setBibIds] = useState({});
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetchAuth(`/juegos/planificaciones/${id}/`);
        const data = await res.ok ? await res.json() : null;
        if (!data) {
          setPlan(null);
          setCargando(false);
          return;
        }
        const juegosFinal = await fetchJuegosPorIds(data.juegos);
        setPlan({
          ...data,
          juegos: juegosFinal,
          total: data.duracion_total,
          jugado: data.duracion_jugada,
          restante:
            data.duracion_total != null
              ? Math.max(0, data.duracion_total - data.duracion_jugada)
              : null,
        });
        const est = {};
        const ids = {};
        for (const j of juegosFinal) {
          try {
            const resBib = await fetchAuth(
              `/juegos/biblioteca/?game_id=${j.id}`
            );
            const datos = await resBib.json();
            if (Array.isArray(datos) && datos.length > 0) {
              ids[j.id] = datos[0].id;
              est[j.id] =
                datos[0].estado === "completado" ? "completado" : "pendiente";
            } else {
              est[j.id] = "pendiente";
            }
          } catch {
            est[j.id] = "pendiente";
          }
        }
        setBibIds(ids);
        setEstatus(est);
      } catch (e) {
        setPlan(null);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  if (cargando) return <div className="p-4">Cargando...</div>;
  if (!plan) return <div className="p-4">Planificación no encontrada</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="font-display text-3xl font-bold">{plan.nombre}</h1>
      <div className="text-sm">
        <p>Total: {formatHoras(plan.total)}</p>
        <p>Jugado: {formatHoras(plan.jugado)}</p>
        {plan.restante != null && (
          <p>Restante: {formatHoras(plan.restante)}</p>
        )}
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {plan.juegos.map((j) => (
          <div key={j.id} className="space-y-2">
            <GameCard juego={j} />
            <div className="flex justify-center gap-1 text-xs">
              <button
                onClick={async () => {
                  if (bibIds[j.id]) {
                    await fetchAuth(`/juegos/biblioteca/${bibIds[j.id]}/`, {
                      method: "PATCH",
                      body: JSON.stringify({ estado: "completado" }),
                    });
                  }
                  setEstatus((e) => ({ ...e, [j.id]: "completado" }));
                }}
                className={`px-2 py-1 rounded ${estatus[j.id] === "completado" ? "bg-success" : "bg-muted"}`}
              >
                Completar
              </button>
              <button
                onClick={() => setEstatus((e) => ({ ...e, [j.id]: "saltado" }))}
                className={`px-2 py-1 rounded ${estatus[j.id] === "saltado" ? "bg-warning" : "bg-muted"}`}
              >
                Saltar
              </button>
              <button
                onClick={() => {
                  setPlan((p) => ({ ...p, juegos: p.juegos.filter((x) => x.id !== j.id) }));
                  setEstatus((e) => {
                    const { [j.id]: _, ...rest } = e;
                    return rest;
                  });
                }}
                className="px-2 py-1 rounded bg-destructive"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      {plan.juegos.length > 0 && (
        <button
          onClick={async () => {
            const res = await fetchAuth(`/juegos/planificaciones/${id}/finalizar/`, {
              method: "POST",
              body: JSON.stringify({ juegos: estatus }),
            });
            if (res.ok) {
              const data = await res.json();
              setResumen(data);
              setPlan((p) => ({ ...p, juegos: [] }));
            }
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-bold"
        >
          Completar plan
        </button>
      )}
      {resumen && (
        <div className="space-y-2 bg-card/30 p-4 rounded">
          <h2 className="text-xl font-semibold">Resumen</h2>
          <p>Total: {formatHoras(resumen.total_segundos)}</p>
          <p>Completados: {resumen.completados}</p>
          <p>Saltados: {resumen.saltados}</p>
        </div>
      )}
    </div>
  );
}
