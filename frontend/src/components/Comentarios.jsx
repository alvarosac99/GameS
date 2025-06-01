import { useState, useEffect } from "react";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    document.cookie.split(";").forEach((c) => {
      const [key, val] = c.trim().split("=");
      if (key === name) cookieValue = decodeURIComponent(val);
    });
  }
  return cookieValue;
}

export default function Comentarios({ juegoId, isAuth }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  function cargarComentarios() {
    setCargando(true);
    fetch(`/api/comentarios/juego/${juegoId}/`)
      .then(res => res.json())
      .then(data => {
        setComentarios(data);
        setCargando(false);
      });
  }

  useEffect(() => {
    cargarComentarios();
    // eslint-disable-next-line
  }, [juegoId]);

  function enviarComentario(e) {
    e.preventDefault();
    setError("");
    if (!nuevo.trim()) return;
    fetch(`/api/comentarios/juego/${juegoId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      credentials: "include",
      body: JSON.stringify({ texto: nuevo }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al enviar comentario");
        return res.json();
      })
      .then(data => {
        setNuevo("");
        cargarComentarios();
      })
      .catch(() => setError("No se pudo enviar el comentario"));
  }

  function borrarComentario(id) {
    fetch(`/api/comentarios/borrar/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    })
      .then(() => cargarComentarios());
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Comentarios</h2>
      {isAuth && (
        <form onSubmit={enviarComentario} className="mb-4 flex gap-2">
          <textarea
            className="flex-1 rounded border px-2 py-1 bg-gray-900 text-claro resize-none"
            value={nuevo}
            onChange={e => setNuevo(e.target.value)}
            maxLength={1000}
            placeholder="Escribe tu comentario..."
            required
          />
          <button
            type="submit"
            className="bg-naranja px-4 py-2 rounded text-black font-semibold"
            disabled={!nuevo.trim()}
          >
            Publicar
          </button>
        </form>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {cargando ? (
        <div className="text-gray-400">Cargando comentarios...</div>
      ) : (
        <div className="space-y-4">
          {comentarios.length === 0 && (
            <div className="text-gray-500">¡Sé el primero en comentar!</div>
          )}
          {comentarios.map((c) => (
            <div key={c.id} className="bg-metal/60 rounded-xl p-3 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-naranja">{c.user.username}</span>
                <span className="text-xs text-gray-400">{new Date(c.fecha).toLocaleString()}</span>
                {isAuth && c.user.username === window.USERNAME && (
                  <button
                    onClick={() => borrarComentario(c.id)}
                    className="ml-auto text-xs text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="text-claro">{c.texto}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
