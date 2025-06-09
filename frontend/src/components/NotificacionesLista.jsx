import { useNotificaciones } from "@/context/NotificacionesContext";
import { useEffect } from "react";

export default function NotificacionesLista() {
  const { notificaciones, cargar, marcarLeida } = useNotificaciones();

  useEffect(cargar, []);

  if (!notificaciones.length) return null;

  return (
    <div className="absolute right-4 top-16 bg-black/90 text-white p-4 rounded shadow-lg w-80">
      <h3 className="font-bold mb-2">Notificaciones</h3>
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {notificaciones.map(n => (
          <li key={n.id} className="text-sm border-b border-borde pb-2 last:border-0 flex justify-between gap-2">
            <span>{n.mensaje}</span>
            {!n.leida && (
              <button className="text-naranja" onClick={() => marcarLeida(n.id)}>
                Marcar leído
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
