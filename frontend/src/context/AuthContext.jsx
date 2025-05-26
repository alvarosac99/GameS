import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/usuarios/session/", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUsuario({
            id: data.id,
            nombre: data.nombre,
            username: data.username,
            email: data.email,
          });
          setAutenticado(true);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const login = (token, datos) => {
    setUsuario(datos);
    setAutenticado(true);
  };

  const logout = () => {
    setUsuario(null);
    setAutenticado(false);
  };

  return (
    <AuthContext.Provider value={{ usuario, autenticado, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}
