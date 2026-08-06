// src/components/AñadirEntrada.jsx
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

export default function AñadirEntrada({ onEntradaCreada }) {
  const { fetchAuth } = useAuth();
  const { t } = useLang();
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

  const { resultados: juegos } = useDebouncedSearch(
    busqueda,
    (q) =>
      fetchAuth(`/juegos/buscar_en_biblioteca/?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => (Array.isArray(data) ? data : [])),
    { delay: 300, minLength: 2, enabled: !seleccionado }
  );

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
    if (onEntradaCreada) onEntradaCreada();
  };

  return (
    <form
      onSubmit={crearEntrada}
      className="bg-card/60 backdrop-blur p-4 rounded-xl space-y-3 shadow"
    >
      <h2 className="text-xl font-semibold text-foreground">Añadir nueva entrada</h2>

      <label htmlFor="entrada-busqueda" className="sr-only">
        {t("searchGameInLibraryPlaceholder")}
      </label>
      <input
        id="entrada-busqueda"
        type="text"
        placeholder={t("searchGameInLibraryPlaceholder")}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setSeleccionado(null);
        }}
        className="w-full p-2 rounded bg-background border border-border"
      />

      {busqueda.length >= 2 && juegos.length > 0 && !seleccionado && (
        <ul className="max-h-48 overflow-y-auto border border-border rounded bg-background text-sm divide-y divide-border">
          {juegos.map((juego) => (
            <li
              key={juego.id ?? juego.name}
              role="button"
              tabIndex={0}
              className="flex items-center gap-3 p-2 cursor-pointer hover:bg-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setSeleccionado(juego);
                setBusqueda(juego.name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSeleccionado(juego);
                  setBusqueda(juego.name);
                }
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
          <label htmlFor="entrada-estado" className="sr-only">
            Estado
          </label>
          <select
            id="entrada-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full p-2 rounded bg-background border border-border"
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.label}
              </option>
            ))}
          </select>

          <label htmlFor="entrada-nota" className="sr-only">
            {t("sessionNotesPlaceholder")}
          </label>
          <textarea
            id="entrada-nota"
            rows={3}
            placeholder={t("sessionNotesPlaceholder")}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full p-2 rounded bg-background border border-border"
          />

          <label htmlFor="entrada-duracion" className="sr-only">
            {t("sessionDurationPlaceholder")}
          </label>
          <input
            id="entrada-duracion"
            type="text"
            placeholder={t("sessionDurationPlaceholder")}
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-full p-2 rounded bg-background border border-border"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-opacity-90"
          >
            Guardar entrada
          </button>
        </>
      )}
    </form>
  );
}
