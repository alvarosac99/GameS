import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { apiFetch } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLang();
  const [csrfToken, setCsrfToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    apiFetch("/usuarios/session/", { credentials: "include" })
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
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmarPassword) {
      setMensaje(t("passwordMismatch"));
      return;
    }

    const res = await apiFetch("/usuarios/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ username, email, password, confirmarPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      login("session", data.usuario);
      navigate("/bienvenida");
    } else {
      setMensaje(data.error || "Error al registrar");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-card shadow-lg rounded text-foreground">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("registerTitle")}</h2>
      <form onSubmit={handleRegister}>
        <label htmlFor="register-username" className="sr-only">
          {t("registerUsername")}
        </label>
        <input
          id="register-username"
          type="text"
          placeholder={t("registerUsername")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="register-email" className="sr-only">
          {t("registerEmail")}
        </label>
        <input
          id="register-email"
          type="email"
          placeholder={t("registerEmail")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="register-password" className="sr-only">
          {t("registerPassword")}
        </label>
        <input
          id="register-password"
          type="password"
          placeholder={t("registerPassword")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label htmlFor="register-confirm-password" className="sr-only">
          {t("registerConfirmPassword")}
        </label>
        <input
          id="register-confirm-password"
          type="password"
          placeholder={t("registerConfirmPassword")}
          className="mb-3 p-2 w-full bg-card text-foreground rounded placeholder:text-muted-foreground"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded w-full font-medium">
          {t("registerButton")}
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-destructive text-center">{mensaje}</p>}
      <p className="mt-4 text-sm text-center">
        {t("registerHasAccount")} {" "}
        <Link to="/login" className="text-primary hover:underline">{t("registerLoginHere")}</Link>
      </p>
    </div>
  );
}

