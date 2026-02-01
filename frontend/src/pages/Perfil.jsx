import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import EditarPerfil from "@/components/EditarPerfil";
import EditarFavoritos from "@/components/EditarFavoritos";
import GameCard from "@/components/GameCard";
import LoaderCirculo from "@/components/LoaderCirculo";
import { Pencil } from "lucide-react";
import ActividadReciente from "@/components/ActividadReciente";
import Reportar from "@/components/Reportar";
import { apiFetch } from "../lib/api";

const extraerMediaUrls = (juego) => {
  if (!juego) return [];
  const items = [...(juego.screenshots || []), ...(juego.artworks || [])];
  return items
    .map((img) => img?.url)
    .filter(Boolean)
    .map((url) => `https:${url.replace("t_thumb", "t_screenshot_huge")}`);
};

export default function Perfil() {
  const { nombre } = useParams();
  const navigate = useNavigate();
  const { usuario, cargando, fetchAuth } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [favoritosDatos, setFavoritosDatos] = useState([null, null, null, null, null]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoFavoritos, setModoFavoritos] = useState(false);
  const [animacion, setAnimacion] = useState("onda");
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);
  const [actividad, setActividad] = useState([]);
  const [logros, setLogros] = useState([]);
  const [sigo, setSigo] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoPorMi, setBloqueadoPorMi] = useState(false);
  const [bloqueadoPorEl, setBloqueadoPorEl] = useState(false);

  const cambiarAnimacion = () => {
    const animaciones = ["onda", "rebote", "giro", "temblor"];
    setAnimacion(animaciones[(animaciones.indexOf(animacion) + 1) % animaciones.length]);
  };

  const getAnimacion = (tipo, i) => {
    switch (tipo) {
      case "onda": return { y: [0, -8, 0] };
      case "rebote": return { scale: [1, 1.25, 1] };
      case "giro": return { rotate: [0, 360, 0] };
      case "temblor": return { x: [0, -2, 2, 0] };
      default: return { y: [0, -8, 0] };
    }
  };

  const renderNombreAnimado = (nombre) =>
    nombre.split("").map((letra, i) => (
      <motion.span
        key={i}
        className="inline-block"
        animate={getAnimacion(animacion, i)}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.04 }}
      >
        {letra}
      </motion.span>
    ));

  const cargarPerfil = () => {
    setBloqueadoPorEl(false);
    setBloqueadoPorMi(false);
    setPerfil(null);
    apiFetch(`/usuarios/perfil-publico/${nombre}/`, { credentials: "include" })
      .then(res => {
        if (res.status === 403) {
          setBloqueadoPorEl(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.tu_lo_bloqueaste) {
          setBloqueadoPorMi(true);
          return;
        }
        setPerfil({
          ...data,
          avatar: data.foto || "/media/avatares/default.png",
          favoritos: Array.isArray(data.favoritos) && data.favoritos.length === 5
            ? data.favoritos
            : [...(data.favoritos || []), ...Array(5 - (data.favoritos || []).length).fill(null)],
          bio: data.bio || "",
        });
        setSigo(data.yo_sigo || false);
        setBloqueado(data.yo_lo_bloquee || false);
      })
      .catch(() => navigate("/404", { replace: true }));
  };

  useEffect(() => {
    if (cargando) return;
    if (!nombre && usuario?.username) {
      navigate(`/perfil/${usuario.username}`, { replace: true });
      return;
    }
    if (nombre) cargarPerfil();
  }, [nombre, usuario, cargando, navigate]);

  useEffect(() => {
    if (!perfil) return;
    const ids = perfil.favoritos || [];
    if (ids.every(id => !id)) {
      setFavoritosDatos([null, null, null, null, null]);
      setCargandoFavoritos(false);
      return;
    }
    setCargandoFavoritos(true);
    let cancelado = false;

    const cargarDetalle = async (id) => {
      try {
        const res = await apiFetch(`/juegos/detalle/${id}/`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    apiFetch(`/juegos/populares/?ids=${ids.join(",")}`)
      .then(res => res.json())
      .then(async data => {
        let juegos = ids.map(id => data.juegos.find(j => j.id === id) || null);
        for (let i = 0; i < ids.length; i++) {
          if (!ids[i]) continue;
          if (!juegos[i]) {
            const juego = await cargarDetalle(ids[i]);
            if (juego) juegos[i] = juego;
            continue;
          }
          const tieneMedia = (juegos[i].screenshots && juegos[i].screenshots.length > 0)
            || (juegos[i].artworks && juegos[i].artworks.length > 0);
          if (!tieneMedia) {
            const juego = await cargarDetalle(ids[i]);
            if (juego) juegos[i] = juego;
          }
        }
        if (!cancelado) {
          setFavoritosDatos(juegos);
        }
      })
      .catch(() => {
        if (!cancelado) setFavoritosDatos([null, null, null, null, null]);
      })
      .finally(() => {
        if (!cancelado) setCargandoFavoritos(false);
      });

    return () => { cancelado = true; };
  }, [perfil]);

  useEffect(() => {
    if (!perfil?.username) return;
    apiFetch(`/actividad/${perfil.username}/`)
      .then(res => res.json())
      .then(data => setActividad(data))
      .catch(() => setActividad([]));

    apiFetch(`/actividad/logros/${perfil.username}/`)
      .then(res => res.json())
      .then(data => setLogros(data))
      .catch(() => setLogros([]));
  }, [perfil]);

  const manejarSeguir = async () => {
    const url = `/usuarios/${sigo ? "dejar_seguir" : "seguir"}/${nombre}/`;
    try {
      const res = await fetchAuth(url, { method: "POST" });
      if (res.ok) setSigo(!sigo);
    } catch (err) {
      console.error("Error al seguir/dejar de seguir:", err);
    }
  };

  const manejarBloqueo = async () => {
    const url = `/usuarios/${bloqueado ? "desbloquear" : "bloquear"}/${nombre}/`;
    try {
      const res = await fetchAuth(url, { method: "POST" });
      if (res.ok) {
        setBloqueado(!bloqueado);
        setSigo(false);
        setPerfil(null);
        if (!bloqueado) {
          setBloqueadoPorMi(true);
        } else {
          cargarPerfil();
        }
      }
    } catch (err) {
      console.error("Error al bloquear/desbloquear:", err);
    }
  };

  if (cargando || (!perfil && !bloqueadoPorMi && !bloqueadoPorEl)) {
    return <LoaderCirculo texto="Cargando perfil..." />;
  }

  if (bloqueadoPorMi) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="bg-black/40 border border-borde p-6 rounded-2xl w-full max-w-md shadow-xl mx-auto">
          <h2 className="text-2xl font-bold text-naranja mb-2">Has bloqueado a este perfil</h2>
          <p className="text-claro mb-4">Desbloquéalo si deseas volver a ver su contenido.</p>
          <button onClick={manejarBloqueo} className="px-4 py-2 bg-naranja text-black font-bold rounded-full">Desbloquear</button>
        </div>
      </div>
    );
  }

  if (bloqueadoPorEl) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="bg-black/40 border border-borde p-6 rounded-2xl w-full max-w-md shadow-xl mx-auto">
          <h2 className="text-2xl font-bold text-naranja mb-2">Este usuario te ha bloqueado</h2>
          <p className="text-claro">No puedes ver su perfil ni interactuar con él.</p>
        </div>
      </div>
    );
  }

  const esMiPerfil = perfil?.es_mi_perfil;
  const tags = perfil?.tags || ["Competitivo", "Explorador", "Cooperativo"];

  const favoritosFondo = favoritosDatos.flatMap((j) => extraerMediaUrls(j));
  const fondoImagenes =
    favoritosFondo.length > 0
      ? Array.from({ length: 96 }, (_, i) => favoritosFondo[i % favoritosFondo.length])
      : [];

  return (
    <div className="relative min-h-screen w-full">
      <style>{`
        @keyframes perfilFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .perfil-enter { opacity: 0; animation: perfilFadeUp 600ms ease-out forwards; }
        .perfil-delay-1 { animation-delay: 80ms; }
        .perfil-delay-2 { animation-delay: 160ms; }
        .perfil-delay-3 { animation-delay: 240ms; }
        .perfil-delay-4 { animation-delay: 320ms; }
        .perfil-delay-5 { animation-delay: 400ms; }
        @keyframes perfilBgIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        .perfil-bg-fade { opacity: 0; animation: perfilBgIn 900ms ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .perfil-enter { animation: none; opacity: 1; transform: none; }
          .perfil-bg-fade { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      {fondoImagenes.length > 0 && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="grid grid-cols-4 md:grid-cols-6 gap-2 opacity-90 w-full h-full overflow-hidden"
            style={{
              gridAutoRows: "minmax(140px, 22vh)",
              gridAutoFlow: "dense",
            }}
          >
            {fondoImagenes.map((img, idx) => (
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
                  className="w-full h-full object-cover perfil-bg-fade"
                  style={{
                    animationDelay: `${(idx % 12) * 60}ms`,
                    willChange: "opacity, transform",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/70 dark:from-black/10 dark:via-black/30 dark:to-black/60" />
        </div>
      )}

      <div className="relative z-10 w-full px-4 sm:px-6 pt-10">
        <div className="w-full bg-white/75 text-gray-900 border border-gray-200 shadow-lg backdrop-blur-sm dark:bg-black/35 dark:text-claro dark:border-borde dark:shadow-xl dark:backdrop-blur-md rounded-3xl px-6 sm:px-10 py-8 sm:py-10 perfil-enter perfil-delay-1">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10">
            <div className="relative">
              <img
                src={perfil.avatar || "/media/avatares/default.png"}
                alt="Avatar"
                className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full object-cover ring-4 ring-naranja border-4 border-metal shadow-2xl bg-black"
              />
              {esMiPerfil && (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="absolute bottom-3 right-3 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-800 shadow dark:bg-naranja dark:text-black dark:hover:bg-naranjaHover"
                  title="Editar perfil"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight cursor-pointer select-none"
                onClick={cambiarAnimacion}
                title="Haz clic para animar tu nombre"
              >
                {renderNombreAnimado(perfil.nombre)}
              </h1>

            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen w-full px-4 sm:px-6 py-10 flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-[340px] flex flex-col items-center lg:items-start perfil-enter perfil-delay-1 bg-white/70 text-gray-900 border border-gray-200 shadow-sm backdrop-blur-sm dark:bg-black/30 dark:text-claro dark:border-borde dark:shadow dark:backdrop-blur-md rounded-2xl p-4">
          <div className="relative mb-6 perfil-enter perfil-delay-2 hidden">
            <img
              src={perfil.avatar || "/media/avatares/default.png"}
              alt="Avatar"
              className="w-40 h-40 rounded-full object-cover ring-4 ring-naranja border-4 border-metal shadow-xl bg-black"
            />
            {esMiPerfil && (
              <button
                onClick={() => setModoEdicion(true)}
                className="absolute bottom-3 right-3 bg-naranja p-2 rounded-full hover:bg-naranjaHover text-black shadow"
                title="Editar perfil"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
          </div>
          <h1
            className="text-3xl font-bold text-claro text-left cursor-pointer select-none hidden"
            onClick={cambiarAnimacion}
            title="Haz clic para animar tu nombre"
          >
            {renderNombreAnimado(perfil.nombre)}
          </h1>
          <p className="text-gray-900 dark:text-naranja text-lg font-semibold mb-2 perfil-enter perfil-delay-3">@{perfil.username}</p>
          <div className="flex flex-wrap gap-2 mb-2 perfil-enter perfil-delay-3">
            {tags.map((t, i) => (
              <span key={i} className="text-xs rounded-xl px-3 py-1 font-bold border border-gray-300 bg-white/80 text-gray-900 dark:border-naranja dark:bg-naranja/10 dark:text-naranja">{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-lg font-semibold text-gray-900 dark:text-naranja mb-1 perfil-enter perfil-delay-4">
            <span>{perfil.horas || 0}h jugadas</span>
            <span>·</span>
            <span>{perfil.juegos || 0} juegos</span>
          </div>
          <div className="flex flex-wrap gap-4 text-base text-gray-900 dark:text-claro mb-3 perfil-enter perfil-delay-4">
            <span>{perfil.amigos || 0} amigos</span>
            <span>·</span>
            <span>{perfil.seguidores || 0} seguidores</span>
          </div>
          <div className="w-full perfil-enter perfil-delay-5">
            <h2 className="font-bold text-naranja mb-1 text-left">Biografía</h2>
            <div className="bg-white/70 border border-gray-200 dark:bg-black/40 dark:border-borde rounded-xl px-3 py-2 min-h-[40px] mb-2">
              <p className="text-gray-900 dark:text-claro text-sm">{perfil.bio || <span className="text-gray-600 dark:text-borde">¡No ha escrito su biografía aún!</span>}</p>
            </div>
          </div>
          {!esMiPerfil && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={manejarSeguir}
                className={`px-4 py-1 rounded font-semibold ${sigo ? "bg-gray-200 text-gray-900 dark:bg-borde dark:text-naranja" : "bg-gray-900 text-white dark:bg-naranja dark:text-black"}`}
              >
                {sigo ? "Dejar de seguir" : "Seguir"}
              </button>
              <button
                onClick={manejarBloqueo}
                className="px-4 py-1 rounded bg-red-600 text-white"
              >
                {bloqueado ? "Desbloquear" : "Bloquear"}
              </button>
              <Reportar modelo="usuario" objectId={perfil.id} />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-8 justify-start perfil-enter perfil-delay-2">
          <div className="bg-white/70 text-gray-900 border border-gray-200 shadow-sm backdrop-blur-sm dark:bg-black/30 dark:text-claro dark:border-borde dark:shadow dark:backdrop-blur-md rounded-2xl flex flex-col gap-2 px-6 py-5 perfil-enter perfil-delay-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900 dark:text-naranja text-lg">Favoritos</h2>
              {esMiPerfil && (
                <button
                  onClick={() => setModoFavoritos(true)}
                  className="ml-2 text-xs bg-gray-900 text-white px-2 py-1 rounded font-bold dark:bg-naranja dark:text-black"
                >Editar</button>
              )}
            </div>
            {cargandoFavoritos ? (
              <LoaderCirculo texto="Cargando juegos favoritos..." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {favoritosDatos.map((juego, i) =>
                  juego ? (
                    <GameCard key={juego.id || i} juego={juego} onClick={() => navigate(`/juego/${juego.id}`)} />
                  ) : (
                    <GameCard key={i} />
                  )
                )}
              </div>
            )}
          </div>

          <div className="bg-white/70 text-gray-900 border border-gray-200 shadow-sm backdrop-blur-sm dark:bg-black/30 dark:text-claro dark:border-borde dark:shadow dark:backdrop-blur-md rounded-2xl flex flex-col gap-2 px-6 py-5 perfil-enter perfil-delay-4">
            <h2 className="font-bold text-gray-900 dark:text-naranja text-lg mb-2">Recompensas / Logros</h2>
            <div className="flex flex-wrap gap-2">
              {logros.length === 0 ? (
                <p className="text-gray-600 dark:text-borde text-sm">Aún no tiene logros.</p>
              ) : (
                logros.map((logro, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-900 font-semibold px-3 py-1 rounded-xl border border-gray-300 dark:bg-naranja/20 dark:text-naranja dark:border-naranja"
                    title={logro.descripcion || ""}
                  >
                    {logro.nombre}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="perfil-enter perfil-delay-5">
            <ActividadReciente actividades={actividad} />
          </div>
        </div>

        {modoEdicion && <EditarPerfil cerrar={() => setModoEdicion(false)} />}
        {modoFavoritos && (
          <EditarFavoritos
            favoritos={favoritosDatos}
            onGuardar={async (nuevos) => {
              const nuevosIds = [...nuevos].map(j => (j && j.id) || null);
              while (nuevosIds.length < 5) nuevosIds.push(null);
              const res = await fetchAuth('/usuarios/favoritos/', {
                method: 'POST',
                body: JSON.stringify({ favoritos: nuevosIds }),
              });

              // Usar la respuesta del backend para actualizar el perfil
              if (res.ok) {
                const perfilActualizado = await res.json();
                setPerfil(prev => ({ ...prev, ...perfilActualizado }));
              }

              setModoFavoritos(false);
            }}
            onCerrar={() => setModoFavoritos(false)}
          />
        )}
      </div>
    </div>
  );
}







