import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function JuegoUnico() {
  const { id } = useParams();
  const [juego, setJuego] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/juegos/detalle/${id}/`)
      .then((res) => res.json())
      .then((data) => {
        setJuego(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar el juego:", err);
        setCargando(false);
      });
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-fondo text-claro p-6">
        <Skeleton height={60} width={300} />
        <Skeleton height={400} />
        <Skeleton height={20} count={4} />
      </div>
    );
  }

  if (!juego) {
    return (
      <div className="min-h-screen text-center text-xl p-10">
        Juego no encontrado
      </div>
    );
  }

  const developers = juego.involved_companies
    ?.filter((c) => c.developer)
    .map((c) => c.company?.name)
    .join(", ") || "Desconocida";

  const publishers = juego.involved_companies
    ?.filter((c) => c.publisher)
    .map((c) => c.company?.name)
    .join(", ") || "Desconocido";

  const plataformas = juego.platforms?.map((p) => p.name).join(", ") || "N/A";

  return (
    <div className="min-h-screen bg-fondo text-claro p-6 space-y-6">
      <h1 className="text-4xl font-bold mb-4">{juego.name}</h1>

      {juego.screenshots?.length > 0 ? (
        <img
          src={`https:${juego.screenshots[0].url.replace("t_thumb", "t_screenshot_huge")}`}
          alt={`Banner de ${juego.name}`}
          className="w-full max-h-[400px] object-cover rounded shadow"
        />
      ) : juego.cover?.url ? (
        <img
          src={`https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`}
          alt={`Portada de ${juego.name}`}
          className="w-full max-h-[400px] object-contain rounded shadow"
        />
      ) : (
        <div className="w-full h-[400px] bg-metal text-center flex items-center justify-center rounded shadow">
          <span className="text-gray-400">Sin imagen disponible</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p><strong>Fecha de salida:</strong>{" "}
            {juego.first_release_date
              ? new Date(juego.first_release_date * 1000).toLocaleDateString()
              : "Desconocida"}
          </p>
          <p><strong>Desarrolladora:</strong> {developers}</p>
          <p><strong>Publisher:</strong> {publishers}</p>
          <p><strong>Plataformas:</strong> {plataformas}</p>
        </div>

        <div className="flex flex-col gap-4">
          <button className="bg-naranja hover:bg-naranjaHover text-black font-bold py-2 px-4 rounded shadow">
            ➕ Añadir a biblioteca
          </button>
          <button className="bg-borde hover:bg-metal text-claro font-medium py-2 px-4 rounded shadow">
            ❤️ Añadir a deseados
          </button>
          <button className="bg-metal hover:bg-borde text-claro font-medium py-2 px-4 rounded shadow">
            ⭐ Puntuar
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mt-8 mb-2">Descripción</h2>
        <p>{juego.summary || "No hay descripción disponible para este juego."}</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mt-8 mb-2">Comentarios</h2>
        <div className="text-gray-400 italic">Sección de comentarios (próximamente)</div>
      </div>
    </div>
  );
}
