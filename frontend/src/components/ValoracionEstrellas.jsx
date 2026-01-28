import { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

export default function ValoracionEstrellas({ juegoId }) {
  const { autenticado, fetchAuth } = useAuth();
  const [miValoracion, setMiValoracion] = useState(null);
  const [hover, setHover] = useState(null);
  const [media, setMedia] = useState(0);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    setCargando(true);
    fetchAuth(`/juegos/valoracion/${juegoId}/`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        setMiValoracion(data.mi_valoracion ?? null);
        setMedia(data.media_valoracion || 0);
        setTotal(data.total_valoraciones || 0);
      })
      .finally(() => setCargando(false));
  }, [juegoId, fetchAuth]);

  function puntuar(valor) {
    if (!autenticado) {
      setMensaje("Debes iniciar sesión para valorar.");
      return;
    }
    setPublicando(true);
    fetchAuth(`/juegos/valoracion/${juegoId}/`, {
      method: "POST",
      body: JSON.stringify({ valor }),
    })
      .then(res => res.json())
      .then(data => {
        setMiValoracion(data.mi_valoracion ?? null);
        setMedia(data.media_valoracion || 0);
        setTotal(data.total_valoraciones || 0);
        setMensaje("¡Gracias por valorar!");
      })
      .catch(() => setMensaje("No se pudo guardar la valoración."))
      .finally(() => setPublicando(false));
  }

  function renderEstrellas({ valor, interactivo = false, onStarClick, onStarHover, onStarLeave }) {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      let tipo = "empty";
      if (valor >= i) tipo = "full";
      else if (valor >= i - 0.5) tipo = "half";
      let estrella;
      if (interactivo) {
        estrella = (
          <span
            key={i}
            className="cursor-pointer transition-all duration-150 transform hover:scale-125"
            onMouseMove={e => {
              if (!publicando) {
                const { left, width } = e.target.getBoundingClientRect();
                const x = e.clientX - left;
                onStarHover(x < width / 2 ? i - 0.5 : i);
              }
            }}
            onClick={e => {
              if (!publicando) {
                const { left, width } = e.target.getBoundingClientRect();
                const x = e.clientX - left;
                onStarClick(x < width / 2 ? i - 0.5 : i);
              }
            }}
            onMouseLeave={onStarLeave}
            title={`Puntuar con ${i} estrellas`}
          >
            {tipo === "full" ? (
              <FaStar size={28} className="text-naranja drop-shadow" />
            ) : tipo === "half" ? (
              <FaStarHalfAlt size={28} className="text-naranja drop-shadow" />
            ) : (
              <FaRegStar size={28} className="text-borde" />
            )}
          </span>
        );
      } else {
        estrella =
          tipo === "full" ? (
            <FaStar key={i} size={24} className="text-naranja" />
          ) : tipo === "half" ? (
            <FaStarHalfAlt key={i} size={24} className="text-naranja" />
          ) : (
            <FaRegStar key={i} size={24} className="text-borde" />
          );
      }
      estrellas.push(estrella);
    }
    return estrellas;
  }

  return (
    <div className="bg-[#22282f] border border-[#292e36] rounded-xl p-4 mt-4 w-fit min-w-[220px] shadow flex flex-col gap-1 items-center">
      {/* Solo estrellas para la puntuación propia */}
      <div className="flex items-center gap-2">
        {renderEstrellas({
          valor: hover ?? miValoracion ?? 0,
          interactivo: true,
          onStarClick: valor => {
            if (autenticado && !publicando) puntuar(valor);
          },
          onStarHover: valor => {
            if (autenticado && !publicando) setHover(valor);
          },
          onStarLeave: () => setHover(null),
        })}
        <span className="ml-2 text-naranja text-sm font-semibold">
          {miValoracion ? `Mi puntuación: ${miValoracion}` : ""}
        </span>
        {cargando && <span className="text-borde ml-2">Cargando...</span>}
      </div>
      {/* Solo el número para la media, destacado */}
      <div className="flex items-center gap-2 text-lg mt-1">
        <span className="ml-1 text-naranja font-bold">{media ? media.toFixed(2) : "--"}</span>
        <span className="text-xs text-borde">
          {total} valoración{total !== 1 ? "es" : ""}
        </span>
      </div>
      {mensaje && <div className="text-xs text-naranja mt-1">{mensaje}</div>}
    </div>
  );
}
