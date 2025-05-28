import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Carga el usuario y su filtro_adulto
  useEffect(() => {
    fetch("/api/usuarios/session/", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          // Ahora obtenemos también el filtro_adulto
          fetch("/api/usuarios/me/", { credentials: "include" })
            .then(r => r.json())
            .then(userdata => {
              setUsuario({
                id: data.id,
                nombre: data.nombre,
                username: data.username,
                email: data.email,
                filtro_adulto: userdata.filtro_adulto, 
              });
              setAutenticado(true);
            });
        } else {
          setUsuario(null);
          setAutenticado(false);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const login = (token, datos) => {
    // Cuando se loguea, vuelve a cargar el usuario completo
    fetch("/api/usuarios/me/", { credentials: "include" })
      .then(r => r.json())
      .then(userdata => {
        setUsuario({
          ...datos,
          filtro_adulto: userdata.filtro_adulto,
        });
      });
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
