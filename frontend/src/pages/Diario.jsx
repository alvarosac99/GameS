// src/pages/Diario.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CalendarioDiario from "@/components/CalendarioDiario";
import ListaEntradasDiario from "@/components/ListaEntradasDiario";
import AñadirEntrada from "@/components/AñadirEntrada";
import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function Diario() {
  const { fetchAuth } = useAuth();
  const { t } = useLang();
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarEntradas = async () => {
    setCargando(true);
    try {
      const res = await fetchAuth("/api/diario/");
      const data = await res.json();
      if (Array.isArray(data)) {
        const ids = [...new Set(data.map((e) => e.juego))];
        const detalles = await Promise.all(
          ids.map((id) =>
            fetch(`/api/juegos/buscar_id/?id=${id}`)
              .then((r) => r.json())
              .catch(() => null)
          )
        );
        const mapaDetalles = {};
        detalles.forEach((d) => {
          if (d && d.id) {
            mapaDetalles[d.id] = {
              nombre: d.name,
              cover: d.cover?.url
                ? `https:${d.cover.url.replace("t_thumb", "t_cover_small")}`
                : null,
            };
          }
        });
        const conDetalles = data.map((e) => ({
          ...e,
          juego_nombre: mapaDetalles[e.juego]?.nombre,
          juego_cover: mapaDetalles[e.juego]?.cover,
        }));
        setEntradas(conDetalles);
      } else {
        setEntradas([]);
      }
    } catch (err) {
      setEntradas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEntradas();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎮 {t("myGameDiary")}</h1>
        <Link
          to="/jugar"
          className="px-4 py-2 rounded bg-naranja text-white hover:bg-opacity-80"
        >
          {t("menuPlay")}
        </Link>
      </div>

      <AñadirEntrada onEntradaCreada={cargarEntradas} />

      <section>
        <h2 className="text-xl font-semibold mb-2">{t("lastEntries")}</h2>
        <ListaEntradasDiario entradas={entradas} cargando={cargando} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">{t("calendarSessions")}</h2>
        <CalendarioDiario entradas={entradas} />
      </section>
    </div>
  );
}
