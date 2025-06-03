// src/pages/Jugar.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Jugar() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();

  const [juegos, setJuegos] = useState([]);
  const [juegoId, setJuegoId] = useState(null);
  const [inicio, setInicio] = useState(null);
  const [duracion, setDuracion] = useState(null);
  const [nota, setNota] = useState("");
  const [enCurso, setEnCurso] = useState(false);
  const [tiempoActual, setTiempoActual] = useState("00:00:00");

  useEffect(() => {
    fetchAuth("/api/biblioteca/").then((res) => {
      if (Array.isArray(res)) setJuegos(res.map(e => e.juego));
    });
  }, []);

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
    if (!juegoId) return;
    setInicio(Date.now());
    setEnCurso(true);
  };

  const terminar = async () => {
    const fin = Date.now();
    const segundos = Math.floor((fin - inicio) / 1000);
    const duracionFormato = new Date(segundos * 1000).toISOString().substr(11, 8);

    setDuracion(duracionFormato);
    setEnCurso(false);

    await fetchAuth("/api/diario/", {
      method: "POST",
      body: JSON.stringify({
        juego: juegoId,
        estado: "jugando",
        nota,
        duracion: duracionFormato,
      }),
    });

    navigate("/diario");
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">🎮 JUGAR!</h1>

      <select
        value={juegoId || ""}
        onChange={(e) => setJuegoId(e.target.value)}
        className="w-full p-2 rounded bg-fondo border border-borde"
        disabled={enCurso}
      >
        <option value="">Selecciona un juego...</option>
        {juegos.map((j) => (
          <option key={j.id} value={j.id}>
            {j.nombre}
          </option>
        ))}
      </select>

      <div className="text-5xl text-center font-mono bg-metal p-4 rounded shadow">
        {tiempoActual}
      </div>

      {!enCurso ? (
        <button
          onClick={comenzar}
          disabled={!juegoId}
          className="w-full p-4 text-xl rounded bg-naranja text-white hover:bg-opacity-90"
        >
          Iniciar sesión
        </button>
      ) : (
        <div className="space-y-4">
          <textarea
            rows={3}
            placeholder="¿Qué hiciste en esta sesión?"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full p-2 rounded bg-fondo border border-borde"
          />
          <button
            onClick={terminar}
            className="w-full p-4 text-xl rounded bg-green-600 text-white hover:bg-opacity-90"
          >
            Terminar sesión y guardar
          </button>
        </div>
      )}
    </div>
  );
}
