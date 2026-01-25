import { useEffect, useRef, useState } from "react";
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
import {
  FaPlaystation,
  FaXbox,
  FaPlus,
  FaMinus,
  FaRegBookmark,
  FaBookmark,
  FaWikipediaW,
  FaDiscord,
  FaRedditAlien,
  FaInstagram,
  FaTwitter,
  FaFacebookF,
  FaGlobe,
  FaBookOpen,
} from "react-icons/fa";

// Mapa de tiendas con sus iconos y nombres
const SHOP_ICONS = {
  steam: { key: "steam", Icon: SiSteam, name: "Steam" },
  playstation: { key: "playstation", Icon: FaPlaystation, name: "PlayStation" },
  xbox: { key: "xbox", Icon: FaXbox, name: "Xbox" },
  epic: { key: "epic", Icon: SiEpicgames, name: "Epic Games" },
  gog: { key: "gog", Icon: SiGogdotcom, name: "GOG.com" },
  nintendo: { key: "nintendo", Icon: SiNintendoswitch, name: "Nintendo" },
  ubisoft: { key: "ubisoft", Icon: SiUbisoft, name: "Ubisoft" },
  apple: { key: "apple", Icon: SiAppstore, name: "App Store" },
  google: { key: "google", Icon: SiGoogleplay, name: "Google Play" },
  youtube: { key: "youtube", Icon: SiYoutube, name: "YouTube" },
};

const LINK_ICONS = [
  { key: "wikipedia.org", Icon: FaWikipediaW, name: "Wikipedia" },
  { key: "minecraft.wiki", Icon: FaBookOpen, name: "Minecraft Wiki" },
  { key: "minecraft.net", Icon: FaGlobe, name: "Minecraft" },
  { key: "discordapp.com", Icon: FaDiscord, name: "Discord" },
  { key: "discord.gg", Icon: FaDiscord, name: "Discord" },
  { key: "reddit.com", Icon: FaRedditAlien, name: "Reddit" },
  { key: "instagram.com", Icon: FaInstagram, name: "Instagram" },
  { key: "twitter.com", Icon: FaTwitter, name: "Twitter" },
  { key: "x.com", Icon: FaTwitter, name: "X (Twitter)" },
  { key: "facebook.com", Icon: FaFacebookF, name: "Facebook" },
  { key: "youtube.com", Icon: SiYoutube, name: "YouTube" },
  { key: "twitch.tv", Icon: SiTwitch, name: "Twitch" },
];

// Función para obtener info de tienda desde la URL
function getShopInfo(url) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
  return Object.values(SHOP_ICONS).find((s) => domain.includes(s.key)) || null;
}

function getLinkInfo(url) {
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
  return LINK_ICONS.find((item) => domain.includes(item.key)) || null;
}

