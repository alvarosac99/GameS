import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { apiFetch } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    apiFetch('/usuarios/session/')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) navigate("/bienvenida");
      });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/usuarios/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token && data.usuario) {
        await login(data.token, data.usuario);
        navigate("/bienvenida");
      } else {
        setMensaje(data.error || "Fallo al iniciar sesión");
      }
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-card shadow-lg rounded text-foreground">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("loginTitle")}</h2>
      <form onSubmit={handleLogin}>
        <label htmlFor="login-username" className="sr-only">
          {t("loginUsername")}
        </label>
        <input
          id="login-username"
          type="text"
          placeholder={t("loginUsername")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="login-password" className="sr-only">
          {t("loginPassword")}
        </label>
        <input
          id="login-password"
          type="password"
          placeholder={t("loginPassword")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded w-full font-medium">
          {t("loginButton")}
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-destructive text-center">{mensaje}</p>}
      <p className="mt-4 text-sm text-center">
        {t("loginNoAccount")} {" "}
        <Link to="/register" className="text-primary hover:underline">{t("loginRegisterHere")}</Link>
      </p>
    </div>
  );
}
