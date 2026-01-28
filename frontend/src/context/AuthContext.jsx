import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

// Utilidad para obtener la cookie del CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim(); 
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Fetch seguro con CSRF y sesión incluida
  const fetchAuth = (endpoint, options = {}) => {
    const headers = options.headers || {};
    if (["POST", "PUT", "PATCH", "DELETE"].includes((options.method || "GET").toUpperCase())) {
      headers["X-CSRFToken"] = getCookie("csrftoken");
      headers["Content-Type"] = "application/json";
    }
    return apiFetch(endpoint, {
      ...options,
      credentials: "include",
      headers,
    });
  };

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

  const login = (token, datos) => {
    fetchAuth("/usuarios/me/", { credentials: "include" })
      .then(r => r.json())
      .then(userdata => {
        setUsuario({
          ...datos,
          rol: userdata.rol,
          filtro_adulto: userdata.filtro_adulto,
          foto: userdata.foto || "/media/avatares/default.png",
        });
      });
    setAutenticado(true);
  };

  const logout = () => {
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
