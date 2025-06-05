import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";

export default function Planificaciones() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetchAuth("/api/juegos/planificaciones/");
        const data = await res.json();
        const resTimes = await fetchAuth("/api/sesiones/tiempos/");
        const tiempos = await resTimes.json();
        const detallados = await Promise.all(
          data.map(async (p) => {
            const juegosDet = await Promise.all(
              p.juegos.map(async (gid) => {
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
            return { ...p, juegos: juegosDet.filter(Boolean), total, jugado, restante };
          })
        );
        setPlanes(detallados);
      } catch (e) {
        setPlanes([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Mis planificaciones</h1>
      {cargando ? (
        <p>Cargando...</p>
      ) : planes.length === 0 ? (
        <p>No hay planificaciones guardadas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {planes.map((p) => (
            <div key={p.id} className="bg-metal/30 p-4 rounded">
              <h2 className="font-semibold mb-2">{p.nombre}</h2>
              <div
                className="grid grid-cols-2 gap-2 cursor-pointer"
                onClick={() => navigate(`/planificacion/${p.id}`)}
              >
                {p.juegos.slice(0, 4).map((j) => (
                  <GameCard key={j.id} juego={j} />
                ))}
              </div>
              <div className="text-xs mt-2">
                <p>Total: {p.total ? (p.total / 3600).toFixed(1) + "h" : "N/A"}</p>
                <p>Jugado: {(p.jugado / 3600).toFixed(1)}h</p>
                {p.restante != null && (
                  <p>Restante: {(p.restante / 3600).toFixed(1)}h</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}