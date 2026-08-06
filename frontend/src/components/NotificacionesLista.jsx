import { useNotificaciones } from "@/context/NotificacionesContext";
import { useEffect } from "react";

export default function NotificacionesLista({ onCerrar }) {
  const { notificaciones, cargar, marcarLeida } = useNotificaciones();

  useEffect(cargar, []);

  useEffect(() => {
    if (!onCerrar) return undefined;
    const manejarEscape = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [onCerrar]);

  if (!notificaciones.length) return null;

  return (
    <div className="absolute right-4 top-16 bg-card text-foreground p-4 rounded shadow-lg w-80 max-w-[calc(100vw-2rem)] border border-border">
      <h3 className="font-bold mb-2">Notificaciones</h3>
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {notificaciones.map(n => (
          <li key={n.id} className="text-sm border-b border-border pb-2 last:border-0 flex justify-between gap-2">
            <span>{n.mensaje}</span>
            {!n.leida && (
              <button className="text-primary" onClick={() => marcarLeida(n.id)}>
                Marcar leído
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
