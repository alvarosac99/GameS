import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import "@/styles/calendar-override.css";

export default function CalendarioDiario({ entradas }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const entradasPorFecha = {};
  entradas.forEach((entrada) => {
    const fecha = entrada.fecha.slice(0, 10); // YYYY-MM-DD directo
    if (!entradasPorFecha[fecha]) entradasPorFecha[fecha] = [];
    entradasPorFecha[fecha].push(entrada);
  });

  const fechaSeleccionadaStr = fechaSeleccionada
    ? fechaSeleccionada.toLocaleDateString('sv-SE') // sin problema de zona horaria
    : null;

  return (
    <div className="flex flex-col md:flex-row bg-metal/40 backdrop-blur rounded-xl shadow p-4 gap-6">
      
      {/* Calendario a la izquierda */}
      <div className="w-full md:w-1/2">
        <Calendar
          onChange={setFechaSeleccionada}
          value={fechaSeleccionada}
          tileClassName={({ date }) => {
            const key = date.toLocaleDateString('sv-SE');
            if (fechaSeleccionadaStr === key) return "tile-seleccionada";
            if (entradasPorFecha[key]) return "tile-marcada";
            return "tile-normal";
          }}
          tileContent={({ date }) => {
            const key = date.toLocaleDateString('sv-SE');
            if (entradasPorFecha[key]) return <div className="dot" />;
          }}
        />
      </div>

      {/* Lista de entradas a la derecha */}
      <div className="w-full md:w-1/2 flex flex-col space-y-3 text-claro">
        {fechaSeleccionadaStr ? (
          <>
            <h3 className="text-lg font-bold border-b border-borde pb-1">
              Entradas del {fechaSeleccionadaStr}
            </h3>

            {entradasPorFecha[fechaSeleccionadaStr]?.length ? (
              entradasPorFecha[fechaSeleccionadaStr].map((entrada) => (
                <div
                  key={entrada.id}
                  className="bg-fondo p-3 rounded border-l-4 border-naranja shadow-sm"
                >
                  <p className="font-semibold">
                    {entrada.juego_nombre ?? `Juego ID: ${entrada.juego}`}
                  </p>
                  <p className="text-sm italic">{entrada.estado}</p>
                  {entrada.nota && <p className="text-sm mt-1">{entrada.nota}</p>}
                  {entrada.duracion && (
                    <p className="text-xs mt-1 opacity-80">
                      Duración: {entrada.duracion}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm italic">No hay entradas este día.</p>
            )}
          </>
        ) : (
          <p className="text-sm italic">Selecciona un día para ver las entradas.</p>
        )}
      </div>
    </div>
  );
}
