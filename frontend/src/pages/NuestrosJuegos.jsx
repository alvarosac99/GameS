import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function NuestrosJuegos() {
  const { fetchAuth } = useAuth();
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchAuth("/juegos/dev/")
      .then((res) => res.json())
      .then((data) => setJuegos(data))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Nuestros Juegos</h1>
      {cargando ? (
        <p>Cargando...</p>
      ) : juegos.length === 0 ? (
        <p>No hay juegos publicados.</p>
      ) : (
        <div className="space-y-4">
          {juegos.map((j) => (
            <div key={j.id} className="bg-metal/30 p-4 rounded">
              <h2 className="text-xl font-semibold">{j.nombre}</h2>
              {j.descripcion && (
                <p className="text-sm text-gray-300">{j.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
