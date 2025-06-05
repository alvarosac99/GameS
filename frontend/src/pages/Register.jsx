import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [csrfToken, setCsrfToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/usuarios/session/", { credentials: "include" })
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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmarPassword) {
      setMensaje(t("passwordMismatch"));
      return;
    }

    const res = await fetch("/api/usuarios/register/", {
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
      navigate("/bienvenida");
    } else {
      setMensaje(data.error || "Error al registrar");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 bg-metal shadow-lg rounded text-claro">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("registerTitle")}</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder={t("registerUsername")}
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={t("registerEmail")}
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("registerPassword")}
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("registerConfirmPassword")}
          className="mb-3 p-2 w-full bg-gray-700 text-white rounded placeholder:text-gray-400"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-naranja hover:bg-naranjaHover text-white p-2 rounded w-full font-medium">
          {t("registerButton")}
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm text-red-400 text-center">{mensaje}</p>}
      <p className="mt-4 text-sm text-center">
        {t("registerHasAccount")} {" "}
        <Link to="/login" className="text-naranja hover:underline">{t("registerLoginHere")}</Link>
      </p>
    </div>
  );
}

