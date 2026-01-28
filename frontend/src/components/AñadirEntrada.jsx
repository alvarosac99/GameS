// src/components/AñadirEntrada.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";

export default function AñadirEntrada({ onEntradaCreada }) {
  const { fetchAuth } = useAuth();
  const { t } = useLang();
  const [juegos, setJuegos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [estado, setEstado] = useState("jugando");
  const [nota, setNota] = useState("");
  const [duracion, setDuracion] = useState("");

  const ESTADOS = [
    { valor: "jugando", label: "Jugando" },
    { valor: "completado", label: "Completado" },
    { valor: "abandonado", label: "Abandonado" },
    { valor: "en_espera", label: "En espera" },
  ];

  useEffect(() => {
    const delay = setTimeout(() => {
      if (busqueda.length < 2 || seleccionado) {
        setJuegos([]);
        return;
      }

      fetchAuth(`/juegos/buscar_en_biblioteca/?q=${encodeURIComponent(busqueda)}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Resultados recibidos:", data);
          if (Array.isArray(data)) setJuegos(data);
        })
        .catch((error) => {
          console.error("Error al buscar juegos:", error);
          setJuegos([]);
        });
    }, 300);

    return () => clearTimeout(delay);
  }, [busqueda, seleccionado]);

  const crearEntrada = async (e) => {
    e.preventDefault();
    if (!seleccionado) return;

    const datos = {
      juego: seleccionado.id,
      estado,
      nota,
      duracion: duracion.includes(":") ? duracion : `0:${duracion}:00`,
    };

    await fetchAuth("/diario/", {
      method: "POST",
      body: JSON.stringify(datos),
    });

    setSeleccionado(null);
    setEstado("jugando");
    setNota("");
    setDuracion("");
    setBusqueda("");
    setJuegos([]);
    if (onEntradaCreada) onEntradaCreada();
  };

  return (
    <form
      onSubmit={crearEntrada}
      className="bg-metal/60 backdrop-blur p-4 rounded-xl space-y-3 shadow"
    >
      <h2 className="text-xl font-semibold text-claro">Añadir nueva entrada</h2>

      <input
        type="text"
        placeholder={t("searchGameInLibraryPlaceholder")}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setSeleccionado(null);
        }}
        className="w-full p-2 rounded bg-fondo border border-borde"
      />

      {busqueda.length >= 2 && juegos.length > 0 && !seleccionado && (
        <ul className="max-h-48 overflow-y-auto border border-borde rounded bg-fondo text-sm divide-y divide-borde">
          {juegos.map((juego) => (
            <li
              key={juego.id ?? juego.name}
              className="flex items-center gap-3 p-2 cursor-pointer hover:bg-metal transition-all"
              onClick={() => {
                setSeleccionado(juego);
                setBusqueda(juego.name);
              }}
            >
              {juego.cover && (
                <img
                  src={`https:${juego.cover.url}`}
                  alt={juego.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <span>{juego.name}</span>
            </li>
          ))}
        </ul>
      )}

      {seleccionado && (
        <>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full p-2 rounded bg-fondo border border-borde"
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.label}
              </option>
            ))}
          </select>

          <textarea
            rows={3}
            placeholder={t("sessionNotesPlaceholder")}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full p-2 rounded bg-fondo border border-borde"
          />

          <input
            type="text"
            placeholder={t("sessionDurationPlaceholder")}
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-full p-2 rounded bg-fondo border border-borde"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded bg-naranja text-white hover:bg-opacity-90"
          >
            Guardar entrada
          </button>
        </>
      )}
    </form>
  );
}
