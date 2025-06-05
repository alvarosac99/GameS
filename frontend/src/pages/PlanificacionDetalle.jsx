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
        const juegosDet = await Promise.all(
          data.juegos.map(async (gid) => {
            const j = await fetch(`/api/juegos/buscar_id/?id=${gid}`)
              .then((r) => r.json())
              .catch(() => null);
            return j;
          })
        );
        setPlan({
          ...data,
          juegos: juegosDet.filter(Boolean),
          total: data.duracion_total,
          jugado: data.duracion_jugada,
          restante:
            data.duracion_total != null
              ? Math.max(0, data.duracion_total - data.duracion_jugada)
              : null,
        });
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