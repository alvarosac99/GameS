import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "react-loading-skeleton/dist/skeleton.css";
import DropLoader from "@/components/DropLoader";
import Carrusel from "@/components/Carrusel";
import Comentarios from "@/components/Comentarios";
import Precios from "@/components/Precios";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";


import ValoracionEstrellas from "@/components/ValoracionEstrellas";
import {
  SiSteam,
  SiEpicgames,
  SiGogdotcom,
  SiNintendoswitch,
  SiUbisoft,
  SiAppstore,
  SiGoogleplay,
  SiYoutube,
  SiTwitch,
} from "react-icons/si";
import { FaPlaystation, FaXbox, FaPlus, FaMinus, FaRegBookmark, FaBookmark } from "react-icons/fa";

// Mapa de tiendas con sus iconos y nombres
const SHOP_ICONS = {
  steam: { key: "steam", Icon: SiSteam, name: "Steam" },
  playstation: { key: "playstation", Icon: FaPlaystation, name: "PlayStation" },
  xbox: { key: "xbox", Icon: FaXbox, name: "Xbox" },
  epic: { key: "epic", Icon: SiEpicgames, name: "Epic Games" },
  gog: { key: "gog", Icon: SiGogdotcom, name: "GOG.com" },
  nintendo: { key: "nintendo", Icon: SiNintendoswitch, name: "Nintendo" },
  ubisoft: { key: "ubisoft", Icon: SiUbisoft, name: "Ubisoft" },
  itch: { key: "itch", Icon: SiTwitch, name: "Twitch" },
  apple: { key: "apple", Icon: SiAppstore, name: "App Store" },
  google: { key: "google", Icon: SiGoogleplay, name: "Google Play" },
  youtube: { key: "youtube", Icon: SiYoutube, name: "YouTube" },
};

// Función para obtener info de tienda desde la URL
function getShopInfo(url) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
  return Object.values(SHOP_ICONS).find((s) => domain.includes(s.key)) || null;
}

