import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/context/LangContext";

export default function NuevoJuego() {
  const { fetchAuth, usuario } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  const crear = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchAuth("/juegos/dev/", {
        method: "POST",
        body: JSON.stringify({ nombre, descripcion }),
      });
      if (!res.ok) throw new Error("No se pudo crear el juego");
      await res.json();
      navigate("/nuestros-juegos");
    } catch (e) {
      setError(e.message);
    }
  };

  if (usuario?.rol !== "DEV" && usuario?.rol !== "ADMIN") {
    return <p className="p-4">Acceso restringido</p>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold">Añadir juego</h1>
      {error && <p className="text-destructive">{error}</p>}
      <form onSubmit={crear} className="space-y-4 max-w-xl">
        <label htmlFor="nuevo-juego-nombre" className="sr-only">
          {t("newGameNamePlaceholder")}
        </label>
        <input
          id="nuevo-juego-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 rounded bg-card border border-border"
          placeholder={t("newGameNamePlaceholder")}
          required
        />
        <label htmlFor="nuevo-juego-descripcion" className="sr-only">
          {t("newGameDescriptionPlaceholder")}
        </label>
        <textarea
          id="nuevo-juego-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-2 rounded bg-card border border-border"
          rows={5}
          placeholder={t("newGameDescriptionPlaceholder")}
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold"
        >
          Crear
        </button>
      </form>
    </div>
  );
}
