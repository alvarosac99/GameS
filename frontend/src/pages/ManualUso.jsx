import React, { useState } from "react";
import { useLang } from "@/context/LangContext";

const secciones = [
  { id: "inicio" },
  { id: "juegos" },
  { id: "biblioteca" },
  { id: "diario" },
  { id: "planificaciones" },
  { id: "perfil" },
  { id: "ajustes" },
  { id: "jugar" },
];


export default function ManualUso() {
  const [activo, setActivo] = useState(secciones[0].id);
  const actual = secciones.find((s) => s.id === activo);
  const { t } = useLang();

  return (
    <div className="py-6 px-0 md:px-6 md:max-w-6xl md:mx-auto text-claro flex flex-col md:flex-row gap-6">
      <nav className="md:w-64 flex-shrink-0 pr-4 md:pr-6">
        <ul className="space-y-2">
          {secciones.map((sec) => (
            <li key={sec.id}>
              <button
                className={`w-full text-left p-2 rounded hover:bg-metal/70 transition ${activo === sec.id ? "bg-metal" : "bg-metal/50"}`}
                onClick={() => setActivo(sec.id)}
              >
                {t(`manual${sec.id}Titulo`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 bg-metal/50 p-4 rounded">
        <h2 className="text-2xl font-bold mb-2">{t(`manual${actual.id}Titulo`)}</h2>
        <p>{t(`manual${actual.id}Texto`)}</p>
      </div>
    </div>
  );
}