// Extrae URL embed de YouTube si existe
function getYoutubeEmbedUrl(url) {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{11})/) ||
    url.match(/youtu\.be\/([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function JuegoUnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [juego, setJuego] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [inLibrary, setInLibrary] = useState(false);
  const [entryId, setEntryId] = useState(null);
  const [estado, setEstado] = useState("jugando");
  const [inWishlist, setInWishlist] = useState(false);
  const [mostrarCompra, setMostrarCompra] = useState(false);
  const [tiempo, setTiempo] = useState(null);
  const [descripcion, setDescripcion] = useState("");

  const { autenticado, fetchAuth } = useAuth();
  const { t, lang } = useLang();

  // Carga la info del juego por ID
  useEffect(() => {
    setJuego(null);
    setInLibrary(false);
    setEntryId(null);
    setCargando(true);

    fetch(`/api/juegos/detalle/${id}/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setJuego(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (!juego) return;
    const texto = juego.summary_es || juego.summary || "";
    if (!texto) {
      setDescripcion(t("noDescription"));
      return;
    }
    if (lang === "en") {
      if (juego.summary && !juego.summary_es) {
        setDescripcion(juego.summary);
        return;
      }
      fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(texto)}`
      )
        .then((r) => r.json())
        .then((d) => setDescripcion(d[0].map((x) => x[0]).join("")))
        .catch(() => setDescripcion(texto));
    } else {
      if (juego.summary_es) {
        setDescripcion(juego.summary_es);
        return;
      }
      fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=${encodeURIComponent(texto)}`
      )
        .then((r) => r.json())
        .then((d) => setDescripcion(d[0].map((x) => x[0]).join("")))
        .catch(() => setDescripcion(texto));
    }
  }, [juego, lang, t]);

  useEffect(() => {
    if (!juego) return;
    setTiempo(null);
    fetch(`/api/juegos/tiempo/?nombre=${encodeURIComponent(juego.name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.found) setTiempo(data);
      })
      .catch(() => {});
  }, [juego?.name]);

  // Comprueba si el juego está en la biblioteca del usuario
  useEffect(() => {
    if (!juego || !autenticado) return;

    fetch(`/api/juegos/biblioteca/?game_id=${juego.id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInLibrary(true);
          setEntryId(data[0].id);
          setEstado(data[0].estado || "jugando");
        } else {
          setInLibrary(false);
          setEntryId(null);
          setEstado("jugando");
        }
      })
      .catch(() => {
        setInLibrary(false);
        setEntryId(null);
        setEstado("jugando");
      });
  }, [juego?.id, autenticado]);

  // Añade juego a biblioteca
  function handleAdd() {
    fetchAuth("/api/juegos/biblioteca/", {
      method: "POST",
      body: JSON.stringify({ game_id: juego.id, estado }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al añadir");
        return res.json();
      })
      .then((data) => {
        setInLibrary(true);
        setEntryId(data.id);
      })
      .catch(console.error);
  }

  // Quita juego de biblioteca
  function handleRemove() {
    if (!entryId) return;
    fetchAuth(`/api/juegos/biblioteca/${entryId}/`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al eliminar");
        setInLibrary(false);
        setEntryId(null);
        setEstado("jugando");
      })
      .catch(console.error);
  }

  // Cambia estado visual wishlist (sin backend aún)
  function handleWishlist() {
    setInWishlist((prev) => !prev);
  }

  if (cargando) return <DropLoader />;

  if (!juego)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        {t("gameNotFound")}
      </div>
    );

  // Datos extraídos para facilitar uso en JSX
  const desarrolladoras =
    juego.involved_companies
      ?.filter((c) => c.developer && c.company)
      .map((c) => ({ id: c.company.id, name: c.company.name })) || [];
  const plataformas =
    juego.platforms?.map((p) => ({ id: p.id, name: p.name })) || [];
  const generos = juego.genres?.map((g) => ({ id: g.id, name: g.name })) || [];
  const modos =
    juego.game_modes?.map((m) => ({ id: m.id, name: m.name })) || [];

  // Plataformas soportadas por la API de precios
  const mapaPlataformas = {
    pc: "pc",
    "playstation 5": "ps5",
    "playstation 4": "ps4",
    "playstation 3": "ps3",
    "xbox series": "xbox series x",
    "xbox one": "xbox one",
    "xbox 360": "xbox 360",
    "nintendo switch": "nintendo switch",
    "wii u": "nintendo wii u",
    "nintendo 3ds": "nintendo 3ds",
  };

  const plataformasPrecios = Array.from(
    new Set(
      plataformas
        .map((p) => {
          const nombre = p.name.toLowerCase();
          for (const clave in mapaPlataformas) {
            if (nombre.includes(clave)) return mapaPlataformas[clave];
          }
          return null;
        })
        .filter(Boolean)
    )
  );
  if (plataformasPrecios.length === 0) plataformasPrecios.push("pc");

  // Clasificación de URLs tiendas y otras
  const enlacesTiendas = [];
  let ytEmbed = null;
  const otrosEnlaces = [];
  (juego.websites || []).forEach((w) => {
    const shop = getShopInfo(w.url);
    if (shop?.name === "YouTube") {
      const e = getYoutubeEmbedUrl(w.url);
      if (e && !ytEmbed) ytEmbed = e;
      else otrosEnlaces.push(w.url);
    } else if (shop) {
      enlacesTiendas.push({ ...shop, url: w.url });
    } else {
      otrosEnlaces.push(w.url);
    }
  });

  return (
    <div className="relative w-full min-h-screen bg-transparent text-claro">
      {juego.screenshots?.[0]?.url && (
        <div className="relative w-full overflow-hidden z-0">
          <img
            src={`https:${juego.screenshots[0].url.replace("t_thumb", "t_screenshot_huge")}`}
            alt="Banner"
            className="w-full h-[50vh] min-h-[300px] object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.85) 95%, rgba(0,0,0,1) 100%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      )}

      <div
        className={`max-w-7xl mx-auto ${juego.screenshots?.[0]?.url ? "-mt-32" : "mt-8"
          } px-4 md:px-8 relative z-20`}
      >
        <div className="bg-metal/30 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-10 flex flex-col lg:flex-row gap-8 border border-borde/40">
          {/* Columna izquierda */}
          <div className="flex-shrink-0 flex flex-col items-center">
            {juego.cover?.url && (
              <img
                src={`https:${juego.cover.url.replace(
                  "t_thumb",
                  "t_cover_big"
                )}`}
                alt="Portada"
                className="w-64 rounded-lg shadow-lg"
              />
            )}

            {autenticado ? (
              <div className="mt-6 w-full flex flex-col gap-3 items-center">
                <div className="w-full flex gap-3">
                  {inLibrary ? (
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                      onClick={handleRemove}
                    >
                      <FaMinus /> Quitar de mi biblioteca
                    </button>
                  ) : (
                    <button
                      className="flex-1 bg-naranja hover:bg-naranjaHover text-black font-bold py-2 rounded flex items-center justify-center gap-2"
                      onClick={handleAdd}
                    >
                      <FaPlus /> Añadir a mi biblioteca
                    </button>
                  )}
                </div>
                <div className="w-full flex gap-3">
                  <button
                    className="flex-1 bg-metal hover:bg-borde text-naranja font-bold py-2 rounded flex items-center justify-center gap-2 border"
                    onClick={handleWishlist}
                  >
                    {inWishlist ? <FaBookmark /> : <FaRegBookmark />}
                    {inWishlist ? "En wishlist" : "Añadir a wishlist"}
                  </button>
                </div>
                {inLibrary && (
                  <div className="w-full">
                    <select
                      value={estado}
                      onChange={(e) => {
                        const nuevo = e.target.value;
                        setEstado(nuevo);
                        fetchAuth(`/api/juegos/biblioteca/${entryId}/`, {
                          method: "PATCH",
                          body: JSON.stringify({ estado: nuevo }),
                        });
                      }}
                      className="w-full mt-2 p-2 rounded bg-fondo border border-borde"
                    >
                      <option value="jugando">Jugando</option>
                      <option value="completado">Completado</option>
                      <option value="abandonado">Abandonado</option>
                      <option value="en_espera">En espera</option>
                    </select>
                  </div>
                )}
                <div className="w-full flex justify-center">
                  <ValoracionEstrellas juegoId={juego.id} />
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="mt-6 text-sm text-naranja hover:underline"
                >
                  Inicia sesión para gestionar tu biblioteca
                </Link>
                <div className="w-full flex justify-center mt-2">
                  <ValoracionEstrellas juegoId={juego.id} />
                </div>
              </>
            )}

            {enlacesTiendas.length > 0 && (
              <div className="mt-6 w-full">
                <h2 className="text-lg font-semibold mb-2">Dónde comprar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {enlacesTiendas.map((ti) => (
                    <a
                      key={ti.url}
                      href={ti.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center bg-gray-800 hover:bg-naranja px-4 py-3 rounded-lg"
                    >
                      <ti.Icon size={28} />
                      <span className="mt-1 text-sm font-bold">{ti.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {plataformasPrecios.length > 0 && (
              <div className="mt-6 w-full">
                <button
                  onClick={() => setMostrarCompra(true)}
                  className="w-full bg-naranja hover:bg-naranjaHover text-black font-bold py-2 rounded"
                >
                  {t("openPriceComparator")}
                </button>
              </div>
            )}
            {otrosEnlaces.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mt-3">Enlaces útiles</h2>
                <ul className="list-disc ml-6 text-sm text-gray-300">
                  {otrosEnlaces.map((u) => (
                    <li key={u} className="break-words">
                      <a
                        href={u}
                        className="text-naranja hover:underline break-all"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-extrabold">{juego.name}</h1>
            <p className="text-gray-300">
              {juego.first_release_date
                ? `Lanzado el ${new Date(
                  juego.first_release_date * 1000
                ).toLocaleDateString("es-ES")}`
                : "Fecha de lanzamiento desconocida"}
            </p>
            <div className="flex flex-wrap gap-2">
              {plataformas.map((p) => (
                <Link
                  key={p.id}
                  to={`/juegos?plataforma=${p.id}`}
                  className="bg-borde/50 hover:bg-borde text-xs px-3 py-1 rounded-full"
                >
                  {p.name}
                </Link>
              ))}
              {generos.map((g) => (
                <Link
                  key={g.id}
                  to={`/juegos?genero=${g.id}`}
                  className="bg-naranja/40 hover:bg-naranja text-xs px-3 py-1 rounded-full"
                >
                  {g.name}
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p>
                  <strong>Desarrolladoras:</strong>{" "}
                  {desarrolladoras.length > 0
                    ? desarrolladoras.map((d, i) => (
                      <Link
                        key={d.id}
                        to={`/juegos?desarrolladora=${d.id}`}
                        className="text-naranja hover:underline mr-2"
                      >
                        {d.name}
                        {i < desarrolladoras.length - 1 && ","}
                      </Link>
                    ))
                    : "Desconocida"}
                </p>
                <p>
                  <strong>Publisher:</strong>{" "}
                  {juego.involved_companies
                    ?.filter((c) => c.publisher)
                    .map((c) => c.company?.name)
                    .join(", ") || "Desconocido"}
                </p>
                <p>
                  <strong>Duración:</strong>{" "}
                  {tiempo ? `${tiempo.main}h historia` : "Desconocida"}
                </p>
                <p>
                  <strong>Duración:</strong>{" "}
                  {tiempo ? `${tiempo.main}h historia` : "Desconocida"}
                </p>
                <p>
                  <strong>Saga:</strong> {juego.collection?.name || "Desconocida"}
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>Modos de juego:</strong>{" "}
                  {modos.length > 0
                    ? modos.map((m) => (
                      <Link
                        key={m.id}
                        to={`/juegos?modo=${m.id}`}
                        className="text-naranja hover:underline mr-2"
                      >
                        {m.name}
                      </Link>
                    ))
                    : "N/A"}
                </p>
                <p>
                  <strong>Perspectivas:</strong>{" "}
                  {juego.player_perspectives
                    ?.map((p) => p.name)
                    .join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Temas:</strong>{" "}
                  {juego.themes?.map((t) => t.name).join(", ") || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Descripción</h2>
              <p className="text-gray-200">{descripcion}</p>
            </div>
            {ytEmbed && (
              <div>
                <h2 className="text-xl font-semibold mb-1">Tráiler / Gameplay</h2>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={ytEmbed}
                    className="w-full h-64 rounded-xl"
                    allowFullScreen
                    title="Video"
                  />
                </div>
              </div>
            )}
            {juego.similar_games?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Juegos similares</h2>
                <Carrusel
                  juegos={juego.similar_games}
                  onSelect={(j) => navigate(`/juego/${j.id}`)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Comentarios */}
        <div className="max-w-3xl mx-auto my-10">
          <div className="bg-metal/30 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-borde/40">
            <Comentarios juegoId={juego.id} isAuth={autenticado} />
          </div>
        </div>
      </div>
      {mostrarCompra && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMostrarCompra(false)}
          />
          <div className="w-full sm:w-96 bg-metal shadow-xl transform transition-transform animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-4 border-b border-borde">
              <h2 className="text-lg font-semibold">{t("openPriceComparator")}</h2>
              <button
                onClick={() => setMostrarCompra(false)}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-full">
              <Precios nombre={juego.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
