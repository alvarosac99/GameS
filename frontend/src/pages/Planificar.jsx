import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";

export default function Planificar() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const resBib = await fetchAuth(
          "/api/juegos/biblioteca/?por_pagina=1000"
        );
        const dataBib = await resBib.json();
        const juegos = (dataBib.juegos || []).filter((j) => j.estado !== "completado");
        const resTimes = await fetchAuth("/api/sesiones/tiempos/");
        const tiempos = await resTimes.json();

        const detallados = await Promise.all(
          juegos.map(async (j) => {
            const t = await fetch(
              `/api/juegos/tiempo/?nombre=${encodeURIComponent(j.name)}`
            )
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);
            const jugado = tiempos[j.id] || 0;
            const total = t?.main ? t.main * 3600 : null;
            const restante = total != null ? Math.max(0, total - jugado) : null;
            return { ...j, jugado, total, restante };
          })
        );

        detallados.sort(
          (a, b) => (a.restante ?? Infinity) - (b.restante ?? Infinity)
        );
        setLista(detallados);
      } catch (e) {
        setLista([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Planificar juegos</h1>
      <p className="text-sm text-gray-300">
        Esta es tu biblioteca ordenada desde el juego que más rápido podrías
        terminar entre los que aún no has completado.
      </p>
      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {lista.map((j) => (
            <div
              key={j.id}
              className="relative bg-metal/30 p-2 rounded group"
            >
              <div
                className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/60 z-10"
              >
                <button
                  onClick={() =>
                    setLista((prev) => prev.filter((x) => x.id !== j.id))
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>
              <div onClick={() => navigate(`/jugar?juego=${j.id}`)}>
                <GameCard juego={j} />
              </div>
              <div className="text-xs mt-1 space-y-1">
                <p>Total: {j.total ? (j.total / 3600).toFixed(1) + "h" : "N/A"}</p>
                <p>Jugado: {(j.jugado / 3600).toFixed(1)}h</p>
                {j.restante != null && (
                  <p>Restante: {(j.restante / 3600).toFixed(1)}h</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!cargando && lista.length > 0 && (
        <button
          onClick={async () => {
            await fetchAuth("/api/juegos/planificaciones/", {
              method: "POST",
              body: JSON.stringify({ nombre: "Plan", juegos: lista.map((j) => j.id) }),
            });
            navigate("/planificar");
          }}
          className="mt-4 px-4 py-2 bg-naranja text-black rounded font-bold"
        >
          Guardar planificación
        </button>
      )}
    </div>
  );
}