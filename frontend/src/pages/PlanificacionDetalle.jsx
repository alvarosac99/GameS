import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GameCard from "@/components/GameCard";

export default function PlanificacionDetalle() {
  const { id } = useParams();
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetchAuth(`/api/juegos/planificaciones/${id}/`);
        const data = await res.ok ? await res.json() : null;
        if (!data) {
          setPlan(null);
          setCargando(false);
          return;
        }
        const resTimes = await fetchAuth("/api/sesiones/tiempos/");
        const tiempos = await resTimes.json();
        const juegosDet = await Promise.all(
          data.juegos.map(async (gid) => {
            const j = await fetch(`/api/juegos/buscar_id/?id=${gid}`)
              .then((r) => r.json())
              .catch(() => null);
            if (!j) return null;
            const t = await fetch(
              `/api/juegos/tiempo/?nombre=${encodeURIComponent(j.name)}`
            )
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);
            const jugado = tiempos[gid] || 0;
            const total = t?.main ? t.main * 3600 : null;
            const restante = total != null ? Math.max(0, total - jugado) : null;
            return { ...j, jugado, total, restante };
          })
        );
        const total = juegosDet.reduce((a, j) => a + (j?.total || 0), 0);
        const jugado = juegosDet.reduce((a, j) => a + (j?.jugado || 0), 0);
        const restante = total ? Math.max(0, total - jugado) : null;
        setPlan({ ...data, juegos: juegosDet.filter(Boolean), total, jugado, restante });
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
      <h1 className="text-3xl font-bold">{plan.nombre}</h1>
      <div className="text-sm">
        <p>Total: {plan.total ? (plan.total / 3600).toFixed(1) + "h" : "N/A"}</p>
        <p>Jugado: {(plan.jugado / 3600).toFixed(1)}h</p>
        {plan.restante != null && (
          <p>Restante: {(plan.restante / 3600).toFixed(1)}h</p>
        )}
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {plan.juegos.map((j) => (
          <div
            key={j.id}
            className="cursor-pointer"
            onClick={() => navigate(`/jugar?juego=${j.id}`)}
          >
            <GameCard juego={j} />
          </div>
        ))}
      </div>
    </div>
  );
}