import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [csrfToken, setCsrfToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/usuarios/session/", {
      credentials: "include",
    }).then(res => {
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
      }
      const token = getCookie("csrftoken");
      if (token) setCsrfToken(token);
      return res.json();
    }).then(data => {
      if (data.authenticated) navigate("/bienvenida");
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("http://10.42.0.1:8000/api/usuarios/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      navigate("/bienvenida");
    } else {
      setMensaje(data.error || "Fallo al iniciar sesión");
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-gray-800 p-6 rounded-lg shadow-lg">

      <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Usuario"
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 hover:bg-blue-600 p-2 rounded w-full" type="submit">
          Entrar
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-red-400 text-center">{mensaje}</p>}
      <p className="mt-4 text-sm text-center">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-blue-400 hover:underline">Regístrate aquí</Link>
      </p>
    </div>
  );
}