// Extrae URL embed de YouTube si existe
function getYoutubeEmbedUrl(url) {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{11})/) ||
    url.match(/youtu\.be\/([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getRandomObjectPosition(value) {
  const hash = hashString(value);
  const x = 10 + (hash % 81);
  const y = 10 + (Math.floor(hash / 97) % 81);
  return `${x}% ${y}%`;
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
  const [descripcionImgIndex, setDescripcionImgIndex] = useState(0);
  const [descripcionNextIndex, setDescripcionNextIndex] = useState(null);
  const [descripcionDirection, setDescripcionDirection] = useState(1);
  const [descripcionPhase, setDescripcionPhase] = useState("idle");
  const igdbVideosRef = useRef(null);
  const igdbPhotosRef = useRef(null);
  const descripcionIntervalRef = useRef(null);
  const descripcionPauseUntilRef = useRef(0);
  const descripcionIndexRef = useRef(0);
  const descripcionPhaseRef = useRef("idle");

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

  const igdbPhotos = [
    ...(juego?.artworks || []),
    ...(juego?.screenshots || []),
  ].filter((img) => img?.url);

  const descripcionImages = igdbPhotos.map(
    (img) => `https:${img.url.replace("t_thumb", "t_screenshot_huge")}`
  );

  useEffect(() => {
    setDescripcionImgIndex(0);
    setDescripcionNextIndex(null);
    descripcionPhaseRef.current = "idle";
    setDescripcionPhase("idle");
  }, [juego?.id]);

  useEffect(() => {
    descripcionIndexRef.current = descripcionImgIndex;
  }, [descripcionImgIndex]);

  useEffect(() => {
    descripcionPhaseRef.current = descripcionPhase;
  }, [descripcionPhase]);

  useEffect(() => {
    if (descripcionPhase !== "prepare") return;
    const raf = requestAnimationFrame(() => {
      setDescripcionPhase("animating");
    });
    return () => cancelAnimationFrame(raf);
  }, [descripcionPhase]);

  useEffect(() => {
    if (descripcionImages.length <= 1) return;
    if (descripcionIntervalRef.current) {
      clearInterval(descripcionIntervalRef.current);
    }
    descripcionIntervalRef.current = setInterval(() => {
      if (Date.now() < descripcionPauseUntilRef.current) return;
      if (descripcionPhaseRef.current !== "idle") return;
      const baseIndex = descripcionIndexRef.current;
      const nextIndex =
        baseIndex === descripcionImages.length - 1 ? 0 : baseIndex + 1;
      startDescripcionTransition(nextIndex, 1);
    }, 3000);

    return () => {
      if (descripcionIntervalRef.current) {
        clearInterval(descripcionIntervalRef.current);
        descripcionIntervalRef.current = null;
      }
    };
  }, [descripcionImages.length]);

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

  if (juego.name?.toLowerCase().includes("minecraft")) {
    const minecraftLinks = [
      "https://en.wikipedia.org/wiki/Minecraft",
      "https://minecraft.wiki/w/Java_Edition",
      "https://minecraft.net/",
      "https://discordapp.com/invite/minecraft",
      "https://www.reddit.com/r/Minecraft",
      "https://www.instagram.com/minecraft",
      "https://twitter.com/Minecraft",
      "https://www.facebook.com/minecraft",
      "https://www.youtube.com/user/TeamMojang",
    ];
    minecraftLinks.forEach((link) => {
      if (!otrosEnlaces.includes(link)) {
        otrosEnlaces.push(link);
      }
    });
    const twitchLink = "https://www.twitch.tv/directory/game/Minecraft";
    if (!otrosEnlaces.includes(twitchLink)) {
      otrosEnlaces.push(twitchLink);
    }
  }

  const enlacesUtilesConIcono = [];
  const enlacesUtilesOtros = [];
  otrosEnlaces.forEach((url) => {
    const info = getLinkInfo(url);
    if (info) {
      enlacesUtilesConIcono.push({ ...info, url });
    } else {
      enlacesUtilesOtros.push(url);
    }
  });

  const mediaImages = [
    ...(juego.screenshots || []),
    ...(juego.artworks || []),
  ]
    .map((img) => img?.url)
    .filter(Boolean)
    .map((url) => `https:${url.replace("t_thumb", "t_screenshot_huge")}`);

  const backgroundImages =
    mediaImages.length > 0
      ? Array.from({ length: 96 }, (_, i) => mediaImages[i % mediaImages.length])
      : [];

  const igdbVideos = (juego.videos || [])
    .map((v) => ({
      id: v.id || v.video_id,
      name: v.name || "Video",
      embed: v.video_id ? `https://www.youtube.com/embed/${v.video_id}` : null,
    }))
    .filter((v) => v.embed);

  function scrollCarousel(ref, dir) {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 260);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  const estadoLabel = {
    jugando: t("statusPlaying"),
    completado: t("statusCompleted"),
    abandonado: t("statusAbandoned"),
    en_espera: t("statusOnHold"),
  }[estado] || t("statusPlaying");

  function startDescripcionTransition(nextIndex, direction) {
    if (descripcionImages.length <= 1) return;
    if (descripcionPhaseRef.current !== "idle") return;
    if (nextIndex === descripcionImgIndex) return;
    setDescripcionDirection(direction);
    setDescripcionNextIndex(nextIndex);
    descripcionPhaseRef.current = "prepare";
    setDescripcionPhase("prepare");
  }

  function pauseDescripcionAuto() {
    descripcionPauseUntilRef.current = Date.now() + 10000;
  }

  function forceFinishDescripcionTransition() {
    if (descripcionPhaseRef.current === "idle") return;
    const nextIndex =
      descripcionNextIndex !== null ? descripcionNextIndex : descripcionImgIndex;
    setDescripcionImgIndex(nextIndex);
    setDescripcionNextIndex(null);
    descripcionPhaseRef.current = "idle";
    setDescripcionPhase("idle");
    descripcionIndexRef.current = nextIndex;
  }

  function handleDescripcionPrev() {
    if (descripcionImages.length === 0) return;
    if (descripcionPhaseRef.current !== "idle") {
      forceFinishDescripcionTransition();
    }
    const baseIndex = descripcionIndexRef.current;
    const nextIndex =
      baseIndex === 0
        ? descripcionImages.length - 1
        : baseIndex - 1;
    pauseDescripcionAuto();
    startDescripcionTransition(nextIndex, -1);
  }

  function handleDescripcionNext() {
    if (descripcionImages.length === 0) return;
    if (descripcionPhaseRef.current !== "idle") {
      forceFinishDescripcionTransition();
    }
    const baseIndex = descripcionIndexRef.current;
    const nextIndex =
      baseIndex === descripcionImages.length - 1
        ? 0
        : baseIndex + 1;
    pauseDescripcionAuto();
    startDescripcionTransition(nextIndex, 1);
  }

  return (
    <div className="relative w-full min-h-screen bg-transparent text-claro overflow-hidden">
      {backgroundImages.length > 0 && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="grid grid-cols-4 md:grid-cols-6 gap-2 opacity-90 w-full h-full overflow-hidden"
            style={{
              gridAutoRows: "minmax(140px, 22vh)",
              gridAutoFlow: "dense",
            }}
          >
            {backgroundImages.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                className="w-full h-full overflow-hidden"
                style={{
                  gridColumn:
                    idx % 5 === 0
                      ? "span 2 / span 2"
                      : idx % 11 === 0
                        ? "span 3 / span 3"
                        : "span 1 / span 1",
                  gridRow:
                    idx % 7 === 0
                      ? "span 2 / span 2"
                      : idx % 13 === 0
                        ? "span 3 / span 3"
                        : "span 1 / span 1",
                }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: getRandomObjectPosition(`${img}-${idx}`) }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
        </div>
      )}
      <div className="w-full px-4 md:px-8 relative z-10 py-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-10 border border-black/50">
          <div className="grid grid-cols-1 xl:grid-cols-[320px,minmax(0,1fr),320px] gap-8 items-start">
            {/* Columna izquierda */}
            <div className="flex flex-col items-center xl:items-stretch">
              <div className="w-full bg-black/50 border border-black/40 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
                {juego.cover?.url && (
                  <img
                    src={`https:${juego.cover.url.replace(
                      "t_thumb",
                      "t_cover_big"
                    )}`}
                    alt="Portada"
                    className="w-full rounded-lg shadow-lg"
                  />
                )}

                {autenticado ? (
                  <div className="mt-4 w-full flex flex-col gap-3 items-center xl:items-stretch">
                    <div className="w-full flex gap-3">
                      {inLibrary ? (
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                          onClick={handleRemove}
                        >
                          <FaMinus /> {t("gameRemoveLibrary")}
                        </button>
                      ) : (
                        <button
                          className="flex-1 bg-naranja hover:bg-naranjaHover text-black font-bold py-2 rounded flex items-center justify-center gap-2"
                          onClick={handleAdd}
                        >
                          <FaPlus /> {t("gameAddLibrary")}
                        </button>
                      )}
                    </div>
                    <div className="w-full flex gap-3">
                      <button
                        className="flex-1 bg-[#232323] hover:bg-[#2a2a2a] text-naranja font-bold py-2 rounded flex items-center justify-center gap-2 border border-borde/60"
                        onClick={handleWishlist}
                      >
                        {inWishlist ? <FaBookmark /> : <FaRegBookmark />}
                        {inWishlist ? t("gameInWishlist") : t("gameAddWishlist")}
                      </button>
                    </div>
                    <div className="w-full">
                      <ValoracionEstrellas juegoId={juego.id} />
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
                          className="w-full mt-2 p-2 rounded bg-[#181818] border border-borde/50"
                        >
                          <option value="jugando">{t("statusPlaying")}</option>
                          <option value="completado">{t("statusCompleted")}</option>
                          <option value="abandonado">{t("statusAbandoned")}</option>
                          <option value="en_espera">{t("statusOnHold")}</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="mt-4 text-sm text-naranja hover:underline block"
                    >
                      {t("gameLoginManage")}
                    </Link>
                    <div className="w-full flex justify-center mt-2">
                      <ValoracionEstrellas juegoId={juego.id} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Columna central */}
            <div className="flex flex-col gap-6">
              <div>
                <h1
                  className="text-5xl md:text-6xl font-extrabold tracking-tight text-white"
                  style={{ textShadow: "0 8px 24px rgba(0,0,0,0.45)" }}
                >
                  {juego.name}
                </h1>
                <p className="text-gray-300 mt-3 text-sm uppercase tracking-widest">
                  {juego.first_release_date
                    ? `${t("gameReleasedOn")} ${new Date(
                      juego.first_release_date * 1000
                    ).toLocaleDateString("es-ES")}`
                    : t("gameReleaseUnknown")}
                </p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),320px] gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{t("gameDescription")}</h2>
                  <p className="text-gray-200 leading-relaxed">{descripcion}</p>
                  {descripcionImages.length > 0 && (
                    <div className="mt-5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleDescripcionPrev}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center"
                          aria-label="Anterior"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleDescripcionNext}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center"
                          aria-label="Siguiente"
                        >
                          ›
                        </button>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-black/50 bg-[#1f1f1f]">
                          {descripcionNextIndex === null ? (
                            <img
                              src={descripcionImages[descripcionImgIndex]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex"
                              style={{
                                width: "200%",
                                transform:
                                  descripcionPhase === "animating"
                                    ? descripcionDirection === 1
                                      ? "translateX(-50%)"
                                      : "translateX(0%)"
                                    : descripcionDirection === 1
                                      ? "translateX(0%)"
                                      : "translateX(-50%)",
                                transition:
                                  descripcionPhase === "animating"
                                    ? "transform 500ms ease-out"
                                    : "none",
                              }}
                              onTransitionEnd={() => {
                                if (descripcionPhase !== "animating") return;
                                setDescripcionImgIndex(descripcionNextIndex);
                                setDescripcionNextIndex(null);
                                descripcionPhaseRef.current = "idle";
                                setDescripcionPhase("idle");
                              }}
                            >
                              <div className="w-1/2 h-full">
                                <img
                                  src={
                                    descripcionDirection === 1
                                      ? descripcionImages[descripcionImgIndex]
                                      : descripcionImages[descripcionNextIndex]
                                  }
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="w-1/2 h-full">
                                <img
                                  src={
                                    descripcionDirection === 1
                                      ? descripcionImages[descripcionNextIndex]
                                      : descripcionImages[descripcionImgIndex]
                                  }
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {descripcionImgIndex + 1}/{descripcionImages.length}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-black/45 border border-black/50 rounded-xl p-4 h-fit backdrop-blur-sm">
                  <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-3">
                    {t("gameTechSheet")}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {plataformas.map((p) => (
                      <Link
                        key={p.id}
                        to={`/juegos?plataforma=${p.id}`}
                        className="bg-[#232323] hover:bg-[#2a2a2a] text-xs px-3 py-1 rounded-full text-gray-200"
                      >
                        {p.name}
                      </Link>
                    ))}
                    {generos.map((g) => (
                      <Link
                        key={g.id}
                        to={`/juegos?genero=${g.id}`}
                        className="bg-[#2a2a2a] hover:bg-[#333333] text-xs px-3 py-1 rounded-full text-gray-200"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-300">
                    <div className="space-y-2">
                      <p>
                        <strong>{t("gameDevelopers")}:</strong>{" "}
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
                      {juego.involved_companies?.some((c) => c.publisher) && (
                        <p>
                          <strong>{t("gamePublisher")}:</strong>{" "}
                          {juego.involved_companies
                            .filter((c) => c.publisher)
                            .map((c) => c.company?.name)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {tiempo?.main && (
                        <p>
                          <strong>{t("gameDuration")}:</strong> {tiempo.main}h historia
                        </p>
                      )}
                      {juego.collection?.name && (
                        <p>
                          <strong>{t("gameSaga")}:</strong> {juego.collection.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {modos.length > 0 && (
                        <p>
                          <strong>{t("gameModes")}:</strong>{" "}
                          {modos.map((m) => (
                            <Link
                              key={m.id}
                              to={`/juegos?modo=${m.id}`}
                              className="text-naranja hover:underline mr-2"
                            >
                              {m.name}
                            </Link>
                          ))}
                        </p>
                      )}
                      {juego.player_perspectives?.length > 0 && (
                        <p>
                          <strong>{t("gamePerspectives")}:</strong>{" "}
                          {juego.player_perspectives.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {juego.themes?.length > 0 && (
                        <p>
                          <strong>{t("gameThemes")}:</strong>{" "}
                          {juego.themes.map((t) => t.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {ytEmbed && (
                <div>
                  <h2 className="text-xl font-semibold mb-1">{t("gameTrailer")}</h2>
                  <div className="aspect-video">
                    <iframe
                      src={ytEmbed}
                      className="w-full h-full rounded-xl min-h-[220px]"
                      allowFullScreen
                      title="Video"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col gap-6">
              {enlacesTiendas.length > 0 && (
                <div className="w-full bg-black/50 border border-black/40 rounded-xl p-4 backdrop-blur-sm">
                  <h2 className="text-lg font-semibold mb-2">{t("gameWhereBuy")}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {enlacesTiendas.map((ti) => (
                      <a
                        key={ti.url}
                        href={ti.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center bg-metal hover:bg-naranja px-4 py-3 rounded-lg"
                      >
                        <ti.Icon size={28} />
                        <span className="mt-1 text-sm font-bold">{ti.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {plataformasPrecios.length > 0 && (
                <div className="w-full bg-black/50 border border-black/40 rounded-xl p-4 backdrop-blur-sm">
                  <button
                    onClick={() => setMostrarCompra(true)}
                    className="w-full bg-naranja hover:bg-naranjaHover text-black font-bold py-2 rounded"
                  >
                    {t("openPriceComparator")}
                  </button>
                </div>
              )}
              {(enlacesUtilesConIcono.length > 0 || enlacesUtilesOtros.length > 0) && (
                <div className="w-full bg-black/50 border border-black/40 rounded-xl p-4 backdrop-blur-sm">
                  <h2 className="text-xl font-semibold mt-3">{t("gameUsefulLinks")}</h2>
                  {enlacesUtilesConIcono.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {enlacesUtilesConIcono.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center gap-1 bg-[#232323] hover:bg-[#2a2a2a] border border-borde/60 rounded-lg px-3 py-2 text-xs text-center"
                        >
                          <link.Icon size={22} />
                          <span className="font-semibold">{link.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {enlacesUtilesOtros.length > 0 && (
                    <ul className="list-disc ml-6 text-sm text-gray-300 mt-3">
                      {enlacesUtilesOtros.map((u) => (
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
                  )}
                </div>
              )}
            </div>
          </div>

          

          {juego.similar_games?.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4">{t("gameSimilar")}</h2>
              <Carrusel
                juegos={juego.similar_games}
                onSelect={(j) => navigate(`/juego/${j.id}`)}
              />
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div className="w-full my-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-black/50">
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
