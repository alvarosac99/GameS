// src/components/JuegoUnico.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import DropLoader from "@/components/DropLoader";
import {
  SiSteam,
  SiEpicgames,
  SiGogdotcom,
  SiNintendoswitch,
  SiUbisoft,
  SiItchdotio,
  SiAppstore,
  SiGoogleplay,
  SiYoutube,
} from "react-icons/si";
import { FaPlaystation, FaXbox, FaStar, FaThumbsUp } from "react-icons/fa";

// Función para leer cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    document.cookie.split(";").forEach((c) => {
      const [key, val] = c.trim().split("=");
      if (key === name) cookieValue = decodeURIComponent(val);
    });
  }
  return cookieValue;
}

const SHOP_ICONS = {
  steam: { key: "steam", Icon: SiSteam, name: "Steam" },
  playstation: { key: "playstation", Icon: FaPlaystation, name: "PlayStation" },
  xbox: { key: "xbox", Icon: FaXbox, name: "Xbox" },
  epic: { key: "epic", Icon: SiEpicgames, name: "Epic Games" },
  gog: { key: "gog", Icon: SiGogdotcom, name: "GOG.com" },
  nintendo: { key: "nintendo", Icon: SiNintendoswitch, name: "Nintendo" },
  ubisoft: { key: "ubisoft", Icon: SiUbisoft, name: "Ubisoft" },
  itch: { key: "itch", Icon: SiItchdotio, name: "Itch.io" },
  apple: { key: "apple", Icon: SiAppstore, name: "App Store" },
  google: { key: "google", Icon: SiGoogleplay, name: "Google Play" },
  youtube: { key: "youtube", Icon: SiYoutube, name: "YouTube" },
};

function getShopInfo(url) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
  return Object.values(SHOP_ICONS).find((s) => domain.includes(s.key)) || null;
}

function getYoutubeEmbedUrl(url) {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{11})/) ||
    url.match(/youtu\.be\/([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function StarRating({ onRate }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-1 mt-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar
          key={i}
          className={`cursor-pointer ${i <= (hover || rating) ? "text-yellow-400" : "text-gray-600"}`}
          size={24}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => {
            setRating(i);
            onRate?.(i);
          }}
        />
      ))}
    </div>
  );
}

export default function JuegoUnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [juego, setJuego] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [isAuth, setIsAuth] = useState(false);
  const [inLibrary, setInLibrary] = useState(false);
  const [entryId, setEntryId] = useState(null);

  // Comprueba autenticación
  useEffect(() => {
    fetch("/api/usuarios/me/", { credentials: "include" })
      .then((res) => { if (res.ok) setIsAuth(true); })
      .catch(() => { });
  }, []);

  // Carga detalles del juego
  useEffect(() => {
    setCargando(true);
    fetch(`/api/juegos/detalle/${id}/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setJuego(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [id]);

  // Comprueba si está en la biblioteca
  useEffect(() => {
    if (!juego || !isAuth) return;
    fetch(`/api/juegos/biblioteca/?game_id=${juego.id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInLibrary(true);
          setEntryId(data[0].id);
        }
      })
      .catch(() => { });
  }, [juego, isAuth]);

  function handleAdd() {
    fetch("/api/juegos/biblioteca/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ game_id: juego.id }),
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

  function handleRemove() {
    if (!entryId) return;
    fetch(`/api/juegos/biblioteca/${entryId}/`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al eliminar");
        setInLibrary(false);
        setEntryId(null);
      })
      .catch(console.error);
  }

  if (cargando) {
    return (
      <DropLoader />
    );
  }
  if (!juego) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Juego no encontrado
      </div>
    );
  }

  const desarrolladoras = juego.involved_companies
    ?.filter((c) => c.developer && c.company)
    .map((c) => ({ id: c.company.id, name: c.company.name })) || [];
  const plataformas = juego.platforms?.map((p) => ({ id: p.id, name: p.name })) || [];
  const generos = juego.genres?.map((g) => ({ id: g.id, name: g.name })) || [];
  const modos = juego.game_modes?.map((m) => ({ id: m.id, name: m.name })) || [];
  const descripcion = juego.summary_es || juego.summary || "No hay descripción disponible.";

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
    <div className="relative w-full min-h-screen bg-fondo text-claro">
      {juego.screenshots?.[0]?.url && (
        <div className="relative w-full overflow-hidden z-0">
          <img
            src={`https:${juego.screenshots[0].url.replace(
              "t_thumb",
              "t_screenshot_huge"
            )}`}
            alt="Banner"
            className="w-full h-[50vh] min-h-[300px] object-cover filter brightness-50"
          />
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-b from-transparent to-fondo pointer-events-none" />
        </div>
      )}
      <div className={`max-w-7xl mx-auto ${juego.screenshots?.[0]?.url ? '-mt-32' : 'mt-8'} px-4 md:px-8 relative z-20`}>
        <div className="bg-metal/90 rounded-2xl shadow-xl p-8 mb-10 flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="flex-shrink-0 flex flex-col items-center">
              {/* Portada */}
              {juego.cover?.url && (
                <img
                  src={`https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`}
                  alt="Portada"
                  className="w-64 rounded-lg shadow-lg"
                />
              )}

              {/* Botones Añadir/Quitar y Me gusta */}
              {isAuth ? (
                <div className="mt-6 w-full flex justify-between gap-4">
                  {inLibrary ? (
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                      onClick={handleRemove}
                    >
                      ❌ Quitar de mi biblioteca
                    </button>
                  ) : (
                    <button
                      className="flex-1 bg-naranja hover:bg-naranjaHover text-black font-bold py-2 rounded"
                      onClick={handleAdd}
                    >
                      ➕ Añadir a mi biblioteca
                    </button>
                  )}
                  <button className="flex-1 bg-borde hover:bg-metal text-claro font-bold py-2 rounded flex items-center justify-center gap-1">
                    <FaThumbsUp /> Me gusta
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="mt-6 text-sm text-naranja hover:underline"
                >
                  Inicia sesión para gestionar tu biblioteca
                </Link>
              )}

              {/* Valoración */}
              <StarRating onRate={(v) => console.log("Puntuaste:", v)} />

              {/* DÓNDE COMPRAR en grid */}
              {enlacesTiendas.length > 0 && (
                <div className="mt-6 w-full">
                  <h2 className="text-lg font-semibold mb-2">Dónde comprar</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {enlacesTiendas.map((ti, i) => (
                      <a
                        key={i}
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

              {/* Otros enlaces */}
              {otrosEnlaces.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mt-3">Enlaces útiles</h2>
                  <ul className="list-disc ml-6 text-sm text-gray-300">
                    {otrosEnlaces.map((u, i) => (
                      /* 'break-words' en el <li> y 'break-all' en el <a> */
                      <li key={i} className="break-words">
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
          </div>
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
                  <strong>Idiomas:</strong> {juego.idiomas?.join(", ") || "N/A"}
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
              <div>
                <h2 className="text-xl font-semibold mb-1">Juegos similares</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {juego.similar_games.map((s, i) => (
                    <div
                      key={i}
                      className="cursor-pointer hover:scale-105 text-center"
                      onClick={() => navigate(`/juego/${s.id}`)}
                    >
                      {s.cover?.url ? (
                        <img
                          src={`https:${s.cover.url.replace(
                            "t_thumb",
                            "t_cover_big"
                          )}`}
                          alt={s.name}
                          className="w-full rounded shadow"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-800 flex items-center justify-center text-gray-400">
                          Sin imagen
                        </div>
                      )}
                      <p className="mt-1 text-sm">{s.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
