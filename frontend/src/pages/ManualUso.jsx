import React, { useState } from "react";

const secciones = [
  {
    id: "inicio",
    titulo: "Página principal",
    texto:
      "Esta es la primera pantalla que verás al entrar en la aplicación. Desde aquí puedes tener una visión general de la actividad reciente, ver los juegos más populares, recomendaciones basadas en tus intereses, y acceder rápidamente a las secciones principales.\n\nEn la esquina superior izquierda hay un botón que abre el menú lateral. Ese menú es la forma principal de moverse por toda la aplicación. Si estás en un dispositivo móvil, también verás botones flotantes que permiten abrir el buscador",
  },
  {
    id: "juegos",
    titulo: "Juegos",
    texto:
      "En esta sección puedes explorar todo el catálogo de videojuegos disponible. Tienes una barra de búsqueda en la parte superior para encontrar cualquier título por su nombre. Además, puedes aplicar filtros para ver solo los juegos de ciertos géneros (como aventuras, estrategia, etc.), de plataformas específicas (como PC, PlayStation, Xbox), o incluso filtrarlos por orden alfabético, popularidad o fecha de salida.\n\nSi haces clic en cualquier tarjeta de juego, se abrirá una vista detallada donde podrás ver toda su información: sinopsis, portada, plataformas, puntuaciones, vídeos, y una lista de ofertas de tiendas online extraídas automáticamente mediante comparadores de precios.",
  },
  {
    id: "biblioteca",
    titulo: "Biblioteca",
    texto:
      "Aquí se agrupan todos los juegos que has añadido a tu colección personal. Puedes añadir un juego desde su ficha individual con el botón 'Añadir a mi biblioteca'.\n\nLa biblioteca está pensada para ayudarte a organizar y revisar qué juegos tienes, cuánto tiempo has jugado a cada uno, cuáles te gustan más y qué pendientes tienes. Desde cada tarjeta puedes lanzar una sesión de juego directamente o ver detalles sobre tus estadísticas. También puedes ordenarla alfabéticamente, por tiempo jugado, por fecha de adquisición o por preferencias.",
  },
  {
    id: "diario",
    titulo: "Diario",
    texto:
      "El diario de juego es una sección pensada para registrar tus sesiones de juego de forma manual. Por cada día que juegues, puedes crear una entrada en el diario indicando qué juego utilizaste, cuánto tiempo jugaste y añadir una nota o reflexión sobre esa partida.\n\nTambién puedes marcar si finalizaste un juego, lo abandonaste o si lo estás disfrutando. Las entradas del diario se muestran organizadas en un calendario interactivo para que puedas ver tu progreso de forma visual y sencilla.",
  },
  {
    id: "planificaciones",
    titulo: "Planificaciones",
    texto:
      "En esta sección puedes programar futuras sesiones de juego, como si fuera una agenda. Esto es útil para organizarte si tienes poco tiempo o quieres dedicar ciertos momentos a jugar.\n\nPuedes crear eventos como 'jugar al capítulo final de X juego el sábado por la noche' o 'empezar nueva partida de Y juego la próxima semana'. Estos eventos pueden incluir varios juegos y tareas asociadas, y puedes marcar qué has completado. La aplicación te notificará cuando se acerque la fecha si tienes recordatorios activos.",
  },
  {
    id: "perfil",
    titulo: "Perfil",
    texto:
      "Tu perfil contiene todos tus datos de usuario. Desde aquí puedes cambiar tu nombre, tu foto de perfil, escribir una pequeña biografía, o añadir tu lista de juegos favoritos.\n\nTambién puedes ver tus estadísticas generales como número de juegos, horas jugadas, valoraciones y entradas en el diario. Otros usuarios podrán visitar tu perfil y ver la información pública, como los juegos que has compartido o los comentarios que hayas dejado.",
  },
  {
    id: "ajustes",
    titulo: "Ajustes",
    texto:
      "La sección de ajustes te permite personalizar el funcionamiento y el aspecto de la aplicación. Algunas de las opciones disponibles son:\n\n- Cambiar el idioma de toda la interfaz.\n- Seleccionar un tema visual (modo claro, oscuro, o personalizado).\n- Activar o desactivar sonidos, notificaciones y efectos.\n- Configurar tu privacidad o restaurar valores predeterminados.\n\nEs recomendable revisar esta sección la primera vez que entras para asegurarte de que la aplicación se adapta a tus preferencias.",
  },
  {
    id: "jugar",
    titulo: "Jugar",
    texto:
      "Esta sección está diseñada para ayudarte a registrar el tiempo que dedicas a tus juegos de manera precisa. Aquí puedes buscar el juego que vas a utilizar y pulsar en 'Iniciar sesión de juego'. La aplicación empezará a contar el tiempo automáticamente.\n\nCuando termines, vuelve a esta sección y pulsa en 'Detener sesión'. El tiempo se guardará y aparecerá tanto en tu biblioteca como en el diario. De esta forma, no necesitas anotar nada manualmente y puedes llevar un control exacto de cuándo y cuánto has jugado.\n\nEs útil para detectar tus hábitos de juego, organizar tus sesiones y tener estadísticas reales de uso.",
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
