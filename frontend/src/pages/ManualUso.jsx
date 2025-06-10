import React, { useState } from "react";

const secciones = [
  {
    id: "inicio",
    titulo: "Página principal",
    texto:
      "Al entrar verás estadísticas del sitio, carruseles de juegos populares y recomendaciones personales. Desde aquí puedes abrir el menú lateral para navegar por el resto de apartados.",
  },
  {
    id: "juegos",
    titulo: "Juegos",
    texto:
      "Explora todo el catálogo utilizando la barra de búsqueda y los filtros de género, plataforma o editor. Haz clic en cualquier tarjeta para acceder a su ficha y comparar precios.",
  },
  {
    id: "biblioteca",
    titulo: "Biblioteca",
    texto:
      "Añade los juegos que posees o sigues para consultarlos rápidamente. Podrás ordenar tu lista, ver el tiempo jugado y lanzar sesiones desde cada tarjeta.",
  },
  {
    id: "diario",
    titulo: "Diario",
    texto:
      "Registra tus partidas diarias. Crea entradas con notas y revisa en el calendario cuándo jugaste cada título para seguir tu progreso.",
  },
  {
    id: "planificaciones",
    titulo: "Planificaciones",
    texto:
      "Programa futuras sesiones de juego. Define eventos, añade los títulos implicados y marca las tareas completadas para recibir recordatorios.",
  },
  {
    id: "perfil",
    titulo: "Perfil",
    texto:
      "Consulta tus datos personales, modifica el avatar y revisa valoraciones o comentarios. Otros usuarios podrán visitar tu perfil público.",
  },
  {
    id: "ajustes",
    titulo: "Ajustes",
    texto:
      "Cambia el idioma, el aspecto visual y otras preferencias para que GameS se adapte a tus gustos.",
  },
  {
    id: "jugar",
    titulo: "Jugar",
    texto:
      "Inicia y detén sesiones de juego. Busca el título que vas a jugar, pulsa \"Iniciar\" y la aplicación registrará tu tiempo hasta que finalices.",
  },
];

export default function ManualUso() {
  const [activo, setActivo] = useState(secciones[0].id);
  const actual = secciones.find((s) => s.id === activo);

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
                {sec.titulo}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 bg-metal/50 p-4 rounded">
        <h2 className="text-2xl font-bold mb-2">{actual.titulo}</h2>
        <p>{actual.texto}</p>
      </div>
    </div>
  );
}
