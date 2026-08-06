import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "react-loading-skeleton/dist/skeleton.css";
import DropLoader from "@/components/DropLoader";
import Carrusel from "@/components/Carrusel";
import Comentarios from "@/components/Comentarios";
import Precios from "@/components/Precios";
import GameCard from "@/components/GameCard";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import ValoracionEstrellas from "@/components/ValoracionEstrellas";
import { apiFetch } from "../lib/api";
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

function extractMediaUrls(game) {
  if (!game) return [];
  const items = [...(game.screenshots || []), ...(game.artworks || [])];
  return items
    .map((img) => img?.url)
    .filter(Boolean)
    .map((url) => `https:${url.replace("t_thumb", "t_screenshot_huge")}`);
}

function readFavoritesCache(username) {
  try {
    const raw = localStorage.getItem(`fav_bg_${username}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.images || !Array.isArray(parsed.images)) return null;
    const ageMs = Date.now() - (parsed.ts || 0);
    if (ageMs > 1000 * 60 * 60 * 24) return null;
    return parsed.images;
  } catch {
    return null;
  }
}

function writeFavoritesCache(username, images) {
  try {
    const payload = {
      ts: Date.now(),
      images: images.slice(0, 140),
    };
    localStorage.setItem(`fav_bg_${username}`, JSON.stringify(payload));
  } catch { }
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
  const [favoritosImages, setFavoritosImages] = useState([]);
  const [similarIndex, setSimilarIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const igdbVideosRef = useRef(null);
  const igdbPhotosRef = useRef(null);
  const descripcionIntervalRef = useRef(null);
  const descripcionPauseUntilRef = useRef(0);
  const descripcionIndexRef = useRef(0);
  const descripcionPhaseRef = useRef("idle");
  const favoritosAbortRef = useRef(null);

  const { autenticado, fetchAuth, usuario } = useAuth();
  const { t, lang } = useLang();

  useEffect(() => {
    favoritosAbortRef.current?.abort();
    if (!autenticado || !usuario?.username) {
      setFavoritosImages([]);
      return undefined;
    }
    const controller = new AbortController();
    favoritosAbortRef.current = controller;
    const cached = readFavoritesCache(usuario.username);
    if (cached?.length) {
      setFavoritosImages(cached);
    }

    const cargarFavoritosFondo = async () => {
      try {
        const perfilRes = await apiFetch(
          `/usuarios/perfil-publico/${usuario.username}/`,
          { credentials: "include", signal: controller.signal }
        );
        if (!perfilRes.ok) throw new Error("perfil");
        const perfil = await perfilRes.json();
        const ids = (perfil.favoritos || []).filter(Boolean).slice(0, 5);
        if (ids.length === 0) {
          setFavoritosImages([]);
          return;
        }
        const res = await apiFetch(`/juegos/populares/?ids=${ids.join(",")}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const juegos = ids.map((gid) => data.juegos?.find((j) => j.id === gid) || null);
        for (let i = 0; i < ids.length; i += 1) {
          if (!juegos[i] && ids[i]) {
            try {
              const resJuego = await apiFetch(`/juegos/buscar_id/?id=${ids[i]}`, {
                signal: controller.signal,
              });
              if (resJuego.ok) {
                juegos[i] = await resJuego.json();
              }
            } catch { }
          }
        }
        const allImages = juegos.flatMap((j) => extractMediaUrls(j));
        const unique = Array.from(new Set(allImages));
        setFavoritosImages(unique);
        if (unique.length > 0) {
          writeFavoritesCache(usuario.username, unique);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setFavoritosImages([]);
        }
      }
    };

    cargarFavoritosFondo();
    return () => controller.abort();
  }, [autenticado, usuario?.username]);

  // Carga la info del juego por ID
  useEffect(() => {
    setJuego(null);
    setInLibrary(false);
    setEntryId(null);
    setCargando(true);

    apiFetch(`/juegos/detalle/${id}/`, { credentials: "include" })
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
      return undefined;
    }
    if (lang === "en" && juego.summary && !juego.summary_es) {
      setDescripcion(juego.summary);
      return undefined;
    }
    if (lang !== "en" && juego.summary_es) {
      setDescripcion(juego.summary_es);
      return undefined;
    }

    const controller = new AbortController();
    const tl = lang === "en" ? "en" : "es";
    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(texto)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((d) => setDescripcion(d[0].map((x) => x[0]).join("")))
      .catch((e) => {
        if (e.name !== "AbortError") setDescripcion(texto);
      });

    return () => controller.abort();
  }, [juego, lang, t]);

  useEffect(() => {
    if (!juego) return;
    setTiempo(null);
    apiFetch(`/juegos/tiempo/?nombre=${encodeURIComponent(juego.name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.found) setTiempo(data);
      })
      .catch(() => { });
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
    setSimilarIndex(0);
  }, [juego?.id]);

  useEffect(() => {
    setVideoIndex(0);
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

    apiFetch(`/juegos/biblioteca/?game_id=${juego.id}`, {
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
    fetchAuth("/juegos/biblioteca/", {
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
    fetchAuth(`/juegos/biblioteca/${entryId}/`, {
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

  // Cambia el estado de biblioteca con rollback si falla el PATCH
  function handleEstadoChange(nuevo) {
    const anterior = estado;
    setEstado(nuevo);
    fetchAuth(`/juegos/biblioteca/${entryId}/`, {
      method: "PATCH",
      body: JSON.stringify({ estado: nuevo }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al actualizar estado");
      })
      .catch(() => setEstado(anterior));
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

  const mediaImages = extractMediaUrls(juego);
  const baseBackgroundImages =
    mediaImages.length > 0 ? mediaImages : favoritosImages;
  const backgroundImages =
    baseBackgroundImages.length > 0
      ? Array.from({ length: 96 }, (_, i) => baseBackgroundImages[i % baseBackgroundImages.length])
      : [];
  const useSingleBackground =
    baseBackgroundImages.length > 0 && baseBackgroundImages.length < 5;
  const singleBackgroundImage = baseBackgroundImages[0];
  const heroCover = juego.cover?.url
    ? `https:${juego.cover.url.replace("t_thumb", "t_cover_big")}`
    : null;

  const igdbVideos = (juego.videos || [])
    .map((v) => ({
      id: v.id || v.video_id,
      name: v.name || "Video",
      embed: v.video_id ? `https://www.youtube.com/embed/${v.video_id}` : null,
    }))
    .filter((v) => v.embed);
  const similarGames = juego.similar_games || [];

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
    <div className="relative w-full min-h-screen bg-transparent text-foreground overflow-hidden">
      <style>{`
        @keyframes gameFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .game-enter { opacity: 0; animation: gameFadeUp 700ms ease-out forwards; }
        .game-delay-1 { animation-delay: 60ms; }
        .game-delay-2 { animation-delay: 120ms; }
        .game-delay-3 { animation-delay: 180ms; }
        .game-delay-4 { animation-delay: 240ms; }
        .game-delay-5 { animation-delay: 300ms; }
        .game-delay-6 { animation-delay: 360ms; }
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(48px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-rise {
          opacity: 0;
          animation: heroRise 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 120ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .game-enter { animation: none; opacity: 1; transform: none; }
          .hero-rise { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      {backgroundImages.length > 0 && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {useSingleBackground ? (
            <div className="w-full h-full game-enter">
              <img
                src={singleBackgroundImage}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: "50% 35%" }}
              />
            </div>
          ) : (
            <div
              className="grid grid-cols-4 md:grid-cols-6 gap-2 opacity-90 w-full h-full overflow-hidden game-enter"
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
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/65 to-black/90" />
        </div>
      )}
      <div className="w-full px-4 md:px-8 relative z-10 pt-4 md:pt-6 pb-10">
        <div className="relative overflow-hidden mb-10 game-enter -mx-4 md:-mx-8">
          <div className="relative z-10 min-h-[55vh] md:min-h-[62vh] flex items-end">
            <div className="w-full px-6 md:px-12 pb-8 pt-12 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 hero-rise">
                {heroCover && (
                  <div className="w-36 sm:w-44 md:w-56 shrink-0">
                    <div className="bg-card/55 border border-border rounded-2xl p-2 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                      <img
                        src={heroCover}
                        alt="Portada"
                        className="w-full rounded-xl object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/90">
                    {juego.first_release_date
                      ? `${t("gameReleasedOn")} ${new Date(
                        juego.first_release_date * 1000
                      ).toLocaleDateString("es-ES")}`
                      : t("gameReleaseUnknown")}
                  </p>
                  <h1
                    className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mt-2"
                    style={{ textShadow: "0 16px 40px rgba(0,0,0,0.55)" }}
                  >
                    {juego.name}
                  </h1>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {autenticado ? (
                      <>
                        {inLibrary ? (
                          <button
                            className="inline-flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold px-6 py-3 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                            onClick={handleRemove}
                          >
                            <FaMinus /> {t("gameRemoveLibrary")}
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                            onClick={handleAdd}
                          >
                            <FaPlus /> {t("gameAddLibrary")}
                          </button>
                        )}
                        <button
                          className="inline-flex items-center justify-center gap-2 bg-card/50 hover:bg-card/70 text-primary font-bold px-6 py-3 rounded-full border border-border/60 backdrop-blur-sm"
                          onClick={handleWishlist}
                        >
                          {inWishlist ? <FaBookmark /> : <FaRegBookmark />}
                          {inWishlist ? t("gameInWishlist") : t("gameAddWishlist")}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center bg-card/60 hover:bg-card/75 text-primary font-bold px-6 py-3 rounded-full border border-border/60 backdrop-blur-sm"
                      >
                        {t("gameLoginManage")}
                      </Link>
                    )}
                  </div>
                  {autenticado && (
                    <div className="mt-4 flex flex-col gap-2 md:hidden">
                      <div className="w-full">
                        <ValoracionEstrellas juegoId={juego.id} />
                      </div>
                      {inLibrary && (
                        <div className="w-full">
                          <label htmlFor="estado-biblioteca-mobile" className="sr-only">
                            Estado
                          </label>
                          <select
                            id="estado-biblioteca-mobile"
                            value={estado}
                            onChange={(e) => handleEstadoChange(e.target.value)}
                            className="w-full mt-1 p-2 rounded bg-muted border border-border/50"
                          >
                            <option value="jugando">{t("statusPlaying")}</option>
                            <option value="completado">{t("statusCompleted")}</option>
                            <option value="abandonado">{t("statusAbandoned")}</option>
                            <option value="en_espera">{t("statusOnHold")}</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-10 border border-border game-enter">
          <div className="grid grid-cols-1 xl:grid-cols-[320px,minmax(0,1fr),320px] gap-8 items-start">
            {/* Columna izquierda */}
            <div className="flex flex-col items-center xl:items-stretch game-enter game-delay-1 order-3 xl:order-1">
              <div className="w-full bg-card/50 border border-border rounded-2xl p-4 shadow-lg backdrop-blur-sm">
                {tiempo?.main && (
                  <div className="w-full rounded-lg bg-muted/80 border border-border/60 px-3 py-2 text-sm text-muted-foreground">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {t("gameDuration")}
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {tiempo.main}h
                    </div>
                  </div>
                )}

                {autenticado ? (
                  <div className="mt-4 w-full flex flex-col gap-3 items-center xl:items-stretch">
                    <div className="hidden md:block w-full">
                      <ValoracionEstrellas juegoId={juego.id} />
                    </div>
                    {inLibrary && (
                      <div className="hidden md:block w-full">
                        <label htmlFor="estado-biblioteca-desktop" className="sr-only">
                          Estado
                        </label>
                        <select
                          id="estado-biblioteca-desktop"
                          value={estado}
                          onChange={(e) => handleEstadoChange(e.target.value)}
                          className="w-full mt-2 p-2 rounded bg-muted border border-border/50"
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
                  <div className="mt-4 w-full flex justify-center">
                    <ValoracionEstrellas juegoId={juego.id} />
                  </div>
                )}
              </div>
              {similarGames.length > 0 && (
                <div className="mt-6 bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm game-enter game-delay-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                      {t("gameSimilar")}
                    </h3>
                    {similarGames.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSimilarIndex((prev) =>
                              prev === 0 ? similarGames.length - 1 : prev - 1
                            )
                          }
                          className="w-11 h-11 rounded-full bg-card/60 hover:bg-card/80 text-foreground flex items-center justify-center"
                          aria-label="Anterior"
                        >
                          <span aria-hidden="true">&lt;</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSimilarIndex((prev) =>
                              prev === similarGames.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="w-11 h-11 rounded-full bg-card/60 hover:bg-card/80 text-foreground flex items-center justify-center"
                          aria-label="Siguiente"
                        >
                          <span aria-hidden="true">&gt;</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <GameCard
                    juego={similarGames[similarIndex]}
                    onClick={() =>
                      navigate(`/juego/${similarGames[similarIndex].id}`)
                    }
                  />
                </div>
              )}
            </div>

            {/* Columna central */}
            <div className="flex flex-col gap-6 game-enter game-delay-2 order-1 xl:order-2">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),320px] gap-6">
                <div className="game-enter game-delay-4">
                  <h2 className="text-xl font-semibold mb-1">{t("gameDescription")}</h2>
                  <p className="text-muted-foreground leading-relaxed">{descripcion}</p>
                  {descripcionImages.length > 0 && (
                    <div className="mt-5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleDescripcionPrev}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-card/60 hover:bg-card/80 text-foreground rounded-full w-11 h-11 flex items-center justify-center"
                          aria-label="Anterior"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={handleDescripcionNext}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-card/60 hover:bg-card/80 text-foreground rounded-full w-11 h-11 flex items-center justify-center"
                          aria-label="Siguiente"
                        >
                          ›
                        </button>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border bg-muted">
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
                      <div className="mt-2 text-xs text-muted-foreground">
                        {descripcionImgIndex + 1}/{descripcionImages.length}
                      </div>
                    </div>
                  )}
                  {igdbVideos.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">Videos</h2>
                        {igdbVideos.length > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setVideoIndex((prev) =>
                                  prev === 0 ? igdbVideos.length - 1 : prev - 1
                                )
                              }
                              className="w-11 h-11 rounded-full bg-card/60 hover:bg-card/80 text-foreground flex items-center justify-center"
                              aria-label="Anterior"
                            >
                              <span aria-hidden="true">&lt;</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setVideoIndex((prev) =>
                                  prev === igdbVideos.length - 1 ? 0 : prev + 1
                                )
                              }
                              className="w-11 h-11 rounded-full bg-card/60 hover:bg-card/80 text-foreground flex items-center justify-center"
                              aria-label="Siguiente"
                            >
                              <span aria-hidden="true">&gt;</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-muted">
                        <iframe
                          src={igdbVideos[videoIndex].embed}
                          className="w-full h-full"
                          allowFullScreen
                          title={igdbVideos[videoIndex].name || "Video"}
                        />
                      </div>
                      {igdbVideos[videoIndex].name && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {igdbVideos[videoIndex].name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-card/45 border border-border rounded-xl p-4 h-fit backdrop-blur-sm game-enter game-delay-5">
                  <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
                    {t("gameTechSheet")}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {plataformas.map((p) => (
                      <Link
                        key={p.id}
                        to={`/juegos?plataforma=${p.id}`}
                        className="bg-muted hover:bg-muted/70 text-xs px-3 py-1 rounded-full text-muted-foreground"
                      >
                        {p.name}
                      </Link>
                    ))}
                    {generos.map((g) => (
                      <Link
                        key={g.id}
                        to={`/juegos?genero=${g.id}`}
                        className="bg-muted hover:bg-muted/70 text-xs px-3 py-1 rounded-full text-muted-foreground"
                      >
                        {g.name}
                      </Link>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <p>
                        <strong>{t("gameDevelopers")}:</strong>{" "}
                        {desarrolladoras.length > 0
                          ? desarrolladoras.map((d, i) => (
                            <Link
                              key={d.id}
                              to={`/juegos?desarrolladora=${d.id}`}
                              className="text-primary hover:underline mr-2"
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
                              className="text-primary hover:underline mr-2"
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
                <div className="game-enter game-delay-6">
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
            <div className="flex flex-col gap-6 game-enter game-delay-3 order-3 xl:order-3">
              {enlacesTiendas.length > 0 && (
                <div className="w-full bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm">
                  <h2 className="text-lg font-semibold mb-2">{t("gameWhereBuy")}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {enlacesTiendas.map((ti) => (
                      <a
                        key={ti.url}
                        href={ti.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center bg-card hover:bg-primary px-4 py-3 rounded-lg"
                      >
                        <ti.Icon size={28} />
                        <span className="mt-1 text-sm font-bold">{ti.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {plataformasPrecios.length > 0 && (
                <div className="w-full bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm">
                  <button
                    onClick={() => setMostrarCompra(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded"
                  >
                    {t("openPriceComparator")}
                  </button>
                </div>
              )}
              {(enlacesUtilesConIcono.length > 0 || enlacesUtilesOtros.length > 0) && (
                <div className="w-full bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm">
                  <h2 className="text-xl font-semibold mt-3">{t("gameUsefulLinks")}</h2>
                  {enlacesUtilesConIcono.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {enlacesUtilesConIcono.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center gap-1 bg-muted hover:bg-muted/70 border border-border/60 rounded-lg px-3 py-2 text-xs text-center"
                        >
                          <link.Icon size={22} />
                          <span className="font-semibold">{link.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {enlacesUtilesOtros.length > 0 && (
                    <ul className="list-disc ml-6 text-sm text-muted-foreground mt-3">
                      {enlacesUtilesOtros.map((u) => (
                        <li key={u} className="break-words">
                          <a
                            href={u}
                            className="text-primary hover:underline break-all"
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

        </div>

        {/* Comentarios */}
        <div className="w-full my-10 game-enter game-delay-5">
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-border">
            <Comentarios juegoId={juego.id} isAuth={autenticado} />
          </div>
        </div>
      </div>
      {mostrarCompra && (
        <div className="fixed inset-0 z-modal flex">
          <div
            className="flex-1 bg-card/60"
            onClick={() => setMostrarCompra(false)}
          />
          <div className="w-full sm:w-96 bg-card shadow-xl transform transition-transform animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{t("openPriceComparator")}</h2>
              <button
                onClick={() => setMostrarCompra(false)}
                aria-label="Cerrar comparador de precios"
                className="text-2xl leading-none w-11 h-11 flex items-center justify-center"
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
