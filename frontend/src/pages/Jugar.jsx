// src/pages/Jugar.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GameCard from "@/components/GameCard";
import { useLang } from "@/context/LangContext";
import { apiFetch } from "../lib/api";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

export default function Jugar() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [inicio, setInicio] = useState(null);
  const [sesionId, setSesionId] = useState(null);
  const [enCurso, setEnCurso] = useState(false);
  const [tiempoActual, setTiempoActual] = useState("00:00:00");
  const [mostrarNota, setMostrarNota] = useState(false);
  const notaRef = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("juego");
    if (id) {
      apiFetch(`/juegos/buscar_id/?id=${id}`)
        .then((r) => r.json())
        .then((j) => {
          setSeleccionado(j);
          setBusqueda(j.name);
        })
        .catch(() => {});
    }
  }, []);

  // Cargar sesión activa si existe
  useEffect(() => {
    fetchAuth("/sesiones/activa/")
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((data) => {
        if (data && data.id) {
          setSesionId(data.id);
          setInicio(new Date(data.inicio).getTime());
          setEnCurso(true);
          apiFetch(`/juegos/buscar_id/?id=${data.juego}`)
            .then((r) => r.json())
            .then((j) => setSeleccionado(j))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (enCurso) {
      localStorage.setItem(
        "sesionJuego",
        JSON.stringify({ sesionId, inicio })
      );
    } else {
      localStorage.removeItem("sesionJuego");
    }
  }, [enCurso, sesionId, inicio]);

  // Buscar en la biblioteca del usuario
  const { resultados: sugerencias } = useDebouncedSearch(
    busqueda,
    (q) =>
      fetchAuth(`/juegos/buscar_en_biblioteca/?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => (Array.isArray(data) ? data : [])),
    { delay: 300, minLength: 1, enabled: !seleccionado }
  );

  useEffect(() => {
    let intervalo = null;
    if (enCurso) {
      intervalo = setInterval(() => {
        const segundos = Math.floor((Date.now() - inicio) / 1000);
        const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
        const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
        const s = String(segundos % 60).padStart(2, "0");
        setTiempoActual(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      clearInterval(intervalo);
    }
    return () => clearInterval(intervalo);
  }, [enCurso, inicio]);

  const comenzar = () => {
    if (!seleccionado) return;
    fetchAuth("/sesiones/iniciar/", {
      method: "POST",
      body: JSON.stringify({ juego: seleccionado.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSesionId(data.id);
        setInicio(new Date(data.inicio).getTime());
        setEnCurso(true);
      });
  };

  const terminar = () => {
    setMostrarNota(true);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">🎮 JUGAR!</h1>

      <div className="relative">
        <label htmlFor="jugar-busqueda" className="sr-only">
          {t("searchGameInLibraryPlaceholder")}
        </label>
        <input
          id="jugar-busqueda"
          type="text"
          placeholder={t("searchGameInLibraryPlaceholder")}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setSeleccionado(null);
          }}
          disabled={enCurso}
          className="w-full p-2 rounded bg-background border border-border"
        />
        {busqueda.length >= 2 && sugerencias.length > 0 && !seleccionado && (
          <ul className="absolute z-dropdown bg-card border border-border rounded w-full max-h-60 overflow-y-auto overscroll-contain mt-1 divide-y divide-border">
            {sugerencias.map((j) => (
              <li
                key={j.id}
                role="button"
                tabIndex={0}
                className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setSeleccionado(j);
                  setBusqueda(j.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSeleccionado(j);
                    setBusqueda(j.name);
                  }
                }}
              >
                {j.cover && (
                  <img
                    src={`https:${j.cover.url}`}
                    alt=""
                    className="w-6 h-6 object-cover rounded"
                  />
                )}
                {j.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {seleccionado && (
        <div className="flex items-center gap-2 mt-4">
          <div className="w-16">
            <GameCard juego={seleccionado} onClick={() => navigate(`/juego/${seleccionado.id}`)} />
          </div>
          {enCurso && <span className="text-success font-semibold">JUGANDO</span>}
        </div>
      )}

      <div className="text-5xl text-center font-mono bg-card p-4 rounded shadow">
        {tiempoActual}
      </div>

      {!enCurso ? (
        <button
          onClick={comenzar}
          disabled={!seleccionado}
          className="w-full p-4 text-xl rounded bg-primary text-primary-foreground hover:bg-opacity-90"
        >
          Iniciar sesión
        </button>
      ) : (
        <button
          onClick={terminar}
          className="w-full p-4 text-xl rounded bg-success text-white hover:bg-opacity-90"
        >
          Terminar sesión
        </button>
      )}

      {mostrarNota && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
          <div className="bg-card p-6 rounded-xl space-y-4 w-11/12 max-w-md">
            <h2 id="nota-sesion-titulo" className="text-xl font-semibold text-center">Añade una nota</h2>
            <label htmlFor="nota-sesion" className="sr-only">
              Nota de la sesión
            </label>
            <textarea
              id="nota-sesion"
              rows={3}
              defaultValue="ME LO PASE GENIAL!"
              ref={notaRef}
              className="w-full p-2 rounded bg-background border border-border"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={async () => {
                  await fetchAuth("/sesiones/finalizar/", {
                    method: "POST",
                    body: JSON.stringify({
                      sesion: sesionId,
                      guardar: true,
                      nota: notaRef.current.value,
                    }),
                  });
                  setEnCurso(false);
                  setSesionId(null);
                  setTiempoActual("00:00:00");
                  navigate("/diario");
                }}
                className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-opacity-90"
              >
                Guardar
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetchAuth("/sesiones/finalizar/", {
                      method: "POST",
                      body: JSON.stringify({ sesion: sesionId, guardar: false }),
                    });
                  } catch {
                    // la sesión se limpia igualmente en local; el backend puede quedar con la sesión abierta
                  }
                  setMostrarNota(false);
                  setEnCurso(false);
                  setSesionId(null);
                  setTiempoActual("00:00:00");
                }}
                className="px-4 py-2 rounded bg-muted text-foreground hover:bg-card"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
