import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FaStar, FaRegStar, FaStarHalfAlt, FaTimes } from "react-icons/fa";

// Formato de fecha
const fechaCorta = (iso) => {
  const date = new Date(iso);
  return date.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
};

// Render de estrellas con soporte para medias
function renderEstrellas(valor) {
  const estrellas = [];
  for (let i = 1; i <= 5; i++) {
    if (valor >= i) {
      estrellas.push(<FaStar key={i} className="text-naranja inline" />);
    } else if (valor >= i - 0.5) {
      estrellas.push(<FaStarHalfAlt key={i} className="text-naranja inline" />);
    } else {
      estrellas.push(<FaRegStar key={i} className="text-borde inline" />);
    }
  }
  return estrellas;
}

const ORDENES = [
  { value: "recientes", label: "Más nuevos" },
  { value: "antiguos", label: "Más antiguos" },
];

export default function Comentarios({ juegoId }) {
  const { usuario, autenticado, fetchAuth } = useAuth();
  const navigate = useNavigate();

  const [comentarios, setComentarios] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [orden, setOrden] = useState("recientes");

  const comentariosRef = useRef(null);
  const textareaRef = useRef(null);

  const POR_PAGINA = 10;

  // Solo carga comentarios si está autenticado
  useEffect(() => {
    if (autenticado) {
      cargarComentarios();
    } else {
      setComentarios([]);
      setCargando(false);
    }
  }, [juegoId, autenticado]);

  useEffect(() => {
    setPaginas(Math.max(1, Math.ceil(comentarios.length / POR_PAGINA)));
  }, [comentarios]);

  function ordenarLista(lista) {
    switch (orden) {
      case "antiguos":
        return [...lista].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      case "recientes":
        return [...lista].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      default:
        return lista;
    }
  }

  async function cargarComentarios() {
    setCargando(true);
    try {
      const res = await fetch(`/api/comentarios/juego/${juegoId}/`);
      const data = await res.json();

      const comentariosOrdenados = ordenarLista(data || []);
      const comentariosConFoto = await Promise.all(
        comentariosOrdenados.map(async (comentario) => {
          try {
            const resFoto = await fetch(`/api/usuarios/perfil-publico/${comentario.user.username}/`);
            const perfil = await resFoto.json();
            return {
              ...comentario,
              foto: perfil.foto,
              nombre: perfil.nombre,
            };
          } catch {
            return {
              ...comentario,
              foto: "/media/avatares/default.png",
              nombre: comentario.user.username,
            };
          }
        })
      );

      setComentarios(comentariosConFoto);
      setPagina(1);
    } catch {
      setComentarios([]);
    }
    setCargando(false);
  }

  function enviarComentario(e) {
    e.preventDefault();
    setError("");

    const texto = nuevo.trim();
    if (texto.length < 2) {
      setError("El comentario debe tener al menos 2 caracteres.");
      return;
    }

    setPublicando(true);
    fetchAuth(`/api/comentarios/juego/${juegoId}/`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    })
      .then(async (res) => {
        setPublicando(false);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.texto?.[0] || err?.detail || "No se pudo enviar el comentario");
        }
        return res.json();
      })
      .then(() => {
        setNuevo("");
        cargarComentarios();
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      })
      .catch((err) => setError(err.message));
  }

  function borrarComentario(id) {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    fetchAuth(`/api/comentarios/borrar/${id}/`, { method: "DELETE" }).then(() =>
      cargarComentarios()
    );
  }

  function ComentarioBloque({ c }) {
    return (
      <div
        onClick={() => navigate(`/perfil/${c.user.username}`)}
        className="bg-[#2b2b2b] hover:bg-[#3c3c3c] rounded-xl p-4 shadow-md border border-borde/40 text-white transition-all duration-300 flex gap-4 cursor-pointer group"
      >
        <img
          src={c.foto}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover border border-borde"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-white group-hover:underline">{c.nombre}</span>
            {c.valoracion != null && (
              <span className="flex items-center ml-2">
                {renderEstrellas(c.valoracion)}
                <span className="ml-1 text-naranja font-semibold text-xs">
                  {Number(c.valoracion).toFixed(1)}
                </span>
              </span>
            )}
            <span className="text-xs text-gray-400">{fechaCorta(c.fecha)}</span>
            {autenticado &&
              (usuario?.username === c.user.username ||
                usuario?.rol === "STAFF" ||
                usuario?.rol === "ADMIN") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  borrarComentario(c.id);
                }}
                className="ml-auto bg-metal text-red-400 text-xs rounded-md px-3 py-1 flex items-center gap-1 hover:bg-red-900/20 hover:text-red-500 cursor-pointer"
              >
                <FaTimes /> Eliminar
              </button>
            )}
          </div>
          <div className="text-white/90">{c.texto}</div>
        </div>
      </div>
    );
  }

  const inicio = (pagina - 1) * POR_PAGINA;
  const fin = inicio + POR_PAGINA;
  const paginaActual = comentarios.slice(inicio, fin);

  if (!autenticado) {
    return (
      <div className="mt-8 text-center text-white">
        <p>
          <strong>Inicia sesión</strong> para ver y publicar comentarios.
        </p>
        <Link
          to="/login"
          className="inline-block mt-2 px-4 py-2 bg-naranja text-black rounded-xl font-semibold hover:bg-naranja/90"
        >
          Ir a Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8" ref={comentariosRef}>
      <h2 className="text-xl font-bold mb-4 text-white">Comentarios</h2>

      <div className="flex items-center gap-4 mb-2">
        <label className="text-xs text-gray-400 font-semibold">Ordenar por:</label>
        <select
          className="bg-metal border-borde rounded-xl px-2 py-1 text-naranja font-bold"
          value={orden}
          onChange={(e) => {
            setOrden(e.target.value);
            setComentarios((prev) => ordenarLista(prev));
          }}
        >
          {ORDENES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={enviarComentario} className="mb-4 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          id="comentario-nuevo"
          className="rounded-xl border border-naranja px-3 py-2 bg-metal text-white resize-none transition focus:outline-none focus:border-naranja"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Escribe tu comentario..."
          required
          disabled={publicando}
        />
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            className={`bg-naranja px-4 py-2 rounded-xl text-black font-semibold transition ${
              publicando ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={!nuevo.trim() || publicando}
          >
            {publicando ? "Publicando..." : "Publicar"}
          </button>
          <span className="text-xs text-gray-400 ml-2">{nuevo.length}/1000</span>
        </div>
      </form>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      {cargando ? (
        <div className="text-gray-400">Cargando comentarios...</div>
      ) : comentarios.length === 0 ? (
        <div className="text-gray-500">¡Sé el primero en comentar!</div>
      ) : (
        <>
          <div className="space-y-4">
            {paginaActual.map((c) => (
              <ComentarioBloque key={c.id} c={c} />
            ))}
          </div>
          {paginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                className="px-2 py-1 rounded bg-borde text-xs text-white/80"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
              >
                Anterior
              </button>
              <span className="font-mono text-xs text-white/70">
                Página {pagina} de {paginas}
              </span>
              <button
                className="px-2 py-1 rounded bg-borde text-xs text-white/80"
                onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                disabled={pagina === paginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
