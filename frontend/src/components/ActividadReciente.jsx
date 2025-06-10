import { useEffect, useState } from "react";
import { FaGamepad, FaStar, FaTrophy, FaComment, FaUserPlus } from "react-icons/fa"; // ⬅ nuevo ícono

function formatearFecha(iso) {
  const date = new Date(iso);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function obtenerIcono(tipo) {
  switch (tipo) {
    case "juego_agregado": return <FaGamepad className="text-naranja" />;
    case "juego_valorado": return <FaStar className="text-naranja" />;
    case "logro": return <FaTrophy className="text-naranja" />;
    case "comentario": return <FaComment className="text-naranja" />;
    case "seguimiento": return <FaUserPlus className="text-naranja" />; // ⬅ nuevo tipo
    default: return <FaGamepad className="text-naranja" />;
  }
}

async function reemplazarIdsPorNombres(descripciones) {
  const juegosIds = new Set();
  descripciones.forEach(d => {
    const match = d.descripcion.match(/\*(\d+)\*/);
    if (match) juegosIds.add(match[1]);
  });

  const idToNombre = {};
  await Promise.all([...juegosIds].map(async id => {
    try {
      const res = await fetch(`/api/juegos/buscar_id/?id=${id}`);
      const data = await res.json();
      idToNombre[id] = data.name || `Juego ${id}`;
    } catch {
      idToNombre[id] = `Juego ${id}`;
    }
  }));

  return descripciones.map(d => ({
    ...d,
    descripcion: d.descripcion.replace(/\*(\d+)\*/g, (_, id) => `*${idToNombre[id] || id}*`)
  }));
}

export default function ActividadReciente({ actividades }) {
  const [actividadesFinales, setActividadesFinales] = useState([]);

  useEffect(() => {
    if (!actividades?.length) return;
    reemplazarIdsPorNombres(actividades).then(setActividadesFinales);
  }, [actividades]);

  if (!actividadesFinales.length) return null;

  return (
    <div className="bg-black/30 backdrop-blur-md border border-borde rounded-2xl shadow px-6 py-5">
      <h2 className="font-bold text-naranja text-lg mb-2">Actividad reciente</h2>
      <ul className="flex flex-col gap-3">
        {actividadesFinales.map((act, i) => (
          <li key={i} className="flex items-start gap-3 text-claro">
            <span className="mt-1">{obtenerIcono(act.tipo)}</span>
            <div>
              <p className="text-sm">{formatearDescripcion(act.descripcion)}</p>
              <p className="text-xs text-borde">{formatearFecha(act.fecha)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatearDescripcion(texto) {
  const partes = texto.split(/(\*.*?\*)/);
  return partes.map((parte, i) => {
    if (parte.startsWith("*") && parte.endsWith("*")) {
      return <strong key={i}>{parte.slice(1, -1)}</strong>;
    }
    return <span key={i}>{parte}</span>;
  });
}
