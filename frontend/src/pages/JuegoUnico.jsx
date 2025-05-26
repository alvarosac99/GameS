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
    <div className="min-h-screen bg-fondo text-claro">
      {/* Banner */}
      <div className="relative h-[350px] w-full overflow-hidden">
        {juego.screenshots?.[0]?.url ? (
          <img
            src={`https:${juego.screenshots[0].url.replace("t_thumb", "t_screenshot_huge")}`}
            alt="Banner"
            className="object-cover w-full h-full brightness-[0.3]"
          />
        ) : (
          <div className="w-full h-full bg-metal flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}

        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-4xl font-bold drop-shadow">{juego.name}</h1>
          <p className="drop-shadow text-lg">
            {juego.first_release_date
              ? `Lanzado el ${new Date(juego.first_release_date * 1000).toLocaleDateString()}`
              : "Fecha de salida desconocida"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 px-6 py-8">
        {/* Columna izquierda */}
        <div className="md:col-span-1 flex flex-col items-center space-y-4">
          {juego.cover?.url && (
            <img
              src={`https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`}
              alt="Portada"
              className="w-48 h-auto rounded shadow"
            />
          )}

          <button className="bg-naranja hover:bg-naranjaHover text-black font-bold py-2 px-4 rounded w-full">
            ➕ Añadir a biblioteca
          </button>
          <button className="bg-borde hover:bg-metal text-claro font-medium py-2 px-4 rounded w-full">
            ❤️ Añadir a deseados
          </button>
          <button className="bg-metal hover:bg-borde text-claro font-medium py-2 px-4 rounded w-full">
            ⭐ Puntuar
          </button>
        </div>

        {/* Columna derecha */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p><strong>Desarrolladora:</strong> {developers}</p>
              <p><strong>Publisher:</strong> {publishers}</p>
              <p><strong>Plataformas:</strong> {plataformas}</p>
            </div>
            <div>
              <p><strong>Géneros:</strong> <span className="italic text-gray-400">Pendiente</span></p>
              <p><strong>Saga:</strong> <span className="italic text-gray-400">Próximamente</span></p>
              <p><strong>Más info:</strong> <a href={`https://www.igdb.com/games/${id}`} className="text-naranja underline">IGDB</a></p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Descripción</h2>
            <p className="text-gray-200">{juego.summary || "No hay descripción disponible para este juego."}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Comentarios</h2>
            <div className="text-gray-400 italic">Sección de comentarios (próximamente)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
