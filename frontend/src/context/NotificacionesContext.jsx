import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const NotiContext = createContext();

export function useNotificaciones() {
  return useContext(NotiContext);
}

export default function NotificacionesProvider({ children }) {
  const { autenticado, fetchAuth } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);

  const cargar = () => {
    if (!autenticado) return;
    fetchAuth("/api/notificaciones/")
      .then(r => r.json())
      .then(setNotificaciones)
      .catch(() => {});
  };

  const marcarLeida = id => {
    fetchAuth(`/api/notificaciones/${id}/`, { method: "PATCH", body: JSON.stringify({ leida: true }) })
      .then(r => r.json())
      .then(n => setNotificaciones(notificaciones.map(x => x.id === id ? n : x)));
  };

  useEffect(cargar, [autenticado]);

  return (
    <NotiContext.Provider value={{ notificaciones, cargar, marcarLeida }}>
      {children}
    </NotiContext.Provider>
  );
}
