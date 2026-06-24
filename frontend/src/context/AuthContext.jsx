import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);

  const fetchAuth = (endpoint, options = {}) => apiFetch(endpoint, options);

  // Carga el usuario y su filtro_adulto
  useEffect(() => {
    // Esto asegura que la cookie CSRF esté presente
    fetchAuth("/usuarios/session/", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          fetchAuth("/usuarios/me/", { credentials: "include" })
            .then(r => r.json())
            .then(userdata => {
              setUsuario({
                id: data.id,
                nombre: data.nombre,
                username: data.username,
                email: data.email,
                rol: data.rol,
                filtro_adulto: userdata.filtro_adulto,
                foto: userdata.foto || "/media/avatares/default.png",
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

  const login = async (token, datos) => {
    const r = await fetchAuth("/usuarios/me/", { credentials: "include" });
    const userdata = await r.json();
    setUsuario({
      ...datos,
      rol: userdata.rol,
      filtro_adulto: userdata.filtro_adulto,
      foto: userdata.foto || "/media/avatares/default.png",
    });
    setAutenticado(true);
  };

  const logout = async () => {
    await fetchAuth("/usuarios/logout/", { method: "POST" }).catch(() => {});
    setUsuario(null);
    setAutenticado(false);
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      autenticado,
      login,
      logout,
      cargando,
      fetchAuth, 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
