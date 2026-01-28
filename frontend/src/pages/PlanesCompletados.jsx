import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PlanesCompletados() {
  const { fetchAuth } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetchAuth("/juegos/planificaciones_completadas/");
        const data = await res.json();
        setPlanes(data);
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
      <h1 className="text-3xl font-bold">Planes completados</h1>
      {cargando ? (
        <p>Cargando...</p>
      ) : planes.length === 0 ? (
        <p>No hay planes completados.</p>
      ) : (
        <ul className="space-y-4">
          {planes.map((p) => (
            <li key={p.id} className="bg-metal/30 p-4 rounded">
              <h2 className="font-semibold mb-2">{p.nombre}</h2>
              <p>Total jugado: {(p.resumen.total_segundos / 3600).toFixed(1)}h</p>
              <p>Completados: {p.resumen.completados}</p>
              <p>Saltados: {p.resumen.saltados}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
