import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [csrfToken, setCsrfToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch('/api/usuarios/session/', { credentials: "include" })
      .then(res => {
        function getCookie(name) {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(";").shift();
        }
        const token = getCookie("csrftoken");
        if (token) setCsrfToken(token);
        return res.json();
      })
      .then(data => {
        if (data.authenticated) navigate("/bienvenida");
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/usuarios/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.token && data.usuario) {
      login(data.token, data.usuario);
      navigate("/bienvenida");
    } else {
      setMensaje(data.error || "Fallo al iniciar sesión");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-metal shadow-lg rounded text-claro">
      <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Usuario"
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-naranja hover:bg-naranjaHover text-white p-2 rounded w-full font-medium">
          Entrar
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-red-400 text-center">{mensaje}</p>}
      <p className="mt-4 text-sm text-center">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-naranja hover:underline">Regístrate aquí</Link>
      </p>
    </div>
  );
}
